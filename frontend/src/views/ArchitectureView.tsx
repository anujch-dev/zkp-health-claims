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
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Architecture & Threat Model Matrix</h2>
              <p className="text-xs text-slate-400">
                Formal cryptographic separation of On-Chain state vs Off-Chain AES-256-GCM encrypted storage
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              BN254 Pairing Check
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Groth16 SNARK
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              HIPAA Tier 4
            </span>
          </div>
        </div>
      </div>

      {/* Visual Data Boundary: On-Chain vs Off-Chain Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Off-Chain Storage Column */}
        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <EyeOff className="h-5 w-5" />
              <span>OFF-CHAIN ENCRYPTED VAULT (IPFS / Web Crypto)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              ZERO-KNOWLEDGE WITNESS
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Sensitive patient medical files are AES-256-GCM encrypted locally in the patient browser before being pinned to decentralized storage (IPFS). The insurer never receives or indexes this data.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Clinical Diagnosis (ICD-10)</span>
                <span className="text-[10px] text-slate-500">G43.909, I49.9, etc.</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Never revealed on-chain. Evaluated strictly inside Circom R1CS constraints.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Prescriptions & Regimen</span>
                <span className="text-[10px] text-slate-500">Sumatriptan 100mg, etc.</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Blinded. Can be shared via Secret-Free Pharmacy QR Pass without leaking disease.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Patient Sovereign Salt & Secret</span>
                <span className="text-[10px] text-slate-500">0xsecret_salt...</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Held by patient wallet. Used as private circuit witness to derive deterministic nullifier.
              </p>
            </div>
          </div>
        </div>

        {/* On-Chain Ledger Column */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Eye className="h-5 w-5" />
              <span>ON-CHAIN VERIFIED LEDGER (EVM Smart Contracts)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PUBLIC SIGNALS ONLY
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Only mathematical commitments, Poseidon Merkle roots, non-reversible claim nullifiers, and Groth16 curve points are committed to Ethereum/EVM contracts.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Approved Hospital Merkle Root</span>
                <span className="text-[10px] text-indigo-400 truncate max-w-[120px]">{HOSPITAL_MERKLE_ROOT.slice(0, 10)}...</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Poseidon Merkle root proving treating facility is licensed without revealing internal staff.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5" /> Claim Nullifier (Replay ID)</span>
                <span className="text-[10px] text-amber-400">Poseidon(salt, nonce)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Permanent nullifier flag preventing double-spending while preserving anonymity.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5" /> Groth16 Proof (A, B, C)</span>
                <span className="text-[10px] text-emerald-400">BN254 Pairing</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Verified on-chain by <code className="text-emerald-300">Groth16Verifier.sol</code> in ~210,000 EVM gas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Threat-Model Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Threat Model & Attack Vector Mitigation Matrix
          </h3>
          <span className="text-xs text-slate-400 font-mono">5 Vectors Evaluated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Threat Vector</th>
                <th className="py-3 px-3">Adversary Goal</th>
                <th className="py-3 px-3">Cryptographic Defense</th>
                <th className="py-3 px-3">Contract / Circuit Enforcer</th>
                <th className="py-3 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Replay Attack
                </td>
                <td className="py-3 px-3 text-slate-300">Submit the same valid claim twice to siphon funds</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">Deterministic Nullifier = Poseidon(secret, nonce)</td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-400">ZKPInsuranceSettlement.sol (`isNullified`)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">BLOCKED</span>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Insurer Data Snooping
                </td>
                <td className="py-3 px-3 text-slate-300">Inspect ledger or mempool to deny coverage for preexisting conditions</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">Zero-Knowledge Witness Blinding (Circom)</td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-400">health_claim.circom (diagnosis is private witness)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">PREVENTED</span>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-purple-400" /> Rogue Hospital Spoofing
                </td>
                <td className="py-3 px-3 text-slate-300">Unlicensed clinic generates fraudulent payout claims</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">Poseidon Merkle Membership Proof (Depth 4)</td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-400">MerkleTreeInclusion in circuit & on-chain root check</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">BLOCKED</span>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-blue-400" /> Unauthorized Doctor Access
                </td>
                <td className="py-3 px-3 text-slate-300">Ex-physician or stranger reads patient medical chart</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">AES-256-GCM + On-Chain Role Expiry Guard</td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-400">HealthAccessRegistry.sol (`hasActiveAccess`)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">BLOCKED</span>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-3 font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Over-Limit / Policy Fraud
                </td>
                <td className="py-3 px-3 text-slate-300">Hospital claims $75,000 against a $50,000 policy limit</td>
                <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">LessEqThan(64) R1CS Numerical Constraints</td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-400">health_claim.circom (witness solver rejects)</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">HALTED</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live On-Chain Audit Trail Explorer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-emerald-400" />
              Live On-Chain Audit Trail Explorer
            </h3>
            <p className="text-xs text-slate-400">
              Streaming all smart contract events: RecordRegistered, RecordViewed, BreakGlassAccessed, and ClaimSettled
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
              <button
                onClick={() => setFilterRole('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRole('patient')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'patient' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Patient
              </button>
              <button
                onClick={() => setFilterRole('hospital')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'hospital' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Hospital
              </button>
              <button
                onClick={() => setFilterRole('emergency')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterRole === 'emergency' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Break-Glass
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500">No matching audit events found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                    {log.badge && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.badge === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.badge === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                        log.badge === 'danger' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {log.actorRole.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px]">{log.details}</p>
                </div>

                <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
                  <div>Actor: <span className="text-slate-400">{log.actorAddress.slice(0, 6)}...{log.actorAddress.slice(-4)}</span></div>
                  {log.txHash && <div className="text-indigo-400 truncate max-w-[140px]">Tx: {log.txHash.slice(0, 10)}...</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contract Verification References */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div>Registry: <span className="text-emerald-400">{REGISTRY_CONTRACT_ADDRESS}</span></div>
        <div>Verifier: <span className="text-indigo-400">{VERIFIER_CONTRACT_ADDRESS}</span></div>
        <div>Settlement: <span className="text-purple-400">{SETTLEMENT_CONTRACT_ADDRESS}</span></div>
      </div>
    </div>
  );
};
