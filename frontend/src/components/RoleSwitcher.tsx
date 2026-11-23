import React from 'react';
import { User, Building2, ShieldCheck, PlayCircle, Network } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  pendingClaimsCount: number;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onSelectRole,
  pendingClaimsCount,
}) => {
  const roles: {
    id: UserRole;
    label: string;
    subtitle: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    {
      id: 'demo',
      label: 'Overview & Demo',
      subtitle: 'Editorial walk-through & console',
      icon: PlayCircle,
    },
    {
      id: 'patient',
      label: '1. Patient Vault',
      subtitle: 'AES-256-GCM, Break-Glass & FHIR',
      icon: User,
    },
    {
      id: 'hospital',
      label: '2. Hospital Prover',
      subtitle: 'Groth16 Prover & Attack Simulator',
      icon: Building2,
    },
    {
      id: 'insurer',
      label: '3. Insurer & Settlement',
      subtitle: 'X-Ray Calldata & Proof Receipts',
      icon: ShieldCheck,
      badge: pendingClaimsCount > 0 ? pendingClaimsCount : undefined,
    },
    {
      id: 'architecture',
      label: '4. Threat Model & Audit',
      subtitle: 'On-Chain vs Off-Chain Explorer',
      icon: Network,
    },
  ];

  return (
    <div className="bg-alabaster-100 border-b border-alabaster-300 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-2.5 justify-center sm:justify-start">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all text-left relative ${
                isActive
                  ? 'bg-sage-700 border-sage-700 text-white shadow-sm'
                  : 'bg-white border-alabaster-300 text-clinical-muted hover:text-clinical-text hover:border-sage-300 hover:bg-sage-50/50'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-sage-800 text-white' : 'bg-alabaster-100 text-clinical-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-clinical-text'}`}>
                    {r.label}
                  </span>
                  {r.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {r.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] hidden md:block ${isActive ? 'text-sage-200' : 'text-clinical-muted'}`}>
                  {r.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
