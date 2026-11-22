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
      label: 'Judge Walkthrough',
      subtitle: 'One-click scenarios & console',
      icon: PlayCircle,
    },
    {
      id: 'patient',
      label: '1. Patient Portal',
      subtitle: 'AES-256-GCM, Break-Glass & FHIR',
      icon: User,
    },
    {
      id: 'hospital',
      label: '2. Hospital Portal',
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
    <div className="bg-slate-900/60 border-b border-slate-800 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-2 justify-center sm:justify-start">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border transition-all text-left relative ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {r.label}
                  </span>
                  {r.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                      {r.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">{r.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
