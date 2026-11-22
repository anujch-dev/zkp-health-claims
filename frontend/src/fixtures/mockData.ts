import { HealthRecord, InsurancePolicy, AccreditedHospital, ClaimSubmission, AuditEvent } from '../types';

export const PATIENT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const INSURER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const SETTLEMENT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const REGISTRY_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// 4-leaf Merkle tree for accredited hospitals
// Merkle Root: 0x4d65726b6c65526f6f745f486f73706974616c735f323032365f5a4b50303100
export const HOSPITAL_MERKLE_ROOT = "0x89e2cf9b9ad65646f9011933a39e76d05f322ea15d18d45e5eb4578bfa79fbc1";

export const ACCREDITED_HOSPITALS: AccreditedHospital[] = [
  {
    id: "hosp-1",
    name: "Apex University Health Care",
    licenseNumber: "MED-LIC-NY-88291",
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    leafHash: "0x1a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    leafIndex: 0,
    merkleProof: [
      "0x2b9c0d12e34f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e",
      "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b"
    ]
  },
  {
    id: "hosp-2",
    name: "St. Jude Metropolitan Hospital",
    licenseNumber: "MED-LIC-CA-44912",
    walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    leafHash: "0x2b9c0d12e34f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e",
    leafIndex: 1,
    merkleProof: [
      "0x1a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
      "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b"
    ]
  },
  {
    id: "hosp-3",
    name: "Mayo Memorial Research Clinic",
    licenseNumber: "MED-LIC-MN-11029",
    walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
    leafHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b",
    leafIndex: 2,
    merkleProof: [
      "0x4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b3c",
      "0x5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b3c4d"
    ]
  },
  {
    id: "hosp-4",
    name: "Stanford Biomedical Pavilion",
    licenseNumber: "MED-LIC-CA-99381",
    walletAddress: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    leafHash: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b3c",
    leafIndex: 3,
    merkleProof: [
      "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b",
      "0x5e6f7a8b9c0d1e2f3a4b5c6d71a8f93e2b9c0d12e34f5a6b7c8d9e0f1a2b3c4d"
    ]
  }
];

export const INITIAL_POLICY: InsurancePolicy = {
  id: "pol-001",
  policyNumber: "POL-ZKP-2026-9941",
  patientAddress: PATIENT_ADDRESS,
  patientName: "Alice Vance",
  insurerName: "AetherShield Decentralized Health Underwriters",
  maxCoverageLimit: 50000,
  remainingCoverage: 44200,
  validFrom: "2026-01-01",
  validUntil: "2027-12-31",
  policyCommitmentHash: "0x7a3f89d0b6728341ef92d5c310467ae584920bcf241851239aa827b5f90241ec",
  policySecretSalt: "0x89abf72910cde47101",
  coveredProcedures: [
    { code: "CPT-70553", name: "Brain MRI with & without Contrast", category: "Radiology", maxCoveredAmount: 3500 },
    { code: "CPT-93000", name: "12-Lead Electrocardiogram (ECG)", category: "Cardiology", maxCoveredAmount: 650 },
    { code: "CPT-99214", name: "Outpatient Comprehensive Consultation", category: "Evaluation", maxCoveredAmount: 450 },
    { code: "CPT-43239", name: "Upper Endoscopy & Biopsy", category: "Gastroenterology", maxCoveredAmount: 4200 },
    { code: "CPT-29881", name: "Knee Arthroscopy & Meniscectomy", category: "Orthopedics", maxCoveredAmount: 8500 },
    { code: "CPT-99285", name: "Emergency Department High Severity", category: "Emergency", maxCoveredAmount: 6000 }
  ]
};

