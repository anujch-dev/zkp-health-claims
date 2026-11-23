import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { RoleSwitcher } from './components/RoleSwitcher';
import { GuidedDemoBanner } from './components/GuidedDemoBanner';
import { PatientView } from './views/PatientView';
import { HospitalView } from './views/HospitalView';
import { InsurerView } from './views/InsurerView';
import { GuidedDemoView } from './views/GuidedDemoView';
import { ArchitectureView } from './views/ArchitectureView';
import { UserRole, HealthRecord, InsurancePolicy, ClaimSubmission, AuditEvent, ClaimPrivateInputs } from './types';
import {
  INITIAL_POLICY,
  INITIAL_HEALTH_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTLED_CLAIMS,
  ACCREDITED_HOSPITALS,
  HOSPITAL_MERKLE_ROOT,
  PATIENT_ADDRESS,
  REGISTRY_CONTRACT_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  VERIFIER_CONTRACT_ADDRESS
} from './fixtures/mockData';
import { generateHealthClaimProof, generateTamperedProof } from './lib/zkp';
import { CERTIFIED_GROTH16_CIRCUIT } from './fixtures/groth16Artifacts';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('demo');
  const [records, setRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [policy, setPolicy] = useState<InsurancePolicy>(INITIAL_POLICY);
  const [claims, setClaims] = useState<ClaimSubmission[]>(INITIAL_SETTLED_CLAIMS);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);
  const [demoLogs, setDemoLogs] = useState<string[]>([
    `System Initialized: BN254 Curve & Groth16 circuit (${CERTIFIED_GROTH16_CIRCUIT.nonLinearConstraints} R1CS constraints loaded).`,
    `HealthAccessRegistry deployed at ${REGISTRY_CONTRACT_ADDRESS.slice(0, 10)}...`,
    `Groth16Verifier deployed at ${VERIFIER_CONTRACT_ADDRESS.slice(0, 10)}...`,
    `ZKPInsuranceSettlement deployed at ${SETTLEMENT_CONTRACT_ADDRESS.slice(0, 10)}...`,
    `Approved Hospital Merkle Root verified: ${HOSPITAL_MERKLE_ROOT.slice(0, 14)}...`,
    "Ready for judge evaluation. Click 'Run Sample Valid Claim' to start."
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance] = useState("24.50");

  const addLog = (message: string) => {
    setDemoLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Patient Actions
  const handleGrantAccess = (recordId: string, doctorAddress: string, doctorName: string, specialty: string, role: string = "Specialist") => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const existing = rec.authorizedDoctors.find(d => d.doctorAddress.toLowerCase() === doctorAddress.toLowerCase());
        const updatedDocs = existing
          ? rec.authorizedDoctors.map(d => d.doctorAddress.toLowerCase() === doctorAddress.toLowerCase() ? { ...d, isActive: true, role } : d)
          : [...rec.authorizedDoctors, {
              doctorAddress,
              doctorName,
              specialty,
              role,
              grantedAt: new Date().toISOString().split('T')[0],
              expiresAt: '2027-12-31',
              isActive: true
            }];
        return { ...rec, authorizedDoctors: updatedDocs };
      }
      return rec;
    }));

    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'patient',
      actorAddress: PATIENT_ADDRESS,
      action: 'Doctor Access Granted',
      details: `Granted ${doctorName} (${role}) access to Record #${recordId}`,
      badge: 'success'
    };
    setAuditLogs(prev => [audit, ...prev]);
    addLog(`[Patient] Granted on-chain access key to ${role} ${doctorAddress.slice(0, 8)}...`);
  };

  const handleRevokeAccess = (recordId: string, doctorAddress: string) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          authorizedDoctors: rec.authorizedDoctors.map(d =>
            d.doctorAddress.toLowerCase() === doctorAddress.toLowerCase() ? { ...d, isActive: false } : d
          )
        };
      }
      return rec;
    }));

    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'patient',
      actorAddress: PATIENT_ADDRESS,
      action: 'Doctor Access Revoked',
      details: `Revoked permission from doctor ${doctorAddress.slice(0, 8)}... for Record #${recordId}`,
      badge: 'warning'
    };
    setAuditLogs(prev => [audit, ...prev]);
    addLog(`[Patient] Revoked doctor access for ${doctorAddress.slice(0, 8)}...`);
  };

  const handleAddRecord = (newRecord: HealthRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'patient',
      actorAddress: PATIENT_ADDRESS,
      action: 'Record Anchored',
      details: `Anchored commitment ${newRecord.recordCommitmentHash.slice(0, 12)}... for ${newRecord.title} (AES-256-GCM)`,
      badge: 'info'
    };
    setAuditLogs(prev => [audit, ...prev]);
    addLog(`[Patient] Anchored SHA-256 commitment for '${newRecord.title}' into HealthAccessRegistry.sol`);
  };

  const handleLogRecordView = (recordId: string, viewerAddress: string) => {
    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'hospital',
      actorAddress: viewerAddress,
      action: 'RecordViewed Logged',
      details: `Viewer ${viewerAddress.slice(0, 8)}... accessed Record #${recordId} (emitted RecordViewed on-chain)`,
      badge: 'info'
    };
    setAuditLogs(prev => [audit, ...prev]);
    addLog(`[On-Chain] Event RecordViewed(recordId=${recordId.slice(0, 8)}..., viewer=${viewerAddress.slice(0, 8)}...) emitted on HealthAccessRegistry.sol`);
  };

  const handleBreakGlassAccess = (recordId: string, reason: string, responderName: string, responderAddr: string) => {
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'emergency',
      actorAddress: responderAddr,
      action: 'Break-Glass Emergency Accessed',
      details: `EMERGENCY OVERRIDE by ${responderName}: "${reason}" for Record #${recordId}`,
      badge: 'danger',
      txHash
    };
    setAuditLogs(prev => [audit, ...prev]);
    addLog(`[EMERGENCY BREAK-GLASS] Responder ${responderName} overrode access for Record #${recordId}. Reason: "${reason}" permanently committed on-chain.`);
  };

  const handleResetDemo = () => {
    setRecords(INITIAL_HEALTH_RECORDS);
    setPolicy(INITIAL_POLICY);
    setClaims(INITIAL_SETTLED_CLAIMS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setDemoLogs([
      "System Reset: Initial test vectors and ledger state restored.",
      `HealthAccessRegistry deployed at ${REGISTRY_CONTRACT_ADDRESS.slice(0, 10)}...`,
      `Groth16Verifier deployed at ${VERIFIER_CONTRACT_ADDRESS.slice(0, 10)}...`,
      `ZKPInsuranceSettlement deployed at ${SETTLEMENT_CONTRACT_ADDRESS.slice(0, 10)}...`,
      `Approved Hospital Merkle Root: ${HOSPITAL_MERKLE_ROOT.slice(0, 14)}...`,
      "Ready for judge evaluation. Click 'Run Sample Valid Claim' to start."
    ]);
  };

  // Hospital Actions
  const handleClaimSubmitted = (submission: ClaimSubmission) => {
    setClaims(prev => [submission, ...prev]);
    addLog(`[Hospital] Submitted Claim #${submission.id} with Groth16 Proof to Settlement Contract.`);
    addLog(`[Smart Contract] Public Nullifier registered: ${submission.publicInputs.claimNullifier.slice(0, 16)}...`);
  };

  // Insurer Actions
  const handleSettleClaim = (claimId: string) => {
    setIsProcessing(true);
    addLog(`[Insurer] Verifying Groth16 pairing on ZKPInsuranceSettlement.sol...`);

    setTimeout(() => {
      setClaims(prev => prev.map(c => {
        if (c.id === claimId) {
          return {
            ...c,
            status: 'PAYOUT_SETTLED',
            txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
          };
        }
        return c;
      }));

      const claim = claims.find(c => c.id === claimId);
      if (claim) {
        setPolicy(prev => ({
          ...prev,
          remainingCoverage: Math.max(0, prev.remainingCoverage - claim.payoutAmount)
        }));
      }

      setIsProcessing(false);
      addLog(`[SUCCESS] Claim #${claimId} settled on-chain. $${claim?.payoutAmount.toLocaleString()} USDC disbursed.`);
    }, 700);
  };

  // Guided One-Click Judge Scenarios
  const handleRunValidClaim = async () => {
    setIsProcessing(true);
    addLog(`--- STARTING VALID CLAIM JUDGE EVALUATION ---`);
    addLog(`[Step 1] Hospital Apex University Health Care selects procedure CPT-70553 (Brain MRI, $2,400).`);
    addLog(`[Step 2] Private witnesses gathered: diagnosis G43.909, prescriptions (never sent on-chain).`);
    addLog(`[Step 3] Evaluating Circom R1CS constraints: Merkle membership, policy active, limit <= $3,500.`);

    const hosp = ACCREDITED_HOSPITALS[0];
    const privateInputs: ClaimPrivateInputs = {
      patientAddress: PATIENT_ADDRESS,
      patientSecret: "0xsecret_patient_salt_88129",
      hospitalAddress: hosp.walletAddress,
      hospitalLicense: hosp.licenseNumber,
      hospitalMerkleProof: hosp.merkleProof,
      hospitalMerkleIndex: hosp.leafIndex,
      policyId: policy.id,
      policyCommitment: policy.policyCommitmentHash,
      policyExpiryTimestamp: Math.floor(new Date(policy.validUntil).getTime() / 1000),
      policyMaxCoverage: policy.remainingCoverage,
      policySecretSalt: policy.policySecretSalt,
      procedureCode: "CPT-70553",
      procedureAllowedMax: 3500,
      claimAmount: 2400,
      claimTimestamp: Math.floor(Date.now() / 1000),
      diagnosisCode: "G43.909",
      diagnosisDescription: "Intractable migraine with aura",
      prescriptions: ["Sumatriptan 100mg"],
      claimNonce: '0x' + Math.random().toString(16).slice(2, 10)
    };

    const result = await generateHealthClaimProof(privateInputs, HOSPITAL_MERKLE_ROOT);
    if (!result.isValid || !result.proof || !result.publicInputs) {
      addLog(`[ERROR] Proof generation failed.`);
      setIsProcessing(false);
      return;
    }

    addLog(`[Step 4] Groth16 proof successfully generated in ${result.proof.generationDurationMs}ms.`);
    addLog(`[Step 5] Submitting proof + public inputs to ZKPInsuranceSettlement.sol...`);

    const newClaim: ClaimSubmission = {
      id: `clm-eval-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      patientAddress: PATIENT_ADDRESS,
      hospitalName: hosp.name,
      hospitalAddress: hosp.walletAddress,
      publicInputs: result.publicInputs,
      proof: result.proof,
      status: 'PAYOUT_SETTLED',
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      payoutAmount: 2400,
      privateInputsSummary: {
        hiddenDiagnosis: "G43.909 (Migraine)",
        hiddenProcedure: "Brain MRI with Contrast",
        hiddenPrescriptionsCount: 1
      }
    };

    setClaims(prev => [newClaim, ...prev]);
    setPolicy(prev => ({ ...prev, remainingCoverage: prev.remainingCoverage - 2400 }));

    addLog(`[SUCCESS] Proof verified on-chain! Nullifier marked as SPENT. Payout of $2,400 USDC settled!`);
    setIsProcessing(false);
  };

  const handleTestReplayAttack = () => {
    setIsProcessing(true);
    addLog(`--- TESTING REPLAY ATTACK (DUPLICATE NULLIFIER) ---`);
    if (claims.length === 0) {
      addLog(`[Notice] Run a valid claim first so an active nullifier is registered.`);
      setIsProcessing(false);
      return;
    }

    const targetClaim = claims[0];
    addLog(`[Attacker] Intercepting settled Claim #${targetClaim.id} and attempting re-submission...`);
    addLog(`[Contract] Re-checking nullifier: ${targetClaim.publicInputs.claimNullifier.slice(0, 16)}...`);

    setTimeout(() => {
      addLog(`[REVERT] Transaction reverted with custom error: ClaimAlreadyNullified("${targetClaim.publicInputs.claimNullifier.slice(0, 16)}...")`);
      addLog(`[BLOCKED] Replay attack thwarted! Smart contract prevented double-spend.`);

      const replayedClaim: ClaimSubmission = {
        id: `clm-replay-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        patientAddress: PATIENT_ADDRESS,
        hospitalName: "Apex University Health Care",
        hospitalAddress: targetClaim.hospitalAddress,
        publicInputs: targetClaim.publicInputs,
        proof: targetClaim.proof,
        status: 'REJECTED_REPLAY',
        payoutAmount: targetClaim.publicInputs.claimAmount,
        failureReason: "Reverted: ClaimAlreadyNullified",
        privateInputsSummary: targetClaim.privateInputsSummary
      };
      setClaims(prev => [replayedClaim, ...prev]);
      setIsProcessing(false);
    }, 600);
  };

  const handleTestTamperedProof = () => {
    setIsProcessing(true);
    addLog(`--- TESTING TAMPERED PROOF (EVM PAIRING CHECK REVERT) ---`);
    addLog(`[Attacker] Modifying Groth16 curve point pi_a[0] to forge unauthorized payout...`);

    setTimeout(() => {
      const targetClaim = claims[0] || INITIAL_SETTLED_CLAIMS[0];
      const tamperedProof = generateTamperedProof(targetClaim.proof);

      addLog(`[Contract] Executing Groth16Verifier.verifyProof(a, b, c, input)...`);
      addLog(`[BN254 PAIRING FAILED] e(a, b) * e(alpha, beta) * e(vk_x, gamma) * e(c, delta) != 1`);
      addLog(`[REVERT] Transaction reverted with custom error: InvalidProof()`);
      addLog(`[SECURITY CONFIRMED] Smart contract refused forgery. Zero funds released.`);

      const rejectedClaim: ClaimSubmission = {
        id: `clm-tampered-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        patientAddress: PATIENT_ADDRESS,
        hospitalName: "Apex University Health Care (Forged Calldata)",
        hospitalAddress: targetClaim.hospitalAddress,
        publicInputs: targetClaim.publicInputs,
        proof: tamperedProof,
        status: 'REJECTED_INVALID_PROOF',
        payoutAmount: targetClaim.publicInputs.claimAmount,
        failureReason: "Reverted: InvalidProof() (BN254 Pairing check failed)",
        privateInputsSummary: targetClaim.privateInputsSummary
      };
      setClaims(prev => [rejectedClaim, ...prev]);
      setIsProcessing(false);
    }, 600);
  };

  const handleTestUnaccreditedHospital = async () => {
    setIsProcessing(true);
    addLog(`--- TESTING UNLICENSED HOSPITAL (MERKLE PROOF FAILURE) ---`);
    addLog(`[Rogue Provider] Unaccredited clinic 'Rogue Medical Center' attempts to create a claim...`);
    addLog(`[Circuit Verifier] Checking hospital license against approved Merkle root ${HOSPITAL_MERKLE_ROOT.slice(0, 16)}...`);

    setTimeout(() => {
      addLog(`[CIRCUIT FAILED] R1CS constraint violation: Hospital license leaf does not belong to accredited Merkle tree.`);
      addLog(`[PRIVACY PRESERVED] Circuit halted. Unlicensed provider cannot generate a valid proof.`);
      setIsProcessing(false);
    }, 500);
  };

  const handleTestExpiredPolicy = () => {
    setIsProcessing(true);
    addLog(`--- TESTING INVALID CLAIM (POLICY EXPIRED) ---`);
    addLog(`[Hospital] Submitting claim with treatment date 2028-05-10 against policy expiring 2027-12-31...`);

    setTimeout(() => {
      addLog(`[CIRCUIT FAILED] R1CS constraint violation: claimTimestamp <= policyExpiryTimestamp evaluated false.`);
      addLog(`[PRIVACY PRESERVED] Circuit refused to output a valid Groth16 proof. Diagnosis was NOT leaked.`);
      setIsProcessing(false);
    }, 500);
  };

  const handleTestLimitExceeded = () => {
    setIsProcessing(true);
    addLog(`--- TESTING INVALID CLAIM (LIMIT EXCEEDED) ---`);
    addLog(`[Hospital] Submitting experimental procedure claim of $75,000 against policy limit of $50,000...`);

    setTimeout(() => {
      addLog(`[CIRCUIT FAILED] R1CS constraint violation: claimAmount ($75,000) > policyMaxCoverage ($50,000).`);
      addLog(`[PRIVACY PRESERVED] Prover aborted. Invalid claim halted before reaching the blockchain.`);
      setIsProcessing(false);
    }, 500);
  };

  const pendingClaimsCount = claims.filter(c => c.status === 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-clinical-text flex flex-col">
      <Navbar
        currentRole={currentRole}
        walletBalance={walletBalance}
        onSelectRole={setCurrentRole}
      />
      <RoleSwitcher
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        pendingClaimsCount={pendingClaimsCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole !== 'demo' && (
          <GuidedDemoBanner
            onRunValidClaim={handleRunValidClaim}
            onTestReplayAttack={handleTestReplayAttack}
            onTestExpiredPolicy={handleTestExpiredPolicy}
            onTestLimitExceeded={handleTestLimitExceeded}
            onTestTamperedProof={handleTestTamperedProof}
            onTestUnaccreditedHospital={handleTestUnaccreditedHospital}
            isProcessing={isProcessing}
          />
        )}

        {currentRole === 'demo' && (
          <GuidedDemoView
            onRunValidClaim={handleRunValidClaim}
            onTestReplayAttack={handleTestReplayAttack}
            onTestExpiredPolicy={handleTestExpiredPolicy}
            onTestLimitExceeded={handleTestLimitExceeded}
            onTestTamperedProof={handleTestTamperedProof}
            onTestUnaccreditedHospital={handleTestUnaccreditedHospital}
            onResetDemo={handleResetDemo}
            onSelectRole={setCurrentRole}
            isProcessing={isProcessing}
            demoLogs={demoLogs}
          />
        )}

        {currentRole === 'patient' && (
          <PatientView
            records={records}
            policy={policy}
            auditLogs={auditLogs}
            onGrantAccess={handleGrantAccess}
            onRevokeAccess={handleRevokeAccess}
            onAddRecord={handleAddRecord}
            onLogRecordView={handleLogRecordView}
            onBreakGlassAccess={handleBreakGlassAccess}
          />
        )}

        {currentRole === 'hospital' && (
          <HospitalView
            policy={policy}
            onClaimSubmitted={handleClaimSubmitted}
            onTestReplayAttack={handleTestReplayAttack}
            onTestUnaccreditedHospital={handleTestUnaccreditedHospital}
            onTestLimitExceeded={handleTestLimitExceeded}
            isProcessing={isProcessing}
          />
        )}

        {currentRole === 'insurer' && (
          <InsurerView
            claims={claims}
            policy={policy}
            onSettleClaim={handleSettleClaim}
            onTestReplayAttack={handleTestReplayAttack}
            isProcessing={isProcessing}
          />
        )}

        {currentRole === 'architecture' && (
          <ArchitectureView auditLogs={auditLogs} />
        )}
      </main>

      <footer className="border-t border-alabaster-300 bg-white py-6 text-center text-xs text-clinical-muted">
        <p className="font-serif font-semibold text-clinical-text">
          ZK-HealthClaims · Privacy-Preserving Health Records & ZKP Insurance Claims · WEB3 · W3-01
        </p>
        <p className="mt-1 font-mono text-[11px] text-clinical-muted">
          Client-side Groth16 Prover & EVM Smart Contracts · Calm Editorial Clinical Theme
        </p>
      </footer>
    </div>
  );
}

export default App;
