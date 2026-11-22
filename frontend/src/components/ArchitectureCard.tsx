import React from 'react';
import { ShieldCheck, EyeOff, Eye, Lock, Cpu } from 'lucide-react';

export const ArchitectureCard: React.FC = () => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            Decentralized Privacy Architecture & Threat Model
          </h3>
          <p className="text-xs text-slate-400">
            Cryptographic separation between Public On-Chain Verification and Private Off-Chain Medical Records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            HIPAA Compliant Web3 Model
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            Groth16 SNARK
          </span>
        </div>
      </div>

      {/* Grid: Private vs Public */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Private Data Box */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
              <EyeOff className="h-4 w-4" />
              <span>PRIVATE / OFF-CHAIN (Zero Knowledge)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              NEVER SEEN BY INSURER
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Stored encrypted on IPFS / patient storage. Consumed only as private witnesses by the hospital client during proof generation:
          </p>
          <ul className="text-xs space-y-1.5 text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <li className="flex items-center gap-1.5 text-rose-300">
              <Lock className="h-3 w-3" /> Exact Clinical Diagnosis (ICD-10 Code)
            </li>
            <li className="flex items-center gap-1.5 text-rose-300">
              <Lock className="h-3 w-3" /> Specific Procedure Name & Pathology Details
            </li>
            <li className="flex items-center gap-1.5 text-rose-300">
              <Lock className="h-3 w-3" /> Prescriptions & Medication List
            </li>
            <li className="flex items-center gap-1.5 text-rose-300">
              <Lock className="h-3 w-3" /> Patient Identity Salt & Secret Key
            </li>
            <li className="flex items-center gap-1.5 text-rose-300">
              <Lock className="h-3 w-3" /> Full Encrypted Medical History & CID
            </li>
          </ul>
        </div>

        {/* Public Data Box */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <Eye className="h-4 w-4" />
              <span>PUBLIC / ON-CHAIN (Smart Contract Verified)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              AUDITED ON-CHAIN
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Visible on the ledger to the insurer and automated settlement contract to trigger authorized claim disbursement:
          </p>
          <ul className="text-xs space-y-1.5 text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <li className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Approved Hospital Merkle Root
            </li>
            <li className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Policy Commitment Hash (Hash of Policy + Limits)
            </li>
            <li className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Claim Nullifier (Prevents Double-Spend / Replay)
            </li>
            <li className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Claim Total Amount (e.g. $2,400.00 USDC)
            </li>
            <li className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Groth16 Proof (pi_a, pi_b, pi_c)
            </li>
          </ul>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Zero-Knowledge Proof Verification & Replay Protection Flow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-indigo-400">1. Patient Delegation</span>
            <p className="text-[11px] text-slate-400">Grants encrypted record read access to doctor; holds active policy commitment.</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-blue-400">2. Hospital Prover</span>
            <p className="text-[11px] text-slate-400">Generates ZK proof of licensing, active policy, covered procedure & unique nullifier.</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-purple-400">3. Contract Replay Guard</span>
            <p className="text-[11px] text-slate-400">Checks if nullifier is already in mapping. If spent, transaction reverts immediately.</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-emerald-400">4. Instant Settlement</span>
            <p className="text-[11px] text-slate-400">Verifies ZK proof validity on-chain and triggers automated escrow payout.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
