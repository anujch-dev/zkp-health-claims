import React, { useState } from 'react';
import { Shield, Sparkles, Sliders, Menu, X, Check } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact navigation labels required by prompt:
  // Home | How It Works | Verify Claim | Dashboard | About / FAQs
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
    } else if (target === 'dashboard') {
      onSelectRole('patient');
    } else if (target === 'about-faqs') {
      onSelectRole('architecture');
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'patient':
        return { name: 'Patient Vault', role: 'PATIENT' };
      case 'hospital':
        return { name: 'Hospital Prover', role: 'HOSPITAL' };
      case 'insurer':
        return { name: 'Insurer Settlement', role: 'INSURER' };
      case 'architecture':
        return { name: 'Audit & Threat Model', role: 'AUDIT' };
      default:
        return { name: 'Overview / Evaluator', role: 'EVALUATOR' };
    }
  };

  const roleInfo = getRoleBadge();

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
              <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-[#E7E1D7] text-[#294638] font-mono font-medium">
                W3-01
              </span>
            </div>
            <p className="text-[11px] text-[#5F685F] tracking-wide font-normal -mt-0.5">
              Privacy-Preserving Health Records & ZKP Claims
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
            Verify Claim
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'patient' || currentRole === 'insurer'
                ? 'text-[#294638] font-semibold border-b border-[#294638] pb-0.5'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => handleNavClick('about-faqs')}
            className={`uppercase text-[11px] tracking-widest font-medium transition-colors ${
              currentRole === 'architecture'
                ? 'text-[#294638] font-semibold border-b border-[#294638] pb-0.5'
                : 'text-[#292D29] hover:text-[#294638]'
            }`}
          >
            About / FAQs
          </button>
        </nav>

        {/* Right Utilities: Terminology Mode & Active Portal Badge */}
        <div className="hidden sm:flex items-center space-x-3">
          {/* Terminology Switcher */}
          <button
            onClick={onToggleTerminology}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-[#FAF9F6] border border-[#E7E1D7] text-xs text-[#292D29] hover:border-[#A6B3A1] transition shadow-none"
            title="Toggle between Plain English (Clinical/Patient) and Technical (Cryptographic ZK) descriptions"
          >
            {terminologyMode === 'plain' ? (
              <>
                <Sparkles className="h-3 w-3 text-[#294638]" />
                <span className="text-[11px] font-medium">Plain Mode</span>
              </>
            ) : (
              <>
                <Sliders className="h-3 w-3 text-[#5F685F]" />
                <span className="text-[11px] font-medium font-mono">ZK Mode</span>
              </>
            )}
          </button>

          {/* Role Status Tag */}
          <div className="px-3 py-1.5 rounded-sm bg-[#FAF9F6] border border-[#E7E1D7] text-[11px] text-[#294638] font-medium flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#294638]"></span>
            <span>{roleInfo.name}</span>
          </div>

          {/* Hardhat Node Indicator */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm bg-[#FAF9F6] border border-[#E7E1D7] text-[11px] font-mono text-[#5F685F]">
            <Check className="h-3 w-3 text-[#294638]" />
            <span>{walletBalance} ETH</span>
          </div>
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
              Verify Claim
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638] border-b border-[#E7E1D7]/60"
            >
              Dashboard (Patient / Insurer)
            </button>
            <button
              onClick={() => handleNavClick('about-faqs')}
              className="text-left uppercase text-xs tracking-widest font-medium py-2 text-[#292D29] hover:text-[#294638]"
            >
              About / FAQs
            </button>
          </div>

          <div className="pt-3 border-t border-[#E7E1D7] flex items-center justify-between">
            <button
              onClick={onToggleTerminology}
              className="px-3 py-1.5 rounded-sm bg-[#F3F0E9] border border-[#E7E1D7] text-xs font-medium text-[#294638]"
            >
              Toggle Mode: {terminologyMode === 'plain' ? 'Plain English' : 'ZK Technical'}
            </button>
            <span className="text-xs font-mono text-[#5F685F]">{walletBalance} ETH</span>
          </div>
        </div>
      )}
    </header>
  );
};
