import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Eye, Lock, Cpu, Network, AlertTriangle, ShieldAlert, Key, FileCheck, Search, Filter } from 'lucide-react';
import { AuditEvent } from '../types';
import {
  REGISTRY_CONTRACT_ADDRESS,
  VERIFIER_CONTRACT_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  HOSPITAL_MERKLE_ROOT
} from '../fixtures/mockData';

interface ArchitectureViewProps {
  auditLogs: AuditEvent[];
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ auditLogs }) => {
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = auditLogs.filter(log => {
    const matchesRole = filterRole === 'all' || log.actorRole === filterRole;
    const matchesSearch = searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorAddress.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-clinical-text">
                System Architecture & Threat Model Matrix
              </h2>
              <p className="text-xs text-clinical-muted">
                Formal cryptographic separation of On-Chain state vs Off-Chain AES-256-GCM encrypted storage
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-800 border border-sage-200 font-medium">
              BN254 Pairing Check
            </span>
            <span className="px-3 py-1 rounded-full bg-alabaster-200 text-clinical-text border border-alabaster-300 font-medium">
              Groth16 SNARK
            </span>
            <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-800 border border-sage-200 font-medium">
              HIPAA Tier 4
            </span>
          </div>
        </div>
      </div>

      {/* Visual Data Boundary: On-Chain vs Off-Chain Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Off-Chain Storage Column */}
        <div className="bg-clinical-amberBg/30 border border-clinical-amberBorder rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-clinical-amberBorder/60 pb-3">
            <div className="flex items-center space-x-2 text-clinical-amber font-bold text-sm font-sans">
              <EyeOff className="h-5 w-5" />
              <span>OFF-CHAIN ENCRYPTED VAULT (IPFS / Web Crypto)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clinical-amberBg text-clinical-amber border border-clinical-amberBorder font-bold">
              ZERO-KNOWLEDGE WITNESS
            </span>
          </div>

          <p className="text-xs text-clinical-muted leading-relaxed">
            Sensitive patient medical files are AES-256-GCM encrypted locally in the patient browser before being pinned to decentralized storage (IPFS). The insurer never receives or indexes this data.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-white border border-clinical-amberBorder/60 space-y-1.5">
              <div className="flex items-center justify-between text-clinical-amber font-bold font-sans">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Clinical Diagnosis (ICD-10)</span>
                <span className="text-[10px] text-clinical-muted font-mono">G43.909, I49.9</span>
              </div>
              <p className="text-[11px] text-clinical-muted font-sans">
                Never revealed on-chain. Evaluated strictly inside Circom R1CS constraints.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-clinical-amberBorder/60 space-y-1.5">
              <div className="flex items-center justify-between text-clinical-amber font-bold font-sans">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Prescriptions & Regimen</span>
                <span className="text-[10px] text-clinical-muted font-mono">Sumatriptan 100mg</span>
              </div>
              <p className="text-[11px] text-clinical-muted font-sans">
                Blinded. Can be shared via Secret-Free Pharmacy QR Pass without leaking disease.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-clinical-amberBorder/60 space-y-1.5">
              <div className="flex items-center justify-between text-clinical-amber font-bold font-sans">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Patient Sovereign Salt & Secret</span>
                <span className="text-[10px] text-clinical-muted font-mono">0xsecret_salt...</span>
              </div>
              <p className="text-[11px] text-clinical-muted font-sans">
                Held by patient wallet. Used as private circuit witness to derive deterministic nullifier.
              </p>
            </div>
          </div>
        </div>

        {/* On-Chain Ledger Column */}
        <div className="bg-sage-50/60 border border-sage-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-sage-200 pb-3">
            <div className="flex items-center space-x-2 text-sage-800 font-bold text-sm font-sans">
              <Eye className="h-5 w-5" />
              <span>ON-CHAIN VERIFIED LEDGER (EVM Smart Contracts)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sage-100 text-sage-800 border border-sage-200 font-bold">
              PUBLIC SIGNALS ONLY
            </span>
          </div>

          <p className="text-xs text-clinical-muted leading-relaxed">
            Only mathematical commitments, Poseidon Merkle roots, non-reversible claim nullifiers, and Groth16 curve points are committed to Ethereum/EVM contracts.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-white border border-sage-200 space-y-1.5">
              <div className="flex items-center justify-between text-sage-800 font-bold font-sans">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-sage-700" /> Approved Hospital Merkle Root</span>
                <span className="text-[10px] text-sage-700 truncate max-w-[120px]">{HOSPITAL_MERKLE_ROOT.slice(0, 10)}...</span>
              </div>
              <p className="text-[11px] text-clinical-muted font-sans">
                Poseidon Merkle root proving treating facility is licensed without revealing internal staff.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-sage-200 space-y-1.5">
              <div className="flex items-center justify-between text-sage-800 font-bold font-sans">
                <span className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-sage-700" /> Claim Nullifier (Replay ID)</span>
                <span className="text-[10px] text-sage-700 font-bold">Poseidon(salt, nonce)</span>
              </div>
              <p className="text-[11px] text-clinical-muted font-sans">
                Permanent nullifier flag preventing double-spending while preserving anonymity.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-sage-200 space-y-1.5">
              <div className="flex items-center justify-between text-sage-800 font-bold font-sans">
                <span className="flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5 text-sage-700" /> Groth16 Proof (A, B, C)</span>
                <span className="text-[10px] text-sage-700 font-bold">BN254 Pairing</span>
              </div>
              <p className="text-[11px] text-clinical-muted font-sans">
                Verified on-chain by <code className="text-sage-800 font-bold">Groth16Verifier.sol</code> in ~210,000 EVM gas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Threat-Model Matrix */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-alabaster-200 pb-3">
          <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Threat Model & Attack Vector Mitigation Matrix
          </h3>
          <span className="text-xs text-clinical-muted font-mono">5 Vectors Evaluated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-alabaster-200 text-clinical-muted uppercase tracking-wider font-semibold font-sans">
                <th className="py-3 px-3">Threat Vector</th>
                <th className="py-3 px-3">Adversary Goal</th>
                <th className="py-3 px-3">Cryptographic Defense</th>
                <th className="py-3 px-3">Contract / Circuit Enforcer</th>
                <th className="py-3 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-alabaster-200 font-sans">
              <tr className="hover:bg-alabaster-50 transition">
                <td className="py-3 px-3 font-semibold text-clinical-text flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Replay Attack
                </td>
                <td className="py-3 px-3 text-clinical-muted">Submit the same valid claim twice to siphon funds</td>
                <td className="py-3 px-3 font-mono text-[11px] text-sage-800">Deterministic Nullifier = Poseidon(secret, nonce)</td>
                <td className="py-3 px-3 font-mono text-[11px] text-clinical-muted">ZKPInsuranceSettlement.sol (`isNullified`)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-100 text-sage-800 border border-sage-200">BLOCKED</span>
                </td>
              </tr>

              <tr className="hover:bg-alabaster-50 transition">
                <td className="py-3 px-3 font-semibold text-clinical-text flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Insurer Data Snooping
                </td>
                <td className="py-3 px-3 text-clinical-muted">Inspect ledger or mempool to deny coverage for preexisting conditions</td>
                <td className="py-3 px-3 font-mono text-[11px] text-sage-800">Zero-Knowledge Witness Blinding (Circom)</td>
                <td className="py-3 px-3 font-mono text-[11px] text-clinical-muted">health_claim.circom (diagnosis is private witness)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-100 text-sage-800 border border-sage-200">PREVENTED</span>
                </td>
              </tr>

              <tr className="hover:bg-alabaster-50 transition">
                <td className="py-3 px-3 font-semibold text-clinical-text flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-slate-600" /> Rogue Hospital Spoofing
                </td>
                <td className="py-3 px-3 text-clinical-muted">Unlicensed clinic generates fraudulent payout claims</td>
                <td className="py-3 px-3 font-mono text-[11px] text-sage-800">Poseidon Merkle Membership Proof (Depth 4)</td>
                <td className="py-3 px-3 font-mono text-[11px] text-clinical-muted">MerkleTreeInclusion in circuit & on-chain root check</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-100 text-sage-800 border border-sage-200">BLOCKED</span>
                </td>
              </tr>

              <tr className="hover:bg-alabaster-50 transition">
                <td className="py-3 px-3 font-semibold text-clinical-text flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-slate-600" /> Unauthorized Doctor Access
                </td>
                <td className="py-3 px-3 text-clinical-muted">Ex-physician or stranger reads patient medical chart</td>
                <td className="py-3 px-3 font-mono text-[11px] text-sage-800">AES-256-GCM + On-Chain Role Expiry Guard</td>
                <td className="py-3 px-3 font-mono text-[11px] text-clinical-muted">HealthAccessRegistry.sol (`hasActiveAccess`)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-100 text-sage-800 border border-sage-200">BLOCKED</span>
                </td>
              </tr>

              <tr className="hover:bg-alabaster-50 transition">
                <td className="py-3 px-3 font-semibold text-clinical-text flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Over-Limit / Policy Fraud
                </td>
                <td className="py-3 px-3 text-clinical-muted">Hospital claims $75,000 against a $50,000 policy limit</td>
                <td className="py-3 px-3 font-mono text-[11px] text-sage-800">LessEqThan(64) R1CS Numerical Constraints</td>
                <td className="py-3 px-3 font-mono text-[11px] text-clinical-muted">health_claim.circom (witness solver rejects)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-100 text-sage-800 border border-sage-200">HALTED</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live On-Chain Audit Trail Explorer */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-alabaster-200 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
              <Cpu className="h-5 w-5 text-sage-700" />
              Live On-Chain Audit Trail Explorer
            </h3>
            <p className="text-xs text-clinical-muted">
              Streaming all smart contract events: RecordRegistered, RecordViewed, BreakGlassAccessed, and ClaimSettled
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-clinical-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-alabaster-50 border border-alabaster-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-clinical-text placeholder-clinical-muted focus:outline-none focus:border-sage-600 focus:bg-white font-mono"
              />
            </div>

            <div className="flex items-center space-x-1 bg-alabaster-100 p-1 rounded-xl border border-alabaster-300 text-xs">
              <Filter className="h-3.5 w-3.5 text-clinical-muted ml-1.5" />
              <button
                onClick={() => setFilterRole('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'all' ? 'bg-sage-700 text-white font-semibold' : 'text-clinical-muted hover:text-clinical-text'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRole('patient')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'patient' ? 'bg-sage-700 text-white font-semibold' : 'text-clinical-muted hover:text-clinical-text'}`}
              >
                Patient
              </button>
              <button
                onClick={() => setFilterRole('hospital')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'hospital' ? 'bg-sage-700 text-white font-semibold' : 'text-clinical-muted hover:text-clinical-text'}`}
              >
                Hospital
              </button>
              <button
                onClick={() => setFilterRole('emergency')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'emergency' ? 'bg-rose-700 text-white font-semibold' : 'text-clinical-muted hover:text-clinical-text'}`}
              >
                Break-Glass
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-center py-8 text-xs text-clinical-muted">No matching audit events found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-alabaster-50 border border-alabaster-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-clinical-text">{log.action}</span>
                    <span className="text-[10px] font-mono text-clinical-muted">{log.timestamp}</span>
                    {log.badge && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.badge === 'success' ? 'bg-sage-100 text-sage-800' :
                        log.badge === 'warning' ? 'bg-amber-100 text-amber-800' :
                        log.badge === 'danger' ? 'bg-rose-100 text-rose-800' :
                        'bg-alabaster-200 text-clinical-text'
                      }`}>
                        {log.actorRole.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-clinical-muted text-[11px]">{log.details}</p>
                </div>

                <div className="text-right font-mono text-[10px] text-clinical-muted shrink-0">
                  <div>Actor: <span className="text-clinical-text">{log.actorAddress.slice(0, 6)}...{log.actorAddress.slice(-4)}</span></div>
                  {log.txHash && <div className="text-sage-700 truncate max-w-[140px]">Tx: {log.txHash.slice(0, 10)}...</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contract Verification References */}
      <div className="p-4 rounded-xl bg-alabaster-100 border border-alabaster-300 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-clinical-muted">
        <div>Registry: <span className="text-sage-800 font-semibold">{REGISTRY_CONTRACT_ADDRESS}</span></div>
        <div>Verifier: <span className="text-sage-800 font-semibold">{VERIFIER_CONTRACT_ADDRESS}</span></div>
        <div>Settlement: <span className="text-sage-800 font-semibold">{SETTLEMENT_CONTRACT_ADDRESS}</span></div>
      </div>
    </div>
  );
};
