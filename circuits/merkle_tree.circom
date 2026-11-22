pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./node_modules/circomlib/circuits/comparators.circom";

// Merkle Tree inclusion checker for binary Merkle tree
template MerkleTreeInclusion(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal current[levels + 1];
    current[0] <== leaf;

    component hashers[levels];

    for (var i = 0; i < levels; i++) {
        // pathIndices[i] must be 0 or 1
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        hashers[i] = Poseidon(2);

        // If pathIndices[i] == 0: left = current[i], right = pathElements[i]
        // If pathIndices[i] == 1: left = pathElements[i], right = current[i]
        hashers[i].inputs[0] <== current[i] + pathIndices[i] * (pathElements[i] - current[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (current[i] - pathElements[i]);

        current[i + 1] <== hashers[i].out;
    }

    // Enforce computed root equals the public root
    root === current[levels];
}
