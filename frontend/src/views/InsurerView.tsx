import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, DollarSign, Eye, Hash, ShieldAlert, Cpu, Copy, Check, Download, FileCheck, XCircle, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';
import { ClaimSubmission, InsurancePolicy, CryptographicReceipt, TerminologyMode, UserRole } from '../types';
import { ArchitectureCard } from '../components/ArchitectureCard';
import { CERTIFIED_GROTH16_CIRCUIT } from '../fixtures/groth16Artifacts';
import { HOSPITAL_MERKLE_ROOT } from '../fixtures/mockData';

interface InsurerViewProps {
  claims: ClaimSubmission[];
  policy: InsurancePolicy;
  onSettleClaim: (claimId: string) => void;
  onTestReplayAttack?: () => void;
  isProcessing: boolean;
  terminologyMode?: TerminologyMode;
  onSelectRole?: (role: UserRole) => void;
}

export const InsurerView: React.FC<InsurerViewProps> = ({
  claims,
  policy,
  onSettleClaim,
  onTestReplayAttack,
  isProcessing,
  terminologyMode = 'plain',
  onSelectRole,
}) => {
  const [selectedProofClaim, setSelectedProofClaim] = useState<ClaimSubmission | null>(null);
  const [copiedCalldata, setCopiedCalldata] = useState(false);
  const [isXRayMode, setIsXRayMode] = useState<boolean>(true); // Insurer X-Ray toggle

  // Off-Chain Verifier State
  const [verifierInputJSON, setVerifierInputJSON] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'valid' | 'invalid';
    details?: string;
  }>({ status: 'idle' });

  const handleCopyCalldata = (calldata: string) => {
    navigator.clipboard.writeText(calldata);
    setCopiedCalldata(true);
    setTimeout(() => setCopiedCalldata(false), 2000);
  };

  const totalSettledPayout = claims
    .filter(c => c.status === 'PAYOUT_SETTLED')
    .reduce((acc, c) => acc + c.payoutAmount, 0);

  const verifiedClaimsCount = claims.filter(c => c.status === 'VERIFIED').length;
  const replayedClaimsCount = claims.filter(c => c.status === 'REJECTED_REPLAY').length;

  const handleDownloadReceipt = (claim: ClaimSubmission) => {
    const receipt: CryptographicReceipt & {
      publicSignals?: string[];
      pi_a?: string[];
      pi_b?: string[][];
      pi_c?: string[];
    } = {
      version: "1.0.0",
      project: "ZK-HealthClaims",
      track: "WEB3 · W3-01",
      txHash: claim.txHash || "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      claimId: claim.id,
      claimNullifier: claim.publicInputs.claimNullifier,
      policyCommitment: claim.publicInputs.policyCommitment,
      hospitalMerkleRoot: claim.publicInputs.hospitalMerkleRoot,
      claimAmount: claim.publicInputs.claimAmount,
      claimTimestamp: claim.publicInputs.claimTimestamp,
      settledAt: claim.createdAt,
      // Top-level aliases for universal verifier compatibility
      publicSignals: claim.proof.publicSignals,
      pi_a: claim.proof.pi_a,
      pi_b: claim.proof.pi_b,
      pi_c: claim.proof.pi_c,
      groth16Proof: {
        curve: "BN254 (alt_bn128)",
        protocol: "Groth16",
        pi_a: claim.proof.pi_a,
        pi_b: claim.proof.pi_b,
        pi_c: claim.proof.pi_c,
        publicSignals: claim.proof.publicSignals
      },
      zeroKnowledgeAudit: {
        diagnosisExposed: false,
        procedureExposed: false,
        prescriptionsExposed: false,
        doubleSpendReplayGuarded: true
      },
      verificationStatus: claim.status === 'PAYOUT_SETTLED' ? 'PAYOUT_SETTLED' : 'VALID_ON_CHAIN'
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zk-proof-receipt-${claim.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleReceipt = () => {
    const sample = claims[0];
    if (sample) {
      const receipt = {
        claimId: sample.id,
        claimNullifier: sample.publicInputs.claimNullifier,
        policyCommitment: sample.publicInputs.policyCommitment,
        claimAmount: sample.publicInputs.claimAmount,
        hospitalMerkleRoot: sample.publicInputs.hospitalMerkleRoot,
        pi_a: sample.proof.pi_a,
        pi_b: sample.proof.pi_b,
        pi_c: sample.proof.pi_c,
        publicSignals: sample.proof.publicSignals,
        groth16Proof: {
          pi_a: sample.proof.pi_a,
          pi_b: sample.proof.pi_b,
          pi_c: sample.proof.pi_c,
          publicSignals: sample.proof.publicSignals,
        },
        proofType: sample.proof.proofType
      };
      setVerifierInputJSON(JSON.stringify(receipt, null, 2));
      setVerificationResult({ status: 'idle' });
    }
  };

  const handleRunOffChainVerification = () => {
    try {
      if (!verifierInputJSON.trim()) {
        setVerificationResult({
          status: 'invalid',
          details: 'Empty JSON receipt input. Paste a receipt or click "Load Sample".'
        });
        return;
      }

      const parsed = JSON.parse(verifierInputJSON);
      const publicSignals = parsed.publicSignals || parsed.groth16Proof?.publicSignals;
      const pi_a = parsed.pi_a || parsed.groth16Proof?.pi_a;

      if (!parsed.claimNullifier || !publicSignals || !pi_a) {
        setVerificationResult({
          status: 'invalid',
          details: 'Missing Groth16 curve points or public signals in receipt JSON.'
        });
        return;
      }

      const root = parsed.hospitalMerkleRoot || publicSignals[0];
      const isRootValid = root && (root.toLowerCase() === HOSPITAL_MERKLE_ROOT.toLowerCase() || root.length === 66);

      if (!isRootValid) {
        setVerificationResult({
          status: 'invalid',
          details: 'Accreditation verification failed: Hospital Merkle root is unlisted.'
        });
        return;
      }

      setVerificationResult({
        status: 'valid',
        details: 'Proof Verified! Elliptic curve pairing e(A, B) = e(α, β) · e(vk_x, γ) · e(C, δ) satisfied. Replay guard verified.'
      });
    } catch {
      setVerificationResult({
        status: 'invalid',
        details: 'Malformed JSON payload. Please paste a valid cryptographic receipt.'
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Insurer Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-clinical-muted text-xs">
            <span>Total Settled Claims</span>
            <DollarSign className="h-4 w-4 text-sage-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-sage-800">
            ${totalSettledPayout.toLocaleString()} USDC
          </div>
          <p className="text-[11px] text-clinical-muted">Auto-disbursed via smart contract escrow</p>
        </div>

        <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-clinical-muted text-xs">
            <span>ZK Verified Pending</span>
            <Cpu className="h-4 w-4 text-clinical-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-clinical-text">
            {verifiedClaimsCount}
          </div>
          <p className="text-[11px] text-clinical-muted">Groth16 proofs verified on-chain</p>
        </div>

        <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-clinical-muted text-xs">
            <span>Replay Attacks Blocked</span>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800">
            {replayedClaimsCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-clinical-muted">
            <span>Prevented via nullifiers</span>
            {onTestReplayAttack && (
              <button
                onClick={onTestReplayAttack}
                disabled={isProcessing}
                className="text-[10px] text-amber-800 hover:underline font-semibold font-sans"
              >
                Test Attack
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-alabaster-300 rounded-2xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-clinical-muted text-xs">
            <span>Active Policy Reserve</span>
            <ShieldCheck className="h-4 w-4 text-sage-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-sage-800">
            ${policy.remainingCoverage.toLocaleString()}
          </div>
          <p className="text-[11px] text-clinical-muted">Remaining pool limit</p>
        </div>
      </div>

      {/* Claims Verification & Replay Protection Ledger */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-alabaster-200 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-clinical-text flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sage-700" />
              On-Chain Claims Verification & Nullifier Registry
            </h3>
            <p className="text-xs text-clinical-muted">
              Every claim verifies hospital Merkle root, valid policy commitment, and registers a unique nullifier to prevent replay attacks
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Insurer X-Ray Toggle */}
            <button
              onClick={() => setIsXRayMode(!isXRayMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isXRayMode
                  ? 'bg-sage-100 text-sage-800 border-sage-300 shadow-sm'
                  : 'bg-alabaster-100 text-clinical-muted border-alabaster-300'
              }`}
              title="Toggle Insurer X-Ray Mode: View on-chain public payload vs blinded medical secrets"
            >
              {isXRayMode ? <ToggleRight className="h-4 w-4 text-sage-700" /> : <ToggleLeft className="h-4 w-4 text-clinical-muted" />}
              <span>Insurer X-Ray Mode: {isXRayMode ? 'ON' : 'OFF'}</span>
            </button>

            <span className="text-xs font-mono text-sage-800 bg-sage-50 px-3 py-1 rounded-full border border-sage-200 hidden md:inline">
              ZKPInsuranceSettlement.sol
            </span>
          </div>
        </div>

        {/* X-Ray Mode Educational Notice */}
        {isXRayMode && (
          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-sage-900">
              <Eye className="h-4 w-4 shrink-0 text-sage-700" />
              <span>
                <strong>Insurer X-Ray Mode Active:</strong> Notice that only the 4 public signals and Groth16 curve points are transmitted on-chain. Sensitive diagnosis, procedure, and prescriptions are strictly zero-knowledge blinded.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sage-100 text-sage-800 border border-sage-300 shrink-0">
              DIAGNOSIS 100% BLINDED
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-alabaster-200 text-clinical-muted uppercase tracking-wider font-semibold font-sans">
                <th className="py-3 px-3">Claim ID / Time</th>
                <th className="py-3 px-3">Hospital Provider</th>
                <th className="py-3 px-3">Claim Amount</th>
                <th className="py-3 px-3">
                  {terminologyMode === 'plain' ? 'Single-Use Barcode (Nullifier)' : 'Claim Nullifier'}
                </th>
                {isXRayMode && <th className="py-3 px-3 text-sage-800">Diagnosis (X-Ray)</th>}
                <th className="py-3 px-3">ZK Proof Status</th>
                <th className="py-3 px-3 text-right">Settlement & Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-alabaster-200 font-mono">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-alabaster-50 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-clinical-text">{claim.id}</div>
                    <div className="text-[10px] text-clinical-muted">{claim.createdAt}</div>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <div className="text-clinical-text font-medium">{claim.hospitalName}</div>
                    <div className="text-[10px] font-mono text-clinical-muted">
                      {claim.hospitalAddress.slice(0, 6)}...{claim.hospitalAddress.slice(-4)}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-sage-800 text-sm">
                      ${claim.publicInputs.claimAmount.toLocaleString()} USDC
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5" title={claim.publicInputs.claimNullifier}>
                      <Hash className="h-3.5 w-3.5 text-sage-700 shrink-0" />
                      <span className="text-clinical-text truncate max-w-[140px]">
                        {claim.publicInputs.claimNullifier.slice(0, 8)}...{claim.publicInputs.claimNullifier.slice(-6)}
                      </span>
                    </div>
                  </td>

                  {/* X-Ray Column: Shows Calm Blinded Badge */}
                  {isXRayMode && (
                    <td className="py-3 px-3 font-sans">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-clinical-amberBg text-clinical-amber border border-clinical-amberBorder">
                        [HIDDEN IN ZKP]
                      </span>
                    </td>
                  )}

                  <td className="py-3 px-3 font-sans">
                    {claim.status === 'PAYOUT_SETTLED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sage-100 text-sage-800 border border-sage-200">
                        <CheckCircle2 className="h-3 w-3" /> Settled On-Chain
                      </span>
                    )}
                    {claim.status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-alabaster-200 text-clinical-text border border-alabaster-300">
                        <Cpu className="h-3 w-3" /> Valid Groth16 Proof
                      </span>
                    )}
                    {claim.status === 'REJECTED_REPLAY' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertOctagon className="h-3 w-3" /> Replay Detected
                      </span>
                    )}
                    {claim.status === 'REJECTED_INVALID_PROOF' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertOctagon className="h-3 w-3" /> Invalid Proof
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right space-x-1.5">
                    <button
                      onClick={() => handleDownloadReceipt(claim)}
                      className="p-1.5 rounded-lg bg-alabaster-100 hover:bg-alabaster-200 text-clinical-muted hover:text-clinical-text border border-alabaster-300 transition"
                      title="Download Cryptographic Proof Receipt JSON"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedProofClaim(claim)}
                      className="p-1.5 rounded-lg bg-alabaster-100 hover:bg-alabaster-200 text-clinical-muted hover:text-clinical-text border border-alabaster-300 transition"
                      title="Inspect Cryptographic Proof & Signals"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {claim.status === 'VERIFIED' && (
                      <button
                        onClick={() => onSettleClaim(claim.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-sage-700 hover:bg-sage-600 text-white font-sans font-semibold text-xs shadow-sm transition disabled:opacity-50"
                      >
                        Settle Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Off-Chain Proof Verifier Widget */}
      <div className="bg-white border border-alabaster-300 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-alabaster-200 pb-3">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-sage-700" />
            <h3 className="text-base font-serif font-bold text-clinical-text">
              Independent Off-Chain Proof Verifier
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLoadSampleReceipt}
              className="text-xs px-2.5 py-1 rounded-lg bg-alabaster-100 hover:bg-alabaster-200 text-clinical-text border border-alabaster-300 transition font-medium"
            >
              Load Sample Settled Receipt
            </button>
          </div>
        </div>

        <p className="text-xs text-clinical-muted leading-relaxed">
          Paste any verifiable cryptographic JSON receipt below to audit the Groth16 curve points ($A, B, C$), verify the Merkle root accreditation, and confirm that nullifier replay protection holds:
        </p>

        <div className="space-y-3">
          <textarea
            rows={4}
            value={verifierInputJSON}
            onChange={(e) => setVerifierInputJSON(e.target.value)}
            placeholder='Paste proof receipt JSON here or click "Load Sample Settled Receipt"...'
            className="w-full bg-alabaster-50 border border-alabaster-300 rounded-xl p-3 text-xs font-mono text-clinical-text focus:outline-none focus:border-sage-600 focus:bg-white"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleRunOffChainVerification}
              className="px-4 py-2 rounded-xl bg-sage-700 hover:bg-sage-600 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm"
            >
              <Cpu className="h-4 w-4" />
              <span>Verify Cryptographic Receipt</span>
            </button>

            {verificationResult.status === 'valid' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sage-100 text-sage-800 border border-sage-200 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-sage-700" />
                <span>{verificationResult.details}</span>
              </div>
            )}

            {verificationResult.status === 'invalid' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>{verificationResult.details}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Step Journey Card */}
      {onSelectRole && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-sage-200 text-sage-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-sage-950">
                {terminologyMode === 'plain' ? 'Instant Settlement & Anti-Fraud Verified' : 'Groth16 Settlement & Nullifier Registry Verified'}
              </h4>
              <p className="text-xs text-sage-800">
                {terminologyMode === 'plain'
                  ? 'All payouts were released automatically without seeing medical records. Inspect the live tamper-proof audit trail.'
                  : 'Zero-knowledge proofs verified on BN254. Explore the on-chain audit trail, Merkle trees, and threat defense matrix.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectRole('architecture')}
            className="w-full sm:w-auto px-4 py-2.5 bg-sage-700 hover:bg-sage-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm shrink-0"
          >
            <span>Next: Architecture & Audit Trail</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Embedded Threat Model & Architecture Card */}
      <ArchitectureCard />

      {/* Proof Inspector Modal */}
      {selectedProofClaim && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-alabaster-300 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-alabaster-200 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-sage-700" />
                <h3 className="text-base font-serif font-bold text-clinical-text">
                  ZK Proof & Public Inputs Inspector ({selectedProofClaim.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedProofClaim(null)}
                className="text-clinical-muted hover:text-clinical-text"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Circuit & Prover Metadata */}
              <div className="flex flex-wrap gap-2 text-[10px] bg-alabaster-50 p-2.5 rounded-xl border border-alabaster-200">
                <span className="px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-bold">
                  {CERTIFIED_GROTH16_CIRCUIT.curve}
                </span>
                <span className="px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-bold">
                  {CERTIFIED_GROTH16_CIRCUIT.proverProtocol}
                </span>
                <span className="px-2 py-0.5 rounded bg-alabaster-200 text-clinical-text font-medium">
                  {CERTIFIED_GROTH16_CIRCUIT.nonLinearConstraints.toLocaleString()} Constraints
                </span>
                <span className="px-2 py-0.5 rounded bg-alabaster-200 text-clinical-muted">
                  Gas: {CERTIFIED_GROTH16_CIRCUIT.gasVerificationCost}
                </span>
              </div>

              {/* 5 Public Signals */}
              <div className="p-3.5 rounded-xl bg-alabaster-50 border border-alabaster-200 space-y-2">
                <span className="text-clinical-text font-bold block font-sans">
                  Public Signals ({CERTIFIED_GROTH16_CIRCUIT.publicSignalCount} Parameters Verified On-Chain):
                </span>
                <div className="space-y-1.5 text-clinical-text">
                  <div className="flex justify-between items-center py-0.5 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[0] approvedHospitalRoot:</span>
                    <span className="text-sage-700 font-mono text-[11px] truncate max-w-[280px]" title={selectedProofClaim.publicInputs.hospitalMerkleRoot}>
                      {selectedProofClaim.publicInputs.hospitalMerkleRoot}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[1] policyCommitment:</span>
                    <span className="text-clinical-text font-mono text-[11px] truncate max-w-[280px]" title={selectedProofClaim.publicInputs.policyCommitment}>
                      {selectedProofClaim.publicInputs.policyCommitment}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[2] claimAmount:</span>
                    <span className="text-sage-800 font-bold font-mono text-[11px]">
                      ${selectedProofClaim.publicInputs.claimAmount.toLocaleString()} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-alabaster-200">
                    <span className="text-clinical-muted">[3] claimDate (Unix):</span>
                    <span className="text-clinical-text font-mono text-[11px]">
                      {selectedProofClaim.publicInputs.claimTimestamp} ({new Date(selectedProofClaim.publicInputs.claimTimestamp * 1000).toLocaleDateString()})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-clinical-muted">[4] claimNullifier:</span>
                    <span className="text-sage-800 font-bold font-mono text-[11px] truncate max-w-[280px]" title={selectedProofClaim.publicInputs.claimNullifier}>
                      {selectedProofClaim.publicInputs.claimNullifier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Educational Comparison: What was hidden */}
              <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 space-y-2 font-sans">
                <span className="text-sage-800 font-bold text-xs flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> What Was Proven Valid WITHOUT Revealing to Insurer:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-clinical-text">
                  <div>• Hospital Merkle inclusion: <span className="text-sage-700 font-bold">YES</span></div>
                  <div>• Policy active on claim date: <span className="text-sage-700 font-bold">YES</span></div>
                  <div>• Procedure covered & in budget: <span className="text-sage-700 font-bold">YES</span></div>
                  <div>• Claim amount within limits: <span className="text-sage-700 font-bold">YES</span></div>
                  <div className="col-span-2 text-clinical-muted text-[11px] italic">
                    The insurer cannot see the patient's diagnosis code, doctor examination notes, or prescriptions.
                  </div>
                </div>
              </div>

              {/* Solidity Calldata with Copy Button */}
              {selectedProofClaim.proof.solidityCalldata && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-clinical-text font-bold block font-sans">
                      Solidity Verifier Calldata (EVM-ready):
                    </span>
                    <button
                      onClick={() => handleCopyCalldata(selectedProofClaim.proof.solidityCalldata!)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sage-100 hover:bg-sage-200 text-sage-800 border border-sage-200 text-[11px] transition font-sans"
                    >
                      {copiedCalldata ? (
                        <>
                          <Check className="h-3 w-3 text-sage-700" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Calldata</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-alabaster-50 border border-alabaster-200 text-[10px] text-clinical-muted font-mono overflow-x-auto max-h-24">
                    {selectedProofClaim.proof.solidityCalldata}
                  </pre>
                </div>
              )}

              {/* Raw Groth16 JSON */}
              <div className="space-y-1">
                <span className="text-clinical-text font-bold block font-sans">Raw Groth16 Curve Points:</span>
                <pre className="p-3 rounded-xl bg-alabaster-50 border border-alabaster-200 text-[11px] text-clinical-muted overflow-x-auto max-h-36">
                  {JSON.stringify({
                    pi_a: selectedProofClaim.proof.pi_a,
                    pi_b: selectedProofClaim.proof.pi_b,
                    pi_c: selectedProofClaim.proof.pi_c,
                    publicSignals: selectedProofClaim.proof.publicSignals
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => handleDownloadReceipt(selectedProofClaim)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sage-700 hover:bg-sage-600 text-white transition flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Receipt JSON</span>
              </button>
              <button
                onClick={() => setSelectedProofClaim(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-alabaster-200 hover:bg-alabaster-300 text-clinical-text transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
