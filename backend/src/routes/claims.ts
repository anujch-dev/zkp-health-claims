import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { contractRelayer } from '../services/contractRelayer.js';
import { ClaimRecord, ZKClaimPublicInputs, ZKProofData } from '../types/index.js';
import { CONFIG } from '../config/index.js';

const router = Router();

// In-memory claim records database
const claimsDb = new Map<string, ClaimRecord>();

// Seed sample settled claim
function seedDemoClaims() {
  const claim1Id = 'CLM-8801-5501';
  const claim1Nullifier = '0x0b0b8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1122';
  
  claimsDb.set(claim1Id, {
    id: claim1Id,
    claimNullifier: claim1Nullifier,
    policyCommitment: '0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be',
    hospitalAddress: CONFIG.DEMO_ROLES.HOSPITAL,
    hospitalName: 'Mayo Clinic Healthcare System',
    claimAmount: 2500,
    claimDate: 1732320000,
    procedureCode: '102',
    procedureName: 'Laparoscopic Appendectomy',
    status: 'settled',
    publicInputs: {
      approvedHospitalRoot: CONFIG.CONTRACTS.ApprovedHospitalMerkleRootDecimal,
      policyCommitment: '18235321658131723648847967345698509104713943756027922529868321960257868673173',
      claimAmount: '2500',
      claimDate: '1732320000',
      claimNullifier: claim1Nullifier
    },
    proof: {
      pi_a: ['0x1111', '0x2222'],
      pi_b: [['0x3333', '0x4444'], ['0x5555', '0x6666']],
      pi_c: ['0x7777', '0x8888'],
      protocol: 'groth16',
      curve: 'bn128'
    },
    txHash: '0x4a7e9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    settledAt: Date.now() - 3600000
  });
}

seedDemoClaims();

/**
 * POST /api/claims/submit
 * Submits zero-knowledge proof for on-chain verification, replay protection check, and immediate escrow settlement
 */
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      proof,
      publicInputs,
      hospitalAddress,
      hospitalName,
      procedureCode,
      procedureName,
      claimAmount
    } = req.body;

    if (!proof || !publicInputs || !publicInputs.claimNullifier) {
      res.status(400).json({ error: 'proof and publicInputs with claimNullifier are required' });
      return;
    }

    const nullifierHex = publicInputs.claimNullifier.startsWith('0x')
      ? publicInputs.claimNullifier
      : '0x' + BigInt(publicInputs.claimNullifier).toString(16).padStart(64, '0');

    // 1. Replay Protection Guard
    const isSpent = await contractRelayer.isNullifierSpent(nullifierHex);
    if (isSpent) {
      res.status(409).json({
        error: 'Replay Attack Prevented: This claim nullifier has already been settled on-chain',
        nullifier: nullifierHex,
        status: 'rejected'
      });
      return;
    }

    const recipient = hospitalAddress || CONFIG.DEMO_ROLES.HOSPITAL;
    const amountNum = claimAmount ? Number(claimAmount) : Number(publicInputs.claimAmount || 2500);

    // 2. Execute on-chain settlement on ZKPInsuranceSettlement.sol
    const settlementResult = await contractRelayer.settleClaimOnChain(
      proof.pi_a,
      proof.pi_b,
      proof.pi_c,
      publicInputs.approvedHospitalRoot,
      publicInputs.policyCommitment,
      nullifierHex,
      amountNum,
      Number(publicInputs.claimDate || Math.floor(Date.now() / 1000)),
      recipient
    );

    const claimId = 'CLM-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const claimRecord: ClaimRecord = {
      id: claimId,
      claimNullifier: nullifierHex,
      policyCommitment: publicInputs.policyCommitment,
      hospitalAddress: recipient,
      hospitalName: hospitalName || 'Mayo Clinic Healthcare System',
      claimAmount: amountNum,
      claimDate: Number(publicInputs.claimDate || Math.floor(Date.now() / 1000)),
      procedureCode: procedureCode || '102',
      procedureName: procedureName || 'Covered Medical Procedure',
      status: 'settled',
      publicInputs,
      proof,
      txHash: settlementResult.txHash,
      settledAt: Date.now()
    };

    claimsDb.set(claimId, claimRecord);

    res.json({
      success: true,
      claimId,
      status: 'settled',
      onChainSettled: settlementResult.onChain,
      transactionHash: settlementResult.txHash,
      nullifier: nullifierHex,
      payoutAmount: amountNum,
      hospitalRecipient: recipient,
      claim: claimRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to settle claim', details: err.message });
  }
});

/**
 * GET /api/claims/nullifier/:nullifier
 * Checks whether a nullifier has already been spent on-chain
 */
router.get('/nullifier/:nullifier', async (req: Request, res: Response): Promise<void> => {
  try {
    const nullifier = String(req.params.nullifier);
    const isSpent = await contractRelayer.isNullifierSpent(nullifier);

    res.json({
      nullifier,
      isSpent,
      status: isSpent ? 'SPENT' : 'UNSPENT'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check nullifier status', details: err.message });
  }
});

/**
 * GET /api/claims
 * Returns list of all submitted / settled claims
 */
router.get('/', (_req: Request, res: Response): void => {
  const claims = Array.from(claimsDb.values()).sort((a, b) => (b.settledAt || 0) - (a.settledAt || 0));
  res.json({
    success: true,
    count: claims.length,
    claims
  });
});

/**
 * GET /api/claims/escrow-status
 * Returns liquidity escrow reserves and payout volume
 */
router.get('/escrow-status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await contractRelayer.getEscrowStatus();
    res.json({
      success: true,
      escrowContract: CONFIG.CONTRACTS.ZKPInsuranceSettlement,
      ...status
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get escrow status', details: err.message });
  }
});

export default router;