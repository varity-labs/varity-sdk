import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for Varity Generic Template smart contract suite
 *
 * This script deploys:
 * 1. Infrastructure contracts (AccessControlRegistry, DataProofRegistry, VarityWalletFactory, SimplifiedPaymaster)
 * 2. GenericTemplate contract configured for specific industry
 *
 * Usage:
 *   npx hardhat run scripts/deploy-generic-template.ts --network arbitrumSepolia
 *
 * Environment variables required:
 *   - PRIVATE_KEY: Deployer private key
 *   - ARBITRUM_SEPOLIA_RPC_URL: RPC endpoint
 */

interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  deploymentTimestamp: number;
  contracts: {
    accessControlRegistry: {
      proxy: string;
      implementation: string;
    };
    dataProofRegistry: {
      proxy: string;
      implementation: string;
    };
    walletFactory: {
      proxy: string;
      implementation: string;
    };
    paymaster: {
      proxy: string;
      implementation: string;
    };
    genericTemplate: {
      proxy: string;
      implementation: string;
    };
  };
  companyConfig: {
    companyId: string;
    companyName: string;
    industry: string;
    entityType: string;
    managerType: string;
    transactionType: string;
    templateVersion: string;
  };
}

async function main() {
  console.log("\n========================================");
  console.log("Varity Generic Template Deployment");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("\n========================================\n");

  const deploymentAddresses: DeploymentAddresses = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deploymentTimestamp: Math.floor(Date.now() / 1000),
    contracts: {
      accessControlRegistry: { proxy: "", implementation: "" },
      dataProofRegistry: { proxy: "", implementation: "" },
      walletFactory: { proxy: "", implementation: "" },
      paymaster: { proxy: "", implementation: "" },
      genericTemplate: { proxy: "", implementation: "" },
    },
    companyConfig: {
      companyId: ethers.id("varity-iso-demo"),
      companyName: "Varity ISO Demo Company",
      industry: "iso",
      entityType: "merchant",
      managerType: "rep",
      transactionType: "payment",
      templateVersion: "v1.0.0",
    },
  };

  // ============ Step 1: Deploy Infrastructure Contracts ============

  console.log("Step 1: Deploying Infrastructure Contracts\n");

  // 1.1 Deploy AccessControlRegistry
  console.log("1.1 Deploying AccessControlRegistry...");
  const AccessControlRegistry = await ethers.getContractFactory("AccessControlRegistry");
  const accessControlRegistry = await upgrades.deployProxy(
    AccessControlRegistry,
    [deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await accessControlRegistry.waitForDeployment();
  const accessControlAddress = await accessControlRegistry.getAddress();
  const accessControlImpl = await upgrades.erc1967.getImplementationAddress(accessControlAddress);

  deploymentAddresses.contracts.accessControlRegistry.proxy = accessControlAddress;
  deploymentAddresses.contracts.accessControlRegistry.implementation = accessControlImpl;

  console.log("   ✅ AccessControlRegistry Proxy:", accessControlAddress);
  console.log("   ✅ Implementation:", accessControlImpl);

  // 1.2 Deploy DataProofRegistry
  console.log("\n1.2 Deploying DataProofRegistry...");
  const DataProofRegistry = await ethers.getContractFactory("DataProofRegistry");
  const dataProofRegistry = await upgrades.deployProxy(
    DataProofRegistry,
    [deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await dataProofRegistry.waitForDeployment();
  const dataProofAddress = await dataProofRegistry.getAddress();
  const dataProofImpl = await upgrades.erc1967.getImplementationAddress(dataProofAddress);

  deploymentAddresses.contracts.dataProofRegistry.proxy = dataProofAddress;
  deploymentAddresses.contracts.dataProofRegistry.implementation = dataProofImpl;

  console.log("   ✅ DataProofRegistry Proxy:", dataProofAddress);
  console.log("   ✅ Implementation:", dataProofImpl);

  // 1.3 Deploy VarityWalletFactory
  console.log("\n1.3 Deploying VarityWalletFactory...");
  const VarityWalletFactory = await ethers.getContractFactory("VarityWalletFactory");
  const walletFactory = await upgrades.deployProxy(
    VarityWalletFactory,
    [deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await walletFactory.waitForDeployment();
  const walletFactoryAddress = await walletFactory.getAddress();
  const walletFactoryImpl = await upgrades.erc1967.getImplementationAddress(walletFactoryAddress);

  deploymentAddresses.contracts.walletFactory.proxy = walletFactoryAddress;
  deploymentAddresses.contracts.walletFactory.implementation = walletFactoryImpl;

  console.log("   ✅ VarityWalletFactory Proxy:", walletFactoryAddress);
  console.log("   ✅ Implementation:", walletFactoryImpl);

  // 1.4 Deploy SimplifiedPaymaster
  console.log("\n1.4 Deploying SimplifiedPaymaster...");
  const SimplifiedPaymaster = await ethers.getContractFactory("SimplifiedPaymaster");
  const paymaster = await upgrades.deployProxy(
    SimplifiedPaymaster,
    [deployer.address, accessControlAddress, walletFactoryAddress],
    { initializer: "initialize", kind: "uups" }
  );
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  const paymasterImpl = await upgrades.erc1967.getImplementationAddress(paymasterAddress);

  deploymentAddresses.contracts.paymaster.proxy = paymasterAddress;
  deploymentAddresses.contracts.paymaster.implementation = paymasterImpl;

  console.log("   ✅ SimplifiedPaymaster Proxy:", paymasterAddress);
  console.log("   ✅ Implementation:", paymasterImpl);

  // ============ Step 2: Deploy GenericTemplate ============

  console.log("\n========================================");
  console.log("Step 2: Deploying GenericTemplate\n");

  const GenericTemplate = await ethers.getContractFactory("GenericTemplate");
  const genericTemplate = await upgrades.deployProxy(
    GenericTemplate,
    [deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await genericTemplate.waitForDeployment();
  const genericTemplateAddress = await genericTemplate.getAddress();
  const genericTemplateImpl = await upgrades.erc1967.getImplementationAddress(genericTemplateAddress);

  deploymentAddresses.contracts.genericTemplate.proxy = genericTemplateAddress;
  deploymentAddresses.contracts.genericTemplate.implementation = genericTemplateImpl;

  console.log("   ✅ GenericTemplate Proxy:", genericTemplateAddress);
  console.log("   ✅ Implementation:", genericTemplateImpl);

  // ============ Step 3: Configure GenericTemplate ============

  console.log("\n========================================");
  console.log("Step 3: Configuring GenericTemplate\n");

  console.log("3.1 Setting company configuration...");
  const setCompanyConfigTx = await genericTemplate.setCompanyConfig(
    deploymentAddresses.companyConfig.companyId,
    deploymentAddresses.companyConfig.companyName,
    deploymentAddresses.companyConfig.industry,
    deploymentAddresses.companyConfig.entityType,
    deploymentAddresses.companyConfig.managerType,
    deploymentAddresses.companyConfig.transactionType,
    deploymentAddresses.companyConfig.templateVersion
  );
  await setCompanyConfigTx.wait();
  console.log("   ✅ Company configuration set");

  console.log("\n3.2 Setting default calculation config...");
  const defaultCalcConfig = {
    baseRateBps: 250,      // 2.5% base rate
    volumeTier1: ethers.parseEther("10000"),   // $10k tier 1
    volumeTier2: ethers.parseEther("50000"),   // $50k tier 2
    tier1RateBps: 200,     // 2% tier 1
    tier2RateBps: 150,     // 1.5% tier 2
    tier3RateBps: 100,     // 1% tier 3
  };
  const setCalcConfigTx = await genericTemplate.setDefaultCalculationConfig(defaultCalcConfig);
  await setCalcConfigTx.wait();
  console.log("   ✅ Default calculation config set");

  // ============ Step 4: Grant System Roles ============

  console.log("\n========================================");
  console.log("Step 4: Configuring Access Control\n");

  console.log("4.1 Granting SYSTEM_ROLE to GenericTemplate...");
  const grantSystemRoleTx = await accessControlRegistry.grantSystemRole(genericTemplateAddress);
  await grantSystemRoleTx.wait();
  console.log("   ✅ SYSTEM_ROLE granted to GenericTemplate");

  // ============ Step 5: Save Deployment Addresses ============

  console.log("\n========================================");
  console.log("Step 5: Saving Deployment Addresses\n");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFilePath = path.join(
    deploymentsDir,
    `deployment-${network.name}-${deploymentAddresses.deploymentTimestamp}.json`
  );

  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentAddresses, null, 2));
  console.log("   ✅ Deployment addresses saved to:", deploymentFilePath);

  // Also save as latest
  const latestFilePath = path.join(deploymentsDir, `deployment-${network.name}-latest.json`);
  fs.writeFileSync(latestFilePath, JSON.stringify(deploymentAddresses, null, 2));
  console.log("   ✅ Latest deployment addresses saved to:", latestFilePath);

  // ============ Deployment Summary ============

  console.log("\n========================================");
  console.log("Deployment Complete!");
  console.log("========================================\n");

  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("\nInfrastructure Contracts:");
  console.log("  AccessControlRegistry:", accessControlAddress);
  console.log("  DataProofRegistry:", dataProofAddress);
  console.log("  VarityWalletFactory:", walletFactoryAddress);
  console.log("  SimplifiedPaymaster:", paymasterAddress);
  console.log("\nGenericTemplate:");
  console.log("  Proxy:", genericTemplateAddress);
  console.log("  Implementation:", genericTemplateImpl);
  console.log("\nCompany Configuration:");
  console.log("  Company ID:", deploymentAddresses.companyConfig.companyId);
  console.log("  Company Name:", deploymentAddresses.companyConfig.companyName);
  console.log("  Industry:", deploymentAddresses.companyConfig.industry);
  console.log("  Entity Type:", deploymentAddresses.companyConfig.entityType);
  console.log("  Manager Type:", deploymentAddresses.companyConfig.managerType);
  console.log("  Transaction Type:", deploymentAddresses.companyConfig.transactionType);
  console.log("\n========================================\n");

  console.log("Next Steps:");
  console.log("1. Verify contracts on block explorer:");
  console.log(`   npx hardhat verify --network ${network.name} ${genericTemplateAddress}`);
  console.log("\n2. Test the deployment:");
  console.log("   npx hardhat run scripts/test-deployment.ts --network", network.name);
  console.log("\n3. Configure frontend with contract addresses from:");
  console.log("  ", deploymentFilePath);
  console.log("\n========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
