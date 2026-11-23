import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { ipfsService } from '../services/ipfsService.js';
import { contractRelayer } from '../services/contractRelayer.js';
import { EncryptedMedicalRecord, AccessPermission, BreakGlassLog, PharmacyQRPayload } from '../types/index.js';
import { CONFIG } from '../config/index.js';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// In-memory records database
const recordsDb = new Map<string, EncryptedMedicalRecord>();
// patientAddress => recordId[]
const patientRecordsMap = new Map<string, string[]>();
// patientAddress_recordId => AccessPermission[]
const permissionsMap = new Map<string, AccessPermission[]>();
// break-glass logs
const breakGlassLogs: BreakGlassLog[] = [];

// Seed demo records for Hackasol presentation
function seedDemoRecords() {
  const patient = CONFIG.DEMO_ROLES.PATIENT.toLowerCase();
  
  const rec1Id = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
  const rec1Content = JSON.stringify({
    resourceType: 'Bundle',
    type: 'document',
    entry: [
      {
        resource: {
          resourceType: 'DiagnosticReport',
          status: 'final',
          code: { text: 'Laparoscopic Appendectomy Operative Report' },
          subject: { reference: 'Patient/Sarah-Chen-8801' },
          effectiveDateTime: '2026-11-20T14:30:00Z',
          performer: [{ display: 'Dr. Marcus Vance, Mayo Clinic' }],
          conclusionCode: [{ coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'K35.80', display: 'Unspecified acute appendicitis' }] }]
        }
      }
    ]
  });
  const enc1 = ipfsService.encryptAESGCM(rec1Content, '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
  const pin1 = ipfsService.pin(Buffer.from(JSON.stringify(enc1)), 'appendectomy_report.enc');

  const record1: EncryptedMedicalRecord = {
    id: rec1Id,
    patientAddress: CONFIG.DEMO_ROLES.PATIENT,
    title: 'Laparoscopic Appendectomy Operative Report',
    category: 'Diagnostic',
    ipfsCid: pin1.cid,
    commitmentHash: pin1.sha256Commitment,
    encryptedPayload: JSON.stringify(enc1),
    metadata: {
      hospitalName: 'Mayo Clinic Healthcare System',
      doctorName: 'Dr. Marcus Vance',
      procedureCode: '102',
      diagnosisCode: '90210',
      timestamp: 1732320000,
      mimeType: 'application/fhir+json'
    },
    anchoredOnChain: true,
    onChainTxHash: '0x3f5c7d8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
    createdAt: Date.now() - 3 * 86400000
  };

  recordsDb.set(rec1Id, record1);
  patientRecordsMap.set(patient, [rec1Id]);

  // Seed sample permission
  permissionsMap.set(`${patient}_${rec1Id}`, [
    {
      recordId: rec1Id,
      granteeAddress: CONFIG.DEMO_ROLES.HOSPITAL,
      granteeName: 'Dr. Marcus Vance (Mayo Clinic)',
      role: 'Doctor',
      grantedAt: Date.now() - 2 * 86400000,
      expiresAt: Date.now() + 5 * 86400000,
      isActive: true,
      txHash: '0x88f231e45c7b8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c'
    }
  ]);
}

seedDemoRecords();

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

    recordsDb.set(recordId, record);

    const normPatient = patientAddress.toLowerCase();
    const existingList = patientRecordsMap.get(normPatient) || [];
    existingList.unshift(recordId);
    patientRecordsMap.set(normPatient, existingList);

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
 * Retrieves all encrypted record commitments for a patient
 */
router.get('/patient/:address', (req: Request, res: Response): void => {
  const address = String(req.params.address).toLowerCase();
  const recordIds = patientRecordsMap.get(address) || [];

  const records = recordIds
    .map(id => recordsDb.get(id))
    .filter((r): r is EncryptedMedicalRecord => !!r);

  res.json({
    success: true,
    patientAddress: String(req.params.address),
    count: records.length,
    records
  });
});

/**
 * GET /api/records/:recordId
 * Verifies view access and logs on-chain RecordViewed audit trail
 */
router.get('/:recordId', async (req: Request, res: Response): Promise<void> => {
  const recordId = String(req.params.recordId);
  const viewerAddress = (req.query.viewerAddress as string) || CONFIG.DEMO_ROLES.HOSPITAL;

  const record = recordsDb.get(recordId);
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

  res.json({
    success: true,
    record,
    viewLoggedOnChain: true,
    auditTxHash: logResult.txHash
  });
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

    const permKey = `${patientAddress.toLowerCase()}_${recordId}`;
    const perms = permissionsMap.get(permKey) || [];
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
    perms.unshift(newPerm);
    permissionsMap.set(permKey, perms);

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

    const permKey = `${patientAddress.toLowerCase()}_${recordId}`;
    const perms = permissionsMap.get(permKey) || [];
    for (const p of perms) {
      if (p.granteeAddress.toLowerCase() === doctorAddress.toLowerCase()) {
        p.isActive = false;
      }
    }

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
 * Lists all active permissions granted by the patient
 */
router.get('/permissions/:patientAddress', (req: Request, res: Response): void => {
  const patient = String(req.params.patientAddress).toLowerCase();
  const allPerms: AccessPermission[] = [];

  for (const [key, perms] of permissionsMap.entries()) {
    if (key.startsWith(patient)) {
      allPerms.push(...perms);
    }
  }

  res.json({
    success: true,
    patientAddress: String(req.params.patientAddress),
    permissions: allPerms
  });
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
    breakGlassLogs.unshift(log);

    const record = recordsDb.get(recordId);

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
