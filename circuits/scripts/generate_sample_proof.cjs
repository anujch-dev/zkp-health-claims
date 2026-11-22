const fs = require('fs');
const path = require('path');
const { buildPoseidon } = require('circomlibjs');
const snarkjs = require('snarkjs');

async function main() {
  console.log('--- Initializing Poseidon & Merkle Tree ---');
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // 1. Setup 16-leaf Merkle Tree (depth 4)
  const leaves = [
    1001n, // Hospital 0: Mayo Clinic (Licensed)
    1002n, // Hospital 1: Johns Hopkins (Licensed)
    1003n, // Hospital 2: Mass General (Licensed)
    1004n, // Hospital 3: Cleveland Clinic (Licensed)
  ];
  // Fill remaining 12 leaves with dummy IDs
  while (leaves.length < 16) {
    leaves.push(BigInt(2000 + leaves.length));
  }

  // Build binary Merkle tree
  const tree = [leaves];
  for (let level = 0; level < 4; level++) {
    const currentLevel = tree[level];
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];
      const h = poseidon([left, right]);
      nextLevel.push(BigInt(F.toString(h)));
    }
    tree.push(nextLevel);
  }

  const root = tree[4][0];
  console.log('Approved Hospital Merkle Root:', root.toString());

  // Hospital 0 (Mayo Clinic) proof
  const targetIndex = 0;
  const pathElements = [];
  const pathIndices = [];
  let idx = targetIndex;
  for (let level = 0; level < 4; level++) {
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    pathElements.push(tree[level][siblingIdx].toString());
    pathIndices.push(isRight ? 1 : 0);
    idx = Math.floor(idx / 2);
  }

  // 2. Policy & Claim Parameters
  const policyId = 8801n;
  const patientSecret = 987654321n;
  const policyExpiry = 1893456000n; // Year 2030
  const maxCoverageLimit = 15000n; // $15,000 max limit
  const coveredProcedures = [101n, 102n, 103n, 104n];

  // Compute Policy Commitment
  const policyCommitmentBig = BigInt(
    F.toString(poseidon([policyId, patientSecret, policyExpiry, maxCoverageLimit]))
  );

  // Claim details
  const claimId = 5501n;
  const claimDate = 1732320000n; // Current timestamp (Nov 2024 / Nov 2026)
  const claimAmount = 2500n; // $2,500 <= $15,000
  const procedureCode = 102n; // Covered: Appendectomy
  const diagnosisCode = 90210n; // Private ICD-10
  const patientRecordHash = 12345678901234567890n; // Private chart commitment

  // Compute Claim Nullifier
  const claimNullifierBig = BigInt(
    F.toString(poseidon([patientSecret, policyId, claimId]))
  );

  // 3. Assemble Circuit Input
  const circuitInput = {
    // Public inputs
    approvedHospitalRoot: root.toString(),
    policyCommitment: policyCommitmentBig.toString(),
    claimAmount: claimAmount.toString(),
    claimDate: claimDate.toString(),
    claimNullifier: claimNullifierBig.toString(),

    // Private inputs
    hospitalId: leaves[0].toString(),
    hospitalMerkleProofPath: pathElements,
    hospitalMerkleProofIndices: pathIndices,

    policyId: policyId.toString(),
    patientSecret: patientSecret.toString(),
    policyExpiry: policyExpiry.toString(),
    maxCoverageLimit: maxCoverageLimit.toString(),

    claimId: claimId.toString(),
    procedureCode: procedureCode.toString(),
    coveredProcedureCodes: coveredProcedures.map((p) => p.toString()),
    diagnosisCode: diagnosisCode.toString(),
    patientRecordHash: patientRecordHash.toString(),
  };

  const circuitsDir = path.resolve(__dirname, '..');
  const buildDir = path.join(circuitsDir, 'build');
  const wasmPath = path.join(buildDir, 'health_claim_js', 'health_claim.wasm');
  const zkeyPath = path.join(buildDir, 'circuit_final.zkey');
  const vkeyPath = path.join(buildDir, 'verification_key.json');

  fs.writeFileSync(
    path.join(buildDir, 'input.json'),
    JSON.stringify(circuitInput, null, 2)
  );
  console.log('✅ Generated circuits/build/input.json');

  // 4. Generate Groth16 Proof using snarkjs
  console.log('--- Generating Groth16 Proof via SnarkJS ---');
  const startTime = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmPath,
    zkeyPath
  );
  const elapsed = Date.now() - startTime;
  console.log(`✅ Proof generated in ${elapsed}ms!`);

  fs.writeFileSync(path.join(buildDir, 'proof.json'), JSON.stringify(proof, null, 2));
  fs.writeFileSync(
    path.join(buildDir, 'public.json'),
    JSON.stringify(publicSignals, null, 2)
  );

  // 5. Verify Proof
  console.log('--- Verifying Proof with Verification Key ---');
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
  const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  console.log('🔍 SnarkJS Local Verification Result:', isValid ? 'VALID' : 'INVALID');
  if (!isValid) throw new Error('Proof verification failed!');

  // 6. Generate Solidity Calldata
  const calldataStr = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  console.log('--- Solidity Calldata generated ---');
  fs.writeFileSync(path.join(buildDir, 'calldata.json'), JSON.stringify({ calldataStr }, null, 2));

  console.log('\n=============================================');
  console.log('ZKP HEALTH CLAIM PROOF COMPLETE!');
  console.log('Public Inputs:');
  console.log(' [0] approvedHospitalRoot:', publicSignals[0]);
  console.log(' [1] policyCommitment:   ', publicSignals[1]);
  console.log(' [2] claimAmount:        ', publicSignals[2]);
  console.log(' [3] claimDate:          ', publicSignals[3]);
  console.log(' [4] claimNullifier:     ', publicSignals[4]);
  console.log('=============================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
