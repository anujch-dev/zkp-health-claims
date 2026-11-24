import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { CONFIG } from '../config/index.js';
import { AuthChallenge, UserRole, UserSession } from '../types/index.js';
import { db } from '../db/index.js';

const router = Router();

// In-memory challenge store (keyed by address.toLowerCase())
const activeChallenges = new Map<string, AuthChallenge>();

// Active sessions (keyed by token)
const activeSessions = new Map<string, UserSession>();

const DEMO_PROFILES: Record<string, { role: UserRole; name: string; organization: string }> = {
  [CONFIG.DEMO_ROLES.PATIENT.toLowerCase()]: {
    role: 'patient',
    name: 'Sarah Chen (Patient)',
    organization: 'Self-Sovereign Patient Vault'
  },
  [CONFIG.DEMO_ROLES.HOSPITAL.toLowerCase()]: {
    role: 'hospital',
    name: 'Dr. Marcus Vance (Chief of Surgery)',
    organization: 'Mayo Clinic Healthcare System'
  },
  [CONFIG.DEMO_ROLES.INSURER.toLowerCase()]: {
    role: 'insurer',
    name: 'Apex Health Underwriting Relayer',
    organization: 'Apex Health & Life Insurance Corp'
  },
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906': {
    role: 'auditor',
    name: 'Elena Rostova (Compliance Inspector)',
    organization: 'Federal Healthcare Security Oversight'
  }
};

/**
 * GET /api/auth/challenge
 * Issues a cryptographically unique sign-in challenge for the wallet
 */
router.get('/challenge', (req: Request, res: Response): void => {
  const address = (req.query.address as string)?.toLowerCase();
  const role = (req.query.role as UserRole) || 'patient';

  if (!address || !ethers.isAddress(address)) {
    res.status(400).json({ error: 'Valid Ethereum address required' });
    return;
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const expiresAt = timestamp + 10 * 60 * 1000; // 10 minutes

  const challengeText = [
    '=== ZKP HEALTH CLAIMS PLATFORM AUTHENTICATION ===',
    `Role: ${role.toUpperCase()}`,
    `Address: ${ethers.getAddress(address)}`,
    `Nonce: ${nonce}`,
    `Chain ID: ${CONFIG.CHAIN_ID}`,
    `Timestamp: ${new Date(timestamp).toISOString()}`
  ].join('\n');

  const challengeData: AuthChallenge = {
    challenge: challengeText,
    timestamp,
    expiresAt,
    role,
    domain: {
      name: 'ZKP Health Claims Platform',
      version: '1.0.0',
      chainId: CONFIG.CHAIN_ID
    }
  };

  activeChallenges.set(address, challengeData);

  res.json({
    success: true,
    address: ethers.getAddress(address),
    role,
    challenge: challengeText,
    expiresAt
  });
});

/**
 * POST /api/auth/verify
 * Verifies the ECDSA signature and issues an authenticated session
 */
router.post('/verify', (req: Request, res: Response): void => {
  const { address, signature, challenge } = req.body;

  if (!address || !signature || !challenge) {
    res.status(400).json({ error: 'address, signature, and challenge are required' });
    return;
  }

  const normalizedAddress = address.toLowerCase();
  const storedChallenge = activeChallenges.get(normalizedAddress);

  if (!storedChallenge) {
    res.status(400).json({ error: 'No active challenge found for this address. Request a challenge first.' });
    return;
  }

  if (Date.now() > storedChallenge.expiresAt) {
    activeChallenges.delete(normalizedAddress);
    res.status(401).json({ error: 'Challenge expired. Please request a new challenge.' });
    return;
  }

  try {
    const recoveredAddress = ethers.verifyMessage(challenge, signature).toLowerCase();

    if (recoveredAddress !== normalizedAddress) {
      res.status(401).json({
        error: 'Signature verification failed: recovered address does not match provided address',
        recoveredAddress,
        providedAddress: normalizedAddress
      });
      return;
    }

    // Signature is valid! Clean up challenge and issue session token
    activeChallenges.delete(normalizedAddress);

    const token = 'zkp_sess_' + crypto.randomBytes(24).toString('hex');
    const profile = DEMO_PROFILES[normalizedAddress] || {
      role: storedChallenge.role,
      name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
      organization: 'Decentralized Healthcare Participant'
    };

    const session: UserSession = {
      address: ethers.getAddress(address),
      role: profile.role,
      name: profile.name,
      organization: profile.organization,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      token
    };

    activeSessions.set(token, session);

    res.json({
      success: true,
      token,
      session
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify signature', details: err.message });
  }
});

/**
 * POST /api/auth/demo-login
 * Fast authenticated session login for judges & hackathon reviewers
 */
router.post('/demo-login', (req: Request, res: Response): void => {
  const { role } = req.body;
  const targetRole = (role as UserRole) || 'patient';

  let demoAddress = CONFIG.DEMO_ROLES.PATIENT;
  if (targetRole === 'hospital') demoAddress = CONFIG.DEMO_ROLES.HOSPITAL;
  if (targetRole === 'insurer') demoAddress = CONFIG.DEMO_ROLES.INSURER;
  if (targetRole === 'auditor') demoAddress = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

  const normalized = demoAddress.toLowerCase();
  const profile = DEMO_PROFILES[normalized] || {
    role: targetRole,
    name: `${targetRole.toUpperCase()} Authority`,
    organization: 'Health Network'
  };

  const token = 'zkp_demo_' + crypto.randomBytes(20).toString('hex');
  const session: UserSession = {
    address: ethers.getAddress(demoAddress),
    role: targetRole,
    name: profile.name,
    organization: profile.organization,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    token
  };

  activeSessions.set(token, session);

  res.json({
    success: true,
    token,
    session,
    isDemo: true
  });
});

/**
 * GET /api/auth/session
 * Validates session token and returns active session data
 */
router.get('/session', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token || !activeSessions.has(token)) {
    res.status(401).json({ authenticated: false, error: 'Unauthorized or expired session' });
    return;
  }

  const session = activeSessions.get(token)!;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    res.status(401).json({ authenticated: false, error: 'Session expired' });
    return;
  }

  res.json({
    authenticated: true,
    session
  });
});

