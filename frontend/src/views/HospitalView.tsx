import React, { useState } from 'react';
import { Building2, ShieldCheck, Cpu, EyeOff, Lock, CheckCircle2, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react';
import { AccreditedHospital, InsurancePolicy, ClaimSubmission, ClaimPrivateInputs } from '../types';
import { ACCREDITED_HOSPITALS, HOSPITAL_MERKLE_ROOT } from '../fixtures/mockData';
import { generateHealthClaimProof, CircuitValidationResult } from '../lib/zkp';

interface HospitalViewProps {
  policy: InsurancePolicy;
  onClaimSubmitted: (submission: ClaimSubmission) => void;
  isProcessing: boolean;
}

export const HospitalView: React.FC<HospitalViewProps> = ({
  policy,
  onClaimSubmitted,
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

  const activeProcedure = policy.coveredProcedures.find(p => p.code === selectedProcedureCode) || policy.coveredProcedures[0];

  const handleGenerateProof = async () => {
    setProvingStatus('proving');
    setCircuitResult(null);

    const claimTimestamp = Math.floor(new Date(claimDate).getTime() / 1000);
    const policyExpiryTimestamp = Math.floor(new Date(policy.validUntil).getTime() / 1000);

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

    // Simulate real prover latency for judging demonstration
    setTimeout(async () => {
      const result = await generateHealthClaimProof(privateInputs, HOSPITAL_MERKLE_ROOT);
      setCircuitResult(result);
      setProvingStatus(result.isValid ? 'success' : 'failed');
    }, 600);
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
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Hospital Claim Generation & ZK Prover</h2>
              <p className="text-xs text-slate-400">
                Generate Zero-Knowledge Proofs proving compliance without exposing sensitive clinical diagnoses
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Accredited Provider:</span>
            <select
              value={selectedHospital.id}
              onChange={(e) => {
                const found = ACCREDITED_HOSPITALS.find(h => h.id === e.target.value);
                if (found) setSelectedHospital(found);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {ACCREDITED_HOSPITALS.map((h) => (\n                <option key={h.id} value={h.id}>
                  {h.name} ({h.licenseNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Merkle Proof Details Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Hospital Wallet:</span>
            <span className="text-slate-300">{selectedHospital.walletAddress}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Merkle Leaf Index:</span>
            <span className="text-emerald-400 font-bold">#{selectedHospital.leafIndex}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Approved Root:</span>
            <span className="text-indigo-400 truncate max-w-[120px]" title={HOSPITAL_MERKLE_ROOT}>
              {HOSPITAL_MERKLE_ROOT.slice(0, 10)}...
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Private Clinical Entry vs ZK Prover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Private Clinical Data Entry */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-rose-400" />
              <h3 className="text-base font-bold text-white">Private Clinical & Claim Inputs</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              CIRCUIT WITNESS (CONFIDENTIAL)
            </span>
          </div>

          <p className="text-xs text-slate-400">
            These fields remain entirely in the hospital client. The insurer never sees the diagnosis, medication, or doctor notes.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Patient & Verified Policy Commitment
              </label>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="text-slate-300">{policy.patientName} ({policy.patientAddress.slice(0, 6)}...{policy.patientAddress.slice(-4)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Policy Limit Remaining:</span>
                  <span className="text-emerald-400 font-bold">${policy.remainingCoverage.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Medical Diagnosis & Notes (STRICTLY PRIVATE) */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                <Lock className="h-3.5 w-3.5" />
                <span>Confidential Health Details (Never Revealed)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ICD-10 Clinical Diagnosis Code
                </label>
                <input
                  type="text"
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  placeholder="e.g. G43.909"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Clinical Examination & Pathology Notes
                </label>
                <textarea
                  rows={2}
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prescriptions & Treatment Regimen
                </label>
                <input
                  type="text"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Procedure and Amount Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Covered Procedure
                </label>
                <select
                  value={selectedProcedureCode}
                  onChange={(e) => setSelectedProcedureCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {policy.coveredProcedures.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} - {p.name} (Max: ${p.maxCoveredAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Claim Amount ($ USD)
                </label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Claim Treatment Date
                </label>
                <input
                  type="date"
                  value={claimDate}
                  onChange={(e) => setClaimDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unique Replay Nonce
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={claimNonce}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono"
                  />
                  <button
                    onClick={() => setClaimNonce('0x' + Math.random().toString(16).slice(2, 10))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
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
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
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

        {/* Right Column: ZK Proof Artifacts & Submission */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">ZK Proof & Public Inputs Pipeline</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ON-CHAIN BOUNDARY
              </span>
            </div>

            {/* Status Feedback */}
            {provingStatus === 'idle' && (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2 text-slate-400">
                <Cpu className="h-8 w-8 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs">No proof generated yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click "Generate Client-Side Zero-Knowledge Proof" to compile witness constraints and compute Groth16 parameters.
                </p>
              </div>
            )}

            {provingStatus === 'failed' && circuitResult && (
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <span>ZK Constraint Evaluation FAILED</span>
                </div>
                <ul className="text-xs text-rose-300 space-y-1 list-disc list-inside">
                  {circuitResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {provingStatus === 'success' && circuitResult && circuitResult.proof && circuitResult.publicInputs && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Proof Generated ({circuitResult.proof.generationDurationMs}ms)</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">Groth16 / BN254 Curve</span>
                </div>

                {/* Public Signals Box */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Public Signals (Broadcast On-Chain):</span>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hospital Merkle Root:</span>
                      <span className="text-indigo-400 truncate max-w-[180px]">{circuitResult.publicInputs.hospitalMerkleRoot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Policy Commitment:</span>
                      <span className="text-slate-400 truncate max-w-[180px]">{circuitResult.publicInputs.policyCommitment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Claim Nullifier (Replay ID):</span>
                      <span className="text-amber-400 font-bold truncate max-w-[180px]">{circuitResult.publicInputs.claimNullifier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Claim Amount:</span>
                      <span className="text-emerald-400 font-bold">${circuitResult.publicInputs.claimAmount.toLocaleString()} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Claim Date (Timestamp):</span>
                      <span className="text-blue-400 font-mono">{new Date(circuitResult.publicInputs.claimTimestamp * 1000).toLocaleDateString()} ({circuitResult.publicInputs.claimTimestamp})</span>
                    </div>
                  </div>
                </div>

                {/* Groth16 Proof Points */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Cryptographic Proof Points:</span>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-400">
                    <div className="truncate"><span className="text-slate-500">pi_a:</span> [{circuitResult.proof.pi_a.join(', ')}]</div>
                    <div className="truncate"><span className="text-slate-500">pi_b:</span> [[{circuitResult.proof.pi_b[0].join(', ')}], [{circuitResult.proof.pi_b[1].join(', ')}]]</div>
                    <div className="truncate"><span className="text-slate-500">pi_c:</span> [{circuitResult.proof.pi_c.join(', ')}]</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          {provingStatus === 'success' && (
            <button
              onClick={handleSubmitClaim}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <FileCheck className="h-4 w-4" />
              <span>Submit Proof to ZKPInsuranceSettlement.sol</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
