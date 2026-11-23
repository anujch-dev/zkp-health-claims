import React from 'react';
import {
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { InsurancePolicy, ClaimSubmission, HealthRecord } from '../types';

interface PortalLandingViewProps {
  onSelectPortal: (portal: 'patient' | 'hospital' | 'insurer' | 'demo' | 'architecture') => void;
  policy: InsurancePolicy;
  claims: ClaimSubmission[];
  records: HealthRecord[];
}

export const PortalLandingView: React.FC<PortalLandingViewProps> = ({
  onSelectPortal,
  policy,
  claims,
  records,
}) => {
  const verifiedClaimsCount = claims.filter(c => c.status === 'VERIFIED' || c.status === 'PAYOUT_SETTLED').length;
  const totalSettledUsdc = claims
    .filter(c => c.status === 'PAYOUT_SETTLED')
    .reduce((sum, c) => sum + c.payoutAmount, 0);

  return (
    <div className="space-y-12 py-4">
      {/* Editorial Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sage-100 text-sage-900 border border-sage-200 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-sage-700" />
          <span>Role-Segregated Web3 Healthcare Ecosystem</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-clinical-text tracking-tight leading-tight">
          Select Your Healthcare Operations Portal
        </h1>

        <p className="text-sm sm:text-base text-clinical-muted leading-relaxed font-normal">
          A zero-knowledge medical claim settlement network where patients retain cryptographic custody of health records, hospitals prove care compliance, and insurers settle claims instantly without exposing diagnoses.
        </p>

        {/* Live System Counter Pill Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-white border border-alabaster-300 text-clinical-text shadow-xs">
            🔒 <strong>{records.length}</strong> Encrypted Patient Records
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-alabaster-300 text-clinical-text shadow-xs">
            ⚡ <strong>{verifiedClaimsCount}</strong> Groth16 Verified Claims
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-alabaster-300 text-sage-800 font-bold shadow-xs">
            💵 <strong>${totalSettledUsdc.toLocaleString()} USDC</strong> Disbursed
          </span>
        </div>
      </div>

      {/* The 3 Visually Distinct Role Portals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* 1. PATIENT PORTAL (Subtle Green Accent) */}
        <div className="bg-white border-2 border-emerald-200/80 hover:border-emerald-600 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
          {/* Subtle Green Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-500"></div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center transition group-hover:scale-105 group-hover:bg-emerald-100">
                <User className="h-7 w-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Patient Access
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-clinical-text group-hover:text-emerald-900 transition">
                Patient Portal
              </h2>
              <p className="text-xs text-clinical-muted mt-1 leading-relaxed">
                Client-side encrypted health vault giving you sovereign ownership over your diagnostic scans, doctor permissions, and coverage.
              </p>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-2.5 text-xs text-clinical-text pt-2 border-t border-alabaster-200">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Manage medical records:</strong> AES-256-GCM client-side encryption with SHA-256 commitments on-chain.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Control access permissions:</strong> Authorize accredited specialists with granular, revocable roles.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Track insurance claims:</strong> Live visual coverage bar and remaining limit (${policy.remainingCoverage.toLocaleString()} USDC).</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4">
            <button
              onClick={() => onSelectPortal('patient')}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-lg"
            >
              <span>Enter Patient Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-[10px] text-center text-clinical-muted mt-2">
              Route: <code>/patient/dashboard</code>
            </p>
          </div>
        </div>

        {/* 2. HOSPITAL PORTAL (Subtle Blue Accent) */}
        <div className="bg-white border-2 border-blue-200/80 hover:border-blue-600 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
          {/* Subtle Blue Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center transition group-hover:scale-105 group-hover:bg-blue-100">
                <Building2 className="h-7 w-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                Clinical Intake
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-clinical-text group-hover:text-blue-900 transition">
                Hospital Portal
              </h2>
              <p className="text-xs text-clinical-muted mt-1 leading-relaxed">
                Accredited medical provider desk for clinical treatment records, EHR patient lookups, and Circom Groth16 claim proof computation.
              </p>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-2.5 text-xs text-clinical-text pt-2 border-t border-alabaster-200">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Access patient records:</strong> Query EHR and view authorized diagnostic scans with patient permission.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Submit insurance claims:</strong> Encode procedure codes (CPT) and pre-flight policy limit validation.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Generate Groth16 ZKPs:</strong> Evaluate Circom constraints and broadcast on-chain proofs without leaking diagnosis.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4">
            <button
              onClick={() => onSelectPortal('hospital')}
              className="w-full py-3.5 px-5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-lg"
            >
              <span>Enter Hospital Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-[10px] text-center text-clinical-muted mt-2">
              Route: <code>/hospital/dashboard</code>
            </p>
          </div>
        </div>

        {/* 3. INSURANCE PORTAL (Subtle Purple Accent) */}
        <div className="bg-white border-2 border-purple-200/80 hover:border-purple-600 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
          {/* Subtle Purple Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-500"></div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center transition group-hover:scale-105 group-hover:bg-purple-100">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                Payer Settlement
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold text-clinical-text group-hover:text-purple-900 transition">
                Insurance Portal
              </h2>
              <p className="text-xs text-clinical-muted mt-1 leading-relaxed">
                Underwriting and claims settlement terminal for on-chain Groth16 pairing verification, batch payout execution, and fraud prevention.
              </p>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-2.5 text-xs text-clinical-text pt-2 border-t border-alabaster-200">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>View & verify ZK claims:</strong> Inspect 4 public signals on-chain while keeping medical diagnosis 100% hidden.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Autonomous settlement:</strong> Auto-disburse verified claims under $3k and trigger 1-click batch payouts.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Replay protection & certificates:</strong> Issue printable official settlement certificates and block replay attacks.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4">
            <button
              onClick={() => onSelectPortal('insurer')}
              className="w-full py-3.5 px-5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-lg"
            >
              <span>Enter Insurance Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-[10px] text-center text-clinical-muted mt-2">
              Route: <code>/insurer/dashboard</code>
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Quick Navigation / Evaluator Testing Utilities */}
      <div className="bg-white border border-alabaster-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-alabaster-200 pb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-clinical-text">
              Demonstration & Cryptographic Audit Tools
            </h3>
            <p className="text-xs text-clinical-muted">
              Fast-track automated test vectors for hackathon judges, smart contract auditors, and security evaluators
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectPortal('demo')}
              className="px-4 py-2 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Cpu className="h-3.5 w-3.5 text-sage-700" />
              <span>Interactive Judge / Test Scenarios</span>
            </button>

            <button
              onClick={() => onSelectPortal('architecture')}
              className="px-4 py-2 rounded-xl bg-alabaster-100 hover:bg-alabaster-200 text-clinical-text border border-alabaster-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-clinical-muted" />
              <span>Full System Architecture</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-clinical-muted">
          <div className="p-3.5 rounded-2xl bg-alabaster-50 border border-alabaster-200 space-y-1">
            <span className="font-semibold text-clinical-text block font-sans">
              1. Zero-Exposure Security
            </span>
            <p className="text-[11px]">
              Diagnosis codes, doctor notes, and prescriptions never touch EVM state or insurance servers.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-alabaster-50 border border-alabaster-200 space-y-1">
            <span className="font-semibold text-clinical-text block font-sans">
              2. Double-Spend Replay Guard
            </span>
            <p className="text-[11px]">
              Every claim creates a unique nullifier derived from patient salt and treatment nonce.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-alabaster-50 border border-alabaster-200 space-y-1">
            <span className="font-semibold text-clinical-text block font-sans">
              3. Hospital Merkle Inclusion
            </span>
            <p className="text-[11px]">
              Poseidon Merkle tree ensures only accredited state-licensed medical centers can generate valid proofs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
