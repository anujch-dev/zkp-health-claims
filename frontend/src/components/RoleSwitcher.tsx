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
    <div className="bg-[#FAF9F6] border-b border-[#E7E1D7] py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-2.5 justify-center sm:justify-start">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-sm border transition-all text-left relative ${
                isActive
                  ? 'bg-[#294638] border-[#294638] text-[#FAF9F6]'
                  : 'bg-white border-[#E7E1D7] text-[#5F685F] hover:text-[#292D29] hover:border-[#A6B3A1] hover:bg-[#F3F0E9]'
              }`}
            >
              <div
                className={`p-1.5 rounded-sm ${
                  isActive ? 'bg-[#1E342A] text-[#FAF9F6]' : 'bg-[#F3F0E9] text-[#5F685F]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs font-semibold ${isActive ? 'text-[#FAF9F6]' : 'text-[#292D29]'}`}>
                    {r.label}
                  </span>
                  {r.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-bold bg-[#FBF0E4] text-[#8A4B1A] border border-[#ECC9A5]">
                      {r.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] hidden md:block ${isActive ? 'text-[#A6B3A1]' : 'text-[#5F685F]'}`}>
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