export const INITIAL_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: "rec-101",
    title: "Neuro-Radiology Cranial MRI Scan",
    category: "Diagnostic",
    date: "2026-11-12",
    hospitalName: "Apex University Health Care",
    doctorName: "Dr. Sarah Lin, MD (Neuro)",
    doctorAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    ipfsCid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    recordCommitmentHash: "0x5109b83acdf882b45091763ef90812aa652dfa7c8812e345b9087cfda2349102",
    isEncrypted: true,
    authorizedDoctors: [
      {
        doctorAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        doctorName: "Dr. Sarah Lin, MD",
        specialty: "Neurology",
        grantedAt: "2026-11-10",
        expiresAt: "2027-11-10",
        isActive: true
      }
    ]
  },
  {
    id: "rec-102",
    title: "Cardiac Holter & Stress Telemetry",
    category: "Diagnostic",
    date: "2026-09-04",
    hospitalName: "Mayo Memorial Research Clinic",
    doctorName: "Dr. Marcus Brody, MD (Cardio)",
    doctorAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    ipfsCid: "bafybeihkovi2nffb3bptl5d73g2k4x6s6a73o3zcb22r6b7ff3ff3c74de",
    recordCommitmentHash: "0x892a0914bc87123908fde7c98124098ad812f8a912e798234ab8912e98412891",
    isEncrypted: true,
    authorizedDoctors: [
      {
        doctorAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        doctorName: "Dr. Marcus Brody, MD",
        specialty: "Cardiology",
        grantedAt: "2026-09-01",
        expiresAt: "2026-10-01",
        isActive: false // Expired/Revoked
      }
    ]
  },
  {
    id: "rec-103",
    title: "Comprehensive Metabolic & Lipid Profile",
    category: "Lab Result",
    date: "2026-08-20",
    hospitalName: "Stanford Biomedical Pavilion",
    doctorName: "Dr. Elena Rostova, PhD",
    doctorAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    ipfsCid: "bafybeicg5z4k7k6yhn57u67r5qhn7y26nf3efuylqabf3oclgtqy55fbzdi",
    recordCommitmentHash: "0x127bcf982a8710923e81247091283e716298371ef891236189ab710293847102",
    isEncrypted: true,
    authorizedDoctors: []
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "aud-1",
    timestamp: "2026-11-22 22:30:15",
    actorRole: "patient",
    actorAddress: PATIENT_ADDRESS,
    action: "Registry Initialized",
    details: "Patient registered 3 encrypted off-chain health records with SHA-256 commitments on-chain.",
    badge: "info"
  },
  {
    id: "aud-2",
    timestamp: "2026-11-22 22:35:40",
    actorRole: "patient",
    actorAddress: PATIENT_ADDRESS,
    action: "Doctor Permission Granted",
    details: "Granted Dr. Sarah Lin (0x3C44...93BC) re-encryption key access for Record #rec-101.",
    badge: "success"
  },
  {
    id: "aud-3",
    timestamp: "2026-11-22 22:42:08",
    actorRole: "patient",
    actorAddress: PATIENT_ADDRESS,
    action: "Doctor Permission Revoked",
    details: "Revoked access from Dr. Marcus Brody (0x90F7...b906) for Record #rec-102.",
    badge: "warning"
  }
];

export const INITIAL_SETTLED_CLAIMS: ClaimSubmission[] = [
  {
    id: "clm-historical-01",
    createdAt: "2026-10-18 14:15:22",
    patientAddress: PATIENT_ADDRESS,
    hospitalName: "Apex University Health Care",
    hospitalAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    publicInputs: {
      hospitalMerkleRoot: HOSPITAL_MERKLE_ROOT,
      policyCommitment: INITIAL_POLICY.policyCommitmentHash,
      claimNullifier: "0x582194cbe4019a2b8e4f16928e34091aef591204891285091285012984019284",
      claimAmount: 5800,
      claimTimestamp: 1760799322
    },
    proof: {
      proofType: "Groth16-Circom",
      isLiveSnark: true,
      pi_a: ["0x21a4...", "0x098b..."],
      pi_b: [["0x12c4...", "0x89e1..."], ["0x45a1...", "0x67b2..."]],
      pi_c: ["0x78f2...", "0x34c1..."],
      publicSignals: [
        HOSPITAL_MERKLE_ROOT,
        INITIAL_POLICY.policyCommitmentHash,
        "0x582194cbe4019a2b8e4f16928e34091aef591204891285091285012984019284",
        "5800"
      ],
      generationDurationMs: 418,
      verifiedOnChain: true
    },
    status: "PAYOUT_SETTLED",
    txHash: "0x89dfb892a0914bc87123908fde7c98124098ad812f8a912e798234ab8912e984",
    payoutAmount: 5800,
    privateInputsSummary: {
      hiddenDiagnosis: "Protected (Private on-chain)",
      hiddenProcedure: "Protected (Private on-chain)",
      hiddenPrescriptionsCount: 2
    }
  }
];