/**
 * GET /api/auth/roles
 * Lists standard demo roles and pre-registered smart contract addresses
 */
router.get('/roles', (_req: Request, res: Response): void => {
  res.json({
    roles: [
      {
        id: 'patient',
        title: 'Patient (Sovereign Vault)',
        address: CONFIG.DEMO_ROLES.PATIENT,
        name: 'Sarah Chen',
        description: 'Holds encrypted medical records, grants time-bound access, controls policy commitment.'
      },
      {
        id: 'hospital',
        title: 'Hospital (Accredited Healthcare Provider)',
        address: CONFIG.DEMO_ROLES.HOSPITAL,
        name: 'Mayo Clinic Healthcare System',
        description: 'Accredited member of Merkle tree, generates Circom Groth16 zero-knowledge proofs.'
      },
      {
        id: 'insurer',
        title: 'Insurer (Apex Health Claims Reserve)',
        address: CONFIG.DEMO_ROLES.INSURER,
        name: 'Apex Health & Life Insurance Corp',
        description: 'Settles claims on-chain with zero knowledge of diagnosis, enforces nullifier replay check.'
      }
    ]
  });
});

/**
 * GET /api/auth/patients
 * Lists all registered patients from PostgreSQL
 */
router.get('/patients', async (_req: Request, res: Response): Promise<void> => {
  try {
    const patients = await db.getAllPatients();
    res.json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve patients', details: err.message });
  }
});

/**
 * POST /api/auth/patient-login
 * Fetches patient details by phone number or patient ID from PostgreSQL
 */
router.post('/patient-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, patientId } = req.body;

    if (!phone && !patientId) {
      res.status(400).json({ error: 'Either phone number or patientId is required' });
      return;
    }

    let patient = null;
    if (patientId) {
      patient = await db.getPatientById(patientId);
    }
    if (!patient && phone) {
      patient = await db.getPatientByPhone(phone);
    }

    if (!patient) {
      res.status(404).json({
        success: false,
        error: 'Patient not found. Check phone number or EHR ID.'
      });
      return;
    }

    res.json({
      success: true,
      patient
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to login patient', details: err.message });
  }
});

/**
 * POST /api/auth/register-patient
 * Registers or updates a patient in PostgreSQL
 */
router.post('/register-patient', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patient_id,
      name,
      phone,
      hospital,
      wallet_address,
      primary_diagnosis,
      primary_diagnosis_code,
      primary_procedure,
      primary_procedure_code,
      avatar_initial
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: 'Patient name and phone are required' });
      return;
    }

    const patientId = patient_id || 'PT-' + Math.floor(100000 + Math.random() * 900000);
    const initial = avatar_initial || name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    const saved = await db.upsertPatient({
      patient_id: patientId,
      name,
      phone,
      hospital: hospital || 'Mayo Clinic Healthcare System',
      wallet_address: wallet_address || CONFIG.DEMO_ROLES.PATIENT,
      primary_diagnosis: primary_diagnosis || 'Unspecified Clinical Follow-up',
      primary_diagnosis_code: primary_diagnosis_code || 'Z00.00',
      primary_procedure: primary_procedure || 'Level 3 Office Visit',
      primary_procedure_code: primary_procedure_code || 'CPT-99213',
      avatar_initial: initial
    });

    res.json({
      success: true,
      patient: saved
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register patient', details: err.message });
  }
});

export default router;
