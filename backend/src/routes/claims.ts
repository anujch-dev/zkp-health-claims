import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { contractRelayer } from '../services/contractRelayer.js';
import { ClaimRecord } from '../types/index.js';
import { CONFIG } from '../config/index.js';
import { db } from '../db/index.js';

const router = Router();

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

    // 1. Replay Protection Guard (check database and smart contract)
    const existingClaim = await db.getClaimByNullifier(nullifierHex);
    const isSpentOnChain = await contractRelayer.isNullifierSpent(nullifierHex);

    if (existingClaim || isSpentOnChain) {
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

    // 3. Persist to PostgreSQL database
    await db.createClaim(claimRecord);

    // 4. Log audit event to database
    await db.logAuditEvent({
      id: 'AUD-' + crypto.randomBytes(6).toString('hex'),
      timestamp: Date.now(),
      eventName: 'ClaimSettled',
      actorRole: 'hospital',
      actorAddress: recipient,
      details: `Claim ${claimId} verified by ZKP and settled for $${amountNum}. Nullifier: ${nullifierHex.substring(0, 18)}...`,
      txHash: settlementResult.txHash
    });

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
    const existingInDb = await db.getClaimByNullifier(nullifier);
    const isSpentOnChain = await contractRelayer.isNullifierSpent(nullifier);
    const isSpent = Boolean(existingInDb || isSpentOnChain);

    res.json({
      nullifier,
      isSpent,
      status: isSpent ? 'SPENT' : 'UNSPENT',
      claim: existingInDb || null
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check nullifier status', details: err.message });
  }
});

/**
 * GET /api/claims
 * Returns list of all submitted / settled claims from PostgreSQL
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const claims = await db.getAllClaims();
    res.json({
      success: true,
      count: claims.length,
      claims
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve claims', details: err.message });
  }
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
    res.status(500).json({ error: 'Failed to retrieve escrow status', details: err.message });
  }
});

export default router;
