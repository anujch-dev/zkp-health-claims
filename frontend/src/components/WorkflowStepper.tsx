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
    <div className="bg-white border-b border-alabaster-300 py-3.5 px-4 sm:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Stepper Steps */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-clinical-muted font-bold mr-1 hidden xl:inline">
            Verification Journey:
          </span>

          {steps.map((s, idx) => {
            const isActive = currentRole === s.id;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => onSelectRole(s.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    isActive
                      ? 'bg-sage-700 text-white border-sage-700 shadow-sm font-semibold'
                      : s.isDone
                      ? 'bg-sage-50 text-sage-900 border-sage-200 hover:border-sage-300'
                      : 'bg-alabaster-50 text-clinical-muted border-alabaster-200 hover:text-clinical-text hover:bg-white'
                  }`}
                  title={terminologyMode === 'plain' ? s.plainDesc : s.desc}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-sage-800 text-white'
                        : s.isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-alabaster-200 text-clinical-muted'
                    }`}
                  >
                    {s.isDone && !isActive ? (
                      <CheckCircle2 className="h-3 w-3 stroke-[3]" />
                    ) : (
                      <span>{s.stepNumber}</span>
                    )}
                  </div>

                  <Icon className="h-3.5 w-3.5 opacity-80 shrink-0" />

                  <span className="font-medium whitespace-nowrap">
                    {terminologyMode === 'plain' ? s.plainTitle : s.title}
                  </span>

                  {s.isDone && !isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>

                {idx < steps.length - 1 && (
                  <span className="text-alabaster-400 font-mono text-xs hidden sm:inline">&rarr;</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Guided "Next Step" CTA */}
        {nextAction && (
          <button
            onClick={() => onSelectRole(nextAction.role)}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 border border-sage-300 text-xs font-semibold shadow-sm transition group self-start lg:self-auto"
          >
            <span>{nextAction.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-sage-700 group-hover:translate-x-0.5 transition" />
          </button>
        )}
      </div>
    </div>
  );
};
