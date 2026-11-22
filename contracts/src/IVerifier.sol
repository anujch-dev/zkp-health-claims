// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Standard Groth16 Snark Verifier interface for BN254/alt_bn128 curve
 * @dev publicInputs order:
 *      [0]: hospitalMerkleRoot
 *      [1]: policyCommitment
 *      [2]: claimNullifier
 *      [3]: claimAmount
 */
interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata input
    ) external view returns (bool r);
}
