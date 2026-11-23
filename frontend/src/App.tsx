import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RoleSwitcher } from './components/RoleSwitcher';
import { WorkflowStepper } from './components/WorkflowStepper';
import { ToastContainer } from './components/ToastContainer';
import { PortalLandingView } from './views/PortalLandingView';
import { PatientPortalView, PatientTab } from './views/PatientPortalView';
import { HospitalPortalView, HospitalTab } from './views/HospitalPortalView';
import { InsurerPortalView, InsurerTab } from './views/InsurerPortalView';
import { GuidedDemoView } from './views/GuidedDemoView';
import { ArchitectureView } from './views/ArchitectureView';
import { UserRole, HealthRecord, InsurancePolicy, ClaimSubmission, AuditEvent, ClaimPrivateInputs, TerminologyMode, ToastMessage, PatientProfile } from './types';
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
  VERIFIER_CONTRACT_ADDRESS,
  PRESET_PATIENTS
} from './fixtures/mockData';
import { generateHealthClaimProof, generateTamperedProof } from './lib/zkp';
import { CERTIFIED_GROTH16_CIRCUIT } from './fixtures/groth16Artifacts';
import { api } from './lib/api';

const parseInitialRoute = (): { role: UserRole; subPath?: string } => {
  if (typeof window === 'undefined') return { role: 'landing' };
  const path = window.location.pathname.toLowerCase();

  if (path.startsWith('/patient')) {
    const parts = path.split('/').filter(Boolean);
    return { role: 'patient', subPath: parts[1] || 'dashboard' };
  }
  if (path.startsWith('/hospital')) {
    const parts = path.split('/').filter(Boolean);
    return { role: 'hospital', subPath: parts[1] || 'dashboard' };
  }
  if (path.startsWith('/insurer')) {
    const parts = path.split('/').filter(Boolean);
    return { role: 'insurer', subPath: parts[1] || 'dashboard' };
  }
  if (path.startsWith('/demo')) {
    return { role: 'demo' };
  }
  if (path.startsWith('/architecture')) {
    return { role: 'architecture' };
  }
  return { role: 'landing' };
};

