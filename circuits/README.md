# Zero-Knowledge Proof (ZKP) Insurance Claims Circuits

This directory contains the production **Circom 2.2** circuit system and **SnarkJS Groth16** verification pipeline for the **Privacy-Preserving Health Records & ZKP Insurance Claims** system.

---

## 1. Circuit Architecture: `health_claim.circom`

The core circuit `HealthClaimVerifier(merkleDepth = 4, numCoveredProcedures = 4)` cryptographically proves that a medical insurance claim is eligible for immediate payment disbursement **without exposing sensitive medical data** on-chain or to the insurance company.

### Public Inputs (Seen on-chain by Insurer and Smart Contract):
1. `approvedHospitalRoot`: 32-byte Merkle root of licensed healthcare providers.
2. `policyCommitment`: Poseidon hash commitment of `(policyId, patientSecret, policyExpiry, maxCoverageLimit)`.
3. `claimAmount`: Payout amount claimed (USDC / wei).
4. `claimDate`: Unix timestamp of medical service.
5. `claimNullifier`: Deterministic nullifier `Poseidon(patientSecret, policyId, claimId)` preventing replay attacks.

### Private Inputs (Known only to Hospital / Patient):
1. `hospitalId`: Unique identifier / leaf of treating hospital.
2. `hospitalMerkleProofPath[4]`: Sibling node hashes in the 4-level provider tree.
3. `hospitalMerkleProofIndices[4]`: Direction indices (0: left, 1: right).
4. `policyId`: Policy identifier.
5. `patientSecret`: Sovereign blinding salt known only to patient.
6. `policyExpiry`: Timestamp when policy coverage expires.
7. `maxCoverageLimit`: Maximum claim payout allowed under policy.
8. `claimId`: Unique hospital invoice identifier.
9. `procedureCode`: Medical procedure performed (e.g. 102 for Appendectomy).
10. `coveredProcedureCodes[4]`: Covered procedure code set in this policy plan.
11. `diagnosisCode`: Confidential ICD-10 medical code (e.g. `90210`).
12. `patientRecordHash`: SHA-256 / Poseidon hash of encrypted medical chart.

---

## 2. Enforced Cryptographic Constraints:

1. **Hospital Accreditation**:
   Computes Poseidon Merkle root from `hospitalId` and path elements. Enforces that computed root equals `approvedHospitalRoot`.
2. **Active Policy Enforcement**:
   Enforces `claimDate <= policyExpiry` using a 64-bit comparator (`LessEqThan(64)`).
3. **Claim Amount Limit**:
   Enforces `claimAmount <= maxCoverageLimit` using a 64-bit comparator (`LessEqThan(64)`).
4. **Procedure Coverage Verification**:
   Checks whether `procedureCode` matches at least one entry in `coveredProcedureCodes[4]` without revealing which specific procedure was performed.
5. **Policy Commitment Integrity**:
   Enforces `policyCommitment === Poseidon(policyId, patientSecret, policyExpiry, maxCoverageLimit)`.
6. **Replay Protection (Nullifier Generation)**:
   Enforces `claimNullifier === Poseidon(patientSecret, policyId, claimId)`.
7. **Clinical Data Binding**:
   Binds `diagnosisCode` and `patientRecordHash` to the claim ID so the clinical chart cannot be detached or spoofed.

---

## 3. Circuit Statistics

- **Curve**: `BN254 (alt_bn128)` — EVM native with `ecPairing` precompile (0x08).
- **Template instances**: 223
- **Non-linear constraints**: 1,960
- **Linear constraints**: 2,234
- **Public inputs**: 5
- **Private inputs**: 21
- **Wires**: 4,208
- **Powers of Tau Ceremony**: $2^{14} = 16,384$ constraints (`pot14_final.ptau`)
- **Prover Speed**: ~1.7 seconds client-side.
- **On-chain Verification**: ~210,000 gas on Ethereum / EVM L2.

---

## 4. Pipeline Scripts

```bash
# 1. Compile Circom circuit to R1CS & WASM witness calculator
node ./node_modules/circom2/cli.js health_claim.circom --r1cs --wasm --sym -o ./build

# 2. Run Powers of Tau ceremony & export Solidity verifier
node scripts/setup_groth16.cjs

# 3. Generate sample proof and export Solidity calldata
node scripts/generate_sample_proof.cjs
```

---

## 5. Generated Artifacts

- `build/health_claim.r1cs`: Rank-1 Constraint System.
- `build/health_claim_js/health_claim.wasm`: WebAssembly witness generator.
- `build/circuit_final.zkey`: Final proving key with phase 2 contribution.
- `build/verification_key.json`: SnarkJS verification key JSON.
- `build/calldata.json`: EVM-ready calldata `[a, b, c, [publicSignals]]`.
- `contracts/src/Groth16Verifier.sol`: Generated EVM verifier contract implementing `IVerifier`.
