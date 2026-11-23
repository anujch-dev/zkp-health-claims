import React from 'react';
import { UserRole, TerminologyMode } from '../types';
import { ArrowRight, CheckCircle2, Lock, Cpu, DollarSign, Network } from 'lucide-react';

interface WorkflowStepperProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  hasRecord: boolean;
  hasProofOrClaim: boolean;
  hasSettled: boolean;
  terminologyMode: TerminologyMode;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentRole,
  onSelectRole,
  hasRecord,
  hasProofOrClaim,
  hasSettled,
  terminologyMode,
}) => {
  const steps: {
    id: UserRole;
    stepNumber: number;
    title: string;
    plainTitle: string;
    desc: string;
    plainDesc: string;
    isDone: boolean;
    icon: React.ElementType;
  }[] = [
    {
      id: 'patient',
      stepNumber: 1,
      title: 'Patient Record Vault',
      plainTitle: '1. Patient Medical Vault',
      desc: 'AES-256-GCM off-chain encryption & commitments',
      plainDesc: 'Store encrypted records & approve doctor access',
      isDone: hasRecord,
      icon: Lock,
    },
    {
      id: 'hospital',
      stepNumber: 2,
      title: 'Hospital ZK Prover',
      plainTitle: '2. Hospital Proof Generator',
      desc: 'Circom Groth16 witness & Merkle proof',
      plainDesc: 'Prove valid insurance policy without sharing diagnosis',
      isDone: hasProofOrClaim,
      icon: Cpu,
    },
    {
      id: 'insurer',
      stepNumber: 3,
      title: 'Insurer Settlement',
      plainTitle: '3. Instant Insurance Payout',
      desc: 'EVM Groth16 verification & nullifier spend',
      plainDesc: 'Contract checks math & automatically releases funds',
      isDone: hasSettled,
      icon: DollarSign,
    },
    {
      id: 'architecture',
      stepNumber: 4,
      title: 'Audit Trail & Threat Model',
      plainTitle: '4. Public Audit Log',
      desc: 'On-chain vs off-chain boundary inspection',
      plainDesc: 'Verify every transaction on the public ledger',
      isDone: hasSettled,
      icon: Network,
    },
  ];

  // Determine what the recommended next step is
  const getNextRole = (): { role: UserRole; label: string } | null => {
    if (currentRole === 'demo') {
      return { role: 'patient', label: 'Start Step 1: Open Patient Vault' };
    }
    if (currentRole === 'patient') {
      return { role: 'hospital', label: 'Proceed to Step 2: Hospital Prover' };
    }
    if (currentRole === 'hospital') {
      return { role: 'insurer', label: 'Proceed to Step 3: Insurer Settlement' };
    }
    if (currentRole === 'insurer') {
      return { role: 'architecture', label: 'Inspect Step 4: Audit Trail & Security' };
    }
    return { role: 'demo', label: 'Return to Overview & Live Demo' };
  };

  const nextAction = getNextRole();

  return (
    <div className="bg-[#FAF9F6] border-b border-[#E7E1D7] py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Stepper Steps */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[#5F685F] font-bold mr-1 hidden xl:inline">
            Verification Journey:
          </span>

          {steps.map((s, idx) => {
            const isActive = currentRole === s.id;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => onSelectRole(s.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm border text-xs transition-all ${
                    isActive
                      ? 'bg-[#294638] text-[#FAF9F6] border-[#294638] font-semibold'
                      : s.isDone
                      ? 'bg-[#E7E1D7] text-[#294638] border-[#A6B3A1]'
                      : 'bg-white text-[#5F685F] border-[#E7E1D7] hover:text-[#292D29] hover:bg-[#F3F0E9]'
                  }`}
                  title={terminologyMode === 'plain' ? s.plainDesc : s.desc}
                >
                  <div
                    className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#1E342A] text-[#FAF9F6]'
                        : s.isDone
                        ? 'bg-[#294638] text-[#FAF9F6]'
                        : 'bg-[#E7E1D7] text-[#5F685F]'
                    }`}
                  >
                    {s.isDone && !isActive ? (
                      <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                    ) : (
                      <span>{s.stepNumber}</span>
                    )}
                  </div>

                  <Icon className="h-3.5 w-3.5 opacity-80 shrink-0" />

                  <span className="font-medium whitespace-nowrap">
                    {terminologyMode === 'plain' ? s.plainTitle : s.title}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <span className="text-[#A6B3A1] font-mono text-xs hidden sm:inline">&rarr;</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Guided "Next Step" CTA */}
        {nextAction && (
          <button
            onClick={() => onSelectRole(nextAction.role)}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-sm bg-[#294638] hover:bg-[#1E342A] text-[#FAF9F6] text-xs uppercase tracking-wider font-semibold transition group self-start lg:self-auto"
          >
            <span>{nextAction.label}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
