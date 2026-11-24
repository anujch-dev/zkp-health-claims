export type UserRole = 'patient' | 'hospital' | 'insurer' | 'auditor';

export interface AuthChallenge {
  challenge: string;
  timestamp: number;
  expiresAt: number;
  role: UserRole;
  domain: {
    name: string;
    version: string;
    chainId: number;
  };
}

export interface UserSession {
  address: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
  token: string;
  name?: string;
  organization?: string;
}

export interface EncryptedMedicalRecord {
  id: string; // recordId (bytes32 hex)
  patientAddress: string;
  title: string;
  category: 'Diagnostic' | 'Prescription' | 'Lab Result' | 'Clinical Summary' | 'Emergency Info';
  ipfsCid: string;
  commitmentHash: string; // SHA-256 / Poseidon hash of record
  encryptedPayload: string; // AES-256-GCM ciphertext + iv + authTag base64
  metadata: {
    hospitalName?: string;
    doctorName?: string;
    procedureCode?: string;
    diagnosisCode?: string;
    timestamp: number;
    fileSize?: number;
    mimeType?: string;
  };
  fhirBundle?: Record<string, any>;
  anchoredOnChain: boolean;
  onChainTxHash?: string;
  createdAt: number;
}

export interface AccessPermission {
  recordId: string;
  granteeAddress: string;
  granteeName?: string;
  role: string; // "Doctor", "Specialist", "EmergencyResponder", "Auditor"
  grantedAt: number;
  expiresAt: number;
  isActive: boolean;
  txHash?: string;
}

export interface BreakGlassLog {
  id: string;
  recordId: string;
  patientAddress: string;
  responderAddress: string;
  reason: string;
  timestamp: number;
  txHash?: string;
}

export interface RecordViewLog {
  id: string;
  recordId: string;
  patientAddress: string;
  viewerAddress: string;
  viewerRole: string;
  timestamp: number;
  txHash?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  eventName: string;
  actorRole: UserRole | string;
  actorAddress: string;
  details: string;
  txHash?: string;
  badge?: 'success' | 'warning' | 'danger' | 'info';
}

export interface ZKClaimPublicInputs {
  approvedHospitalRoot: string;
  policyCommitment: string;
  claimAmount: string;
  claimDate: string;
  claimNullifier: string;
}

export interface ZKClaimPrivateInputs {
  hospitalId: string;
  hospitalMerkleProofPath: string[];
  hospitalMerkleProofIndices: number[];
  policyId: string;
  patientSecret: string;
  policyExpiry: string;
  maxCoverageLimit: string;
  claimId: string;
  procedureCode: string;
  coveredProcedureCodes: string[];
  diagnosisCode: string;
  patientRecordHash: string;
}

export interface ZKProofData {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  protocol: string;
  curve: string;
}

export interface ClaimRecord {
  id: string;
  claimNullifier: string;
  policyCommitment: string;
  hospitalAddress: string;
  hospitalName: string;
  claimAmount: number;
  claimDate: number;
  procedureCode: string;
  procedureName: string;
  status: 'pending' | 'verified' | 'settled' | 'rejected';
  publicInputs: ZKClaimPublicInputs;
  proof: ZKProofData;
  txHash?: string;
  settledAt?: number;
  errorMessage?: string;
}

export interface PharmacyQRPayload {
  passId: string;
  prescriptionHash: string;
  patientAddress: string;
  doctorAddress: string;
  doctorSignature: string;
  medicationCode: string;
  medicationName: string;
  validUntil: number;
  verificationUrl: string;
  zeroKnowledgeAttestation: {
    holdsValidPrescription: boolean;
    diagnosisHidden: boolean;
    doctorAccredited: boolean;
  };
}
