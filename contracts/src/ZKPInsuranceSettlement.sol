// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

/**
 * @title ZKPInsuranceSettlement
 * @notice Automated Zero-Knowledge health claims settlement with on-chain Groth16 verification,
 *         hospital Merkle root enforcement, and nullifier-based replay attack protection.
 */
contract ZKPInsuranceSettlement {
    address public insurer;
    IVerifier public verifier;
    bytes32 public approvedHospitalMerkleRoot;

    // Replay Protection: Tracks spent claim nullifiers
    mapping(bytes32 => bool) public isNullified;

    struct ClaimRecord {
        bytes32 claimNullifier;
        bytes32 policyCommitment;
        address hospital;
        uint256 claimAmount;
        uint256 settledAt;
        bool settled;
    }

    mapping(bytes32 => ClaimRecord) public settledClaims;
    uint256 public totalSettledClaims;
    uint256 public totalSettledPayout;

    // Events
    event EscrowFunded(address indexed funder, uint256 amount);
    event EscrowWithdrawn(address indexed insurer, uint256 amount);
    event HospitalMerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event ClaimSettled(
        bytes32 indexed claimNullifier,
        bytes32 indexed policyCommitment,
        address indexed hospital,
        uint256 claimAmount,
        uint256 timestamp
    );

    // Custom Errors
    error OnlyInsurer();
    error ClaimAlreadyNullified(bytes32 nullifier);
    error InvalidHospitalMerkleRoot(bytes32 submittedRoot, bytes32 approvedRoot);
    error InvalidRecipient();
    error InsufficientEscrowBalance(uint256 currentBalance, uint256 requiredAmount);
    error InvalidZKProof();
    error PayoutTransferFailed();

    modifier onlyInsurer() {
        if (msg.sender != insurer) revert OnlyInsurer();
        _;
    }

    /**
     * @param _verifier Address of the deployed Groth16 / Circom verifier
     * @param _approvedHospitalMerkleRoot Initial Merkle root of accredited healthcare providers
     */
    constructor(address _verifier, bytes32 _approvedHospitalMerkleRoot) payable {
        insurer = msg.sender;
        verifier = IVerifier(_verifier);
        approvedHospitalMerkleRoot = _approvedHospitalMerkleRoot;

        if (msg.value > 0) {
            emit EscrowFunded(msg.sender, msg.value);
        }
    }

    /**
     * @notice Allows insurer to fund the claim settlement liquidity escrow
     */
    function fundEscrow() external payable {
        require(msg.value > 0, "Zero deposit");
        emit EscrowFunded(msg.sender, msg.value);
    }

    /**
     * @notice Allows insurer to withdraw available liquidity
     */
    function withdrawEscrow(uint256 amount) external onlyInsurer {
        if (address(this).balance < amount) revert InsufficientEscrowBalance(address(this).balance, amount);
        (bool success, ) = insurer.call{value: amount}("");
        if (!success) revert PayoutTransferFailed();
        emit EscrowWithdrawn(insurer, amount);
    }

    /**
     * @notice Updates the accredited hospital Merkle root
     */
    function updateHospitalMerkleRoot(bytes32 newRoot) external onlyInsurer {
        bytes32 old = approvedHospitalMerkleRoot;
        approvedHospitalMerkleRoot = newRoot;
        emit HospitalMerkleRootUpdated(old, newRoot);
    }

    /**
     * @notice Updates the Groth16 verifier contract
     */
    function updateVerifier(address newVerifier) external onlyInsurer {
        address old = address(verifier);
        verifier = IVerifier(newVerifier);
        emit VerifierUpdated(old, newVerifier);
    }

    /**
     * @notice Verifies a zero-knowledge claim proof and executes immediate settlement
     * @dev Private clinical inputs (diagnosis, prescriptions, doctor notes) are completely hidden.
     *      Only public inputs [merkleRoot, policyCommitment, claimAmount, claimDate, claimNullifier] are evaluated.
     * @param a Groth16 proof point pi_a
     * @param b Groth16 proof point pi_b
     * @param c Groth16 proof point pi_c
     * @param hospitalMerkleRoot Merkle root proven inside circuit
     * @param policyCommitment Cryptographic commitment to the policy
     * @param claimNullifier Unique deterministic nullifier Hash(patientSecret, policyId, claimId)
     * @param claimAmount Claim reimbursement amount to disburse
     * @param claimDate Service timestamp
     * @param hospitalRecipient Address of the accredited hospital receiving payout
     */
    function submitAndSettleClaim(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        bytes32 hospitalMerkleRoot,
        bytes32 policyCommitment,
        bytes32 claimNullifier,
        uint256 claimAmount,
        uint256 claimDate,
        address payable hospitalRecipient
    ) external returns (bool) {
        // 1. Replay Protection: Ensure nullifier hasn't been used before
        if (isNullified[claimNullifier]) {
            revert ClaimAlreadyNullified(claimNullifier);
        }

        // 2. Hospital Accreditation Check: Merkle root must match active approved root
        if (hospitalMerkleRoot != approvedHospitalMerkleRoot) {
            revert InvalidHospitalMerkleRoot(hospitalMerkleRoot, approvedHospitalMerkleRoot);
        }

        // 3. Recipient sanity check
        if (hospitalRecipient == address(0)) {
            revert InvalidRecipient();
        }

        // 4. Escrow liquidity check
        if (address(this).balance < claimAmount) {
            revert InsufficientEscrowBalance(address(this).balance, claimAmount);
        }

        // 5. Verify Groth16 Zero-Knowledge Proof (BN254 curve)
        // Public signals order matching circuits/health_claim.circom:
        // [0] approvedHospitalRoot
        // [1] policyCommitment
        // [2] claimAmount
        // [3] claimDate
        // [4] claimNullifier
        uint256[5] memory publicSignals = [
            uint256(hospitalMerkleRoot),
            uint256(policyCommitment),
            claimAmount,
            claimDate,
            uint256(claimNullifier)
        ];

        bool isValidProof = verifier.verifyProof(a, b, c, publicSignals);
        if (!isValidProof) {
            revert InvalidZKProof();
        }

        // 6. Nullify to prevent replay
        isNullified[claimNullifier] = true;

        // 7. Record claim details
        settledClaims[claimNullifier] = ClaimRecord({
            claimNullifier: claimNullifier,
            policyCommitment: policyCommitment,
            hospital: hospitalRecipient,
            claimAmount: claimAmount,
            settledAt: block.timestamp,
            settled: true
        });

        totalSettledClaims += 1;
        totalSettledPayout += claimAmount;

        // 8. Execute automated payout
        (bool sent, ) = hospitalRecipient.call{value: claimAmount}("");
        if (!sent) {
            revert PayoutTransferFailed();
        }

        emit ClaimSettled(
            claimNullifier,
            policyCommitment,
            hospitalRecipient,
            claimAmount,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Helper to check if a claim nullifier has been used
     */
    function isClaimNullified(bytes32 nullifier) external view returns (bool) {
        return isNullified[nullifier];
    }

    receive() external payable {
        emit EscrowFunded(msg.sender, msg.value);
    }
}
