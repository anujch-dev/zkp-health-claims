const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const circuitsDir = path.resolve(__dirname, '..');
const buildDir = path.join(circuitsDir, 'build');
const snarkjsCli = path.join(circuitsDir, 'node_modules', 'snarkjs', 'cli.js');

function runSnarkjs(args) {
  const cmd = `node "${snarkjsCli}" ${args}`;
  console.log(`> snarkjs ${args}`);
  execSync(cmd, { stdio: 'inherit', cwd: circuitsDir });
}

console.log('--- Step 1: Starting Powers of Tau 14 (2^14 = 16,384 constraints) ---');
const pot14_0 = path.join(buildDir, 'pot14_0000.ptau');
const pot14_1 = path.join(buildDir, 'pot14_0001.ptau');
const pot14_final = path.join(buildDir, 'pot14_final.ptau');
const r1csPath = path.join(buildDir, 'health_claim.r1cs');
const zkey0 = path.join(buildDir, 'circuit_0000.zkey');
const zkeyFinal = path.join(buildDir, 'circuit_final.zkey');
const vkeyPath = path.join(buildDir, 'verification_key.json');
const verifierSolPath = path.resolve(circuitsDir, '..', 'contracts', 'src', 'Groth16Verifier.sol');

if (!fs.existsSync(pot14_final)) {
  runSnarkjs(`powersoftau new bn128 14 "${pot14_0}"`);
  console.log('--- Step 2: Contributing to Powers of Tau ---');
  runSnarkjs(`powersoftau contribute "${pot14_0}" "${pot14_1}" --name="ZKP Health Claims Setup" -e="entropy-salt-proof-hackasol-2026"`);
  console.log('--- Step 3: Preparing Phase 2 ---');
  runSnarkjs(`powersoftau prepare phase2 "${pot14_1}" "${pot14_final}"`);
} else {
  console.log('pot14_final.ptau already exists, skipping Phase 1.');
}

console.log('--- Step 4: Groth16 Setup for health_claim.r1cs ---');
runSnarkjs(`groth16 setup "${r1csPath}" "${pot14_final}" "${zkey0}"`);

console.log('--- Step 5: Contributing to zKey ---');
runSnarkjs(`zkey contribute "${zkey0}" "${zkeyFinal}" --name="Deployer 1" -e="deployer-entropy-health-zkp"`);

console.log('--- Step 6: Exporting Verification Key JSON ---');
runSnarkjs(`zkey export verificationkey "${zkeyFinal}" "${vkeyPath}"`);

console.log('--- Step 7: Exporting Solidity Verifier Contract ---');
runSnarkjs(`zkey export solidityverifier "${zkeyFinal}" "${verifierSolPath}"`);

console.log('✅ Groth16 setup complete! Solidity verifier exported to:', verifierSolPath);
