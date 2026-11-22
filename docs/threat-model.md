# Threat Model & Security Analysis

## Scope: Privacy-Preserving Health Records & ZKP Insurance Claims (WEB3 · W3-01)

### 1. Adversary Model & Assumptions

We evaluate attacks originating from three distinct adversary classes:
1. **Malicious / Compromised Healthcare Providers**: May attempt to overbill, forge non-existent procedures, bill after policy expiration, or double-spend the same claim.
2. **Curious / Aggressive Insurers**: May attempt to inspect diagnosis codes, medication regimens, and patient records to discriminate or deny future policies.
3. **External Network Attackers / Front-Runners**: May eavesdrop on mempools, attempt to replay submitted proofs, or intercept hospital reimbursements.

---

### 2. Threat Vectors & Cryptographic Countermeasures

| Attack Vector | Threat Scenario | Layer | Cryptographic Countermeasure |
| :--- | :--- | :--- | :--- |
| **Replay & Double Spending** | Hospital or third party resubmits an already settled claim proof to receive duplicate payouts. | Smart Contract | **Nullifier Registry**: Each claim generates a deterministic `claimNullifier = Poseidon(policyCommitment, claimNonce, hospitalAddress)`. `ZKPInsuranceSettlement.sol` stores `nullifiers[claimNullifier] = true`. Re-submissions revert with `ClaimAlreadyNullified`. |
| **Tampered Calldata / Forgery** | Attacker alters public inputs (e.g. inflating claim amount from $2,500 to $50,000) without generating a new proof. | Groth16 Verifier | **BN254 Pairing Equation**: The EVM precompile checks $e(\pi_a, \pi_b) = e(\alpha, \beta) \cdot e(\pi_c, \delta) \cdot e(\sum x_i \cdot \gamma_i, \gamma)$. Any alteration of $x_i$ corrupts the pairing evaluation and immediately reverts with `InvalidProof()`. |
| **Unaccredited Clinic Fraud** | Unlicensed clinic attempts to generate claims against legitimate patient policies. | Circom Circuit | **Merkle Membership**: Prover must provide valid siblings proving inclusion in the accredited provider Merkle tree. Unlicensed leaves cannot construct valid constraint satisfaction. |
| **Diagnosis Surveillance** | Insurer attempts to harvest ICD-10 diagnosis codes or prescription lists. | Zero-Knowledge | **Zero-Knowledge Witness**: Clinical diagnosis and prescription details exist solely as private witnesses inside the hospital client. Zero bits of medical data are published on-chain. |
| **Expired Policy Fraud** | Provider bills for treatment received after the patient's coverage expiration date. | Circom Circuit | **R1CS Time Inequality**: `LessEqThan(64)` constraint enforces `claimTimestamp <= policyExpiryTimestamp`. If evaluated false, circuit generation aborts. |
| **Coverage Cap Exceeded** | Provider attempts to bill an amount greater than the policy's remaining coverage. | Circom Circuit | **R1CS Limit Inequality**: `LessEqThan(64)` constraint enforces `claimAmount <= policyMaxCoverage` and `claimAmount <= procedureLimit`. |
| **Unauthorized Record Snooping** | Doctor browses medical records of patients they do not actively treat. | Sovereign Access Registry | **`HealthAccessRegistry.sol`**: Doctor must hold active unexpired authorization granted by the patient. Only patient key holders can decrypt the off-chain IPFS payload. |

---

### 3. Proof Soundness & Completeness

- **Completeness**: If a hospital is in the accredited Merkle tree, the policy is unexpired, the procedure is covered, and the claim amount is within coverage limits, the hospital can always produce a valid Groth16 proof that passes `Groth16Verifier.verifyProof(...)`.
- **Soundness**: Under the computational hardness of the Discrete Logarithm problem on BN254 and knowledge-of-exponent assumptions, no polynomial-time adversary can produce an accepting proof without possessing a valid private witness satisfying all 1,960 constraints.
- **Zero-Knowledge**: The distribution of generated Groth16 proofs is computationally indistinguishable from simulated proofs, ensuring zero information leakage regarding private clinical witnesses.
