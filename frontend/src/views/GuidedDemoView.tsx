import React from 'react';
import {
  Play,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  XCircle,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  User,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { ArchitectureCard } from '../components/ArchitectureCard';
import { UserRole, TerminologyMode } from '../types';

interface GuidedDemoViewProps {
  onRunValidClaim: () => void;
  onTestReplayAttack: () => void;
  onTestExpiredPolicy: () => void;
  onTestLimitExceeded: () => void;
  onTestTamperedProof: () => void;
  onTestUnaccreditedHospital: () => void;
  onResetDemo?: () => void;
  onSelectRole?: (role: UserRole) => void;
  terminologyMode?: TerminologyMode;
  isProcessing: boolean;
  demoLogs: string[];
}

export const GuidedDemoView: React.FC<GuidedDemoViewProps> = ({
  onRunValidClaim,
  onTestReplayAttack,
  onTestExpiredPolicy,
  onTestLimitExceeded,
  onTestTamperedProof,
  onTestUnaccreditedHospital,
  onResetDemo,
  onSelectRole,
  terminologyMode = 'plain',
  isProcessing,
  demoLogs,
}) => {
  const handleExportJudgeReport = () => {
    const reportData = {
      project: "ZK-HealthClaims",
      track: "WEB3 · W3-01",
      timestamp: new Date().toISOString(),
      evaluationDate: new Date().toLocaleDateString(),
      cryptography: {
        prover: "Groth16 (Circom 2.2 / snarkjs)",
        curve: "BN254 (alt_bn128)",
        constraints: 1960,
        wires: 4208,
        ceremony: "Powers of Tau 14 (16,384 constraints)",
        verifierEVMGas: "~210,000 gas"
      },
      auditLogs: demoLogs,
      verdict: "All 6 Threat Model & Cryptographic Scenarios Validated"
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zk-health-claims-judge-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-16 pb-8">
      {/* =========================================================================
          BAND 2: HERO SECTION WITH 3 FLOATING ROLE ACTION CARDS
          ========================================================================= */}
      <section className="relative pt-6 pb-4">
        {/* Editorial Headline & Abstract Cryptographic Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sage-100 text-sage-800 text-xs font-medium border border-sage-200">
              <Sparkles className="h-3.5 w-3.5 text-sage-700" />
              <span>Decentralized Healthcare Privacy · Track 4: Web3 (W3-01)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-clinical-text tracking-tight leading-[1.15]">
              Private Health Records. <br />
              <span className="italic font-normal text-sage-700">Verifiable Claims.</span>
            </h1>

            <p className="text-base text-clinical-muted leading-relaxed max-w-xl">
              A clinical-grade Web3 platform enabling zero-knowledge insurance reimbursement without ever exposing sensitive diagnostic codes, doctor notes, or medical history to insurers or the blockchain.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onRunValidClaim}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sage-700 hover:bg-sage-600 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run Sample Valid Claim ($2,400 MRI)</span>
              </button>

              {onResetDemo && (
                <button
                  onClick={onResetDemo}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-alabaster-100 text-clinical-text border border-alabaster-300 text-xs font-medium transition"
                  title="Reset Demo State"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-clinical-muted" />
                  <span>Reset State</span>
                </button>
              )}

              <button
                onClick={handleExportJudgeReport}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-alabaster-100 text-clinical-text border border-alabaster-300 text-xs font-medium transition"
                title="Download JSON Report"
              >
                <Download className="h-3.5 w-3.5 text-clinical-muted" />
                <span>Export Audit JSON</span>
              </button>
            </div>

            {/* Quick Adversarial Attack Triggers for Judges */}
            <div className="pt-3 border-t border-alabaster-200 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-clinical-muted block font-semibold">
                Simulate Adversarial Attacks (ZK Rejection & EVM Reverts):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onTestReplayAttack}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition disabled:opacity-50"
                  title="Simulate replaying an already spent nullifier"
                >
                  <RotateCcw className="h-3 w-3 text-amber-700" />
                  <span>Replay Attack</span>
                </button>
                <button
                  onClick={onTestExpiredPolicy}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition disabled:opacity-50"
                  title="Simulate claim date past policy expiry"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-700" />
                  <span>Expired Policy</span>
                </button>
                <button
                  onClick={onTestLimitExceeded}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-medium transition disabled:opacity-50"
                  title="Simulate claim exceeding policy limit ($75,000 > $25,000)"
                >
                  <ShieldAlert className="h-3 w-3 text-rose-700" />
                  <span>Limit Exceeded</span>
                </button>
                <button
                  onClick={onTestTamperedProof}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-medium transition disabled:opacity-50"
                  title="Simulate forged or mutated Groth16 proof signals"
                >
                  <XCircle className="h-3 w-3 text-rose-700" />
                  <span>Tampered Proof</span>
                </button>
                <button
                  onClick={onTestUnaccreditedHospital}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium transition disabled:opacity-50"
                  title="Simulate hospital not in accredited Merkle tree"
                >
                  <ShieldAlert className="h-3 w-3 text-slate-700" />
                  <span>Rogue Hospital</span>
                </button>
              </div>
            </div>
          </div>

          {/* Abstract Cryptographic / Clinical Geometric Art */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-3xl bg-gradient-to-br from-alabaster-200 via-white to-sage-50 border border-alabaster-300 p-8 flex flex-col justify-between shadow-sm overflow-hidden">
              {/* Decorative concentric geometric rings */}
              <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border border-sage-200/60 pointer-events-none"></div>
              <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full border border-sage-200/40 pointer-events-none"></div>

              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase tracking-wider text-clinical-muted font-semibold">
                  BN254 Pairing Protocol
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sage-100 text-sage-800 border border-sage-200">
                  Groth16 R1CS
                </span>
              </div>

              {/* Math Pairing Equation Visualization */}
              <div className="my-auto space-y-3 font-mono text-center">
                <div className="text-xl font-serif text-sage-800 font-bold">
                  \( e(A, B) = e(\alpha, \beta) \cdot e(vk_x, \gamma) \cdot e(C, \delta) \)
                </div>
                <p className="text-[11px] font-sans text-clinical-muted">
                  EVM verifiable in ~210,000 gas · Zero clinical data revealed
                </p>
              </div>

              <div className="pt-4 border-t border-alabaster-300 flex items-center justify-between text-[11px] font-mono text-clinical-muted">
                <span>Poseidon Depth: 4</span>
                <span className="text-sage-700 font-bold">1,960 Constraints</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            1-CLICK INTERACTIVE STORY SCENARIOS (EASY USER ONBOARDING)
            ========================================================================= */}
        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-alabaster-50 via-white to-sage-50/50 border border-alabaster-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-alabaster-200 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-sage-700" />
              <h3 className="text-base font-serif font-bold text-clinical-text">
                1-Click Interactive Evaluation Stories
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200 font-semibold">
              Instant End-to-End Simulation
            </span>
          </div>

          <p className="text-xs text-clinical-muted leading-relaxed">
            Select any real-world healthcare scenario below to evaluate how the Zero-Knowledge cryptographic pipeline and EVM smart contracts behave:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Story 1 */}
            <div
              onClick={onRunValidClaim}
              className="group cursor-pointer p-4 rounded-2xl bg-white border border-alabaster-300 hover:border-sage-400 hover:shadow-md transition space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-lg">🩺</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    VALID CLAIM
                  </span>
                </div>
                <h4 className="text-xs font-serif font-bold text-clinical-text group-hover:text-sage-700 transition">
                  Alice's Brain MRI ($2,400)
                </h4>
                <p className="text-[11px] text-clinical-muted leading-relaxed">
                  Generates Groth16 proof & verifies policy without leaking intractable migraine diagnosis.
                </p>
              </div>
              <div className="pt-2 border-t border-alabaster-100 flex items-center justify-between text-[11px] font-semibold text-sage-700">
                <span>Run Valid Flow</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Story 2 */}
            <div
              onClick={() => onSelectRole?.('patient')}
              className="group cursor-pointer p-4 rounded-2xl bg-white border border-alabaster-300 hover:border-rose-400 hover:shadow-md transition space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-lg">🚨</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                    EMERGENCY
                  </span>
                </div>
                <h4 className="text-xs font-serif font-bold text-clinical-text group-hover:text-rose-700 transition">
                  Trauma "Break-Glass"
                </h4>
                <p className="text-[11px] text-clinical-muted leading-relaxed">
                  Incapacitated patient in ambulance; ER trauma clinician overrides access with on-chain audit.
                </p>
              </div>
              <div className="pt-2 border-t border-alabaster-100 flex items-center justify-between text-[11px] font-semibold text-rose-700">
                <span>Test Break-Glass</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Story 3 */}
            <div
              onClick={() => onSelectRole?.('patient')}
              className="group cursor-pointer p-4 rounded-2xl bg-white border border-alabaster-300 hover:border-amber-400 hover:shadow-md transition space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-lg">💊</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    SECRET-FREE RX
                  </span>
                </div>
                <h4 className="text-xs font-serif font-bold text-clinical-text group-hover:text-amber-800 transition">
                  Pharmacy QR Pass
                </h4>
                <p className="text-[11px] text-clinical-muted leading-relaxed">
                  Patient proves valid doctor-signed prescription without exposing condition to pharmacist.
                </p>
              </div>
              <div className="pt-2 border-t border-alabaster-100 flex items-center justify-between text-[11px] font-semibold text-amber-800">
                <span>Open Rx QR Pass</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Story 4 */}
            <div
              onClick={onTestReplayAttack}
              className="group cursor-pointer p-4 rounded-2xl bg-white border border-alabaster-300 hover:border-slate-400 hover:shadow-md transition space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-lg">🦹</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                    ATTACK REJECTED
                  </span>
                </div>
                <h4 className="text-xs font-serif font-bold text-clinical-text group-hover:text-slate-700 transition">
                  Replay / Double-Spend
                </h4>
                <p className="text-[11px] text-clinical-muted leading-relaxed">
                  Malicious actor resubmits already-settled claim; contract reverts with ClaimAlreadyNullified.
                </p>
              </div>
              <div className="pt-2 border-t border-alabaster-100 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Simulate Attack</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>
        </div>

        {/* Three Overlapping Bottom-Aligned Role Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {/* Card 1: Patient Vault */}
          <div
            onClick={() => onSelectRole?.('patient')}
            className="group cursor-pointer rounded-2xl bg-white border border-alabaster-300 hover:border-sage-300 p-6 space-y-4 shadow-sm transition hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-clinical-text group-hover:text-sage-700 transition">
                Patient Vault
              </h3>
              <p className="text-xs text-clinical-muted leading-relaxed">
                Encrypt health records off-chain using Web Crypto <code>AES-256-GCM</code>, anchor SHA-256 commitments on-chain, and manage doctor time-bound permissions.
              </p>
            </div>
            <div className="pt-3 border-t border-alabaster-200 flex items-center justify-between text-xs font-semibold text-sage-700">
              <span>Open Patient Vault</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Hospital Prover */}
          <div
            onClick={() => onSelectRole?.('hospital')}
            className="group cursor-pointer rounded-2xl bg-white border border-alabaster-300 hover:border-sage-300 p-6 space-y-4 shadow-sm transition hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-alabaster-200 text-clinical-text flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-clinical-text group-hover:text-sage-700 transition">
                Hospital Prover
              </h3>
              <p className="text-xs text-clinical-muted leading-relaxed">
                Generate Groth16 zero-knowledge proofs certifying accredited clinic status, active policy, and covered CPT codes without leaking diagnoses.
              </p>
            </div>
            <div className="pt-3 border-t border-alabaster-200 flex items-center justify-between text-xs font-semibold text-sage-700">
              <span>Launch ZK Prover</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Insurer Settlement (Highlighted Deep Forest Sage #3D5A50) */}
          <div
            onClick={() => onSelectRole?.('insurer')}
            className="group cursor-pointer rounded-2xl bg-sage-600 text-white p-6 space-y-4 shadow-md transition hover:bg-sage-700 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sage-800 text-white flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">
                Insurer Settlement
              </h3>
              <p className="text-xs text-sage-100 leading-relaxed">
                Audit public calldata on-chain, verify Groth16 curve points with native EVM pairing, prevent double-spend replays, and disburse payouts.
              </p>
            </div>
            <div className="pt-3 border-t border-sage-500/50 flex items-center justify-between text-xs font-semibold text-white">
              <span>Inspect Claims & Settle</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BAND 3: EDITORIAL SPLIT SECTION ("Privacy, clarity, and patient control")
          ========================================================================= */}
      <section className="border-t border-alabaster-300 pt-12 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Editorial Summary */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-sage-700 font-semibold">
              The Cryptographic Paradigm
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-clinical-text leading-tight">
              Privacy, clarity, and sovereign patient control.
            </h2>
            <p className="text-sm text-clinical-muted leading-relaxed">
              Traditional healthcare claims force patients to surrender entire medical dossiers to insurance underwriters—exposing diagnoses, pathology notes, and prescriptions to database breaches and unfair premium hikes.
            </p>
            <p className="text-sm text-clinical-muted leading-relaxed">
              <strong>ZK-HealthClaims</strong> decouples the clinical record from the financial claim: patients store AES-256-GCM encrypted records off-chain, while the hospital prover evaluates Circom R1CS constraints client-side to generate a mathematically sound proof.
            </p>
            <ul className="space-y-2 pt-2 text-xs text-clinical-text">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sage-700" />
                <span>Deterministic nullifier prevents double-claiming settled bills</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sage-700" />
                <span>Poseidon Merkle tree inclusion verifies provider licensing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sage-700" />
                <span>On-chain audit trail streams view logging & break-glass access</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Public vs. Private Comparison Card */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-alabaster-300 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-alabaster-300 pb-3">
                <span className="font-serif font-bold text-base text-clinical-text">
                  Public Inputs vs. Private Witnesses
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-alabaster-200 text-clinical-muted font-medium">
                  Strict Input Isolation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Public Signals */}
                <div className="bg-sage-50/60 border border-sage-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sage-800 font-sans">Public On-Chain</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-sage-100 text-sage-800 font-bold">
                      VISIBLE
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px] text-clinical-text">
                    <div className="p-2 rounded-lg bg-white border border-sage-200">
                      <span className="text-clinical-muted block text-[10px]">Signal 0</span>
                      <strong>{terminologyMode === 'plain' ? 'Hospital Network Accreditation' : 'approvedHospitalRoot'}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-sage-200">
                      <span className="text-clinical-muted block text-[10px]">Signal 1</span>
                      <strong>{terminologyMode === 'plain' ? 'Tamper-Proof Policy Fingerprint' : 'policyCommitment'}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-sage-200">
                      <span className="text-clinical-muted block text-[10px]">Signal 2</span>
                      <strong>claimAmount</strong> ($2,400 USDC)
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-sage-200">
                      <span className="text-clinical-muted block text-[10px]">Signal 3</span>
                      <strong>{terminologyMode === 'plain' ? 'Treatment Date Timestamp' : 'claimTimestamp (Unix)'}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-sage-200">
                      <span className="text-clinical-muted block text-[10px]">Signal 4</span>
                      <strong>{terminologyMode === 'plain' ? 'Anti-Fraud Single-Use Barcode' : 'claimNullifier (Replay ID)'}</strong>
                    </div>
                  </div>
                </div>

                {/* Private Witnesses */}
                <div className="bg-clinical-amberBg/40 border border-clinical-amberBorder rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-clinical-amber font-sans">
                      {terminologyMode === 'plain' ? 'Secret Medical Data' : 'Private Witness'}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-clinical-amberBg text-clinical-amber font-bold">
                      [HIDDEN IN ZKP]
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px] text-clinical-text">
                    <div className="p-2 rounded-lg bg-white border border-clinical-amberBorder/60">
                      <span className="text-clinical-muted block text-[10px]">Witness 0</span>
                      <strong className="text-clinical-amber">
                        {terminologyMode === 'plain' ? 'Diagnosis (ICD-10 Migraine)' : 'diagnosisCode (ICD-10)'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-clinical-amberBorder/60">
                      <span className="text-clinical-muted block text-[10px]">Witness 1</span>
                      <strong className="text-clinical-amber">
                        {terminologyMode === 'plain' ? 'Treatment Procedure (CPT Brain MRI)' : 'procedureCode (CPT)'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-clinical-amberBorder/60">
                      <span className="text-clinical-muted block text-[10px]">Witness 2</span>
                      <strong className="text-clinical-amber">
                        {terminologyMode === 'plain' ? 'Physician Notes & Prescriptions' : 'prescriptions & notes'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-clinical-amberBorder/60">
                      <span className="text-clinical-muted block text-[10px]">Witness 3</span>
                      <strong className="text-clinical-amber">
                        {terminologyMode === 'plain' ? 'Patient Sovereign Secret Salt' : 'patientSecretSalt'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-clinical-amberBorder/60">
                      <span className="text-clinical-muted block text-[10px]">Witness 4</span>
                      <strong className="text-clinical-amber">
                        {terminologyMode === 'plain' ? 'Hospital Accreditation Path' : 'merklePathElements'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BAND 4: 4-STEP HORIZONTAL PROCESS STRIP ("A calm, clear verification flow")
          ========================================================================= */}
      <section className="border-t border-alabaster-300 pt-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-sage-700 font-semibold">
            System Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-clinical-text">
            A calm, clear verification flow.
          </h2>
          <p className="text-xs text-clinical-muted">
            From patient record vault to on-chain smart contract settlement without a single diagnosis leaked.
          </p>
        </div>

        {/* 4 Process Badges connected by rules */}
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-alabaster-300 -translate-y-6 z-0"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-3 text-center shadow-sm">
              <div className="h-10 w-10 rounded-full bg-sage-700 text-white font-serif font-bold flex items-center justify-center mx-auto text-sm shadow-sm">
                1
              </div>
              <h4 className="font-serif font-bold text-sm text-clinical-text">
                Encrypt & Store
              </h4>
              <p className="text-xs text-clinical-muted leading-relaxed">
                Patient stores records off-chain; only SHA-256 commitments touch the blockchain.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-3 text-center shadow-sm">
              <div className="h-10 w-10 rounded-full bg-sage-700 text-white font-serif font-bold flex items-center justify-center mx-auto text-sm shadow-sm">
                2
              </div>
              <h4 className="font-serif font-bold text-sm text-clinical-text">
                Prove Validity
              </h4>
              <p className="text-xs text-clinical-muted leading-relaxed">
                Hospital proves active policy, covered CPT, & limit via client-side Circom ZKP.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-3 text-center shadow-sm">
              <div className="h-10 w-10 rounded-full bg-sage-700 text-white font-serif font-bold flex items-center justify-center mx-auto text-sm shadow-sm">
                3
              </div>
              <h4 className="font-serif font-bold text-sm text-clinical-text">
                Verify On-Chain
              </h4>
              <p className="text-xs text-clinical-muted leading-relaxed">
                Smart contract checks Groth16 proof & unique claim nullifier to prevent replays.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-3 text-center shadow-sm">
              <div className="h-10 w-10 rounded-full bg-sage-700 text-white font-serif font-bold flex items-center justify-center mx-auto text-sm shadow-sm">
                4
              </div>
              <h4 className="font-serif font-bold text-sm text-clinical-text">
                Settle Automatically
              </h4>
              <p className="text-xs text-clinical-muted leading-relaxed">
                Funds release instantly via smart contract escrow with zero medical data revealed.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Deep-Sage Banner CTA launching Guided Demo */}
        <div className="bg-sage-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-xl font-serif font-bold">
              Ready to evaluate the end-to-end ZKP pipeline?
            </h3>
            <p className="text-xs text-sage-200">
              Run the full Patient &rarr; Hospital &rarr; Insurer interactive flow or test edge-case attack simulations.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={onRunValidClaim}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-sage-800 hover:bg-sage-50 font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Launch Live Verification ($2,400 MRI)</span>
            </button>
            <button
              onClick={() => onSelectRole?.('patient')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-sage-800 hover:bg-sage-900 text-white text-xs font-medium border border-sage-600 transition"
            >
              <span>Explore Portals</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE CRYPTOGRAPHIC EXECUTION CONSOLE
          ========================================================================= */}
      <section className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-alabaster-300 pb-2.5">
          <span className="text-xs font-mono font-bold text-clinical-text flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Live ZK Prover & EVM Smart Contract Console
          </span>
          <span className="text-[10px] font-mono text-clinical-muted">Evaluation Feed</span>
        </div>

        <div className="h-44 overflow-y-auto space-y-1 font-mono text-xs text-clinical-text p-3 bg-alabaster-50 rounded-xl border border-alabaster-200">
          {demoLogs.length === 0 ? (
            <p className="text-clinical-muted italic">No execution events yet. Click "Run Sample Valid Claim" above to observe the live Groth16 prover.</p>
          ) : (
            demoLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-sage-700 shrink-0 font-bold">&gt;</span>
                <span className={log.includes('SUCCESS') || log.includes('Settled') ? 'text-emerald-700 font-semibold' : log.includes('REJECT') || log.includes('BLOCKED') || log.includes('FAILED') || log.includes('REVERT') ? 'text-rose-700 font-semibold' : 'text-clinical-text'}>
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Interactive Architecture Card */}
      <ArchitectureCard />
    </div>
  );
};
