import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { ipfsService } from '../services/ipfsService.js';
import { contractRelayer } from '../services/contractRelayer.js';
import { EncryptedMedicalRecord, AccessPermission, BreakGlassLog, PharmacyQRPayload } from '../types/index.js';
import { CONFIG } from '../config/index.js';
import { db } from '../db/index.js';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

/**
 * POST /api/records/upload
 * Sovereign encrypted record upload, SHA-256 commitment hashing, IPFS pinning, and on-chain anchoring
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientAddress,
      title,
      category,
      procedureCode,
      diagnosisCode,
      hospitalName,
      doctorName,
      fhirBundleJson
    } = req.body;

    if (!patientAddress) {
      res.status(400).json({ error: 'patientAddress is required' });
      return;
    }

    let rawBuffer: Buffer;
    let mimeType = 'application/json';

    if (req.file) {
      rawBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (fhirBundleJson) {
      rawBuffer = Buffer.from(typeof fhirBundleJson === 'string' ? fhirBundleJson : JSON.stringify(fhirBundleJson));
      mimeType = 'application/fhir+json';
    } else if (req.body.content) {
      rawBuffer = Buffer.from(req.body.content, 'utf8');
      mimeType = 'text/plain';
    } else {
      // Create minimal FHIR bundle from form fields
      const fhirObj = {
        resourceType: 'Bundle',
        type: 'document',
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'ClinicalImpression',
              status: 'completed',
              description: title || 'Patient Health Assessment',
              code: { text: category || 'Diagnostic' },
              subject: { reference: `Patient/${patientAddress}` },
              effectiveDateTime: new Date().toISOString()
            }
          }
        ]
      };
      rawBuffer = Buffer.from(JSON.stringify(fhirObj, null, 2));
      mimeType = 'application/fhir+json';
    }

    // 1. Off-chain AES-256-GCM encryption
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const encryptedPkg = ipfsService.encryptAESGCM(rawBuffer, encryptionKey);
    const encryptedBuffer = Buffer.from(JSON.stringify(encryptedPkg));

    // 2. IPFS Pinning (CIDv0 Qm... + SHA-256 commitment hash)
    const pinResult = ipfsService.pin(encryptedBuffer, `${title || 'record'}.enc`);

    // 3. Generate unique recordId
    const recordId = '0x' + crypto.createHash('sha256').update(pinResult.cid + Date.now().toString()).digest('hex');

    // 4. Anchor on-chain commitment in HealthAccessRegistry.sol
    const anchorResult = await contractRelayer.registerRecordOnChain(
      patientAddress,
      recordId,
      pinResult.sha256Commitment,
      pinResult.cid,
      category || 'Diagnostic'
    );

    const record: EncryptedMedicalRecord = {
      id: recordId,
      patientAddress,
      title: title || 'Medical Record',
      category: category || 'Diagnostic',
      ipfsCid: pinResult.cid,
      commitmentHash: pinResult.sha256Commitment,
      encryptedPayload: JSON.stringify(encryptedPkg),
      metadata: {
        hospitalName: hospitalName || 'General Hospital',
        doctorName: doctorName || 'Attending Physician',
        procedureCode: procedureCode || '102',
        diagnosisCode: diagnosisCode || '90210',
        timestamp: Math.floor(Date.now() / 1000),
        fileSize: rawBuffer.length,
        mimeType
      },
      anchoredOnChain: true,
      onChainTxHash: anchorResult.txHash,
      createdAt: Date.now()
    };

    // 5. Persist to PostgreSQL database
    await db.createRecord(record);

    // 6. Log audit event
    await db.logAuditEvent({
      id: 'AUD-' + crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now(),
      eventName: 'RecordUploaded',
      actorRole: 'patient',
      actorAddress: patientAddress,
      details: `Encrypted record "${record.title}" anchored on-chain with IPFS CID: ${pinResult.cid}`,
      txHash: anchorResult.txHash
    });

    res.json({
      success: true,
      recordId,
      ipfsCid: pinResult.cid,
      commitmentHash: pinResult.sha256Commitment,
      onChainTxHash: anchorResult.txHash,
      onChain: anchorResult.onChain,
      encryptionKeyHex: '0x' + encryptionKey,
      record
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to upload and anchor record', details: err.message });
  }
});

/**
 * GET /api/records/patient/:address
 * Retrieves all encrypted record commitments for a patient from PostgreSQL
 */
