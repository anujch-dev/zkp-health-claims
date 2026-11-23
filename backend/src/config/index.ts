import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect circuit & contract artifact paths (bundled in backend/ vs monorepo root)
const bundledCircuitsDir = path.resolve(__dirname, '../../circuits');
const monorepoCircuitsDir = path.resolve(__dirname, '../../../circuits');
const bundledContractsDir = path.resolve(__dirname, '../../contracts');
const monorepoContractsDir = path.resolve(__dirname, '../../../contracts');

const hasBundledWasm = fs.existsSync(path.join(bundledCircuitsDir, 'health_claim.wasm'));

const circuitsDir = hasBundledWasm ? bundledCircuitsDir : monorepoCircuitsDir;
const contractsDir = fs.existsSync(bundledContractsDir) ? bundledContractsDir : monorepoContractsDir;
const circuitWasm = hasBundledWasm
  ? path.join(bundledCircuitsDir, 'health_claim.wasm')
  : path.resolve(monorepoCircuitsDir, 'build/health_claim_js/health_claim.wasm');
const circuitZkey = hasBundledWasm
  ? path.join(bundledCircuitsDir, 'circuit_final.zkey')
  : path.resolve(monorepoCircuitsDir, 'build/circuit_final.zkey');
const verificationKey = hasBundledWasm
  ? path.join(bundledCircuitsDir, 'verification_key.json')
  : path.resolve(monorepoCircuitsDir, 'build/verification_key.json');

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DATABASE_URL: process.env.DATABASE_URL || '',
  RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:8545',
  CHAIN_ID: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : 31337,
  
  // Smart Contract Addresses
  CONTRACTS: {
    HealthAccessRegistry: process.env.HEALTH_ACCESS_REGISTRY_ADDR || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    Groth16Verifier: process.env.GROTH16_VERIFIER_ADDR || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    ZKPInsuranceSettlement: process.env.ZKP_INSURANCE_SETTLEMENT_ADDR || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    ApprovedHospitalMerkleRoot: process.env.HOSPITAL_MERKLE_ROOT || '0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be',
    ApprovedHospitalMerkleRootDecimal: process.env.HOSPITAL_MERKLE_ROOT_DECIMAL || '8464722192574004154307101905833932193053562928359214660920880496777686120894'
  },

  // Circom & ZK Artifact Paths
  PATHS: {
    circuitsDir,
    contractsDir,
    circuitWasm,
    circuitZkey,
    verificationKey,
    storageDir: path.resolve(__dirname, '../../storage')
  },

  // Default Relayer Private Key (Hardhat Account #0)
  RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',

  // Mock Roles
  DEMO_ROLES: {
    PATIENT: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    HOSPITAL: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    INSURER: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  }
};