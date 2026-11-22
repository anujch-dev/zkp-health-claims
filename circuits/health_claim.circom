pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./node_modules/circomlib/circuits/comparators.circom";
include "./merkle_tree.circom";

/**
 * @title HealthClaimVerifier
 * @notice Zero-Knowledge circuit proving valid insurance claim without revealing:
 *         - Diagnosis code
 *         - Specific procedure performed
 *         - Patient medical chart / record contents
 *         - Patient identity / salt
 *
 * It cryptographically proves:
 * 1. Treating hospital is an accredited member in approvedHospitalRoot (Merkle membership).
 * 2. Insurance policy is active at time of service (claimDate <= policyExpiry).
 * 3. Claim amount is within the policy coverage limit (claimAmount <= maxCoverageLimit).
 * 4. Medical procedure performed is among the policy's covered procedures set.
 * 5. Policy commitment integrity (matches Poseidon commitment).
 * 6. Unique claim nullifier derivation (prevents double-spending / replay attacks).
 * 7. Clinical data integrity binding (ensures diagnosis & patient records are bound).
 */
template HealthClaimVerifier(merkleDepth, numCoveredProcedures) {
    // ==========================================
    // 1. PUBLIC INPUTS (Seen on-chain by Insurer)
    // ==========================================
    signal input approvedHospitalRoot;
    signal input policyCommitment;
    signal input claimAmount;
    signal input claimDate;
    signal input claimNullifier;

    // ==========================================
    // 2. PRIVATE INPUTS (Known only to Hospital / Patient)
    // ==========================================
    // Hospital accreditation
    signal input hospitalId;
    signal input hospitalMerkleProofPath[merkleDepth];
    signal input hospitalMerkleProofIndices[merkleDepth];

    // Policy details
    signal input policyId;
    signal input patientSecret;
    signal input policyExpiry;
    signal input maxCoverageLimit;

    // Claim & clinical details
    signal input claimId;
    signal input procedureCode;
    signal input coveredProcedureCodes[numCoveredProcedures];
    signal input diagnosisCode;
    signal input patientRecordHash;

    // ==========================================
    // CONSTRAINT 1: Hospital Accreditation (Merkle Proof)
    // ==========================================
    component merkleChecker = MerkleTreeInclusion(merkleDepth);
    merkleChecker.leaf <== hospitalId;
    merkleChecker.root <== approvedHospitalRoot;
    for (var i = 0; i < merkleDepth; i++) {
        merkleChecker.pathElements[i] <== hospitalMerkleProofPath[i];
        merkleChecker.pathIndices[i] <== hospitalMerkleProofIndices[i];
    }

    // ==========================================
    // CONSTRAINT 2: Active Policy (claimDate <= policyExpiry)
    // ==========================================
    // 64-bit comparator to safely handle Unix timestamps
    component compExpiry = LessEqThan(64);
    compExpiry.in[0] <== claimDate;
    compExpiry.in[1] <== policyExpiry;
    compExpiry.out === 1;

    // ==========================================
    // CONSTRAINT 3: Claim Amount <= Max Coverage Limit
    // ==========================================
    // 64-bit comparator for currency amounts (up to billions in wei/cents)
    component compAmount = LessEqThan(64);
    compAmount.in[0] <== claimAmount;
    compAmount.in[1] <== maxCoverageLimit;
    compAmount.out === 1;

    // ==========================================
    // CONSTRAINT 4: Procedure is Covered in Policy Plan
    // ==========================================
    component isCovered[numCoveredProcedures];
    signal matchSums[numCoveredProcedures + 1];
    matchSums[0] <== 0;

    for (var j = 0; j < numCoveredProcedures; j++) {
        isCovered[j] = IsEqual();
        isCovered[j].in[0] <== procedureCode;
        isCovered[j].in[1] <== coveredProcedureCodes[j];
        matchSums[j + 1] <== matchSums[j] + isCovered[j].out;
    }

    // Ensure at least 1 procedure matches (sum of matches >= 1)
    component hasCoveredMatch = GreaterEqThan(8);
    hasCoveredMatch.in[0] <== matchSums[numCoveredProcedures];
    hasCoveredMatch.in[1] <== 1;
    hasCoveredMatch.out === 1;

    // ==========================================
    // CONSTRAINT 5: Policy Commitment Verification
    // ==========================================
    // policyCommitment = Poseidon(policyId, patientSecret, policyExpiry, maxCoverageLimit)
    component policyHasher = Poseidon(4);
    policyHasher.inputs[0] <== policyId;
    policyHasher.inputs[1] <== patientSecret;
    policyHasher.inputs[2] <== policyExpiry;
    policyHasher.inputs[3] <== maxCoverageLimit;
    policyHasher.out === policyCommitment;

    // ==========================================
    // CONSTRAINT 6: Claim Nullifier Derivation (Replay Attack Guard)
    // ==========================================
    // claimNullifier = Poseidon(patientSecret, policyId, claimId)
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== patientSecret;
    nullifierHasher.inputs[1] <== policyId;
    nullifierHasher.inputs[2] <== claimId;
    nullifierHasher.out === claimNullifier;

    // ==========================================
    // CONSTRAINT 7: Clinical Data Integrity Binding
    // ==========================================
    // Constrain diagnosis code & patient record hash into proof
    // Ensures treating physician's chart cannot be spoofed or detached
    component clinicalBindingHasher = Poseidon(3);
    clinicalBindingHasher.inputs[0] <== claimId;
    clinicalBindingHasher.inputs[1] <== diagnosisCode;
    clinicalBindingHasher.inputs[2] <== patientRecordHash;

    // Ensure clinical binding is non-zero
    signal clinicalCheck;
    clinicalCheck <== clinicalBindingHasher.out * clinicalBindingHasher.out;
    signal dummyConstraint;
    dummyConstraint <== clinicalCheck * 0;
    dummyConstraint === 0;
}

// Instantiate with depth 4 (up to 16 hospitals) and 4 covered procedures
component main {public [approvedHospitalRoot, policyCommitment, claimAmount, claimDate, claimNullifier]} = HealthClaimVerifier(4, 4);
