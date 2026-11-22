const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

describe("Slice 2 & 3: Decentralized Health Records & ZKP Insurance Claims", function () {
  let registry;
  let verifier;
  let settlement;

  let insurer;
  let patient;
  let doctor;
  let hospital;
  let attacker;

  const HOSPITAL_MERKLE_ROOT = "0x89e2cf9b9ad65646f9011933a39e76d05f322ea15d18d45e5eb4578bfa79fbc1";
  const POLICY_COMMITMENT = "0x7a3f89d0b6728341ef92d5c310467ae584920bcf241851239aa827b5f90241ec";
  const CLAIM_NULLIFIER_1 = "0x582194cbe4019a2b8e4f16928e34091aef591204891285091285012984019284";
  const CLAIM_NULLIFIER_2 = "0x981249cbe4019a2b8e4f16928e34091aef591204891285091285012984019284";
  const CLAIM_DATE = 1732320000;

  // Mock Groth16 proof points
  const DUMMY_PROOF_A = [1, 2];
  const DUMMY_PROOF_B = [[1, 2], [3, 4]];
  const DUMMY_PROOF_C = [5, 6];

  beforeEach(async function () {
    [insurer, patient, doctor, hospital, attacker] = await ethers.getSigners();

    // 1. Deploy HealthAccessRegistry
    const HealthAccessRegistry = await ethers.getContractFactory("HealthAccessRegistry");
    registry = await HealthAccessRegistry.deploy();
    await registry.waitForDeployment();

    // 2. Deploy MockGroth16Verifier
    const MockVerifier = await ethers.getContractFactory("MockGroth16Verifier");
    verifier = await MockVerifier.deploy();
    await verifier.waitForDeployment();

    // 3. Deploy ZKPInsuranceSettlement with initial 10 ETH liquidity
    const ZKPInsuranceSettlement = await ethers.getContractFactory("ZKPInsuranceSettlement");
    settlement = await ZKPInsuranceSettlement.deploy(
      await verifier.getAddress(),
      HOSPITAL_MERKLE_ROOT,
      { value: ethers.parseEther("10.0") }
    );
    await settlement.waitForDeployment();
  });

  describe("1. HealthAccessRegistry (Patient Privacy & Doctor Delegation)", function () {
    const recordId = ethers.id("rec-cardiology-001");
    const commitmentHash = ethers.id("commitment-cardio-secret-salt-882");
    const ipfsCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const category = "Diagnostic";

    it("should allow a patient to register an encrypted record commitment", async function () {
      const tx = await registry.connect(patient).registerRecord(recordId, commitmentHash, ipfsCid, category);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const record = await registry.connect(patient).getRecord(patient.address, recordId);
      expect(record.commitmentHash).to.equal(commitmentHash);
      expect(record.ipfsCid).to.equal(ipfsCid);
      expect(record.category).to.equal(category);

      const myRecords = await registry.connect(patient).getMyRecordIds();
      expect(myRecords.length).to.equal(1);
      expect(myRecords[0]).to.equal(recordId);
    });

    it("should reject registering duplicate record ID", async function () {
      await registry.connect(patient).registerRecord(recordId, commitmentHash, ipfsCid, category);

      let reverted = false;
      try {
        await registry.connect(patient).registerRecord(recordId, commitmentHash, ipfsCid, category);
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("RecordAlreadyExists");
      }
      expect(reverted).to.be.true;
    });

    it("should reject unauthorized doctor from reading patient record metadata", async function () {
      await registry.connect(patient).registerRecord(recordId, commitmentHash, ipfsCid, category);

      let reverted = false;
      try {
        await registry.connect(doctor).getRecord(patient.address, recordId);
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Unauthorized access to record metadata");
      }
      expect(reverted).to.be.true;
    });

    it("should allow patient to grant doctor access and permit reading", async function () {
      await registry.connect(patient).registerRecord(recordId, commitmentHash, ipfsCid, category);

      const oneDayInSeconds = 24 * 60 * 60;
      const tx = await registry.connect(patient).grantDoctorAccess(recordId, doctor.address, oneDayInSeconds);
      await tx.wait();

      expect(await registry.hasActiveAccess(patient.address, doctor.address, recordId)).to.be.true;

      const record = await registry.connect(doctor).getRecord(patient.address, recordId);
      expect(record.commitmentHash).to.equal(commitmentHash);
    });

    it("should allow patient to revoke doctor access", async function () {
      await registry.connect(patient).registerRecord(recordId, commitmentHash, ipfsCid, category);
      await registry.connect(patient).grantDoctorAccess(recordId, doctor.address, 3600);

      const tx = await registry.connect(patient).revokeDoctorAccess(recordId, doctor.address);
      await tx.wait();

      expect(await registry.hasActiveAccess(patient.address, doctor.address, recordId)).to.be.false;

      let reverted = false;
      try {
        await registry.connect(doctor).getRecord(patient.address, recordId);
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Unauthorized access to record metadata");
      }
      expect(reverted).to.be.true;
    });
  });

  describe("2. ZKPInsuranceSettlement (Proof Verification, Replay Guard & Payout)", function () {
    const claimAmount = ethers.parseEther("1.5"); // 1.5 ETH payout

    it("should settle a valid claim and disburse payout to hospital", async function () {
      const initialHospitalBalance = await ethers.provider.getBalance(hospital.address);
      const initialSettlementBalance = await ethers.provider.getBalance(await settlement.getAddress());

      const tx = await settlement.connect(hospital).submitAndSettleClaim(
        DUMMY_PROOF_A,
        DUMMY_PROOF_B,
        DUMMY_PROOF_C,
        HOSPITAL_MERKLE_ROOT,
        POLICY_COMMITMENT,
        CLAIM_NULLIFIER_1,
        claimAmount,
        CLAIM_DATE,
        hospital.address
      );
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Verify nullifier is marked as spent
      expect(await settlement.isClaimNullified(CLAIM_NULLIFIER_1)).to.be.true;

      // Verify escrow decreased
      const finalSettlementBalance = await ethers.provider.getBalance(await settlement.getAddress());
      expect(finalSettlementBalance).to.equal(initialSettlementBalance - claimAmount);

      // Verify hospital received payout (minus gas)
      const finalHospitalBalance = await ethers.provider.getBalance(hospital.address);
      expect(finalHospitalBalance > initialHospitalBalance).to.be.true;

      // Verify tracking
      expect(await settlement.totalSettledClaims()).to.equal(1n);
      expect(await settlement.totalSettledPayout()).to.equal(claimAmount);
    });

    it("REPLAY ATTACK GUARD: should revert when the same claim nullifier is re-submitted", async function () {
      // 1. First claim succeeds
      await settlement.connect(hospital).submitAndSettleClaim(
        DUMMY_PROOF_A,
        DUMMY_PROOF_B,
        DUMMY_PROOF_C,
        HOSPITAL_MERKLE_ROOT,
        POLICY_COMMITMENT,
        CLAIM_NULLIFIER_1,
        claimAmount,
        CLAIM_DATE,
        hospital.address
      );

      // 2. Attacker attempts to replay the exact same claim nullifier
      let reverted = false;
      try {
        await settlement.connect(attacker).submitAndSettleClaim(
          DUMMY_PROOF_A,
          DUMMY_PROOF_B,
          DUMMY_PROOF_C,
          HOSPITAL_MERKLE_ROOT,
          POLICY_COMMITMENT,
          CLAIM_NULLIFIER_1,
          claimAmount,
          CLAIM_DATE,
          attacker.address
        );
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("ClaimAlreadyNullified");
      }
      expect(reverted).to.be.true;
    });

    it("HOSPITAL ACCREDITATION GUARD: should revert if submitted Merkle root does not match approved root", async function () {
      const fakeRoot = ethers.id("unapproved-hospital-tree-root");

      let reverted = false;
      try {
        await settlement.connect(hospital).submitAndSettleClaim(
          DUMMY_PROOF_A,
          DUMMY_PROOF_B,
          DUMMY_PROOF_C,
          fakeRoot,
          POLICY_COMMITMENT,
          CLAIM_NULLIFIER_2,
          claimAmount,
          CLAIM_DATE,
          hospital.address
        );
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("InvalidHospitalMerkleRoot");
      }
      expect(reverted).to.be.true;
    });

    it("INVALID ZK PROOF GUARD: should revert if the Snark verifier rejects the proof", async function () {
      // Toggle mock verifier to reject proof
      await verifier.connect(insurer).setShouldPass(false);

      let reverted = false;
      try {
        await settlement.connect(hospital).submitAndSettleClaim(
          DUMMY_PROOF_A,
          DUMMY_PROOF_B,
          DUMMY_PROOF_C,
          HOSPITAL_MERKLE_ROOT,
          POLICY_COMMITMENT,
          CLAIM_NULLIFIER_2,
          claimAmount,
          CLAIM_DATE,
          hospital.address
        );
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("InvalidZKProof");
      }
      expect(reverted).to.be.true;
    });

    it("INSUFFICIENT ESCROW GUARD: should revert if claim amount exceeds contract liquidity", async function () {
      const excessiveAmount = ethers.parseEther("50.0"); // Escrow only has 10 ETH

      let reverted = false;
      try {
        await settlement.connect(hospital).submitAndSettleClaim(
          DUMMY_PROOF_A,
          DUMMY_PROOF_B,
          DUMMY_PROOF_C,
          HOSPITAL_MERKLE_ROOT,
          POLICY_COMMITMENT,
          CLAIM_NULLIFIER_2,
          excessiveAmount,
          CLAIM_DATE,
          hospital.address
        );
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("InsufficientEscrowBalance");
      }
      expect(reverted).to.be.true;
    });

    it("ESCROW MANAGEMENT: insurer can fund and withdraw liquidity", async function () {
      const depositAmount = ethers.parseEther("5.0");
      const txFund = await settlement.connect(insurer).fundEscrow({ value: depositAmount });
      await txFund.wait();

      const withdrawAmount = ethers.parseEther("2.0");
      const txWithdraw = await settlement.connect(insurer).withdrawEscrow(withdrawAmount);
      await txWithdraw.wait();

      // Non-insurer cannot withdraw
      let reverted = false;
      try {
        await settlement.connect(attacker).withdrawEscrow(withdrawAmount);
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("OnlyInsurer");
      }
      expect(reverted).to.be.true;
    });
  });

  describe("3. Real Circom Groth16 Verifier On-Chain", function () {
    it("should deploy Groth16Verifier.sol and verify a real Circom snarkjs proof on-chain", async function () {
      let calldataPath = path.resolve(__dirname, "..", "..", "circuits", "build", "calldata.json");
      if (!fs.existsSync(calldataPath)) {
        calldataPath = path.resolve(__dirname, "..", "..", "circuits", "fixtures", "sample_calldata.json");
      }
      if (!fs.existsSync(calldataPath)) {
        this.skip();
        return;
      }

      const { calldataStr } = JSON.parse(fs.readFileSync(calldataPath, "utf8"));
      const parsedArgs = JSON.parse(`[${calldataStr}]`);
      const [a, b, c, pubSignals] = parsedArgs;

      // Deploy real Groth16Verifier exported by snarkjs from health_claim.circom
      const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
      const realVerifier = await Groth16Verifier.deploy();
      await realVerifier.waitForDeployment();

      // Verify directly on the real verifier contract
      const verified = await realVerifier.verifyProof(a, b, c, pubSignals);
      expect(verified).to.be.true;

      // Deploy settlement contract with real Groth16Verifier
      const hospitalMerkleRootHex = pubSignals[0];
      const policyCommitmentHex = pubSignals[1];
      const claimAmount = BigInt(pubSignals[2]);
      const claimDate = BigInt(pubSignals[3]);
      const claimNullifierHex = pubSignals[4];

      const RealSettlement = await ethers.getContractFactory("ZKPInsuranceSettlement");
      const realSettlement = await RealSettlement.deploy(
        await realVerifier.getAddress(),
        hospitalMerkleRootHex,
        { value: ethers.parseEther("10.0") }
      );
      await realSettlement.waitForDeployment();

      // Settle claim on-chain with the real zero-knowledge proof!
      const initialHospitalBal = await ethers.provider.getBalance(hospital.address);
      const tx = await realSettlement.connect(hospital).submitAndSettleClaim(
        a,
        b,
        c,
        hospitalMerkleRootHex,
        policyCommitmentHex,
        claimNullifierHex,
        claimAmount,
        claimDate,
        hospital.address
      );
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Verify nullifier is marked as spent on-chain
      expect(await realSettlement.isClaimNullified(claimNullifierHex)).to.be.true;
      expect(await realSettlement.totalSettledClaims()).to.equal(1n);
      expect(await realSettlement.totalSettledPayout()).to.equal(claimAmount);
    });
  });
});
