import React from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

interface GuidedDemoBannerProps {
  onRunValidClaim: () => void;
  onTestReplayAttack: () => void;
  onTestExpiredPolicy: () => void;
  onTestLimitExceeded: () => void;
  isProcessing: boolean;
}

export const GuidedDemoBanner: React.FC<GuidedDemoBannerProps> = ({
  onRunValidClaim,
  onTestReplayAttack,
  onTestExpiredPolicy,
  onTestLimitExceeded,
  isProcessing,
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 mb-8 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400"></span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              Live Judge Evaluation & Interactive Sandbox
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Test the complete decentralized zero-knowledge pipeline with one click. Compare how the cryptographic prover verifies hospital credentials, policy limits, and replay protection without ever exposing the patient's private diagnosis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRunValidClaim}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Sample Valid Claim ($2,400 MRI)</span>
          </button>

          <button
            onClick={onTestReplayAttack}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium text-xs transition disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Test Replay Attack (Duplicate Nullifier)</span>
          </button>

          <button
            onClick={onTestLimitExceeded}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-medium text-xs transition disabled:opacity-50"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Test Limit Exceeded ($75k)</span>
          </button>

          <button
            onClick={onTestExpiredPolicy}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs transition disabled:opacity-50"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Test Expired Policy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
