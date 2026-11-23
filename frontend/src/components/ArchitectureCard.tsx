import React from 'react';
import { ShieldCheck, EyeOff, Eye, Lock, Cpu } from 'lucide-react';

export const ArchitectureCard: React.FC = () => {
  return (
    <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-alabaster-300 pb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-clinical-text flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sage-600" />
            Decentralized Privacy Architecture & Threat Boundary
          </h3>
          <p className="text-xs text-clinical-muted">
            Formal cryptographic separation between Public On-Chain Verification and Private Off-Chain Medical Records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200 font-medium">
            HIPAA Compliant Web3 Model
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-alabaster-200 text-clinical-text border border-alabaster-300 font-medium">
            Groth16 SNARK
          </span>
        </div>
      </div>

      {/* Grid: Private vs Public */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Private Data Box */}
        <div className="rounded-2xl border border-clinical-amberBorder bg-clinical-amberBg/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-clinical-amber font-semibold text-xs">
              <EyeOff className="h-4 w-4" />
              <span>PRIVATE / OFF-CHAIN (Zero-Knowledge Witness)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-clinical-amberBg text-clinical-amber border border-clinical-amberBorder">
              NEVER EXPOSED
            </span>
          </div>
          <p className="text-xs text-clinical-muted leading-relaxed">
            Encrypted client-side with Web Crypto AES-256-GCM. Evaluated strictly as secret witness signals inside the Circom R1CS circuit:
          </p>
          <ul className="text-xs space-y-2 text-clinical-text font-mono bg-white p-3.5 rounded-xl border border-clinical-amberBorder/60">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-clinical-amber font-sans font-medium">
                <Lock className="h-3 w-3" /> ICD-10 Clinical Diagnosis:
              </span>
              <span className="text-[11px] text-clinical-muted">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-clinical-amber font-sans font-medium">
                <Lock className="h-3 w-3" /> Physician Clinical Findings:
              </span>
              <span className="text-[11px] text-clinical-muted">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-clinical-amber font-sans font-medium">
                <Lock className="h-3 w-3" /> Prescriptions & Regimen:
              </span>
              <span className="text-[11px] text-clinical-muted">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-clinical-amber font-sans font-medium">
                <Lock className="h-3 w-3" /> Patient Salt & Sovereign Secret:
              </span>
              <span className="text-[11px] text-clinical-muted">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-clinical-amber font-sans font-medium">
                <Lock className="h-3 w-3" /> Raw IPFS Storage Payload:
              </span>
              <span className="text-[11px] text-clinical-muted">[AES-256-GCM]</span>
            </li>
          </ul>
        </div>

        {/* Public Data Box */}
        <div className="rounded-2xl border border-sage-200 bg-sage-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sage-800 font-semibold text-xs">
              <Eye className="h-4 w-4" />
              <span>PUBLIC / ON-CHAIN (Smart Contract Verified)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sage-100 text-sage-800 border border-sage-200">
              AUDITED ON-CHAIN
            </span>
          </div>
          <p className="text-xs text-clinical-muted leading-relaxed">
            Visible on-chain to the insurer and smart contract to verify validity and trigger automated escrow payout:
          </p>
          <ul className="text-xs space-y-2 text-clinical-text font-mono bg-white p-3.5 rounded-xl border border-sage-200">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sage-800 font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Approved Hospital Merkle Root:
              </span>
              <span className="text-[11px] text-sage-700">Poseidon Root</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sage-800 font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Policy Commitment Hash:
              </span>
              <span className="text-[11px] text-sage-700">Hash(ID, Limits)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sage-800 font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Claim Amount (e.g. $2,400 USDC):
              </span>
              <span className="text-[11px] text-sage-700 font-bold">$2,400.00</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sage-800 font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Claim Nullifier (Replay ID):
              </span>
              <span className="text-[11px] text-sage-700">Anti-Double-Spend</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sage-800 font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Groth16 Curve Points (A, B, C):
              </span>
              <span className="text-[11px] text-sage-700">BN254 Pairing</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="bg-alabaster-50 p-4 rounded-xl border border-alabaster-300">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-clinical-muted mb-3">
          Zero-Knowledge Proof Verification & Replay Protection Flow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-3.5 rounded-xl border border-alabaster-300 space-y-1">
            <span className="text-xs font-bold text-sage-700">1. Patient Delegation</span>
            <p className="text-[11px] text-clinical-muted">Encrypts record off-chain; delegates reading permission on-chain.</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-alabaster-300 space-y-1">
            <span className="text-xs font-bold text-sage-700">2. Hospital Prover</span>
            <p className="text-[11px] text-clinical-muted">Proves active policy, licensed clinic & covered CPT via Circom ZKP.</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-alabaster-300 space-y-1">
            <span className="text-xs font-bold text-sage-700">3. Contract Replay Guard</span>
            <p className="text-[11px] text-clinical-muted">Checks nullifier in mapping. If already spent, transaction reverts.</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-alabaster-300 space-y-1">
            <span className="text-xs font-bold text-sage-700">4. Instant Settlement</span>
            <p className="text-[11px] text-clinical-muted">Verifies Groth16 pairing on EVM and disburses escrow payout.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
