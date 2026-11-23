import React, { useState } from 'react';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';
import { UserRole, TerminologyMode } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  walletBalance?: string;
  onSelectRole?: (role: UserRole, subPath?: string) => void;
  terminologyMode?: TerminologyMode;
  onToggleTerminology?: () => void;
  isBackendOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  isBackendOnline,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (role: UserRole, subPath?: string) => {
    setMobileMenuOpen(false);
    if (!onSelectRole) return;
    onSelectRole(role, subPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'patient':
        return { label: 'Patient Portal', color: 'bg-emerald-600', text: 'text-emerald-900', border: 'border-emerald-200' };
      case 'hospital':
        return { label: 'Hospital Portal', color: 'bg-blue-600', text: 'text-blue-900', border: 'border-blue-200' };
      case 'insurer':
        return { label: 'Insurance Portal', color: 'bg-purple-600', text: 'text-purple-900', border: 'border-purple-200' };
      case 'demo':
        return { label: 'Interactive Demo', color: 'bg-amber-600', text: 'text-amber-900', border: 'border-amber-200' };
      case 'architecture':
        return { label: 'System Architecture', color: 'bg-slate-600', text: 'text-slate-900', border: 'border-slate-200' };
      default:
        return { label: 'Portal Gateway', color: 'bg-[#294638]', text: 'text-[#294638]', border: 'border-[#E7E1D7]' };
    }
  };

  const roleMeta = getRoleLabel();

  return (
    <header className="bg-[#F3F0E9] border-b border-[#E7E1D7] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left Side: Brand Logo, Project Name, Subtitle */}
        <div
          onClick={() => handleNavClick('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Return to Portal Selection Landing Page"
        >
          <div className="h-10 w-10 rounded-full bg-[#294638] text-[#FAF9F6] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Shield className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-xl sm:text-2xl text-[#294638] tracking-tight">
                ZK-HealthClaims
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                v2.0 Portals
              </span>
            </div>
            <p className="text-[11px] text-[#5F685F] tracking-wide font-normal -mt-0.5">
              Privacy-Preserving Healthcare Claims & Settlement
            </p>
          </div>
        </div>

        {/* Right Side: Desktop Navigation Links for Portals */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-7">
          <button
            onClick={() => handleNavClick('landing')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'landing'
                ? 'text-[#294638] font-bold border-b-2 border-[#294638] pb-1'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            Portals
          </button>

          <button
            onClick={() => handleNavClick('patient', 'dashboard')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors flex items-center gap-1.5 ${
              currentRole === 'patient'
                ? 'text-emerald-700 font-bold border-b-2 border-emerald-700 pb-1'
                : 'text-[#292D29] hover:text-emerald-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            Patient Portal
          </button>

          <button
            onClick={() => handleNavClick('hospital', 'dashboard')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors flex items-center gap-1.5 ${
              currentRole === 'hospital'
                ? 'text-blue-700 font-bold border-b-2 border-blue-700 pb-1'
                : 'text-[#292D29] hover:text-blue-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            Hospital Portal
          </button>

          <button
            onClick={() => handleNavClick('insurer', 'dashboard')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors flex items-center gap-1.5 ${
              currentRole === 'insurer'
                ? 'text-purple-700 font-bold border-b-2 border-purple-700 pb-1'
                : 'text-[#292D29] hover:text-purple-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
            Insurance Portal
          </button>

          <button
            onClick={() => handleNavClick('demo')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'demo'
                ? 'text-[#294638] font-bold border-b-2 border-[#294638] pb-1'
                : 'text-[#5F685F] hover:text-[#294638]'
            }`}
          >
            Judge Demo
          </button>
        </nav>

        {/* Right Utilities: Clean Minimal Role Status & Active Indicator */}
        <div className="hidden sm:flex items-center space-x-3">
          {/* Live Backend Connection Indicator */}
          <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E7E1D7] text-xs font-medium flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${isBackendOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] text-[#292D29]">
              {isBackendOnline ? 'EVM & Relayer Online' : 'Connecting...'}
            </span>
          </div>

          {/* Active Portal Badge */}
          <div className={`px-3 py-1.5 rounded-xl bg-[#FAF9F6] border ${roleMeta.border} text-xs ${roleMeta.text} font-medium flex items-center space-x-2 shadow-xs`}>
            <span className={`h-2 w-2 rounded-full ${roleMeta.color}`}></span>
            <span className="font-semibold">{roleMeta.label}</span>
          </div>

          {/* Contextual Action Button */}
          {currentRole === 'landing' ? (
            <button
              onClick={() => handleNavClick('patient', 'dashboard')}
              className="px-3.5 py-2 rounded-xl bg-[#294638] hover:bg-[#1E342A] text-[#FAF9F6] text-xs uppercase tracking-wider font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>Enter Portals</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('landing')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-100 text-clinical-text border border-alabaster-300 text-xs font-medium transition cursor-pointer shadow-xs"
              title="Switch to another portal"
            >
              Switch Portal
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(open => !open)}
          className="lg:hidden p-2 rounded-xl text-[#294638] hover:bg-[#E7E1D7] transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF9F6] border-b border-[#E7E1D7] px-6 py-5 space-y-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNavClick('landing')}
              className="text-left uppercase text-xs tracking-widest font-semibold py-2.5 text-[#292D29] hover:text-[#294638] border-b border-[#E7E1D7]/60 flex items-center justify-between"
            >
              <span>Common Landing Page</span>
              {currentRole === 'landing' && <span className="h-2 w-2 rounded-full bg-[#294638]"></span>}
            </button>
            <button
              onClick={() => handleNavClick('patient', 'dashboard')}
              className="text-left uppercase text-xs tracking-widest font-semibold py-2.5 text-emerald-800 hover:text-emerald-950 border-b border-[#E7E1D7]/60 flex items-center justify-between"
            >
              <span>Patient Portal (Health Vault)</span>
              {currentRole === 'patient' && <span className="h-2 w-2 rounded-full bg-emerald-600"></span>}
            </button>
            <button
              onClick={() => handleNavClick('hospital', 'dashboard')}
              className="text-left uppercase text-xs tracking-widest font-semibold py-2.5 text-blue-800 hover:text-blue-950 border-b border-[#E7E1D7]/60 flex items-center justify-between"
            >
              <span>Hospital Portal (ZKP Prover)</span>
              {currentRole === 'hospital' && <span className="h-2 w-2 rounded-full bg-blue-600"></span>}
            </button>
            <button
              onClick={() => handleNavClick('insurer', 'dashboard')}
              className="text-left uppercase text-xs tracking-widest font-semibold py-2.5 text-purple-800 hover:text-purple-950 border-b border-[#E7E1D7]/60 flex items-center justify-between"
            >
              <span>Insurance Company Portal</span>
              {currentRole === 'insurer' && <span className="h-2 w-2 rounded-full bg-purple-600"></span>}
            </button>
            <button
              onClick={() => handleNavClick('demo')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2.5 text-clinical-muted hover:text-[#294638] flex items-center justify-between"
            >
              <span>Interactive Judge Scenarios</span>
              {currentRole === 'demo' && <span className="h-2 w-2 rounded-full bg-amber-500"></span>}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
