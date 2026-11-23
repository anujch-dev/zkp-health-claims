import React from 'react';
import { ShieldCheck, EyeOff, Eye, Lock, Cpu } from 'lucide-react';

export const ArchitectureCard: React.FC = () => {
  return (
    <div className="bg-[#FAF9F6] border border-[#E7E1D7] rounded-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E7E1D7] pb-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#292D29] flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#294638]" />
            Decentralized Privacy Architecture & Threat Boundary
          </h3>
          <p className="text-xs text-[#5F685F]">
            Formal cryptographic separation between Public On-Chain Verification and Private Off-Chain Medical Records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-sm bg-[#E7E1D7] text-[#294638] font-medium">
            HIPAA Compliant Web3 Model
          </span>
          <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-sm bg-[#FAF9F6] text-[#292D29] border border-[#E7E1D7] font-medium">
            Groth16 SNARK
          </span>
        </div>
      </div>

      {/* Grid: Private vs Public */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Private Data Box */}
        <div className="rounded-sm border border-[#ECC9A5] bg-[#FBF0E4]/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#8A4B1A] font-semibold text-xs">
              <EyeOff className="h-4 w-4" />
              <span>PRIVATE / OFF-CHAIN (Zero-Knowledge Witness)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-sm font-mono font-bold bg-[#FBF0E4] text-[#8A4B1A] border border-[#ECC9A5]">
              NEVER EXPOSED
            </span>
          </div>
          <p className="text-xs text-[#5F685F] leading-relaxed">
            Encrypted client-side with Web Crypto AES-256-GCM. Evaluated strictly as secret witness signals inside the Circom R1CS circuit:
          </p>
          <ul className="text-xs space-y-2 text-[#292D29] font-mono bg-white p-3.5 rounded-sm border border-[#ECC9A5]/60">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#8A4B1A] font-sans font-medium">
                <Lock className="h-3 w-3" /> ICD-10 Clinical Diagnosis:
              </span>
              <span className="text-[11px] text-[#5F685F]">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#8A4B1A] font-sans font-medium">
                <Lock className="h-3 w-3" /> Physician Clinical Findings:
              </span>
              <span className="text-[11px] text-[#5F685F]">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#8A4B1A] font-sans font-medium">
                <Lock className="h-3 w-3" /> Prescriptions & Regimen:
              </span>
              <span className="text-[11px] text-[#5F685F]">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#8A4B1A] font-sans font-medium">
                <Lock className="h-3 w-3" /> Patient Salt & Sovereign Secret:
              </span>
              <span className="text-[11px] text-[#5F685F]">[HIDDEN IN ZKP]</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#8A4B1A] font-sans font-medium">
                <Lock className="h-3 w-3" /> Raw IPFS Storage Payload:
              </span>
              <span className="text-[11px] text-[#5F685F]">[AES-256-GCM]</span>
            </li>
          </ul>
        </div>

        {/* Public Data Box */}
        <div className="rounded-sm border border-[#E7E1D7] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#294638] font-semibold text-xs">
              <Eye className="h-4 w-4" />
              <span>PUBLIC / ON-CHAIN (Smart Contract Verified)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-sm font-mono font-bold bg-[#E7E1D7] text-[#294638] border border-[#A6B3A1]">
              AUDITED ON-CHAIN
            </span>
          </div>
          <p className="text-xs text-[#5F685F] leading-relaxed">
            Visible on-chain to the insurer and smart contract to verify validity and trigger automated escrow payout:
          </p>
          <ul className="text-xs space-y-2 text-[#292D29] font-mono bg-[#FAF9F6] p-3.5 rounded-sm border border-[#E7E1D7]">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#294638] font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Approved Hospital Merkle Root:
              </span>
              <span className="text-[11px] text-[#294638] font-bold">Poseidon Root</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#294638] font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Policy Commitment Hash:
              </span>
              <span className="text-[11px] text-[#5F685F]">Hash(ID, Limits)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#294638] font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Claim Amount (e.g. $2,400 USDC):
              </span>
              <span className="text-[11px] text-[#294638] font-bold">$2,400.00</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#294638] font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Claim Nullifier (Replay ID):
              </span>
              <span className="text-[11px] text-[#294638] font-bold">Anti-Double-Spend</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#294638] font-sans font-medium">
                <ShieldCheck className="h-3 w-3" /> Groth16 Curve Points (A, B, C):
              </span>
              <span className="text-[11px] text-[#294638]">BN254 Pairing</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="bg-[#FAF9F6] p-4 rounded-sm border border-[#E7E1D7]">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#5F685F] mb-3">
          Zero-Knowledge Proof Verification & Replay Protection Flow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-3.5 rounded-sm border border-[#E7E1D7] space-y-1">
            <span className="text-xs font-serif font-bold text-[#294638]">1. Patient Vault</span>
            <p className="text-[11px] text-[#5F685F]">Encrypts record off-chain; delegates reading permission on-chain.</p>
          </div>
          <div className="bg-white p-3.5 rounded-sm border border-[#E7E1D7] space-y-1">
            <span className="text-xs font-serif font-bold text-[#294638]">2. Hospital Prover</span>
            <p className="text-[11px] text-[#5F685F]">Proves active policy, licensed clinic & covered CPT via Circom ZKP.</p>
          </div>
          <div className="bg-white p-3.5 rounded-sm border border-[#E7E1D7] space-y-1">
            <span className="text-xs font-serif font-bold text-[#294638]">3. Replay Guard</span>
            <p className="text-[11px] text-[#5F685F]">Checks nullifier in mapping. If already spent, transaction reverts.</p>
          </div>
          <div className="bg-white p-3.5 rounded-sm border border-[#E7E1D7] space-y-1">
            <span className="text-xs font-serif font-bold text-[#294638]">4. Instant Settlement</span>
            <p className="text-[11px] text-[#5F685F]">Verifies Groth16 pairing on EVM and disburses escrow payout.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
