# Decentralized Architecture: Privacy-Preserving Health Records & ZKP Insurance Claims

## Track: WEB3 · W3-01

### 1. High-Level System Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    PATIENT (Data Sovereign)                                      |
|  - AES-256 encrypted records stored on decentralized storage (IPFS)                              |
|  - On-chain commitment: SHA-256 / Poseidon hash stored on HealthAccessRegistry.sol              |
|  - Issues cryptographic re-encryption keys to licensed doctors                                  |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Grants access to licensed doctor
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                  HOSPITAL / CLINIC (Prover)                                      |
|  - Consults patient, diagnoses condition, performs medical procedure                            |
|  - Client-side Zero-Knowledge Prover (Circom 2.2 / Groth16 on BN254):                            |
|      * Private Inputs: Diagnosis (ICD-10), doctor notes, prescriptions, patient salt, etc.       |
|      * Constraints Proven:                                                                       |
|          1. Hospital wallet is accredited in approved Merkle tree (depth 4 Poseidon tree)        |
|          2. Policy is active (claimTimestamp <= policyExpiryTimestamp)                           |
|          3. Procedure is in covered set & claim amount <= policy and procedure limits           |
|          4. Nullifier = Poseidon(policyCommitment, claimNonce, hospitalAddress)                 |
|      * 5 Public Signals Output:                                                                  |
|          [0] approvedHospitalRoot                                                                |
|          [1] policyCommitment                                                                    |
|          [2] claimAmount (USDC)                                                                  |
|          [3] claimDate (Unix timestamp)                                                          |
|          [4] claimNullifier (Replay attack guard)                                                |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Submits (Proof: pi_a, pi_b, pi_c, 5 Public Signals)
                                                 v
+--------------------------------------------------------------------------------------------------+
|                            SMART CONTRACT (Settlement Engine on EVM)                             |
|  - Contract: ZKPInsuranceSettlement.sol & Groth16Verifier.sol                                    |
|  - Verifier: Groth16 / BN254 Bilinear Pairing Check (~210,000 gas)                              |
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

---

### 2. Zero-Knowledge Circuit Specification (`circuits/health_claim.circom`)

| Metric | Specification |
| :--- | :--- |
| **Circuit Name** | `HealthClaimVerifier` |
| **ZKP Scheme** | Groth16 (snarkjs 0.7.5) |
| **Elliptic Curve** | BN254 / alt_bn128 (Ethereum Native Precompile `0x08`) |
| **Ceremony** | Powers of Tau 14 ($2^{14} = 16,384$ constraints capacity) |
| **Non-Linear Constraints** | 1,960 |
| **Linear Constraints** | 2,248 |
| **Total Wires** | 4,208 |
| **Merkle Tree Depth** | 4 levels (Supports up to 16 licensed hospital leaves) |
| **Public Inputs Count** | 5 Signals |
| **Proving Time (Client)** | ~1.5 - 2.0 seconds in WebAssembly/Node.js |
| **Verifier EVM Gas Cost** | ~210,000 gas |

---

### 3. Public Signals vs. Private Inputs Breakdown

The zero-knowledge circuit enforces complete cryptographic partition between what the insurer needs to verify financially and what remains sovereign medical secrets:

#### Public Signals (On-Chain / Visible to Insurer)
1. **`approvedHospitalRoot`** (`bytes32` / `uint256`): Root of the Merkle tree of accredited medical providers licensed by the regulatory/insurer consortium.
2. **`policyCommitment`** (`bytes32` / `uint256`): Cryptographic commitment of the patient's insurance policy, binding patient identity, expiry, and max coverage.
3. **`claimAmount`** (`uint256`): The exact monetary amount in USDC requested for settlement.
4. **`claimDate`** (`uint256`): The Unix timestamp of the medical encounter.
5. **`claimNullifier`** (`bytes32` / `uint256`): A deterministic nullifier hash derived from policy commitment, hospital address, and claim nonce to prevent replay attacks.

#### Private Inputs (Never Exposed On-Chain or to Insurer)
- **`diagnosisCode`**: ICD-10 medical diagnostic code (e.g., `G43.909 - Intractable migraine with aura`).
- **`diagnosisDescription`**: Clinical notes and physician findings.
- **`prescriptions`**: Drug names, dosages, and regimen details.
- **`patientSecret`**: Secret salt owned by patient blinding the policy commitment.
- **`hospitalLicense`**: Provider license string hashed into Merkle leaf.
- **`hospitalMerkleProof` & `hospitalMerkleIndex`**: Path elements proving tree membership.
- **`procedureAllowedMax`**: Maximum reimbursement tier for the specific procedure.

---

### 4. Smart Contract Architecture

The on-chain architecture is divided into three modular Solidity contracts:

1. **`HealthAccessRegistry.sol`**:
   - Sovereign patient record registry.
   - Anchors SHA-256 / Poseidon commitments of off-chain IPFS encrypted medical records.
   - Provides granular delegation methods (`grantDoctorAccess`, `revokeDoctorAccess`, `isDoctorAuthorized`).
2. **`Groth16Verifier.sol`**:
   - Autogenerated BN254 EVM pairing verifier compiled from the SnarkJS setup.
   - Evaluates the Groth16 pairing equation:
     $$e(\pi_a, \pi_b) = e(\alpha, \beta) \cdot e(\pi_c, \delta) \cdot e(\sum x_i \cdot \gamma_i, \gamma)$$
3. **`ZKPInsuranceSettlement.sol`**:
   - Holds escrow funds deposited by insurers.
   - Validates that `approvedHospitalRoot` matches the accredited root.
   - Verifies the Groth16 proof using the verifier contract.
   - Enforces the nullifier replay protection registry: `mapping(bytes32 => bool) public nullifiers`.
   - Disburses payment instantly to the hospital's wallet.
