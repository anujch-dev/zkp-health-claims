import React, { useState } from 'react';
import { Building2, ShieldCheck, Cpu, EyeOff, Lock, CheckCircle2, AlertTriangle, FileCheck, RefreshCw, Network, Copy, Check, ChevronDown, ChevronUp, ShieldAlert, RotateCcw, XCircle } from 'lucide-react';
import { AccreditedHospital, InsurancePolicy, ClaimSubmission, ClaimPrivateInputs } from '../types';
import { ACCREDITED_HOSPITALS, HOSPITAL_MERKLE_ROOT } from '../fixtures/mockData';
import { generateHealthClaimProof, CircuitValidationResult } from '../lib/zkp';
import { CERTIFIED_GROTH16_CIRCUIT } from '../fixtures/groth16Artifacts';

interface HospitalViewProps {
  policy: InsurancePolicy;
  onClaimSubmitted: (submission: ClaimSubmission) => void;
  onTestReplayAttack?: () => void;
  onTestUnaccreditedHospital?: () => void;
  onTestLimitExceeded?: () => void;
  isProcessing: boolean;
}

export const HospitalView: React.FC<HospitalViewProps> = ({
  policy,
  onClaimSubmitted,
  onTestReplayAttack,
  onTestUnaccreditedHospital,
  onTestLimitExceeded,
  isProcessing,
}) => {
  const [selectedHospital, setSelectedHospital] = useState<AccreditedHospital>(ACCREDITED_HOSPITALS[0]);
  const [selectedProcedureCode, setSelectedProcedureCode] = useState<string>(policy.coveredProcedures[0].code);
  const [claimAmount, setClaimAmount] = useState<number>(2400);
  const [claimDate, setClaimDate] = useState<string>('2026-11-20');
  const [diagnosisCode, setDiagnosisCode] = useState<string>('G43.909');
  const [diagnosisNotes, setDiagnosisNotes] = useState<string>('Intractable migraine with aura, non-responsive to NSAIDs. Scheduled contrast MRI.');
  const [prescriptions, setPrescriptions] = useState<string>('Sumatriptan 100mg, Ondansetron 4mg');
  const [claimNonce, setClaimNonce] = useState<string>(() => '0x' + Math.random().toString(16).slice(2, 10));

  const [provingStatus, setProvingStatus] = useState<'idle' | 'proving' | 'success' | 'failed'>('idle');
  const [circuitResult, setCircuitResult] = useState<CircuitValidationResult | null>(null);
  const [showMerkleDetails, setShowMerkleDetails] = useState<boolean>(false);
  const [copiedCalldata, setCopiedCalldata] = useState<boolean>(false);

  const activeProcedure = policy.coveredProcedures.find(p => p.code === selectedProcedureCode) || policy.coveredProcedures[0];

  // Pre-flight constraint validations
  const claimTimestamp = Math.floor(new Date(claimDate).getTime() / 1000);
  const policyExpiryTimestamp = Math.floor(new Date(policy.validUntil).getTime() / 1000);
  const isTimeValid = claimTimestamp <= policyExpiryTimestamp;
  const isAmountWithinProcedure = claimAmount <= activeProcedure.maxCoveredAmount;
  const isAmountWithinPolicy = claimAmount <= policy.remainingCoverage;

  const handleCopyCalldata = (calldata: string) => {
    navigator.clipboard.writeText(calldata);
    setCopiedCalldata(true);
    setTimeout(() => setCopiedCalldata(false), 2000);
  };

  const handleGenerateProof = async () => {
    setProvingStatus('proving');
    setCircuitResult(null);

    const privateInputs: ClaimPrivateInputs = {
      patientAddress: policy.patientAddress,
      patientSecret: "0xsecret_patient_salt_88129",
      hospitalAddress: selectedHospital.walletAddress,
      hospitalLicense: selectedHospital.licenseNumber,
      hospitalMerkleProof: selectedHospital.merkleProof,
      hospitalMerkleIndex: selectedHospital.leafIndex,
      policyId: policy.id,
      policyCommitment: policy.policyCommitmentHash,
      policyExpiryTimestamp,
      policyMaxCoverage: policy.remainingCoverage,
      policySecretSalt: policy.policySecretSalt,
      procedureCode: selectedProcedureCode,
      procedureAllowedMax: activeProcedure.maxCoveredAmount,
      claimAmount,
      claimTimestamp,
      diagnosisCode,
      diagnosisDescription: diagnosisNotes,
      prescriptions: prescriptions.split(',').map(s => s.trim()),
      claimNonce
    };

    setTimeout(async () => {
      const result = await generateHealthClaimProof(privateInputs, HOSPITAL_MERKLE_ROOT);
      setCircuitResult(result);
      setProvingStatus(result.isValid ? 'success' : 'failed');
    }, 500);
  };

  const handleSubmitClaim = () => {
    if (!circuitResult || !circuitResult.isValid || !circuitResult.proof || !circuitResult.publicInputs) return;

    const submission: ClaimSubmission = {
      id: `clm-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      patientAddress: policy.patientAddress,
      hospitalName: selectedHospital.name,
      hospitalAddress: selectedHospital.walletAddress,
      publicInputs: circuitResult.publicInputs,
      proof: circuitResult.proof,
      status: 'VERIFIED',
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      payoutAmount: circuitResult.publicInputs.claimAmount,
      privateInputsSummary: {
        hiddenDiagnosis: diagnosisCode,
        hiddenProcedure: activeProcedure.name,
        hiddenPrescriptionsCount: prescriptions.split(',').length
      }
    };

    onClaimSubmitted(submission);
    setProvingStatus('idle');
    setCircuitResult(null);
    setClaimNonce('0x' + Math.random().toString(16).slice(2, 10));
  };

  return (
    <div className="space-y-8">
      {/* Hospital Portal Header */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-clinical-text">
                Hospital Claim Generation & ZK Prover
              </h2>
              <p className="text-xs text-clinical-muted">
                Compute Zero-Knowledge Groth16 proofs certifying compliance without exposing sensitive patient diagnoses
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-clinical-muted">Accredited Provider:</span>
            <select
              value={selectedHospital.id}
              onChange={(e) => {
                const found = ACCREDITED_HOSPITALS.find(h => h.id === e.target.value);
                if (found) setSelectedHospital(found);
              }}
              className="bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-1.5 text-xs text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
            >
              {ACCREDITED_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.licenseNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Merkle Proof Details Bar */}
        <div className="mt-4 pt-4 border-t border-alabaster-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-clinical-muted">
          <div className="flex items-center space-x-2">
            <span className="font-sans">Hospital Wallet:</span>
            <span className="text-clinical-text">{selectedHospital.walletAddress}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-sans">Merkle Leaf Index:</span>
            <span className="text-sage-700 font-bold">#{selectedHospital.leafIndex}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-sans">Approved Root:</span>
            <span className="text-sage-800 font-bold truncate max-w-[120px]" title={HOSPITAL_MERKLE_ROOT}>
              {HOSPITAL_MERKLE_ROOT.slice(0, 10)}...
            </span>
          </div>
          <button
            onClick={() => setShowMerkleDetails(!showMerkleDetails)}
            className="flex items-center gap-1 text-[11px] text-sage-700 hover:text-sage-800 font-sans font-semibold"
          >
            <Network className="h-3.5 w-3.5" />
            <span>{showMerkleDetails ? 'Hide Merkle Tree Path' : 'Inspect Merkle Tree Path (Depth 4)'}</span>
            {showMerkleDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Expandable 4-Level Merkle Tree Path Visualizer */}
        {showMerkleDetails && (
          <div className="mt-4 p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 text-xs font-mono space-y-3">
            <div className="flex items-center justify-between text-clinical-text font-sans font-semibold border-b border-alabaster-200 pb-2">
              <span className="flex items-center gap-1.5 text-sage-800">
                <Network className="h-4 w-4" />
                Poseidon Merkle Tree Path Proof (Depth = {CERTIFIED_GROTH16_CIRCUIT.merkleTreeDepth})
              </span>
              <span className="text-[10px] text-sage-800 bg-sage-100 px-2 py-0.5 rounded border border-sage-200 font-mono font-bold">
                Cryptographically Accredited
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-alabaster-200">
                <span className="text-clinical-muted">[Leaf #{selectedHospital.leafIndex}] Hash(Wallet, License):</span>
                <span className="text-clinical-text truncate max-w-[280px]">{selectedHospital.leafHash}</span>
              </div>
              {selectedHospital.merkleProof.map((proofHash, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-alabaster-200">
                  <span className="text-clinical-muted">[Level {idx + 1} Sibling Node]:</span>
                  <span className="text-clinical-text truncate max-w-[280px]">{proofHash}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-sage-50 border border-sage-300 p-2 rounded-lg font-bold">
                <span className="text-sage-800">[Merkle Root] Verified by Smart Contract:</span>
                <span className="text-sage-900 truncate max-w-[280px]">{HOSPITAL_MERKLE_ROOT}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout: Private Clinical Entry vs ZK Prover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Private Clinical Data Entry */}
        <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-alabaster-200 pb-3">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-clinical-amber" />
              <h3 className="text-base font-serif font-bold text-clinical-text">
                Private Clinical & Claim Inputs
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clinical-amberBg text-clinical-amber border border-clinical-amberBorder font-bold">
              CIRCUIT WITNESS (CONFIDENTIAL)
            </span>
          </div>

          <p className="text-xs text-clinical-muted">
            These fields remain entirely in the hospital client. The insurer never sees the diagnosis, medication, or doctor notes.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-clinical-text mb-1">
                Patient & Verified Policy Commitment
              </label>
              <div className="p-3 rounded-xl bg-alabaster-50 border border-alabaster-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-clinical-muted font-sans">Patient:</span>
                  <span className="text-clinical-text">{policy.patientName} ({policy.patientAddress.slice(0, 6)}...{policy.patientAddress.slice(-4)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-clinical-muted font-sans">Policy Limit Remaining:</span>
                  <span className="text-sage-700 font-bold">${policy.remainingCoverage.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Medical Diagnosis & Notes (STRICTLY PRIVATE) */}
            <div className="p-4 rounded-xl border border-clinical-amberBorder bg-clinical-amberBg/30 space-y-3">
              <div className="flex items-center space-x-2 text-clinical-amber text-xs font-bold font-sans">
                <Lock className="h-3.5 w-3.5" />
                <span>Confidential Health Details (Never Revealed)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  ICD-10 Clinical Diagnosis Code
                </label>
                <input
                  type="text"
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  placeholder="e.g. G43.909"
                  className="w-full bg-white border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Clinical Examination & Pathology Notes
                </label>
                <textarea
                  rows={2}
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  className="w-full bg-white border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Prescriptions & Treatment Regimen
                </label>
                <input
                  type="text"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  className="w-full bg-white border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600"
                />
              </div>
            </div>

            {/* Procedure and Amount Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Covered Procedure
                </label>
                <select
                  value={selectedProcedureCode}
                  onChange={(e) => setSelectedProcedureCode(e.target.value)}
                  className="w-full bg-white border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text focus:outline-none focus:border-sage-600"
                >
                  {policy.coveredProcedures.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} - {p.name} (Max: ${p.maxCoveredAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Claim Amount ($ USD)
                </label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  className="w-full bg-white border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text font-mono focus:outline-none focus:border-sage-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Claim Treatment Date
                </label>
                <input
                  type="date"
                  value={claimDate}
                  onChange={(e) => setClaimDate(e.target.value)}
                  className="w-full bg-white border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-text font-mono focus:outline-none focus:border-sage-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-clinical-text mb-1">
                  Unique Replay Nonce
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={claimNonce}
                    readOnly
                    className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl px-3 py-2 text-xs text-clinical-muted font-mono"
                  />
                  <button
                    onClick={() => setClaimNonce('0x' + Math.random().toString(16).slice(2, 10))}
                    className="p-2 rounded-xl bg-alabaster-100 hover:bg-alabaster-200 text-clinical-text border border-alabaster-300 transition"
                    title="Generate New Nonce"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateProof}
            disabled={provingStatus === 'proving'}
            className="w-full py-3 px-4 rounded-xl bg-sage-700 hover:bg-sage-600 text-white font-medium text-xs shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {provingStatus === 'proving' ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Computing Groth16 R1CS Witness & Constraints...</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                <span>Generate Client-Side Zero-Knowledge Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: ZK Proof Artifacts & Pre-Flight Checks */}
        <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-alabaster-200 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-sage-700" />
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  ZK Proof & Public Inputs Pipeline
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sage-100 text-sage-800 border border-sage-200 font-bold">
                ON-CHAIN BOUNDARY
              </span>
            </div>

            {/* Real-Time Pre-Flight Constraint Checklist */}
            <div className="p-3.5 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2 text-xs">
              <span className="font-semibold text-clinical-text block">
                Circom R1CS Pre-Flight Constraint Status:
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-clinical-muted">1. Hospital Merkle Accreditation:</span>
                  <span className="text-sage-700 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> Leaf #{selectedHospital.leafIndex} Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinical-muted">2. Active Policy Timing:</span>
                  <span className={isTimeValid ? "text-sage-700 font-bold flex items-center gap-1 font-mono" : "text-rose-700 font-bold flex items-center gap-1 font-mono"}>
                    {isTimeValid ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {isTimeValid ? "Valid (Unexpired)" : "Expired"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinical-muted">3. Claim &le; Procedure Cap (${activeProcedure.maxCoveredAmount.toLocaleString()}):</span>
                  <span className={isAmountWithinProcedure ? "text-sage-700 font-bold flex items-center gap-1 font-mono" : "text-rose-700 font-bold flex items-center gap-1 font-mono"}>
                    {isAmountWithinProcedure ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {isAmountWithinProcedure ? "Within Cap" : "Exceeds Cap"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinical-muted">4. Claim &le; Remaining Coverage (${policy.remainingCoverage.toLocaleString()}):</span>
                  <span className={isAmountWithinPolicy ? "text-sage-700 font-bold flex items-center gap-1 font-mono" : "text-rose-700 font-bold flex items-center gap-1 font-mono"}>
                    {isAmountWithinPolicy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {isAmountWithinPolicy ? "Within Reserve" : "Exceeds Reserve"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-clinical-muted">5. Diagnosis Privacy Guard:</span>
                  <span className="text-sage-800 font-bold flex items-center gap-1 font-mono">
                    <Lock className="h-3 w-3 text-sage-700" /> Blinded in Witness
                  </span>
                </div>
              </div>
            </div>

            {/* Status Feedback */}
            {provingStatus === 'idle' && (
              <div className="p-6 text-center border border-dashed border-alabaster-300 rounded-xl space-y-2 text-clinical-muted">
                <Cpu className="h-7 w-7 mx-auto text-sage-400 animate-pulse" />
                <p className="text-xs text-clinical-text font-medium">No proof generated yet.</p>
                <p className="text-[11px] text-clinical-muted">
                  Click "Generate Client-Side Zero-Knowledge Proof" to compute {CERTIFIED_GROTH16_CIRCUIT.nonLinearConstraints} R1CS constraints.
                </p>
              </div>
            )}

            {provingStatus === 'failed' && circuitResult && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 space-y-2">
                <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>ZK Constraint Evaluation FAILED</span>
                </div>
                <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside">
                  {circuitResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {provingStatus === 'success' && circuitResult && circuitResult.proof && circuitResult.publicInputs && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-sage-800 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-sage-700" />
                    <span>Proof Generated ({circuitResult.proof.generationDurationMs}ms)</span>
                  </div>
                  <span className="font-mono text-[11px] text-clinical-muted">Groth16 / BN254</span>
                </div>

                {/* 5 Public Signals Box */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-clinical-text">Public Signals (Broadcast On-Chain):</span>
                  <div className="p-3 rounded-xl bg-alabaster-50 border border-alabaster-200 text-[11px] font-mono space-y-1.5 text-clinical-text">
                    <div className="flex justify-between">
                      <span className="text-clinical-muted font-sans">[0] Hospital Merkle Root:</span>
                      <span className="text-sage-700 font-bold truncate max-w-[180px]">{circuitResult.publicInputs.hospitalMerkleRoot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-clinical-muted font-sans">[1] Policy Commitment:</span>
                      <span className="text-clinical-text truncate max-w-[180px]">{circuitResult.publicInputs.policyCommitment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-clinical-muted font-sans">[2] Claim Amount:</span>
                      <span className="text-sage-700 font-bold">${circuitResult.publicInputs.claimAmount.toLocaleString()} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-clinical-muted font-sans">[3] Claim Date (Timestamp):</span>
                      <span className="text-clinical-text font-mono">{new Date(circuitResult.publicInputs.claimTimestamp * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-clinical-muted font-sans">[4] Claim Nullifier (Replay ID):</span>
                      <span className="text-sage-800 font-bold truncate max-w-[180px]">{circuitResult.publicInputs.claimNullifier}</span>
                    </div>
                  </div>
                </div>

                {/* Solidity Calldata snippet */}
                {circuitResult.proof.solidityCalldata && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-clinical-muted font-medium font-sans">Solidity Calldata:</span>
                      <button
                        onClick={() => handleCopyCalldata(circuitResult.proof!.solidityCalldata!)}
                        className="inline-flex items-center gap-1 text-[11px] text-sage-700 hover:text-sage-800 font-sans"
                      >
                        {copiedCalldata ? <Check className="h-3 w-3 text-sage-700" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCalldata ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2 rounded-xl bg-alabaster-50 border border-alabaster-200 text-[10px] text-clinical-muted font-mono overflow-x-auto max-h-16">
                      {circuitResult.proof.solidityCalldata}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Action */}
          {provingStatus === 'success' && (
            <button
              onClick={handleSubmitClaim}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-sage-700 hover:bg-sage-600 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center space-x-2"
            >
              <FileCheck className="h-4 w-4" />
              <span>Submit Proof to ZKPInsuranceSettlement.sol</span>
            </button>
          )}
        </div>
      </div>

      {/* "Try to Hack Me" Zero-Knowledge Attack Simulator */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-alabaster-200 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-serif font-bold text-clinical-text">
              "Try to Hack Me" Attack Simulator
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
            TEST LIVE CRYPTOGRAPHIC GUARDS
          </span>
        </div>

        <p className="text-xs text-clinical-muted leading-relaxed">
          Simulate real cryptographic and smart contract exploit attempts to verify that the Zero-Knowledge system prevents double-spending, unaccredited providers, and policy limit fraud:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>1. Replay Attack</span>
              </div>
              <p className="text-[11px] text-clinical-muted">
                Attempt to re-submit an already settled claim nullifier to collect a duplicate reimbursement payout.
              </p>
              <div className="text-[10px] font-mono text-clinical-muted bg-white p-2 rounded border border-alabaster-200">
                Expected: Revert with ClaimAlreadyNullified()
              </div>
            </div>
            <button
              onClick={onTestReplayAttack}
              disabled={isProcessing}
              className="w-full py-2 px-3 rounded-lg bg-amber-100/70 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold transition"
            >
              Simulate Replay Attack
            </button>
          </div>

          <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                <Lock className="h-4 w-4 text-slate-600" />
                <span>2. Rogue Hospital Attack</span>
              </div>
              <p className="text-[11px] text-clinical-muted">
                Attempt to submit a claim from an unaccredited clinic whose leaf is not in the approved Merkle tree.
              </p>
              <div className="text-[10px] font-mono text-clinical-muted bg-white p-2 rounded border border-alabaster-200">
                Expected: Circom MerkleTreeInclusion fails
              </div>
            </div>
            <button
              onClick={onTestUnaccreditedHospital}
              disabled={isProcessing}
              className="w-full py-2 px-3 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition"
            >
              Simulate Rogue Provider
            </button>
          </div>

          <div className="p-4 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>3. Over-Limit Fraud ($75k)</span>
              </div>
              <p className="text-[11px] text-clinical-muted">
                Attempt to bill $75,000 for an experimental treatment against a remaining policy coverage of $50,000.
              </p>
              <div className="text-[10px] font-mono text-clinical-muted bg-white p-2 rounded border border-alabaster-200">
                Expected: LessEqThan constraint halts prover
              </div>
            </div>
            <button
              onClick={onTestLimitExceeded}
              disabled={isProcessing}
              className="w-full py-2 px-3 rounded-lg bg-rose-100/70 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold transition"
            >
              Simulate Over-Limit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