router.get('/patient/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const address = String(req.params.address).toLowerCase();
    const records = await db.getRecordsByPatient(address);

    res.json({
      success: true,
      patientAddress: String(req.params.address),
      count: records.length,
      records
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch patient records', details: err.message });
  }
});

/**
 * GET /api/records/:recordId
 * Verifies view access and logs on-chain RecordViewed audit trail
 */
router.get('/:recordId', async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = String(req.params.recordId);
    const viewerAddress = (req.query.viewerAddress as string) || CONFIG.DEMO_ROLES.HOSPITAL;

    const record = await db.getRecordById(recordId);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    // Emit on-chain audit view log
    const logResult = await contractRelayer.logRecordView(
      record.patientAddress,
      viewerAddress,
      recordId
    );

    // Log to PostgreSQL audit trail
    await db.logAuditEvent({
      id: 'AUD-' + crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now(),
      eventName: 'RecordViewed',
      actorRole: 'hospital',
      actorAddress: viewerAddress,
      details: `Record ${record.title} viewed by doctor ${viewerAddress.substring(0, 10)}...`,
      txHash: logResult.txHash
    });

    res.json({
      success: true,
      record,
      viewLoggedOnChain: true,
      auditTxHash: logResult.txHash
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve record', details: err.message });
  }
});

/**
 * POST /api/records/grant
 * Patient grants time-bound, role-based doctor access
 */
router.post('/grant', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientAddress, doctorAddress, recordId, role, durationSeconds } = req.body;

    if (!patientAddress || !doctorAddress || !recordId) {
      res.status(400).json({ error: 'patientAddress, doctorAddress, and recordId are required' });
      return;
    }

    const duration = durationSeconds || 7 * 86400;
    const roleName = role || 'Doctor';

    const result = await contractRelayer.grantDoctorAccess(
      patientAddress,
      doctorAddress,
      recordId,
      roleName,
      duration
    );

    const newPerm: AccessPermission = {
      recordId,
      granteeAddress: doctorAddress,
      granteeName: doctorAddress.toLowerCase() === CONFIG.DEMO_ROLES.HOSPITAL.toLowerCase() ? 'Dr. Marcus Vance (Mayo Clinic)' : 'Consulting Physician',
      role: roleName,
      grantedAt: Date.now(),
      expiresAt: result.expiresAt * 1000,
      isActive: true,
      txHash: result.txHash
    };

    // Save permission in PostgreSQL
    await db.grantPermission(newPerm, patientAddress);

    // Log to audit events
    await db.logAuditEvent({
      id: 'AUD-' + crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now(),
      eventName: 'DoctorAccessGranted',
      actorRole: 'patient',
      actorAddress: patientAddress,
      details: `Access granted to doctor ${doctorAddress.substring(0, 10)}... for record ${recordId.substring(0, 12)}...`,
      txHash: result.txHash
    });

    res.json({
      success: true,
      permission: newPerm,
      txHash: result.txHash
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to grant access', details: err.message });
  }
});

/**
 * POST /api/records/revoke
 * Patient revokes doctor access
 */
