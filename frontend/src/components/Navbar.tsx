import React from 'react';
import { Shield, Lock, FileCode, ExternalLink, Sparkles, Sliders } from 'lucide-react';
import { UserRole, TerminologyMode } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  walletBalance: string;
  onSelectRole?: (role: UserRole) => void;
  terminologyMode: TerminologyMode;
  onToggleTerminology: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  walletBalance,
  onSelectRole,
  terminologyMode,
  onToggleTerminology,
}) => {
  const navLinks: { id: UserRole; label: string }[] = [
    { id: 'demo', label: 'Overview' },
    { id: 'patient', label: 'Patient Vault' },
    { id: 'hospital', label: 'Hospital Prover' },
    { id: 'insurer', label: 'Insurer & Settlement' },
    { id: 'architecture', label: 'Architecture & Audit' },
  ];

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'patient':
        return { name: 'Alice Vance (Patient)', role: 'PATIENT', badgeClass: 'bg-sage-100 text-sage-800 border-sage-200' };
      case 'hospital':
        return { name: 'Apex Health System', role: 'HOSPITAL', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'insurer':
        return { name: 'AetherShield Insurer', role: 'INSURER', badgeClass: 'bg-sage-600 text-white border-sage-700' };
      case 'architecture':
        return { name: 'Audit & Threat Model', role: 'EXPLORER', badgeClass: 'bg-alabaster-200 text-clinical-text border-alabaster-300' };
      default:
        return { name: 'Interactive Evaluator', role: 'JUDGE DEMO', badgeClass: 'bg-sage-100 text-sage-800 border-sage-200' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="border-b border-alabaster-300 bg-white/90 backdrop-blur sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Mark */}
        <div
          onClick={() => onSelectRole?.('demo')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-sage-700 text-white flex items-center justify-center shadow-sm group-hover:bg-sage-600 transition">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-lg text-clinical-text tracking-tight">
                ZK-HealthClaims
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 font-mono font-medium border border-sage-200">
                WEB3 · W3-01
              </span>
            </div>
            <p className="text-[11px] text-clinical-muted hidden sm:block">
              Privacy-Preserving Health Records & ZKP Claims
            </p>
          </div>
        </div>

        {/* Quick Navigation Links */}
        {onSelectRole && (
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = currentRole === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectRole(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-sage-100 text-sage-800 font-semibold'
                      : 'text-clinical-muted hover:text-clinical-text hover:bg-alabaster-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Status Badges & Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Terminology Mode Toggle (Plain English vs Technical) */}
          <button
            onClick={onToggleTerminology}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              terminologyMode === 'plain'
                ? 'bg-sage-100 hover:bg-sage-200 text-sage-800 border-sage-300'
                : 'bg-alabaster-200 hover:bg-alabaster-300 text-clinical-text border-alabaster-300'
            }`}
            title="Toggle between Plain English (Medical/Patient view) and Cryptographic (ZK Engineer/Judge view)"
          >
            {terminologyMode === 'plain' ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-sage-700" />
                <span className="hidden sm:inline">Mode: Plain English</span>
                <span className="sm:hidden">Plain</span>
              </>
            ) : (
              <>
                <Sliders className="h-3.5 w-3.5 text-clinical-muted" />
                <span className="hidden sm:inline">Mode: ZK / Judge</span>
                <span className="sm:hidden">Judge</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-alabaster-100 border border-alabaster-300 text-xs text-clinical-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-medium text-clinical-text">Hardhat / EVM</span>
            <span className="text-alabaster-400 font-mono">|</span>
            <span className="font-mono text-clinical-text">{walletBalance} ETH</span>
          </div>

          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-medium ${roleInfo.badgeClass}`}>
            <Lock className="h-3 w-3" />
            <span className="hidden sm:inline">{roleInfo.name}</span>
            <span className="sm:hidden">{roleInfo.role}</span>
          </div>

          <a
            href="https://github.com/anujch-dev/zkp-health-claims"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-clinical-muted hover:text-clinical-text px-2.5 py-1 rounded-lg bg-alabaster-100 hover:bg-alabaster-200 transition border border-alabaster-300"
            title="View Source on GitHub"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-mono text-[11px]">GitHub</span>
            <ExternalLink className="h-3 w-3 text-clinical-muted" />
          </a>
        </div>
      </div>
    </header>
  );
};
