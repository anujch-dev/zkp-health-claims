import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, DollarSign, Eye, Hash, ShieldAlert, Cpu } from 'lucide-react';
import { ClaimSubmission, InsurancePolicy } from '../types';
import { ArchitectureCard } from '../components/ArchitectureCard';

interface InsurerViewProps {
  claims: ClaimSubmission[];
  policy: InsurancePolicy;
  onSettleClaim: (claimId: string) => void;
  isProcessing: boolean;
}

export const InsurerView: React.FC<InsurerViewProps> = ({
  claims,
  policy,
  onSettleClaim,
  isProcessing,
}) => {
  const [selectedProofClaim, setSelectedProofClaim] = useState<ClaimSubmission | null>(null);

  const totalSettledPayout = claims
    .filter(c => c.status === 'PAYOUT_SETTLED')
    .reduce((acc, c) => acc + c.payoutAmount, 0);

  const verifiedClaimsCount = claims.filter(c => c.status === 'VERIFIED').length;
  const replayedClaimsCount = claims.filter(c => c.status === 'REJECTED_REPLAY').length;

  return (
    <div className="space-y-8">
      {/* Insurer Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Settled Claims</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${totalSettledPayout.toLocaleString()} USDC
          </div>
          <p className="text-[11px] text-slate-500">Auto-disbursed via smart contract escrow</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ZK Verified Pending</span>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {verifiedClaimsCount}
          </div>
          <p className="text-[11px] text-slate-500">Groth16 proofs verified on-chain</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Replay Attacks Blocked</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {replayedClaimsCount}
          </div>
          <p className="text-[11px] text-slate-500">Prevented via claim nullifiers</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Policy Reserve</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            ${policy.remainingCoverage.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Remaining pool limit</p>
        </div>
      </div>

      {/* Claims Verification & Replay Protection Ledger */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              On-Chain Claims Verification & Nullifier Registry
            </h3>
            <p className="text-xs text-slate-400">
              Every claim verifies the hospital Merkle root, valid policy commitment, and registers a unique nullifier to prevent replay attacks
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Contract: ZKPInsuranceSettlement.sol
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Claim ID / Time</th>
                <th className="py-3 px-3">Hospital Provider</th>
                <th className="py-3 px-3">Claim Amount</th>
                <th className="py-3 px-3">Claim Nullifier (Replay ID)</th>
                <th className="py-3 px-3">ZK Proof Status</th>
                <th className="py-3 px-3 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{claim.id}</div>
                    <div className="text-[10px] text-slate-500">{claim.createdAt}</div>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <div className="text-slate-200 font-medium">{claim.hospitalName}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {claim.hospitalAddress.slice(0, 6)}...{claim.hospitalAddress.slice(-4)}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-400 text-sm">
                      ${claim.publicInputs.claimAmount.toLocaleString()} USDC
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5" title={claim.publicInputs.claimNullifier}>
                      <Hash className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="text-amber-300 truncate max-w-[140px]">
                        {claim.publicInputs.claimNullifier.slice(0, 8)}...{claim.publicInputs.claimNullifier.slice(-6)}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    {claim.status === 'PAYOUT_SETTLED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Settled On-Chain
                      </span>
                    )}
                    {claim.status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Cpu className="h-3 w-3" /> Valid Groth16 Proof
                      </span>
                    )}
                    {claim.status === 'REJECTED_REPLAY' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertOctagon className="h-3 w-3" /> Replay Detected
                      </span>
                    )}
                    {claim.status === 'REJECTED_INVALID_PROOF' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertOctagon className="h-3 w-3" /> Invalid Proof
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedProofClaim(claim)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Inspect Cryptographic Proof & Signals"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {claim.status === 'VERIFIED' && (
                      <button
                        onClick={() => onSettleClaim(claim.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                      >
                        Settle Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Threat Model & Architecture Card */}
      <ArchitectureCard />

      {/* Proof Inspector Modal */}
      {selectedProofClaim && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  ZK Proof & Public Inputs Inspector ({selectedProofClaim.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedProofClaim(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold block">Public Signals (On-Chain Verification Parameters):</span>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">[0] Hospital Merkle Root:</span>
                    <span className="text-indigo-400 truncate max-w-[280px]">{selectedProofClaim.publicInputs.hospitalMerkleRoot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">[1] Policy Commitment:</span>
                    <span className="text-slate-300 truncate max-w-[280px]">{selectedProofClaim.publicInputs.policyCommitment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">[2] Claim Nullifier:</span>
                    <span className="text-amber-400 font-bold truncate max-w-[280px]">{selectedProofClaim.publicInputs.claimNullifier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">[3] Claim Amount:</span>
                    <span className="text-emerald-400 font-bold">${selectedProofClaim.publicInputs.claimAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Educational Comparison: What was hidden */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2 font-sans">
                <span className="text-rose-400 font-bold text-xs flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> What Was Proven Valid WITHOUT Revealing to Insurer:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>• Hospital Merkle inclusion: <span className="text-emerald-400 font-bold">YES</span></div>
                  <div>• Policy active on claim date: <span className="text-emerald-400 font-bold">YES</span></div>
                  <div>• Procedure covered & in budget: <span className="text-emerald-400 font-bold">YES</span></div>
                  <div>• Claim amount within limits: <span className="text-emerald-400 font-bold">YES</span></div>
                  <div className="col-span-2 text-slate-400 text-[11px] italic">
                    The insurer cannot see the patient's diagnosis code, doctor examination notes, or prescriptions.
                  </div>
                </div>
              </div>

              {/* Raw Groth16 JSON */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Raw Groth16 Proof Points:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 overflow-x-auto">
                  {JSON.stringify(selectedProofClaim.proof, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProofClaim(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
