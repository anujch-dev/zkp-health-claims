import { Router, Request, Response } from 'express';
import { zkpService } from '../services/zkpService.js';
import { ZKClaimPrivateInputs } from '../types/index.js';

const router = Router();

/**
 * GET /api/zkp/merkle-tree
 * Returns the approved hospital Merkle tree root and accredited provider list
 */
router.get('/merkle-tree', async (_req: Request, res: Response): Promise<void> => {
  try {
    await zkpService.init();
    res.json({
      success: true,
      merkleRootDecimal: zkpService.hospitalRoot,
      merkleRootHex: '0x' + BigInt(zkpService.hospitalRoot).toString(16).padStart(64, '0'),
      treeDepth: 4,
      totalLeaves: zkpService.hospitalLeaves.length,
      accreditedHospitals: [\n        { id: '1001', name: 'Mayo Clinic Healthcare System', leafIndex: 0, accredited: true },\n        { id: '1002', name: 'Johns Hopkins Medicine', leafIndex: 1, accredited: true },\n        { id: '1003', name: 'Massachusetts General Hospital', leafIndex: 2, accredited: true },\n        { id: '1004', name: 'Cleveland Clinic Foundation', leafIndex: 3, accredited: true }\n      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve Merkle tree', details: err.message });
  }
});

/**
 * GET /api/zkp/merkle-proof/:hospitalId
 * Generates Poseidon Merkle inclusion proof for accredited hospital
 */
router.get('/merkle-proof/:hospitalId', async (req: Request, res: Response): Promise<void> => {
  try {
    const hospitalId = String(req.params.hospitalId);
    const proof = await zkpService.getHospitalMerkleProof(hospitalId);
    res.json({
      success: true,
      hospitalId,
      proof
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate hospital Merkle proof', details: err.message });
  }
});

/**
 * POST /api/zkp/compute-commitments
 * Calculates policy commitment and claim nullifier via Poseidon
 */
router.post('/compute-commitments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { policyId, patientSecret, policyExpiry, maxCoverageLimit, claimId } = req.body;

    const policyCommitment = await zkpService.computePolicyCommitment(
      policyId || '8801',
      patientSecret || '987654321',
      policyExpiry || '1893456000',
      maxCoverageLimit || '15000'
    );

    const claimNullifier = await zkpService.computeClaimNullifier(
      patientSecret || '987654321',
      policyId || '8801',
      claimId || '5501'
    );

    res.json({
      success: true,
      policyCommitmentDecimal: policyCommitment,
      policyCommitmentHex: '0x' + BigInt(policyCommitment).toString(16).padStart(64, '0'),
      claimNullifierDecimal: claimNullifier,
      claimNullifierHex: '0x' + BigInt(claimNullifier).toString(16).padStart(64, '0')
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute commitments', details: err.message });
  }
});

/**
 * POST /api/zkp/prove
 * Full server-side SnarkJS Groth16 proof generation
 */
router.post('/prove', async (req: Request, res: Response): Promise<void> => {
  try {
    const privateInputs = req.body.privateInputs as ZKClaimPrivateInputs;
    const customMerkleRoot = req.body.merkleRoot;

    if (!privateInputs) {
      res.status(400).json({ error: 'privateInputs is required' });
      return;
    }

    // Default missing Merkle path if hospitalId provided
    if (!privateInputs.hospitalMerkleProofPath || privateInputs.hospitalMerkleProofPath.length === 0) {
      const merkleProof = await zkpService.getHospitalMerkleProof(privateInputs.hospitalId || '1001');
      privateInputs.hospitalMerkleProofPath = merkleProof.pathElements;
      privateInputs.hospitalMerkleProofIndices = merkleProof.pathIndices;
    }

    const proofResult = await zkpService.generateProof(privateInputs, customMerkleRoot);

    res.json({
      success: true,
      ...proofResult
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate Groth16 proof', details: err.message });
  }
});

/**
 * POST /api/zkp/verify
 * Verifies a Groth16 proof against circuits/build/verification_key.json
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      res.status(400).json({ error: 'proof and publicSignals are required' });
      return;
    }

    const verificationResult = await zkpService.verifyProof(proof, publicSignals);

    res.json({
      success: true,
      isValid: verificationResult.isValid
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify Groth16 proof', details: err.message });
  }
});

export default router;
