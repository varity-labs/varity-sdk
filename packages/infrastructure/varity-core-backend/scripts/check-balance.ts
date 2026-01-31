import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('\n📊 Wallet Balance Check');
  console.log('='.repeat(50));
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Chain ID:', (await ethers.provider.getNetwork()).chainId);
  console.log('Deployer Address:', deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  console.log('='.repeat(50));

  const requiredBalance = ethers.parseEther('0.15');
  if (balance >= requiredBalance) {
    console.log('✅ Sufficient balance for deployment');
  } else {
    console.log('❌ Insufficient balance!');
    console.log(   `Need at least 0.15 ETH, have ${ethers.formatEther(balance)} ETH`);
    console.log('   Get testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia');
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
