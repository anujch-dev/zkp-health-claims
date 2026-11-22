import React from 'react';
import { Shield, Lock, FileCode, ExternalLink } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  walletBalance: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, walletBalance }) => {
  const getRoleLabel = () => {
    switch (currentRole) {
      case 'patient': return { name: 'Alice Vance (Patient)', role: 'PATIENT', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'hospital': return { name: 'Apex Health System', role: 'HOSPITAL', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'insurer': return { name: 'AetherShield Insurer', role: 'INSURER', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      default: return { name: 'Interactive Evaluator', role: 'JUDGE DEMO', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
  };

  const roleInfo = getRoleLabel();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">ZK-HealthClaims</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                WEB3 · W3-01
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-Knowledge Private Medical Records & Smart Claims Settlement</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Local Hardhat / EVM</span>
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-slate-400 font-mono">Balance: {walletBalance} ETH</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${roleInfo.color}`}>
            <Lock className="h-3.5 w-3.5" />
            <span>{roleInfo.name}</span>
          </div>

          <a
            href="https://github.com/anujch-dev/zkp-health-claims"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition border border-slate-700/40"
          >
            <FileCode className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
};
