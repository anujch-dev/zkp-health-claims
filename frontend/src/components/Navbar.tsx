import React, { useState } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { UserRole, TerminologyMode } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  walletBalance?: string;
  onSelectRole?: (role: UserRole) => void;
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

  const handleNavClick = (target: string) => {
    setMobileMenuOpen(false);
    if (!onSelectRole) return;

    if (target === 'home') {
      onSelectRole('demo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'how-it-works') {
      onSelectRole('demo');
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else if (target === 'verify-claim') {
      onSelectRole('hospital');
    } else if (target === 'settle-claim') {
      onSelectRole('insurer');
    } else if (target === 'dashboard') {
      onSelectRole('patient');
    }
  };

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'patient':
        return 'Patient Vault';
      case 'hospital':
        return 'Hospital Prover';
      case 'insurer':
        return 'Insurer Settlement';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="bg-[#F3F0E9] border-b border-[#E7E1D7] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left Side: Brand Logo, Project Name, Subtitle */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-full bg-[#294638] text-[#FAF9F6] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Shield className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-xl sm:text-2xl text-[#294638] tracking-tight">
                ZK-HealthClaims
              </span>
            </div>
            <p className="text-[11px] text-[#5F685F] tracking-wide font-normal -mt-0.5">
              Healthcare Insurance Claims & Settlement
            </p>
          </div>
        </div>

        {/* Right Side: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7 xl:space-x-8">
          <button
            onClick={() => handleNavClick('home')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'demo'
                ? 'text-[#294638] font-semibold border-b border-[#294638] pb-0.5'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => handleNavClick('how-it-works')}
            className="uppercase text-[11px] tracking-widest font-medium text-[#292D29] hover:text-[#294638] transition-colors"
          >
            How It Works
          </button>

          <button
            onClick={() => handleNavClick('verify-claim')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'hospital'
                ? 'text-[#294638] font-semibold border-b border-[#294638] pb-0.5'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            Hospital Claims
          </button>

          <button
            onClick={() => handleNavClick('settle-claim')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'insurer'
                ? 'text-[#294638] font-semibold border-b border-[#294638] pb-0.5'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            Insurance Settlement
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'patient'
                ? 'text-[#294638] font-semibold border-b border-[#294638] pb-0.5'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            My Health Records
          </button>
        </nav>

        {/* Right Utilities: Clean Minimal Role Status & Active Indicator */}
        <div className="hidden sm:flex items-center space-x-3">
          {/* Live Backend Connection Indicator */}
          <div className="px-3 py-1.5 rounded-sm bg-[#FAF9F6] border border-[#E7E1D7] text-xs font-medium flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${isBackendOnline ? 'bg-emerald-600' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] text-[#292D29]">
              {isBackendOnline ? 'Backend Online' : 'Connecting...'}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-sm bg-[#FAF9F6] border border-[#E7E1D7] text-xs text-[#294638] font-medium flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#294638]"></span>
            <span>{getRoleLabel()}</span>
          </div>

          <button
            onClick={() => handleNavClick('verify-claim')}
            className="px-4 py-2 rounded-sm bg-[#294638] hover:bg-[#1E342A] text-[#FAF9F6] text-xs uppercase tracking-wider font-semibold transition"
          >
            Settle a Claim
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(open => !open)}
          className="lg:hidden p-2 rounded-sm text-[#294638] hover:bg-[#E7E1D7] transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF9F6] border-b border-[#E7E1D7] px-6 py-5 space-y-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638] border-b border-[#E7E1D7]/60"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638] border-b border-[#E7E1D7]/60"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('verify-claim')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638] border-b border-[#E7E1D7]/60"
            >
              Hospital Claims
            </button>
            <button
              onClick={() => handleNavClick('settle-claim')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638] border-b border-[#E7E1D7]/60"
            >
              Insurance Settlement
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638]"
            >
              My Health Records
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;