import React from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldAlert, Cpu, Lock, XCircle } from 'lucide-react';

interface GuidedDemoBannerProps {
  onRunValidClaim: () => void;
  onTestReplayAttack: () => void;
  onTestExpiredPolicy: () => void;
  onTestLimitExceeded: () => void;
  onTestTamperedProof?: () => void;
  onTestUnaccreditedHospital?: () => void;
  isProcessing: boolean;
}

export const GuidedDemoBanner: React.FC<GuidedDemoBannerProps> = ({
  onRunValidClaim,
  onTestReplayAttack,
  onTestExpiredPolicy,
  onTestLimitExceeded,
  onTestTamperedProof,
  onTestUnaccreditedHospital,
  isProcessing,
}) => {
  return (
    <div className="bg-white border border-alabaster-300 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-sage-600 animate-ping"></span>
            <h2 className="text-sm font-semibold text-clinical-text flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-sage-600" />
              Live Judge Evaluation & Attack Sandbox
            </h2>
          </div>
          <p className="text-xs text-clinical-muted max-w-2xl">
            Test the complete decentralized zero-knowledge pipeline with 1 click. Verify how the Groth16 circuit and smart contracts enforce policy limits, provider accreditation, and replay protection without leaking clinical secrets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunValidClaim}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sage-700 hover:bg-sage-600 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Valid Claim ($2,400 MRI)</span>
          </button>

          <button
            onClick={onTestReplayAttack}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium transition disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Replay Attack</span>
          </button>

          {onTestTamperedProof && (
            <button
              onClick={onTestTamperedProof}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-medium transition disabled:opacity-50"
            >
              <XCircle className="h-3 w-3" />
              <span>Tampered Proof</span>
            </button>
          )}

          {onTestUnaccreditedHospital && (
            <button
              onClick={onTestUnaccreditedHospital}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition disabled:opacity-50"
            >
              <Lock className="h-3 w-3" />
              <span>Rogue Provider</span>
            </button>
          )}

          <button
            onClick={onTestLimitExceeded}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-medium transition disabled:opacity-50"
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Limit Exceeded ($75k)</span>
          </button>

          <button
            onClick={onTestExpiredPolicy}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-alabaster-200 hover:bg-alabaster-300 text-clinical-text border border-alabaster-300 text-xs font-medium transition disabled:opacity-50"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Expired Policy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
