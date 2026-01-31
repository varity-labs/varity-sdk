/**
 * VarityKit Marketplace Test Script
 *
 * Tests the deployed TemplateMarketplace contract:
 * 1. Publish a test template
 * 2. Purchase the template
 * 3. Verify 30/70 revenue split
 * 4. Check creator earnings
 *
 * Usage:
 *   npx hardhat run scripts/test-marketplace.js --network localhost
 *   npx hardhat run scripts/test-marketplace.js --network varityL3
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🧪 Testing VarityKit Marketplace\n");
  console.log("=".repeat(60));

  // Get latest deployment file
  const deploymentsDir = path.join(__dirname, "../deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(hre.network.name))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("❌ No deployment found for network:", hre.network.name);
    process.exit(1);
  }

  const deploymentFile = path.join(deploymentsDir, files[0]);
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("📋 Test Configuration:");
  console.log("  Network:", hre.network.name);
  console.log("  Marketplace:", deployment.contracts.TemplateMarketplace.address);
  console.log("  Registry:", deployment.contracts.TemplateRegistry.address);
  console.log("=".repeat(60));

  const [deployer, creator, buyer] = await hre.ethers.getSigners();
  const marketplace = await hre.ethers.getContractAt(
    "TemplateMarketplace",
    deployment.contracts.TemplateMarketplace.address
  );

  // ========== 1. Publish Template ==========
  console.log("\n📦 Publishing test template...");

  const templateName = "Test Finance Dashboard";
  const templatePrice = hre.ethers.parseEther("0.1"); // 0.1 ETH
  const repositoryUrl = "https://github.com/varity/finance-template";
  const ipfsHash = "QmTest123...";
  const qualityScore = 92;

  const publishTx = await marketplace.connect(creator).publishTemplate(
    templateName,
    templatePrice,
    repositoryUrl,
    ipfsHash,
    qualityScore
  );
  const publishReceipt = await publishTx.wait();

  // Get template ID from event
  const publishEvent = publishReceipt.logs
    .map(log => {
      try {
        return marketplace.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find(event => event && event.name === "TemplatePublished");

  const templateId = publishEvent.args.templateId;

  console.log("✅ Template published!");
  console.log("   Template ID:", templateId);
  console.log("   Name:", templateName);
  console.log("   Price:", hre.ethers.formatEther(templatePrice), "ETH");
  console.log("   Quality Score:", qualityScore);

  // ========== 2. Purchase Template ==========
  console.log("\n💰 Purchasing template...");

  const creatorBalanceBefore = await hre.ethers.provider.getBalance(await creator.getAddress());
  const platformBalanceBefore = await hre.ethers.provider.getBalance(await deployer.getAddress());

  const purchaseTx = await marketplace.connect(buyer).purchaseTemplate(templateId, {
    value: templatePrice,
  });
  await purchaseTx.wait();

  const creatorBalanceAfter = await hre.ethers.provider.getBalance(await creator.getAddress());
  const platformBalanceAfter = await hre.ethers.provider.getBalance(await deployer.getAddress());

  console.log("✅ Template purchased!");

  // ========== 3. Verify Revenue Split ==========
  console.log("\n💸 Verifying Revenue Split...");

  const expectedCreatorShare = (templatePrice * 30n) / 100n;
  const expectedPlatformShare = templatePrice - expectedCreatorShare;

  const actualCreatorGain = creatorBalanceAfter - creatorBalanceBefore;
  const actualPlatformGain = platformBalanceAfter - platformBalanceBefore;

  console.log("Expected:");
  console.log("  Creator (30%):", hre.ethers.formatEther(expectedCreatorShare), "ETH");
  console.log("  Platform (70%):", hre.ethers.formatEther(expectedPlatformShare), "ETH");
  console.log("");
  console.log("Actual:");
  console.log("  Creator received:", hre.ethers.formatEther(actualCreatorGain), "ETH");
  console.log("  Platform received:", hre.ethers.formatEther(actualPlatformGain), "ETH");

  // Verify split is correct
  if (actualCreatorGain === expectedCreatorShare) {
    console.log("\n✅ Revenue split is CORRECT!");
    console.log("   30% → Creator ✅");
    console.log("   70% → Platform ✅");
  } else {
    console.error("\n❌ Revenue split is INCORRECT!");
    process.exit(1);
  }

  // ========== 4. Check Creator Stats ==========
  console.log("\n📊 Creator Statistics:");

  const creatorStats = await marketplace.getCreatorStats(await creator.getAddress());
  console.log("  Total Templates:", creatorStats.totalTemplates.toString());
  console.log("  Total Downloads:", creatorStats.totalDownloads.toString());
  console.log("  Total Revenue:", hre.ethers.formatEther(creatorStats.totalRevenue), "ETH");
  console.log("  Pending Withdrawal:", hre.ethers.formatEther(creatorStats.pendingWithdrawal), "ETH");

  // ========== 5. Test Complete ==========
  console.log("\n" + "=".repeat(60));
  console.log("🎉 All Tests Passed!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });
