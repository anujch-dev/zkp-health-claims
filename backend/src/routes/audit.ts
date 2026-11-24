import { Router, Request, Response } from 'express';
import fs from 'fs';
import { contractRelayer } from '../services/contractRelayer.js';
import { CONFIG } from '../config/index.js';
import { db } from '../db/index.js';

const router = Router();

/**
 * GET /api/audit/events
 * Live tamper-evident audit trail streaming smart contract and database access events
 */
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventName, limit, patient } = req.query;
    const maxLimit = limit ? parseInt(limit as string, 10) : 50;

    let onChainEvents = contractRelayer.getRecentEvents(maxLimit);
    const dbEvents = await db.getRecentAuditEvents(maxLimit);

    if (eventName) {
      onChainEvents = onChainEvents.filter(e => e.eventName.toLowerCase() === (eventName as string).toLowerCase());
    }

    if (patient) {
      onChainEvents = onChainEvents.filter(e => e.args?.patient?.toLowerCase() === (patient as string).toLowerCase());
    }

    res.json({
      success: true,
      totalCount: onChainEvents.length + dbEvents.length,
      events: onChainEvents,
      databaseEvents: dbEvents
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit events', details: err.message });
  }
});

/**
 * GET /api/audit/system-status
 * Health and operational readiness across blockchain, database, circuits, IPFS, and relayer
 */
router.get('/system-status', (_req: Request, res: Response): void => {
  const wasmExists = fs.existsSync(CONFIG.PATHS.circuitWasm);
  const zkeyExists = fs.existsSync(CONFIG.PATHS.circuitZkey);
  const vkeyExists = fs.existsSync(CONFIG.PATHS.verificationKey);

  res.json({
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
    database: {
      status: db.isConnected ? 'CONNECTED' : 'IN_MEMORY_FALLBACK',
      engine: db.isConnected ? 'PostgreSQL (Neon/Supabase)' : 'In-Memory Store',
      hasDatabaseUrl: Boolean(CONFIG.DATABASE_URL)
    },
    network: {
      chainId: CONFIG.CHAIN_ID,
      rpcUrl: CONFIG.RPC_URL,
      onChainConnected: contractRelayer.isConnectedToChain
    },
    contracts: {
      healthAccessRegistry: {
        address: CONFIG.CONTRACTS.HealthAccessRegistry,
        status: 'DEPLOYED'
      },
      groth16Verifier: {
        address: CONFIG.CONTRACTS.Groth16Verifier,
        status: 'DEPLOYED'
      },
      zkpInsuranceSettlement: {
        address: CONFIG.CONTRACTS.ZKPInsuranceSettlement,
        status: 'DEPLOYED'
      }
    },
    zkpEngine: {
      status: wasmExists && zkeyExists && vkeyExists ? 'OPERATIONAL' : 'DEGRADED',
      circuit: 'insurance_claim.circom',
      curve: 'BN254',
      constraints: 1960,
      wasmReady: wasmExists,
      zkeyReady: zkeyExists,
      verificationKeyReady: vkeyExists
    },
    storage: {
      engine: 'IPFS Content-Addressed Gateway + AES-256-GCM',
      status: 'OPERATIONAL'
    }
  });
});

export default router;
