/**
 * Deploy SimplifiedPaymaster + VarityWalletFactory to Varity L3
 *
 * Run with:
 *   PRIVATE_KEY=0x... npx hardhat run scripts/deploy-varity-l3.ts --network varityL3
 */

import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("\nDeploying SimplifiedPaymaster + VarityWalletFactory to Varity L3\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Deployer:", deployerAddress);
  console.log("Balance:", ethers.formatUnits(balance, 6), "USDC (native)");
  console.log("=".repeat(60));

  // ========== 1. Deploy SimplifiedPaymaster (UUPS Proxy) ==========
  console.log("\n1. Deploying SimplifiedPaymaster (UUPS Proxy)...");

  const Paymaster = await ethers.getContractFactory("SimplifiedPaymaster");
  const paymaster = await upgrades.deployProxy(
    Paymaster,
    [
      deployerAddress,           // admin
      ethers.parseUnits("100", 6), // globalDailyLimit: 100 USDC
      100,                        // globalTransactionLimit: 100 txs/user/day
    ],
    { kind: "uups" }
  );
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();

  console.log("SimplifiedPaymaster deployed at:", paymasterAddress);

  // ========== 2. Deploy VarityWalletFactory (UUPS Proxy) ==========
  console.log("\n2. Deploying VarityWalletFactory (UUPS Proxy)...");

  const Factory = await ethers.getContractFactory("VarityWalletFactory");
  const factory = await upgrades.deployProxy(
    Factory,
    [
      paymasterAddress,           // paymaster address (from step 1)
      ethers.parseUnits("0.1", 6), // defaultGasBudget: 0.1 USDC
    ],
    { kind: "uups" }
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("VarityWalletFactory deployed at:", factoryAddress);

  // ========== 3. Link factory to paymaster ==========
  console.log("\n3. Linking WalletFactory to Paymaster...");

  try {
    const paymasterContract = await ethers.getContractAt("SimplifiedPaymaster", paymasterAddress);
    // Check if setWalletFactory exists
    if (paymasterContract.setWalletFactory) {
      const tx = await paymasterContract.setWalletFactory(factoryAddress);
      await tx.wait();
      console.log("WalletFactory linked to Paymaster");
    } else {
      console.log("No setWalletFactory function - skipping link");
    }
  } catch (err) {
    console.log("Could not link factory to paymaster (non-critical):", (err as Error).message?.slice(0, 100));
  }

  // ========== Summary ==========
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));
  console.log("SimplifiedPaymaster:", paymasterAddress);
  console.log("VarityWalletFactory:", factoryAddress);
  console.log("Admin:", deployerAddress);
  console.log("=".repeat(60));

  console.log("\nUpdate these addresses in:");
  console.log("  CLAUDE.md → Deployed Smart Contracts table");
  console.log("  SDK → contract address constants");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });
