# Threat Model & Security Analysis

## Scope: Decentralized Health Records & ZKP Insurance Claims

### 1. Threat Vectors & Countermeasures

#### Attack 1: Replay & Double-Claim Submission
- **Vector**: A malicious actor or hospital re-submits a previously approved valid proof to claim multiple payouts.
- **Countermeasure**: The ZK circuit computes a deterministic `claimNullifier = Hash(policyCommitment, claimNonce, hospitalAddress, claimDate)`. The smart contract maintains a mapping `mapping(bytes32 => bool) public nullifiers`. If `nullifiers[claimNullifier] == true`, transaction immediately reverts with `ClaimAlreadyNullified`.

#### Attack 2: Non-Accredited Provider / Fake Clinic Fraud
- **Vector**: An unverified clinic submits claims under a valid patient policy.
- **Countermeasure**: Hospital credentials must satisfy Merkle tree membership against the insurer's registered `hospitalMerkleRoot`. Any leaf not present in the accredited tree cannot generate a valid Snark proof.

#### Attack 3: Medical Record / Diagnosis Eavesdropping by Insurers
- **Vector**: Insurers use claim submission to profile patients, deny future coverage, or sell health data.
- **Countermeasure**: The clinical diagnosis code (e.g. ICD-10 `G43.909`), examination findings, and prescription list are supplied exclusively as private witnesses to the prover. The zero-knowledge property ensures no information about the private inputs is leaked beyond the boolean truth of the constraints.

#### Attack 4: Expired Policy or Coverage Limit Exceeded
- **Vector**: A hospital attempts to claim reimbursement for a procedure occurring after policy termination or exceeding allowable coverage caps.
- **Countermeasure**: R1CS constraints enforce:
  1. `claimTimestamp <= policyExpiryTimestamp`
  2. `claimAmount <= policyMaxCoverage`
  3. `claimAmount <= procedureAllowedLimit`
  If any condition fails, the prover cannot compute valid proof points `(pi_a, pi_b, pi_c)`.
