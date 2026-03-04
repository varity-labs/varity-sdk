/**
 * VarityKit Smart Contract Deployment Script
 *
 * Deploys:
 * 1. TemplateMarketplace - Marketplace with 90/10 revenue split (90% creator, 10% platform)
 * 2. TemplateRegistry - On-chain metadata registry with IPFS hash storage
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network localhost
 *   npx hardhat run scripts/deploy.js --network arbitrumSepolia
 *   npx hardhat run scripts/deploy.js --network varityL3
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 VarityKit Smart Contract Deployment\n");
  console.log("=".repeat(60));

  // Get deployment account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log("📋 Deployment Configuration:");
  console.log("  Network:", hre.network.name);
  console.log("  Chain ID:", hre.network.config.chainId);
  console.log("  Deployer:", deployerAddress);
  console.log("  Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("=".repeat(60));

  // ========== 1. Deploy TemplateMarketplace ==========
  console.log("\n📦 Deploying TemplateMarketplace...");

  const TemplateMarketplace = await hre.ethers.getContractFactory("TemplateMarketplace");
  const marketplace = await TemplateMarketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("✅ TemplateMarketplace deployed!");
  console.log("   Address:", marketplaceAddress);
  console.log("   Revenue Split: 90% creator, 10% platform");
  console.log("   Min Quality Score:", 85);

  // ========== 2. Deploy TemplateRegistry ==========
  console.log("\n📦 Deploying TemplateRegistry...");

  const TemplateRegistry = await hre.ethers.getContractFactory("TemplateRegistry");
  const registry = await TemplateRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("✅ TemplateRegistry deployed!");
  console.log("   Address:", registryAddress);

  // ========== 3. Verify Deployment ==========
  console.log("\n🔍 Verifying Deployment...");

  try {
    // Check marketplace constants
    const creatorShare = await marketplace.CREATOR_SHARE_PERCENT();
    const platformShare = await marketplace.PLATFORM_SHARE_PERCENT();
    const minQuality = await marketplace.MIN_QUALITY_SCORE();

    console.log("✅ TemplateMarketplace verification:");
    console.log("   Creator Share:", creatorShare.toString() + "%");
    console.log("   Platform Share:", platformShare.toString() + "%");
    console.log("   Min Quality Score:", minQuality.toString());

    // Verify split is correct (90/10)
    if (creatorShare.toString() === "90" && platformShare.toString() === "10") {
      console.log("   ✅ Revenue split is CORRECT (90% creator, 10% platform)");
    } else {
      console.error("   ❌ ERROR: Revenue split is INCORRECT!");
      console.error("      Expected: 90% creator, 10% platform");
      console.error("      Actual:", creatorShare.toString() + "% creator,", platformShare.toString() + "% platform");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }

  // ========== 4. Save Deployment Addresses ==========
  console.log("\n💾 Saving Deployment Information...");

  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {
      TemplateMarketplace: {
        address: marketplaceAddress,
        creatorShare: 90,
        platformShare: 10,
        minQualityScore: 85,
      },
      TemplateRegistry: {
        address: registryAddress,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}_${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("✅ Deployment info saved to:", deploymentFile);

  // ========== 5. Next Steps ==========
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));

  console.log("\n📝 Next Steps:");
  console.log("1. Update backend API with contract addresses:");
  console.log("   TEMPLATE_MARKETPLACE_ADDRESS=" + marketplaceAddress);
  console.log("   TEMPLATE_REGISTRY_ADDRESS=" + registryAddress);
  console.log("");
  console.log("2. Update CLI configuration:");
  console.log("   varietykit config set marketplace_address " + marketplaceAddress);
  console.log("   varietykit config set registry_address " + registryAddress);
  console.log("");

  if (hre.network.name === "arbitrumSepolia" || hre.network.name === "varityL3") {
    console.log("3. Verify contracts on block explorer:");
    console.log("   npx hardhat verify --network " + hre.network.name + " " + marketplaceAddress);
    console.log("   npx hardhat verify --network " + hre.network.name + " " + registryAddress);
    console.log("");
  }

  console.log("4. Test marketplace functionality:");
  console.log("   npx hardhat run scripts/test-marketplace.js --network " + hre.network.name);
  console.log("");

  console.log("=".repeat(60));
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
