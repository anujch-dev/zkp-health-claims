# Decentralized Architecture: Privacy-Preserving Health Records & ZKP Insurance Claims

## Track: WEB3 · W3-01

### 1. High-Level System Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    PATIENT (Data Sovereign)                                      |
|  - AES-256 encrypted records stored on IPFS                                                      |
|  - On-chain commitment: SHA-256 / Poseidon hash stored on HealthAccessRegistry.sol              |
|  - Issues cryptographic re-encryption keys to licensed doctors                                  |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Grants access to licensed doctor
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                  HOSPITAL / CLINIC (Prover)                                      |
|  - Consults patient, diagnoses condition, performs medical procedure                            |
|  - Client-side Zero-Knowledge Prover (Circom / Groth16):                                          |
|      * Private Inputs: Diagnosis (ICD-10), doctor notes, prescriptions, patient identity salt    |
|      * Constraints Proven:                                                                       |
|          1. Hospital wallet is accredited in approved Merkle tree (root verified)                |
|          2. Policy is active (claimTimestamp <= policyExpiryTimestamp)                           |
|          3. Procedure is in covered set & claim amount <= policy and procedure limits           |
|          4. Nullifier = Hash(policyCommitment, claimNonce, hospitalAddress, claimDate)          |
|      * Public Inputs Generated: [merkleRoot, policyCommitment, nullifier, claimAmount]          |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Submits (Proof, Public Inputs)
                                                 v
+--------------------------------------------------------------------------------------------------+
|                            SMART CONTRACT (Settlement Engine on EVM)                             |
|  - Contract: ZKPInsuranceSettlement.sol                                                          |
|  - Verifier: Groth16 / BN254 Pairing Check                                                       |
|  - Replay Guard: nullifierRegistry[claimNullifier] == false                                     |
|  - State Update: marks nullifier as spent, emits ClaimSettled event, disburses escrow payout     |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Inspects public on-chain audit trail
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                      INSURER / AUDITOR                                           |
|  - Reconciles financial payouts with cryptographic guarantees                                    |
|  - ZERO access to patient's private diagnosis, clinical notes, or medical history                |
+--------------------------------------------------------------------------------------------------+
```

### 2. Privacy vs. Transparency Guarantees

| Data Attribute | On-Chain Status | Visibility | Privacy Mechanism |
| :--- | :--- | :--- | :--- |
| **Patient Diagnosis (ICD-10)** | Off-Chain | Private | Circom Private Witness (Never exposed) |
| **Procedure Details / Notes** | Off-Chain | Private | AES-256 Encrypted on IPFS |
| **Doctor Prescription List** | Off-Chain | Private | Zero-Knowledge Witness |
| **Approved Hospital Set** | On-Chain | Public | Merkle Root & Membership Proof |
| **Active Policy Status** | On-Chain | Public | Policy Commitment Hash |
| **Claim Amount** | On-Chain | Public | Public Input for Escrow Disbursement |
| **Claim Replay Nullifier** | On-Chain | Public | Hash-based Double-Spend Protection |
