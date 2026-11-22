import React from 'react';
import { Cpu, Play, RotateCcw, AlertTriangle, ShieldCheck, Lock, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import { ArchitectureCard } from '../components/ArchitectureCard';

interface GuidedDemoViewProps {
  onRunValidClaim: () => void;
  onTestReplayAttack: () => void;
  onTestExpiredPolicy: () => void;
  onTestLimitExceeded: () => void;
  isProcessing: boolean;
  demoLogs: string[];
}

export const GuidedDemoView: React.FC<GuidedDemoViewProps> = ({
  onRunValidClaim,
  onTestReplayAttack,
  onTestExpiredPolicy,
  onTestLimitExceeded,
  isProcessing,
  demoLogs,
}) => {
  return (
    <div className="space-y-8">
      {/* Hero Banner for Judges */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Decentralized Hackathon Prototype · WEB3 · W3-01</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Privacy-Preserving Health Records & Zero-Knowledge Insurance Claims
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            A full-stack Web3 application solving the multi-billion dollar healthcare dilemma: <span className="text-indigo-300 font-semibold">proving policy validity and procedure eligibility without exposing private medical records or diagnosis details</span> to the insurer.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onRunValidClaim}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Run Sample Valid Claim Flow</span>
            </button>

            <button
              onClick={onTestReplayAttack}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Test Replay Attack (Duplicate Nullifier)</span>
            </button>

            <button
              onClick={onTestLimitExceeded}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition disabled:opacity-50"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Test Limit Exceeded ($75,000)</span>
            </button>

            <button
              onClick={onTestExpiredPolicy}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Test Expired Policy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 3-Stage Pipeline Diagram */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-indigo-400" />
          The 3-Role Decentralized Trust Engine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">1. Patient Control</span>
              <Lock className="h-4 w-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Sovereign Medical Records</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Patient owns off-chain encrypted medical records (IPFS). Hashes are stored on-chain. Patient grants doctor re-encryption keys.
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">2. Hospital Prover</span>
              <EyeOff className="h-4 w-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-white">ZK Proof Generation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hospital proves it is in the accredited Merkle tree, policy is active, and procedure is covered—without revealing diagnosis.
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">3. Insurer Contract</span>
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white">On-Chain Settlement</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart contract verifies Groth16 proof, records unique nullifier to prevent double-spending, and auto-disburses payout.
            </p>
          </div>
        </div>
      </div>

      {/* Live Cryptographic Execution Console Logs */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live ZK Prover & EVM Smart Contract Console
          </span>
          <span className="text-[10px] font-mono text-slate-500">Real-Time Evaluation Feed</span>
        </div>

        <div className="h-48 overflow-y-auto space-y-1.5 font-mono text-xs text-slate-300 p-2 bg-slate-900/50 rounded-xl border border-slate-800/60">
          {demoLogs.length === 0 ? (
            <p className="text-slate-600 italic">No execution events yet. Click one of the demo buttons above to trigger a live run.</p>
          ) : (
            demoLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-indigo-400 shrink-0">&gt;</span>
                <span className={log.includes('SUCCESS') || log.includes('Settled') ? 'text-emerald-300 font-semibold' : log.includes('REJECT') || log.includes('BLOCKED') || log.includes('FAILED') ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Architecture & Threat Model Deep Dive */}
      <ArchitectureCard />
    </div>
  );
};
