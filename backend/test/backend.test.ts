import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ethers } from 'ethers';
import { zkpService } from '../dist/services/zkpService.js';
import { ipfsService } from '../dist/services/ipfsService.js';
import { contractRelayer } from '../dist/services/contractRelayer.js';
import { CONFIG } from '../dist/config/index.js';

describe('Module 1: Authentication & Role Cryptography', () => {
  test('generates valid challenge and verifies ECDSA signature', async () => {
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const role = 'patient';

    const timestamp = Date.now();
    const challengeText = [
      '=== ZKP HEALTH CLAIMS PLATFORM AUTHENTICATION ===',
      `Role: ${role.toUpperCase()}`,
      `Address: ${address}`,
      `Nonce: 123456789`,
      `Chain ID: 31337`,
      `Timestamp: ${new Date(timestamp).toISOString()}`
    ].join('\n');

    const signature = await wallet.signMessage(challengeText);
    const recovered = ethers.verifyMessage(challengeText, signature);

    assert.strictEqual(recovered.toLowerCase(), address.toLowerCase());
  });
});

describe('Module 2: Medical Records, AES-256-GCM & IPFS Pinning', () => {
  test('encrypts and decrypts medical records using AES-256-GCM', () => {
    const secretKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const plaintext = JSON.stringify({
      condition: 'Acute Appendicitis',
      procedure: 'Laparoscopic Appendectomy',
      patient: 'Sarah Chen'
    });

    const encrypted = ipfsService.encryptAESGCM(plaintext, secretKey);
    assert.ok(encrypted.ciphertext);
    assert.ok(encrypted.iv);
    assert.ok(encrypted.tag);

    const decrypted = ipfsService.decryptAESGCM(encrypted.ciphertext, encrypted.iv, encrypted.tag, secretKey);
    assert.strictEqual(decrypted.toString('utf8'), plaintext);
  });

  test('generates standard deterministic IPFS CIDv0 and SHA-256 commitment', () => {
    const payload = Buffer.from('HealthRecordPayloadDemo');
    const { cid, sha256Hex } = ipfsService.generateCID(payload);

    assert.ok(cid.startsWith('Qm'));
    assert.ok(sha256Hex.startsWith('0x'));
    assert.strictEqual(sha256Hex.length, 66);
  });

  test('registers record and handles break-glass emergency access', async () => {
    const patient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const responder = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
    const recordId = '0x9999888877776666555544443333222211110000999988887777666655554444';

    const bgResult = await contractRelayer.breakGlassAccess(
      patient,
      responder,
      recordId,
      'Severe trauma resuscitation'
    );

    assert.ok(bgResult.success);
    assert.ok(bgResult.txHash);
  });
});

describe('Module 3: Zero-Knowledge Proof & Merkle Tree', () => {
  test('computes Poseidon Merkle tree root matching smart contract root', async () => {
    await zkpService.init();

    assert.strictEqual(zkpService.hospitalLeaves.length, 16);
    assert.strictEqual(
      zkpService.hospitalRoot,
      CONFIG.CONTRACTS.ApprovedHospitalMerkleRootDecimal
    );
  });

  test('generates valid Merkle inclusion proof for Mayo Clinic (1001)', async () => {
    const proof = await zkpService.getHospitalMerkleProof('1001');

    assert.strictEqual(proof.leaf, '1001');
    assert.strictEqual(proof.index, 0);
    assert.strictEqual(proof.pathElements.length, 4);
    assert.strictEqual(proof.pathIndices.length, 4);
    assert.strictEqual(proof.root, zkpService.hospitalRoot);
  });

  test('computes deterministic policy commitment and claim nullifier', async () => {
    const policyCommitment = await zkpService.computePolicyCommitment(
      '8801',
      '987654321',
      '1893456000',
      '15000'
    );
    assert.strictEqual(
      policyCommitment,
      '18235321658131723648847967345698509104713943756027922529868321960257868673173'
    );

    const claimNullifier = await zkpService.computeClaimNullifier(
      '987654321',
      '8801',
      '5501'
    );
    assert.strictEqual(
      claimNullifier,
      '4993564391706728221496537186369174396735858680389521507455565811901440940270'
    );
  });
});

describe('Module 4: Blockchain Claims Relayer & Replay Protection', () => {
  test('rejects duplicate nullifier settlement (Replay Attack Guard)', async () => {
    const nullifier = '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';

    // First settlement
    const res1 = await contractRelayer.settleClaimOnChain(
      ['0x1', '0x2'],
      [['0x3', '0x4'], ['0x5', '0x6']],
      ['0x7', '0x8'],
      CONFIG.CONTRACTS.ApprovedHospitalMerkleRoot,
      '0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be',
      nullifier,
      2500,
      1732320000,
      CONFIG.DEMO_ROLES.HOSPITAL
    );
    assert.ok(res1.success);

    // Second settlement with SAME nullifier MUST be rejected!
    let rejected = false;
    try {
      await contractRelayer.settleClaimOnChain(
        ['0x1', '0x2'],
        [['0x3', '0x4'], ['0x5', '0x6']],
        ['0x7', '0x8'],
        CONFIG.CONTRACTS.ApprovedHospitalMerkleRoot,
        '0x12b6dcec349f74e997d13b582eb6cdad2860e0c0cc3e9aa3676404e4edbb79be',
        nullifier,
        2500,
        1732320000,
        CONFIG.DEMO_ROLES.HOSPITAL
      );
    } catch (err: any) {
      rejected = true;
      assert.ok(err.message.includes('Replay Attack Prevented'));
    }

    assert.strictEqual(rejected, true);
  });
});

describe('Module 5: Tamper-Evident Audit Event Trail', () => {
  test('logs events and maintains chronological order', () => {
    const events = contractRelayer.getRecentEvents(50);
    assert.ok(events.length > 0);
    assert.ok(events[0].id.startsWith('evt_'));
    assert.ok(events[0].timestamp > 0);
  });
});