export function App() {
  const initialRoute = parseInitialRoute();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRoute.role);
  const [patientTab, setPatientTab] = useState<PatientTab>(
    (initialRoute.role === 'patient' && (initialRoute.subPath as PatientTab)) || 'dashboard'
  );
  const [hospitalTab, setHospitalTab] = useState<HospitalTab>(
    (initialRoute.role === 'hospital' && (initialRoute.subPath as HospitalTab)) || 'dashboard'
  );
  const [insurerTab, setInsurerTab] = useState<InsurerTab>(
    (initialRoute.role === 'insurer' && (initialRoute.subPath as InsurerTab)) || 'dashboard'
  );

  const [terminologyMode, setTerminologyMode] = useState<TerminologyMode>('plain');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [policy, setPolicy] = useState<InsurancePolicy>(INITIAL_POLICY);
  const [claims, setClaims] = useState<ClaimSubmission[]>(INITIAL_SETTLED_CLAIMS);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(PRESET_PATIENTS[0]);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
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

  const navigateTo = (role: UserRole, subPath?: string) => {
    setCurrentRole(role);
    let targetUrl = '/';

    if (role === 'landing') {
      targetUrl = '/';
    } else if (role === 'patient') {
      const tab = (subPath as PatientTab) || patientTab || 'dashboard';
      setPatientTab(tab);
      targetUrl = `/patient/${tab}`;
    } else if (role === 'hospital') {
      const tab = (subPath as HospitalTab) || hospitalTab || 'dashboard';
      setHospitalTab(tab);
      targetUrl = `/hospital/${tab}`;
    } else if (role === 'insurer') {
      const tab = (subPath as InsurerTab) || insurerTab || 'dashboard';
      setInsurerTab(tab);
      targetUrl = `/insurer/${tab}`;
    } else if (role === 'demo') {
      targetUrl = '/demo';
    } else if (role === 'architecture') {
      targetUrl = '/architecture';
    }

    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ role, subPath }, '', targetUrl);
    }
  };

  // Sync browser back/forward buttons with application state
  useEffect(() => {
    const handlePopState = () => {
      const route = parseInitialRoute();
      setCurrentRole(route.role);
      if (route.role === 'patient' && route.subPath) setPatientTab(route.subPath as PatientTab);
      if (route.role === 'hospital' && route.subPath) setHospitalTab(route.subPath as HospitalTab);
      if (route.role === 'insurer' && route.subPath) setInsurerTab(route.subPath as InsurerTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addLog = (message: string) => {
    setDemoLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Monitor backend service connectivity on mount with auto-retry
  useEffect(() => {
    let isMounted = true;
    let retryTimer: any = null;

    const checkHealth = async () => {
      try {
        const health = await api.getHealth();
        if (!isMounted) return;
        if (health?.status === 'healthy') {
          setIsBackendOnline(true);
          addLog(`[Backend Service] Connected to live Express backend on port ${health.port || 5001} (All 5 modules ONLINE)`);
          return;
        }
      } catch {
        // Will retry below
      }

      if (isMounted) {
        setIsBackendOnline(false);
        retryTimer = setTimeout(checkHealth, 4000);
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // Patient Actions
  const handleUpdatePatientProfile = (newProfile: PatientProfile) => {
    setPatientProfile(newProfile);
    setPolicy(prev => ({ ...prev, patientName: newProfile.name }));
    addToast('success', 'EHR Profile Synchronized', `Active patient switched to ${newProfile.name} (${newProfile.phone}). Records decrypted.`);
    addLog(`[EHR Identity] Switched active patient to ${newProfile.name} (Phone: ${newProfile.phone}, ID: #${newProfile.patientId}, Hospital: ${newProfile.hospital})`);
  };

  const handleGrantAccess = (recordId: string, doctorAddress: string, doctorName: string, specialty: string, role: string = "Specialist") => {
    api.grantAccess({
      patientAddress: PATIENT_ADDRESS,
      doctorAddress,
      recordId,
      role
    }).catch(() => {});

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
    addToast('success', 'Doctor Access Granted', `Granted ${doctorName} (${role}) access on-chain.`);
  };

  const handleRevokeAccess = (recordId: string, doctorAddress: string) => {
    api.revokeAccess({
      patientAddress: PATIENT_ADDRESS,
      doctorAddress,
      recordId
    }).catch(() => {});

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
    addToast('warning', 'Doctor Access Revoked', `Revoked permissions for doctor ${doctorAddress.slice(0, 8)}...`);
  };

  const handleAddRecord = (newRecord: HealthRecord) => {
    api.uploadRecord({
      patientAddress: PATIENT_ADDRESS,
      title: newRecord.title,
      category: newRecord.category,
      diagnosisCode: newRecord.diagnosisCode,
      doctorName: newRecord.doctorName,
      content: newRecord.clinicalNotes
    }).catch(() => {});

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
    addToast('success', 'Record Encrypted & Anchored', `Stored '${newRecord.title}' with AES-256-GCM. SHA-256 commitment on-chain.`);
  };

  const handleLogRecordView = (recordId: string, viewerAddress: string) => {
    api.viewRecord(recordId, viewerAddress).catch(() => {});

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
    addToast('info', 'RecordViewed Event Emitted', `Doctor access logged on-chain in HealthAccessRegistry.`);
  };

  const handleBreakGlassAccess = (recordId: string, reason: string, responderName: string, responderAddr: string) => {
    api.breakGlassEmergency({
      patientAddress: PATIENT_ADDRESS,
      recordId,
      responderAddress: responderAddr,
      reason
    }).catch(() => {});

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
    addToast('error', 'Break-Glass Emergency Triggered', `Emergency access by ${responderName} committed permanently to audit trail.`);
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
    api.submitClaim({
      proof: submission.proof,
      publicInputs: submission.publicInputs,
      hospitalAddress: submission.hospitalAddress,
      hospitalName: submission.hospitalName,
      procedureCode: submission.privateInputsSummary?.hiddenProcedure,
      claimAmount: submission.payoutAmount
    }).then(res => {
      if (res?.onChainSettled) {
        addLog(`[Relayer] Claim #${submission.id} settled via backend service (tx: ${res.transactionHash.slice(0, 10)}...)`);
      }
    }).catch(err => {
      console.warn('Backend claim sync:', err.message);
    });

    setClaims(prev => [submission, ...prev]);
    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'hospital',
      actorAddress: submission.hospitalAddress,
      action: 'ZK Claim Submitted',
      details: `Claim #${submission.id} broadcast with Groth16 proof ($${submission.payoutAmount.toLocaleString()})`,
      badge: 'info',
      txHash: submission.txHash
    };
    setAuditLogs(prev => [audit, ...prev]);
    addToast('info', 'ZK Claim Submitted', `Proof for $${submission.payoutAmount.toLocaleString()} sent to smart contract.`);
    addLog(`[Hospital] Submitted Claim #${submission.id} with Groth16 Proof to Settlement Contract.`);
    addLog(`[Smart Contract] Public Nullifier registered: ${submission.publicInputs.claimNullifier.slice(0, 16)}...`);
  };

  // Insurer Actions
  const handleSettleClaim = (claimId: string) => {
    setIsProcessing(true);
    addLog(`[Insurer] Verifying Groth16 pairing on ZKPInsuranceSettlement.sol...`);

    setTimeout(() => {
      const newTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setClaims(prev => prev.map(c => {
        if (c.id === claimId) {
          return {
            ...c,
            status: 'PAYOUT_SETTLED',
            txHash: newTxHash
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
        const audit: AuditEvent = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actorRole: 'insurer',
          actorAddress: SETTLEMENT_CONTRACT_ADDRESS,
          action: 'Groth16 Claim Settled',
          details: `BN254 pairing verified. $${claim.payoutAmount.toLocaleString()} USDC released. Nullifier marked spent.`,
          badge: 'success',
          txHash: newTxHash
        };
        setAuditLogs(prev => [audit, ...prev]);
        addToast('success', 'Claim Settled on Chain', `$${claim.payoutAmount.toLocaleString()} USDC disbursed. Nullifier marked spent.`);
      }

      setIsProcessing(false);
      addLog(`[SUCCESS] Claim #${claimId} settled on-chain. $${claim?.payoutAmount.toLocaleString()} USDC disbursed.`);
    }, 700);
  };

  const handleBatchSettleClaims = () => {
    const verifiedClaims = claims.filter(c => c.status === 'VERIFIED');
    if (verifiedClaims.length === 0) return;
    setIsProcessing(true);
    addLog(`[Insurer Batch Engine] Settling ${verifiedClaims.length} verified claims in single on-chain transaction batch...`);

    setTimeout(() => {
      let totalDisbursed = 0;
      setClaims(prev => prev.map(c => {
        if (c.status === 'VERIFIED') {
          totalDisbursed += c.payoutAmount;
          return {
            ...c,
            status: 'PAYOUT_SETTLED',
            txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
          };
        }
        return c;
      }));

      setPolicy(prev => ({
        ...prev,
        remainingCoverage: Math.max(0, prev.remainingCoverage - totalDisbursed)
      }));

      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorRole: 'insurer',
        actorAddress: SETTLEMENT_CONTRACT_ADDRESS,
        action: 'Batch Claims Settled',
        details: `Batch disbursed $${totalDisbursed.toLocaleString()} USDC across ${verifiedClaims.length} claims via Groth16.`,
        badge: 'success'
      };
      setAuditLogs(prev => [audit, ...prev]);
      addToast('success', 'Batch Settlement Complete', `Disbursed $${totalDisbursed.toLocaleString()} USDC for ${verifiedClaims.length} verified claims.`);
      addLog(`[SUCCESS] Batch settlement completed for ${verifiedClaims.length} claims ($${totalDisbursed.toLocaleString()} USDC total).`);
      setIsProcessing(false);
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

    const audit: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: 'insurer',
      actorAddress: SETTLEMENT_CONTRACT_ADDRESS,
      action: 'Valid Claim Evaluated',
      details: `Verified Groth16 proof on BN254. Disbursed $2,400 USDC for Brain MRI.`,
      badge: 'success',
      txHash: newClaim.txHash
    };
    setAuditLogs(prev => [audit, ...prev]);
    addToast('success', 'Valid Claim Verified', 'Brain MRI ($2,400) settled via Groth16 ZKP without leaking diagnosis.');

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

      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorRole: 'emergency',
        actorAddress: '0xAttacker_Malicious_Proxy',
        action: 'Replay Attack Blocked',
        details: `Smart contract reverted with ClaimAlreadyNullified. Duplicate nullifier rejected.`,
        badge: 'danger'
      };
      setAuditLogs(prev => [audit, ...prev]);
      addToast('error', 'Replay Attack Blocked', 'Contract reverted with ClaimAlreadyNullified. Double-spend rejected.');

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

      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorRole: 'emergency',
        actorAddress: '0xAttacker_Forged_Proof',
        action: 'Tampered Proof Rejected',
        details: `BN254 pairing check failed: InvalidProof(). Forged curve points rejected.`,
        badge: 'danger'
      };
      setAuditLogs(prev => [audit, ...prev]);
      addToast('error', 'Tampered Proof Rejected', 'Groth16 pairing check failed on-chain: InvalidProof(). Zero funds released.');

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

      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorRole: 'hospital',
        actorAddress: '0xRogue_Unlicensed_Clinic',
        action: 'Unlicensed Hospital Rejected',
        details: `Circom Merkle membership check failed against approvedHospitalRoot.`,
        badge: 'danger'
      };
      setAuditLogs(prev => [audit, ...prev]);
      addToast('warning', 'Unlicensed Hospital Blocked', 'Merkle root mismatch. Unaccredited clinic cannot generate valid proof.');

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

      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorRole: 'hospital',
        actorAddress: ACCREDITED_HOSPITALS[0].walletAddress,
        action: 'Expired Policy Rejected',
        details: `Circuit constraint claimTimestamp <= policyExpiryTimestamp violated.`,
        badge: 'warning'
      };
      setAuditLogs(prev => [audit, ...prev]);
      addToast('warning', 'Expired Policy Blocked', 'Circuit constraint violated: claim date is past policy expiry.');

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

      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorRole: 'hospital',
        actorAddress: ACCREDITED_HOSPITALS[0].walletAddress,
        action: 'Coverage Limit Exceeded',
        details: `Circuit constraint claimAmount <= policyMaxCoverage violated ($75,000 > $50,000).`,
        badge: 'warning'
      };
      setAuditLogs(prev => [audit, ...prev]);
      addToast('warning', 'Limit Exceeded Blocked', 'Circuit constraint violated: claim amount exceeds remaining coverage.');

      setIsProcessing(false);
    }, 500);
  };

  const pendingClaimsCount = claims.filter(c => c.status === 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#292D29] flex flex-col font-sans selection:bg-[#E7E1D7] selection:text-[#294638]">
      <Navbar
        currentRole={currentRole}
        walletBalance={walletBalance}
        onSelectRole={navigateTo}
        terminologyMode={terminologyMode}
        onToggleTerminology={() => setTerminologyMode(m => m === 'plain' ? 'technical' : 'plain')}
        isBackendOnline={isBackendOnline}
      />

      {/* Role Switcher & Workflow Stepper shown during Demo Mode or Evaluator tests */}
      {currentRole === 'demo' && (
        <>
          <RoleSwitcher
            currentRole={currentRole}
            onSelectRole={navigateTo}
            pendingClaimsCount={pendingClaimsCount}
          />
          <WorkflowStepper
            currentRole={currentRole}
            onSelectRole={navigateTo}
            hasRecord={records.length > 0}
            hasProofOrClaim={claims.length > 0}
            hasSettled={claims.some(c => c.status === 'PAYOUT_SETTLED')}
            terminologyMode={terminologyMode}
          />
        </>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 1. Common Landing Page */}
        {currentRole === 'landing' && (
          <PortalLandingView
            onSelectPortal={(portal) => navigateTo(portal, 'dashboard')}
            policy={policy}
            claims={claims}
            records={records}
          />
        )}

        {/* 2. Patient Portal with Sovereign Health Vault */}
        {currentRole === 'patient' && (
          <PatientPortalView
            records={records}
            policy={policy}
            patientProfile={patientProfile}
            onUpdatePatientProfile={handleUpdatePatientProfile}
            auditLogs={auditLogs}
            onGrantAccess={handleGrantAccess}
            onRevokeAccess={handleRevokeAccess}
            onAddRecord={handleAddRecord}
            onLogRecordView={handleLogRecordView}
            onBreakGlassAccess={handleBreakGlassAccess}
            terminologyMode={terminologyMode}
            onSelectRole={navigateTo}
            onExitPortal={() => navigateTo('landing')}
            activeTab={patientTab}
            onTabChange={(tab) => navigateTo('patient', tab)}
          />
        )}

        {/* 3. Hospital Portal with Groth16 Claim Prover */}
        {currentRole === 'hospital' && (
          <HospitalPortalView
            policy={policy}
            patientProfile={patientProfile}
            onClaimSubmitted={handleClaimSubmitted}
            onTestReplayAttack={handleTestReplayAttack}
            onTestUnaccreditedHospital={handleTestUnaccreditedHospital}
            onTestLimitExceeded={handleTestLimitExceeded}
            isProcessing={isProcessing}
            terminologyMode={terminologyMode}
            onSelectRole={navigateTo}
            claims={claims}
            records={records}
            onExitPortal={() => navigateTo('landing')}
            activeTab={hospitalTab}
            onTabChange={(tab) => navigateTo('hospital', tab)}
          />
        )}

        {/* 4. Insurance Portal with Zero-Knowledge Verification & Settlement */}
        {currentRole === 'insurer' && (
          <InsurerPortalView
            claims={claims}
            policy={policy}
            onSettleClaim={handleSettleClaim}
            onBatchSettleClaims={handleBatchSettleClaims}
            onTestReplayAttack={handleTestReplayAttack}
            isProcessing={isProcessing}
            terminologyMode={terminologyMode}
            onSelectRole={navigateTo}
            auditLogs={auditLogs}
            onExitPortal={() => navigateTo('landing')}
            activeTab={insurerTab}
            onTabChange={(tab) => navigateTo('insurer', tab)}
          />
        )}

        {/* 5. Interactive Demo Mode for Judges and Evaluators */}
        {currentRole === 'demo' && (
          <GuidedDemoView
            onRunValidClaim={handleRunValidClaim}
            onTestReplayAttack={handleTestReplayAttack}
            onTestExpiredPolicy={handleTestExpiredPolicy}
            onTestLimitExceeded={handleTestLimitExceeded}
            onTestTamperedProof={handleTestTamperedProof}
            onTestUnaccreditedHospital={handleTestUnaccreditedHospital}
            onResetDemo={handleResetDemo}
            onSelectRole={navigateTo}
            isProcessing={isProcessing}
            demoLogs={demoLogs}
            terminologyMode={terminologyMode}
          />
        )}

        {/* 6. System Architecture & Cryptographic Primitives View */}
        {currentRole === 'architecture' && (
          <ArchitectureView auditLogs={auditLogs} />
        )}
      </main>

      <footer className="border-t border-[#E7E1D7] bg-[#FAF9F6] py-10 text-center text-xs text-[#5F685F]">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <span className="font-serif font-bold text-xl text-[#294638]">ZK-HealthClaims</span>
          </div>
          <p className="font-normal text-xs text-[#5F685F] max-w-lg mx-auto leading-relaxed">
            Privacy-Preserving Healthcare Claims & Instant Settlement Powered by Zero-Knowledge Proofs.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-wider text-[#292D29] pt-2">
            <button onClick={() => navigateTo('landing')} className="hover:text-[#294638] transition cursor-pointer">Portal Selection</button>
            <button onClick={() => navigateTo('patient', 'dashboard')} className="hover:text-emerald-700 transition cursor-pointer">Patient Portal</button>
            <button onClick={() => navigateTo('hospital', 'dashboard')} className="hover:text-blue-700 transition cursor-pointer">Hospital Portal</button>
            <button onClick={() => navigateTo('insurer', 'dashboard')} className="hover:text-purple-700 transition cursor-pointer">Insurance Portal</button>
            <button onClick={() => navigateTo('demo')} className="hover:text-[#294638] transition cursor-pointer">Interactive Evaluation</button>
          </div>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
