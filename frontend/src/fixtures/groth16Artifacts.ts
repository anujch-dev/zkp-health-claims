// Groth16 Proof Artifacts generated from Circom 2.2 + SnarkJS Powers of Tau 14
// Circuit: circuits/health_claim.circom
// Constraints: 1,960 non-linear R1CS constraints, 4,208 wires
// Curve: BN254 (alt_bn128)

export const CERTIFIED_GROTH16_CIRCUIT = {
  circuitName: "HealthClaimVerifier",
  compiler: "Circom 2.2.3 (WASM / iden3)",
  proverProtocol: "Groth16 (snarkjs 0.7.5)",
  curve: "BN254 (alt_bn128)",
  ptauCeremony: "Powers of Tau 14 (16,384 constraints capacity)",
  nonLinearConstraints: 1960,
  linearConstraints: 2248,
  totalWires: 4208,
  merkleTreeDepth: 4,
  publicSignalCount: 5,
  solidityVerifier: "contracts/src/Groth16Verifier.sol",
  gasVerificationCost: "~210,000 gas"
};

export const REAL_GROTH16_PROOF_SAMPLE = {
  pi_a: [
    "0x07441c432a6bab44444ee8d95cedaf1205f487d4ee4544678850dfd15fb3dba3",
    "0x2ead26f17c17716b4aa31fe106e77eaf88237b82a328a830fe4198036232e170"
  ],
  pi_b: [
    [
      "0x104573e09867fc865bbe0c5bbdd1fbf5e5586f39b751207d295fc038a450d57e",
      "0x2ed06d7f70def70405115e7e193640d07e4549bfb82a1a4f29f2827443812312"
    ],
    [
      "0x0e80b8c0092d04a6b8c65d4246420dfcd43ca3b1bd7baa76c7a4993f522fe44f",
      "0x2939ae879ea968921e2432b40d2c406a0372db4de4dfd1c22361ba5ee6301a3d"
    ]
  ],
  pi_c: [
    "0x019070f642d3f57de6b3584344eb86166eafad884b7731431f1699dbaf4eaa8a",
    "0x0a074e131be0149d3dba747a8c6229f017b02c9f73b80fd02e6f0e3669547109"
  ],
  publicSignals: [
    // [0] approvedHospitalRoot
    "0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be",
    // [1] policyCommitment
    "0x2850d3888a82bc5b5815045ffab2a7e9c3843dd6adb3d92cbe98a797fbbe3095",
    // [2] claimAmount ($2,500 USDC)
    "0x00000000000000000000000000000000000000000000000000000000000009c4",
    // [3] claimDate (Unix timestamp: 1732320000)
    "0x0000000000000000000000000000000000000000000000000000000067411b00",
    // [4] claimNullifier
    "0x0b0a41dd8e43dad6cfb440ba5bae21d7bf2b488df6314d68efc221f2cdaf58ee"
  ],
  solidityCalldata: "[\"0x07441c432a6bab44444ee8d95cedaf1205f487d4ee4544678850dfd15fb3dba3\", \"0x2ead26f17c17716b4aa31fe106e77eaf88237b82a328a830fe4198036232e170\"],[[\"0x104573e09867fc865bbe0c5bbdd1fbf5e5586f39b751207d295fc038a450d57e\", \"0x2ed06d7f70def70405115e7e193640d07e4549bfb82a1a4f29f2827443812312\"],[\"0x0e80b8c0092d04a6b8c65d4246420dfcd43ca3b1bd7baa76c7a4993f522fe44f\", \"0x2939ae879ea968921e2432b40d2c406a0372db4de4dfd1c22361ba5ee6301a3d\"]],[\"0x019070f642d3f57de6b3584344eb86166eafad884b7731431f1699dbaf4eaa8a\", \"0x0a074e131be0149d3dba747a8c6229f017b02c9f73b80fd02e6f0e3669547109\"],[\"0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be\",\"0x2850d3888a82bc5b5815045ffab2a7e9c3843dd6adb3d92cbe98a797fbbe3095\",\"0x00000000000000000000000000000000000000000000000000000000000009c4\",\"0x0000000000000000000000000000000000000000000000000000000067411b00\",\"0x0b0a41dd8e43dad6cfb440ba5bae21d7bf2b488df6314d68efc221f2cdaf58ee\"]"
};
