import React, { useState } from 'react';
import {
  Shield,
  Lock,
  ArrowRight,
  Play,
  CheckCircle2,
  FileCheck2,
  Activity,
  Building2,
  DollarSign
} from 'lucide-react';
import { UserRole, TerminologyMode } from '../types';

interface GuidedDemoViewProps {
  onRunValidClaim: () => void;
  onTestReplayAttack?: () => void;
  onTestExpiredPolicy?: () => void;
  onTestLimitExceeded?: () => void;
  onTestTamperedProof?: () => void;
  onTestUnaccreditedHospital?: () => void;
  onResetDemo?: () => void;
  onSelectRole?: (role: UserRole) => void;
  terminologyMode?: TerminologyMode;
  isProcessing: boolean;
  demoLogs?: string[];
}

export const GuidedDemoView: React.FC<GuidedDemoViewProps> = ({
  onRunValidClaim,
  onSelectRole,
  isProcessing,
}) => {
  // Image error fallback handlers to guarantee visual resilience
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [gal1Failed, setGal1Failed] = useState(false);
  const [gal2Failed, setGal2Failed] = useState(false);
  const [gal3Failed, setGal3Failed] = useState(false);

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* =========================================================================
          HERO SECTION (Split-Layout Composition matching Reference)
          ========================================================================= */}
      <section className="pt-2 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Side: Large Editorial Serif Heading & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-sm bg-[#E7E1D7] text-[#294638] text-[11px] font-medium tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-[#294638]"></span>
              <span>Private Healthcare Insurance Verification</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#292D29] tracking-tight leading-[1.12]">
              Healthcare Claims. <br />
              <span className="italic font-normal text-[#294638]">Verified with Trust.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#5F685F] leading-relaxed max-w-xl font-normal">
              Secure, transparent and privacy-preserving healthcare insurance claim verification powered by blockchain technology and zero-knowledge proofs.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary Dark-Green CTA: Open Interactive Hospital Claim Portal */}
              <button
                onClick={() => onSelectRole?.('hospital')}
                className="px-7 py-3.5 rounded-sm bg-[#294638] hover:bg-[#1E342A] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold transition-all duration-150 flex items-center space-x-2.5 shadow-none cursor-pointer"
              >
                <span>Verify & Settle Claim</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              {/* Secondary Text-Based CTA */}
              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-3 text-xs uppercase tracking-widest font-medium text-[#294638] hover:text-[#1E342A] transition-colors flex items-center space-x-1.5 group cursor-pointer"
              >
                <span>Explore How It Works</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Side: Large High-Quality Healthcare Photograph (Clean Rectangular Crop) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[480px] bg-[#E7E1D7] overflow-hidden">
              {!heroImgFailed ? (
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80"
                  alt="Doctor and patient consultation in a calm, modern clinical setting"
                  className="w-full h-full object-cover object-center grayscale-[15%] contrast-[1.02]"
                  onError={() => setHeroImgFailed(true)}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-[#E7E1D7] p-8 flex flex-col justify-between border border-[#DCD6CA]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-widest text-[#294638] font-semibold">
                      Clinical Consultation Environment
                    </span>
                    <span className="text-[11px] font-mono text-[#5F685F]">Zero-Knowledge Settlement</span>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-16 w-16 mx-auto rounded-full bg-[#FAF9F6] text-[#294638] flex items-center justify-center">
                      <Activity className="h-8 w-8" />
                    </div>
                    <p className="font-serif text-2xl text-[#294638] font-bold">
                      Patient-Doctor Trust
                    </p>
                    <p className="text-xs text-[#5F685F] max-w-sm mx-auto">
                      Private medical diagnoses remain strictly between patient and physician. Only verified proof of coverage touches the insurer.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-[#5F685F] text-right">
                    Zero Clinical Exposure
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HORIZONTAL FEATURE NAVIGATION STRIP (Full-Width Deep Forest-Green Strip)
          ========================================================================= */}
      <section className="bg-[#294638] text-[#FAF9F6] -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#385B4A]">
          {/* Feature Block 1: Privacy First */}
          <div
            onClick={() => onSelectRole?.('patient')}
            className="p-8 sm:p-10 cursor-pointer group hover:bg-[#233C30] transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-9 w-9 rounded-full bg-[#FAF9F6]/10 text-[#FAF9F6] flex items-center justify-center">
                <Lock className="h-4 w-4 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#FAF9F6] tracking-tight">
                Privacy First
              </h3>
              <p className="text-xs text-[#A6B3A1] leading-relaxed font-normal">
                Patient records remain confidential off-chain. Sensitive diagnostic notes and pathology are never leaked.
              </p>
            </div>
            <div className="pt-2 flex items-center space-x-2 text-[11px] uppercase tracking-widest text-[#FAF9F6] font-medium group-hover:text-[#A6B3A1] transition-colors">
              <span>View Health Records</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Block 2: Secure Verification */}
          <div
            onClick={() => onSelectRole?.('hospital')}
            className="p-8 sm:p-10 cursor-pointer group hover:bg-[#233C30] transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-9 w-9 rounded-full bg-[#FAF9F6]/10 text-[#FAF9F6] flex items-center justify-center">
                <Shield className="h-4 w-4 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#FAF9F6] tracking-tight">
                Secure Verification
              </h3>
              <p className="text-xs text-[#A6B3A1] leading-relaxed font-normal">
                Accredited hospitals fetch treatment records and generate cryptographic proofs directly from clinical systems.
              </p>
            </div>
            <div className="pt-2 flex items-center space-x-2 text-[11px] uppercase tracking-widest text-[#FAF9F6] font-medium group-hover:text-[#A6B3A1] transition-colors">
              <span>Hospital Claims</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Block 3: Transparent Claims */}
          <div
            onClick={() => onSelectRole?.('insurer')}
            className="p-8 sm:p-10 cursor-pointer group hover:bg-[#233C30] transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-9 w-9 rounded-full bg-[#FAF9F6]/10 text-[#FAF9F6] flex items-center justify-center">
                <FileCheck2 className="h-4 w-4 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#FAF9F6] tracking-tight">
                Instant Settlement
              </h3>
              <p className="text-xs text-[#A6B3A1] leading-relaxed font-normal">
                Valid claims are settled instantly with smart contract payouts, removing weeks of insurance paperwork.
              </p>
            </div>
            <div className="pt-2 flex items-center space-x-2 text-[11px] uppercase tracking-widest text-[#FAF9F6] font-medium group-hover:text-[#A6B3A1] transition-colors">
              <span>Insurer Settlement</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THREE-COLUMN VISUAL SECTION (Editorial Photographic Gallery)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
          {/* Image Panel 1: Modern Accredited Hospital Facility */}
          <div className="relative h-64 sm:h-72 lg:h-80 bg-[#E7E1D7] overflow-hidden">
            {!gal1Failed ? (
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
                alt="Modern accredited hospital facility corridor and patient care ward"
                className="w-full h-full object-cover object-center grayscale-[5%] contrast-[1.02]"
                onError={() => setGal1Failed(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#FAF9F6] border border-[#E7E1D7] p-6 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#5F685F]">Hospital Network</span>
                <p className="font-serif text-lg text-[#294638] font-bold">Accredited Facilities</p>
                <p className="text-xs text-[#5F685F]">Verified in-network hospitals anchored via Merkle membership.</p>
              </div>
            )}
          </div>

          {/* Image Panel 2: Medical Diagnostic Imaging & Clinical Analysis */}
          <div className="relative h-64 sm:h-72 lg:h-80 bg-[#E7E1D7] overflow-hidden">
            {!gal2Failed ? (
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
                alt="Physician reviewing medical diagnostic imaging and clinical records"
                className="w-full h-full object-cover object-center contrast-[1.02]"
                onError={() => setGal2Failed(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#294638] text-[#FAF9F6] p-6 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#A6B3A1]">Clinical Diagnostics</span>
                <p className="font-serif text-lg font-bold">Private Medical Imaging</p>
                <p className="text-xs text-[#A6B3A1]">Zero-knowledge proofs verify procedures without disclosing pathology.</p>
              </div>
            )}
          </div>

          {/* Image Panel 3: Healthcare Care Team & Patient Consultation */}
          <div className="relative h-64 sm:h-72 lg:h-80 bg-[#E7E1D7] overflow-hidden">
            {!gal3Failed ? (
              <img
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
                alt="Hospital medical team collaborating on patient treatment and healthcare claims"
                className="w-full h-full object-cover object-center grayscale-[5%] contrast-[1.02]"
                onError={() => setGal3Failed(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#FAF9F6] border border-[#E7E1D7] p-6 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#5F685F]">Medical Team</span>
                <p className="font-serif text-lg text-[#294638] font-bold">Collaborative Care</p>
                <p className="text-xs text-[#5F685F]">Physicians, patients, and insurers securely connected through cryptography.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          "HOW IT WORKS" PROCESS SECTION (Warm Ivory Timeline)
          ========================================================================= */}
      <section id="how-it-works" className="py-8 space-y-12 scroll-mt-24">
        {/* Centered Serif Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] uppercase tracking-widest text-[#294638] font-semibold">
            Simple, Seamless Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#292D29] tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-[#5F685F] leading-relaxed">
            A calm, seamless pipeline connecting patients, hospitals, and insurers to settle medical claims instantly without exposing sensitive diagnoses.
          </p>
        </div>

        {/* 3-Step Horizontal Process Timeline with Connected Markers */}
        <div className="relative max-w-5xl mx-auto">
          {/* Thin horizontal line connecting the markers on desktop */}
          <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-[1px] bg-[#E7E1D7] z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Step 01 — Fetch & Submit */}
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#FAF9F6] border border-[#294638] text-[#294638] font-serif font-bold text-sm flex items-center justify-center mx-auto shadow-sm">
                01
              </div>
              <div className="space-y-2 px-4">
                <h3 className="font-serif font-bold text-xl text-[#292D29]">
                  Fetch Hospital Claim
                </h3>
                <p className="text-xs text-[#5F685F] leading-relaxed">
                  The hospital loads your treatment record and procedure cost directly from the clinical EHR system.
                </p>
              </div>
            </div>

            {/* Step 02 — Verify Coverage */}
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#294638] text-[#FAF9F6] font-serif font-bold text-sm flex items-center justify-center mx-auto shadow-sm">
                02
              </div>
              <div className="space-y-2 px-4">
                <h3 className="font-serif font-bold text-xl text-[#292D29]">
                  Verify Insurance Policy
                </h3>
                <p className="text-xs text-[#5F685F] leading-relaxed">
                  The system cryptographically verifies policy validity, hospital accreditation, and coverage limits without disclosing private notes.
                </p>
              </div>
            </div>

            {/* Step 03 — Settle Payout */}
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#FAF9F6] border border-[#294638] text-[#294638] font-serif font-bold text-sm flex items-center justify-center mx-auto shadow-sm">
                03
              </div>
              <div className="space-y-2 px-4">
                <h3 className="font-serif font-bold text-xl text-[#292D29]">
                  Instant Claim Payout
                </h3>
                <p className="text-xs text-[#5F685F] leading-relaxed">
                  The smart contract confirms the proof and disburses payment directly to the hospital, settling the bill in seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE CLAIM SETTLEMENT CARD (Direct, Streamlined User Action)
          ========================================================================= */}
      <section className="bg-white border border-[#E7E1D7] p-8 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7E1D7] pb-6">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-widest text-[#294638] font-semibold">
              Live Claim Demonstration
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#292D29]">
              Fetch Hospital Claim & Settle Insurance
            </h3>
            <p className="text-xs text-[#5F685F]">
              Experience how a patient and hospital settle a clinical claim in one click with complete privacy.
            </p>
          </div>

          <button
            onClick={onRunValidClaim}
            disabled={isProcessing}
            className="px-6 py-3.5 bg-[#294638] hover:bg-[#1E342A] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50 flex items-center space-x-2 shrink-0 cursor-pointer shadow-none"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{isProcessing ? 'Verifying & Settling...' : '1-Click Settle Claim ($2,400)'}</span>
          </button>
        </div>

        {/* 3 Overview Information Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Block 1: Hospital Record */}
          <div className="p-6 bg-[#FAF9F6] border border-[#E7E1D7] space-y-3">
            <div className="flex items-center space-x-2 text-[#294638]">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Hospital Treatment</span>
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#292D29]">Apex University Health Care</h4>
              <p className="text-xs text-[#5F685F] mt-1">Procedure: Brain MRI with Contrast (CPT-70553)</p>
            </div>
            <div className="pt-2 text-xs font-medium text-[#294638] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#294638]" />
              <span>Accredited In-Network Provider</span>
            </div>
          </div>

          {/* Block 2: Policy Coverage */}
          <div className="p-6 bg-[#FAF9F6] border border-[#E7E1D7] space-y-3">
            <div className="flex items-center space-x-2 text-[#294638]">
              <Shield className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Insurance Policy</span>
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#292D29]">Aethelgard Health Shield</h4>
              <p className="text-xs text-[#5F685F] mt-1">Policy #POL-880129 · Remaining: $50,000</p>
            </div>
            <div className="pt-2 text-xs font-medium text-[#294638] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#294638]" />
              <span>Policy Active & In Budget</span>
            </div>
          </div>

          {/* Block 3: Settlement Status */}
          <div className="p-6 bg-[#FAF9F6] border border-[#E7E1D7] space-y-3">
            <div className="flex items-center space-x-2 text-[#294638]">
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Claim Amount</span>
            </div>
            <div>
              <h4 className="font-serif font-bold text-2xl text-[#294638]">$2,400</h4>
              <p className="text-xs text-[#5F685F] mt-1">Reimbursement released upon verification</p>
            </div>
            <div className="pt-2 text-xs text-[#5F685F] flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#294638]" />
              <span>Diagnosis & Prescriptions Kept Private</span>
            </div>
          </div>
        </div>

        {/* Quick Portal Switcher Pills */}
        <div className="pt-4 border-t border-[#E7E1D7] flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-[#5F685F]">
            Need to manage records or submit a custom bill? Open the dedicated portals:
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onSelectRole?.('hospital')}
              className="px-4 py-2 rounded-sm bg-[#FAF9F6] hover:bg-[#E7E1D7] text-[#292D29] border border-[#E7E1D7] text-xs font-medium transition cursor-pointer"
            >
              Hospital Claims Portal →
            </button>
            <button
              onClick={() => onSelectRole?.('insurer')}
              className="px-4 py-2 rounded-sm bg-[#FAF9F6] hover:bg-[#E7E1D7] text-[#292D29] border border-[#E7E1D7] text-xs font-medium transition cursor-pointer"
            >
              Insurance Settlement Portal →
            </button>
            <button
              onClick={() => onSelectRole?.('patient')}
              className="px-4 py-2 rounded-sm bg-[#FAF9F6] hover:bg-[#E7E1D7] text-[#292D29] border border-[#E7E1D7] text-xs font-medium transition cursor-pointer"
            >
              Patient Health Records →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default GuidedDemoView;
