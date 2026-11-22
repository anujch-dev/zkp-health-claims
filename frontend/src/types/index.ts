export type UserRole = 'patient' | 'hospital' | 'insurer' | 'demo' | 'architecture';

export type GranularRole = 'Doctor' | 'Specialist' | 'EmergencyResponder' | 'Auditor';

export interface DoctorAccess {
  doctorAddress: string;
  doctorName: string;
  specialty: string;
  role?: string;
  grantedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface HealthRecord {
  id: string;
  title: string;
  category: 'Diagnostic' | 'Surgical' | 'Prescription' | 'Lab Result';
  date: string;
  hospitalName: string;
  doctorName: string;
  doctorAddress: string;
  ipfsCid: string;
  recordCommitmentHash: string;
  isEncrypted: boolean;
  ciphertext?: string;
  iv?: string;
  salt?: string;
  clinicalNotes?: string;
  diagnosisCode?: string;
  diagnosisDesc?: string;
  prescriptions?: string[];
  authorizedDoctors: DoctorAccess[];
}

export interface CoveredProcedure {
  code: string;
  name: string;
  category: string;
  maxCoveredAmount: number;
}

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  patientAddress: string;
  patientName: string;
  insurerName: string;
  maxCoverageLimit: number;
  remainingCoverage: number;
  validFrom: string;
  validUntil: string;
  policyCommitmentHash: string;
  policySecretSalt: string;
  coveredProcedures: CoveredProcedure[];
}

export interface AccreditedHospital {
  id: string;
  name: string;
  licenseNumber: string;
  walletAddress: string;
  leafHash: string;
  leafIndex: number;
  merkleProof: string[];
}

export interface ClaimPrivateInputs {
  patientAddress: string;
  patientSecret: string;
  hospitalAddress: string;
  hospitalLicense: string;
  hospitalMerkleProof: string[];
  hospitalMerkleIndex: number;
  policyId: string;
  policyCommitment: string;
  policyExpiryTimestamp: number;
  policyMaxCoverage: number;
  policySecretSalt: string;
  procedureCode: string;
  procedureAllowedMax: number;
  claimAmount: number;
  claimTimestamp: number;
  diagnosisCode: string;       // PRIVATE (never exposed)
  diagnosisDescription: string;// PRIVATE
  prescriptions: string[];     // PRIVATE
  claimNonce: string;          // Random nonce for unique nullifier
}

export interface ClaimPublicInputs {
  hospitalMerkleRoot: string;
  policyCommitment: string;
  claimNullifier: string;
  claimAmount: number;
  claimTimestamp: number;
}

export interface ZKProofData {
  proofType: 'Groth16-Circom' | 'Simulated-Groth16';
  isLiveSnark: boolean;
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  publicSignals: string[];
  solidityCalldata?: string;
  generationDurationMs: number;
  verifiedOnChain: boolean;
}

export interface ClaimSubmission {
  id: string;
  createdAt: string;
  patientAddress: string;
  hospitalName: string;
  hospitalAddress: string;
  publicInputs: ClaimPublicInputs;
  proof: ZKProofData;
  status: 'SUBMITTED' | 'VERIFIED' | 'PAYOUT_SETTLED' | 'REJECTED_REPLAY' | 'REJECTED_INVALID_PROOF';
  txHash?: string;
  payoutAmount: number;
  failureReason?: string;
  // For simulation/educational comparison:
  privateInputsSummary: {
    hiddenDiagnosis: string;
    hiddenProcedure: string;
    hiddenPrescriptionsCount: number;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorRole: UserRole | 'emergency' | 'system';
  actorAddress: string;
  action: string;
  details: string;
  badge?: 'success' | 'warning' | 'danger' | 'info';
  txHash?: string;
}

export interface BreakGlassLog {
  id: string;
  recordId: string;
  patientAddress: string;
  responderAddress: string;
  responderName: string;
  reason: string;
  timestamp: string;
  txHash: string;
}

export interface CryptographicReceipt {
  version: string;
  project: string;
  track: string;
  txHash: string;
  claimId: string;
  claimNullifier: string;
  policyCommitment: string;
  hospitalMerkleRoot: string;
  claimAmount: number;
  claimTimestamp: number;
  settledAt: string;
  groth16Proof: {
    curve: string;
    protocol: string;
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    publicSignals: string[];
  };
  zeroKnowledgeAudit: {
    diagnosisExposed: false;
    procedureExposed: false;
    prescriptionsExposed: false;
    doubleSpendReplayGuarded: true;
  };
  verificationStatus: 'VALID_ON_CHAIN' | 'PAYOUT_SETTLED';
}
