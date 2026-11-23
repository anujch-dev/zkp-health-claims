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
    <div className="bg-[#FAF9F6] border border-[#E7E1D7] rounded-sm p-4 sm:p-5 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-[#294638]"></span>
            <h2 className="text-sm font-semibold text-[#292D29] flex items-center gap-1.5 font-serif">
              <Cpu className="h-4 w-4 text-[#294638]" />
              Live Cryptographic Verification & Attack Sandbox
            </h2>
          </div>
          <p className="text-xs text-[#5F685F] max-w-2xl">
            Test the complete decentralized zero-knowledge pipeline with 1 click. Verify how the Groth16 circuit and smart contracts enforce policy limits, provider accreditation, and replay protection without leaking clinical secrets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunValidClaim}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-[#294638] hover:bg-[#1E342A] text-[#FAF9F6] font-medium text-xs transition disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Valid Claim ($2,400 MRI)</span>
          </button>

          <button
            onClick={onTestReplayAttack}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-[#F3F0E9] text-[#8A4B1A] border border-[#ECC9A5] text-xs font-medium transition disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Replay Attack</span>
          </button>

          {onTestTamperedProof && (
            <button
              onClick={onTestTamperedProof}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-[#F3F0E9] text-[#8B3A3A] border border-[#E8BDBD] text-xs font-medium transition disabled:opacity-50"
            >
              <XCircle className="h-3 w-3" />
              <span>Tampered Proof</span>
            </button>
          )}

          {onTestUnaccreditedHospital && (
            <button
              onClick={onTestUnaccreditedHospital}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-[#F3F0E9] text-[#5F685F] border border-[#E7E1D7] text-xs font-medium transition disabled:opacity-50"
            >
              <Lock className="h-3 w-3" />
              <span>Rogue Provider</span>
            </button>
          )}

          <button
            onClick={onTestLimitExceeded}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-[#F3F0E9] text-[#8B3A3A] border border-[#E8BDBD] text-xs font-medium transition disabled:opacity-50"
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Limit Exceeded ($75k)</span>
          </button>

          <button
            onClick={onTestExpiredPolicy}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-[#F3F0E9] text-[#292D29] border border-[#E7E1D7] text-xs font-medium transition disabled:opacity-50"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Expired Policy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
