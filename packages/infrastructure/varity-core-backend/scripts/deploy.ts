/**
 * Deploy Varity Smart Contracts to Arbitrum Sepolia
 * Run with: npx hardhat run scripts/deploy.ts --network arbitrumSepolia
 */

import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying Varity Smart Contracts to Arbitrum Sepolia...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH\n');

  // 1. Deploy DashboardRegistry
  console.log('1️⃣  Deploying DashboardRegistry...');
  const DashboardRegistry = await ethers.getContractFactory('DashboardRegistry');
  const dashboardRegistry = await DashboardRegistry.deploy();
  await dashboardRegistry.waitForDeployment();
  const registryAddress = await dashboardRegistry.getAddress();
  console.log('   ✅ DashboardRegistry deployed to:', registryAddress);

  // 2. Deploy TemplateManager
  console.log('\n2️⃣  Deploying TemplateManager...');
  const TemplateManager = await ethers.getContractFactory('TemplateManager');
  const templateManager = await TemplateManager.deploy();
  await templateManager.waitForDeployment();
  const templateAddress = await templateManager.getAddress();
  console.log('   ✅ TemplateManager deployed to:', templateAddress);

  // 3. Deploy AccessControl
  console.log('\n3️⃣  Deploying AccessControl...');
  const AccessControl = await ethers.getContractFactory('AccessControl');
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessAddress = await accessControl.getAddress();
  console.log('   ✅ AccessControl deployed to:', accessAddress);

  // 4. Deploy BillingModule
  console.log('\n4️⃣  Deploying BillingModule...');
  const BillingModule = await ethers.getContractFactory('BillingModule');
  const billingModule = await BillingModule.deploy();
  await billingModule.waitForDeployment();
  const billingAddress = await billingModule.getAddress();
  console.log('   ✅ BillingModule deployed to:', billingAddress);

  // Summary
  console.log('\n📊 Deployment Summary');
  console.log('─────────────────────────────────────────────────────────');
  console.log('DashboardRegistry:', registryAddress);
  console.log('TemplateManager:  ', templateAddress);
  console.log('AccessControl:    ', accessAddress);
  console.log('BillingModule:    ', billingAddress);
  console.log('─────────────────────────────────────────────────────────');

  // Save deployment addresses
  const deploymentInfo = {
    network: 'arbitrum-sepolia',
    chainId: 421614,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DashboardRegistry: registryAddress,
      TemplateManager: templateAddress,
      AccessControl: accessAddress,
      BillingModule: billingAddress,
    },
  };

  console.log('\n💾 Deployment Info:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log('\n✨ All contracts deployed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