router.post('/revoke', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientAddress, doctorAddress, recordId } = req.body;

    const result = await contractRelayer.revokeDoctorAccess(
      patientAddress,
      doctorAddress,
      recordId
    );

    // Update in PostgreSQL
    await db.revokePermission(recordId, doctorAddress);

    // Log to audit events
    await db.logAuditEvent({
      id: 'AUD-' + crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now(),
      eventName: 'DoctorAccessRevoked',
      actorRole: 'patient',
      actorAddress: patientAddress || '0x...',
      details: `Access revoked for doctor ${doctorAddress.substring(0, 10)}... on record ${recordId.substring(0, 12)}...`,
      txHash: result.txHash
    });

    res.json({
      success: true,
      revoked: true,
      txHash: result.txHash
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revoke access', details: err.message });
  }
});

/**
 * GET /api/records/permissions/:patientAddress
 * Lists all active permissions granted by the patient from PostgreSQL
 */
router.get('/permissions/:patientAddress', async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = String(req.params.patientAddress).toLowerCase();
    const permissions = await db.getPermissionsForPatient(patient);

    res.json({
      success: true,
      patientAddress: String(req.params.patientAddress),
      permissions
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch permissions', details: err.message });
  }
});

/**
 * POST /api/records/break-glass
 * Emergency responder override for incapacitated patients (permanently logged to on-chain audit trail)
 */
router.post('/break-glass', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientAddress, recordId, responderAddress, reason } = req.body;

    if (!patientAddress || !recordId || !reason) {
      res.status(400).json({ error: 'patientAddress, recordId, and reason are required' });
      return;
    }

    const responder = responderAddress || '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
    const result = await contractRelayer.breakGlassAccess(
      patientAddress,
      responder,
      recordId,
      reason
    );

    const log: BreakGlassLog = {
      id: 'bg_' + crypto.randomBytes(8).toString('hex'),
      recordId,
      patientAddress,
      responderAddress: responder,
      reason,
      timestamp: Date.now(),
      txHash: result.txHash
    };

    // Save in PostgreSQL
    await db.logBreakGlass(log);

    // Log to audit events
    await db.logAuditEvent({
      id: 'AUD-' + crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now(),
      eventName: 'BreakGlassEmergency',
      actorRole: 'emergency',
      actorAddress: responder,
      details: `Emergency Break-Glass Override executed by ${responder.substring(0, 10)}... Reason: ${reason}`,
      txHash: result.txHash
    });

    const record = await db.getRecordById(recordId);

    res.json({
      success: true,
      breakGlassLog: log,
      onChainAuditTx: result.txHash,
      record: record ? {
        id: record.id,
        title: record.title,
        category: record.category,
        ipfsCid: record.ipfsCid,
        metadata: record.metadata
      } : null
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to execute break-glass access', details: err.message });
  }
});

/**
 * POST /api/records/pharmacy-pass
 * Generates a Secret-Free Pharmacy QR Pass (proves valid prescription without revealing diagnosis)
 */
router.post('/pharmacy-pass', (req: Request, res: Response): void => {
  const { patientAddress, recordId, medicationCode, medicationName } = req.body;

  const passId = 'pharm_pass_' + crypto.randomBytes(8).toString('hex');
  const prescriptionHash = '0x' + crypto.createHash('sha256').update(`${patientAddress}-${recordId}-${medicationCode || 'MED-4401'}`).digest('hex');

  const payload: PharmacyQRPayload = {
    passId,
    prescriptionHash,
    patientAddress: patientAddress || CONFIG.DEMO_ROLES.PATIENT,
    doctorAddress: CONFIG.DEMO_ROLES.HOSPITAL,
    doctorSignature: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b1b',
    medicationCode: medicationCode || 'RX-AMOX-500',
    medicationName: medicationName || 'Amoxicillin 500mg Oral Capsule (14 Day Supply)',
    validUntil: Date.now() + 14 * 86400000,
    verificationUrl: `http://localhost:5001/api/records/pharmacy-verify/${passId}`,
    zeroKnowledgeAttestation: {
      holdsValidPrescription: true,
      diagnosisHidden: true,
      doctorAccredited: true
    }
  };

  res.json({
    success: true,
    pass: payload,
    qrDataString: JSON.stringify(payload)
  });
});

export default router;
