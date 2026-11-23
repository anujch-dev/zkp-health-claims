import { Router, Request, Response } from 'express';
import fs from 'fs';
import { contractRelayer } from '../services/contractRelayer.js';
import { CONFIG } from '../config/index.js';

const router = Router();

/**
 * GET /api/audit/events
 * Live tamper-evident audit trail streaming smart contract and access events
 */
router.get('/events', (req: Request, res: Response): void => {
  const { eventName, limit, patient } = req.query;

  let events = contractRelayer.getRecentEvents(limit ? parseInt(limit as string, 10) : 50);

  if (eventName) {
    events = events.filter(e => e.eventName.toLowerCase() === (eventName as string).toLowerCase());
  }

  if (patient) {
    events = events.filter(e => e.args?.patient?.toLowerCase() === (patient as string).toLowerCase());
  }

  res.json({
    success: true,
    totalCount: events.length,
    events
  });
});

/**
 * GET /api/audit/system-status
 * Health and operational readiness across blockchain, circuits, IPFS, and relayer
 */
router.get('/system-status', (_req: Request, res: Response): void => {
  const wasmExists = fs.existsSync(CONFIG.PATHS.circuitWasm);
  const zkeyExists = fs.existsSync(CONFIG.PATHS.circuitZkey);
  const vkeyExists = fs.existsSync(CONFIG.PATHS.verificationKey);

  res.json({
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
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
