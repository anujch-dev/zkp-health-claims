// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Standard Groth16 Snark Verifier interface for BN254/alt_bn128 curve
 * @dev publicSignals order (matching circuits/health_claim.circom):
 *      [0]: approvedHospitalRoot
 *      [1]: policyCommitment
 *      [2]: claimAmount
 *      [3]: claimDate
 *      [4]: claimNullifier
 */
interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[5] calldata input
    ) external view returns (bool r);
}
