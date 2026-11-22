// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

/**
 * @title MockGroth16Verifier
 * @notice Configurable mock verifier for testing Groth16 proofs and simulating failure modes
 */
contract MockGroth16Verifier is IVerifier {
    bool public shouldPass = true;
    address public owner;

    event VerifierToggled(bool newState);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setShouldPass(bool _shouldPass) external onlyOwner {
        shouldPass = _shouldPass;
        emit VerifierToggled(_shouldPass);
    }

    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[4] calldata
    ) external view override returns (bool r) {
        return shouldPass;
    }
}
