const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Deploying ZK-HealthClaims Smart Contracts ===");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy HealthAccessRegistry
  console.log("\n1. Deploying HealthAccessRegistry...");
  const HealthAccessRegistry = await hre.ethers.getContractFactory("HealthAccessRegistry");
  const registry = await HealthAccessRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✓ HealthAccessRegistry deployed at:", registryAddress);

  // 2. Deploy MockGroth16Verifier
  console.log("\n2. Deploying MockGroth16Verifier...");
  const MockGroth16Verifier = await hre.ethers.getContractFactory("MockGroth16Verifier");
  const verifier = await MockGroth16Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✓ MockGroth16Verifier deployed at:", verifierAddress);

  // 3. Deploy ZKPInsuranceSettlement
  // Approved Hospital Merkle Root (4-leaf tree: Apex, St. Jude, Mayo, Stanford)
  const HOSPITAL_MERKLE_ROOT = "0x89e2cf9b9ad65646f9011933a39e76d05f322ea15d18d45e5eb4578bfa79fbc1";
  const initialLiquidity = hre.ethers.parseEther("10.0"); // 10 ETH liquidity escrow

  console.log("\n3. Deploying ZKPInsuranceSettlement with initial 10 ETH escrow...");
  const ZKPInsuranceSettlement = await hre.ethers.getContractFactory("ZKPInsuranceSettlement");
  const settlement = await ZKPInsuranceSettlement.deploy(
    verifierAddress,
    HOSPITAL_MERKLE_ROOT,
    { value: initialLiquidity }
  );
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("✓ ZKPInsuranceSettlement deployed at:", settlementAddress);
  console.log("  Approved Merkle Root:", HOSPITAL_MERKLE_ROOT);
  console.log("  Escrow Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(settlementAddress)), "ETH");

  // 4. Export deployment addresses to JSON file
  const deploymentData = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    contracts: {
      HealthAccessRegistry: registryAddress,
      MockGroth16Verifier: verifierAddress,
      ZKPInsuranceSettlement: settlementAddress
    },
    approvedHospitalMerkleRoot: HOSPITAL_MERKLE_ROOT
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("\n✓ Deployment details exported to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
