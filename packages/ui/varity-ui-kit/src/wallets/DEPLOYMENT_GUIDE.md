# Smart Wallet Deployment Guide for Varity L3

This guide walks through deploying the smart wallet infrastructure on Varity L3 Testnet (Chain ID 33529).

## Prerequisites

- Varity L3 RPC configured: `https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz`
- USDC funded wallet for deployment and gas sponsorship
- Conduit Bundler app installed on Varity L3 (via Conduit Marketplace)

## Contract Addresses (Current Status)

### ⚠️ TODO: Deploy to Varity L3

Currently, these contracts are deployed on **Arbitrum Sepolia** and need to be migrated:

- **SimplifiedPaymaster**: Not deployed to Varity L3 yet
- **VarityWalletFactory**: Not deployed to Varity L3 yet
- **ERC-4337 EntryPoint v0.6**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (standard address)

## Step 1: Deploy SimplifiedPaymaster

```bash
cd packages/infrastructure/varity-core-backend

# Compile contracts
npx hardhat compile

# Deploy to Varity L3
npx hardhat run scripts/deploy-paymaster.ts --network varityL3
```

Expected output:
```
SimplifiedPaymaster deployed to: 0x...
Admin address: 0x...
Global daily limit: 100000000 (100 USDC)
```

**Update config.ts**:
```typescript
// packages/ui/varity-ui-kit/src/wallets/config.ts
export const VARITY_SMART_WALLET_CONTRACTS = {
  paymasterAddress: '0x...' // <- Replace with deployed address
  // ...
}
```

## Step 2: Deploy VarityWalletFactory

```bash
# Deploy factory
npx hardhat run scripts/deploy-factory.ts --network varityL3
```

Expected output:
```
VarityWalletFactory deployed to: 0x...
Paymaster address: 0x... (from Step 1)
Default gas budget: 10000000 (10 USDC)
```

**Update config.ts**:
```typescript
// packages/ui/varity-ui-kit/src/wallets/config.ts
export const VARITY_SMART_WALLET_CONTRACTS = {
  factoryAddress: '0x...', // <- Replace with deployed address
  paymasterAddress: '0x...', // (from Step 1)
  // ...
}
```

## Step 3: Fund Paymaster with USDC

The paymaster needs USDC to sponsor gas for transactions.

```bash
# Transfer USDC to paymaster
# Recommended: 1000 USDC for testing (1000 * 10^6 = 1000000000)

# Option 1: Using Hardhat script
npx hardhat run scripts/fund-paymaster.ts --network varityL3

# Option 2: Manual transfer via block explorer
# Send USDC to: <paymaster-address>
```

## Step 4: Configure Conduit Bundler

### 4.1 Verify Bundler Installation

1. Go to Conduit Dashboard: https://conduit.xyz
2. Select your Varity L3 deployment
3. Navigate to Marketplace → Apps
4. Verify "Conduit Bundler" is installed

### 4.2 Get Bundler Endpoint

The bundler endpoint should be:
```
https://api.conduit.xyz/bundler/33529
```

Or check the managed endpoint in your Conduit dashboard.

### 4.3 Update Environment Variables

```bash
# .env.local (in your app)
NEXT_PUBLIC_CONDUIT_BUNDLER_URL=https://api.conduit.xyz/bundler/33529
NEXT_PUBLIC_PAYMASTER_URL=<optional-custom-paymaster-url>
```

## Step 5: Test Complete Flow

Create a test file to verify everything works:

```typescript
// test-smart-wallet.ts
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';
import {
  SmartWalletProvider,
  getDefaultSmartWalletConfig,
  areContractsDeployed
} from '@varity/ui-kit';

async function testSmartWallet() {
  // 1. Check contracts are deployed
  if (!areContractsDeployed()) {
    console.error('❌ Contracts not deployed! Update config.ts with addresses');
    return;
  }

  console.log('✅ Contracts deployed');

  // 2. Create thirdweb client
  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
  });

  // 3. Create smart wallet config
  const config = getDefaultSmartWalletConfig(client);

  console.log('Smart Wallet Config:', {
    chain: config.chain.name,
    gasless: config.gasless.enabled,
    factory: config.factoryAddress
  });

  console.log('✅ Configuration ready');
  console.log('🎉 Smart wallet infrastructure deployed successfully!');
}

testSmartWallet();
```

Run the test:
```bash
npx ts-node test-smart-wallet.ts
```

## Step 6: Integration Checklist

- [ ] SimplifiedPaymaster deployed to Varity L3
- [ ] VarityWalletFactory deployed to Varity L3
- [ ] Paymaster funded with USDC (minimum 100 USDC)
- [ ] Contract addresses updated in `config.ts`
- [ ] Conduit Bundler verified in dashboard
- [ ] Environment variables set
- [ ] Test script passes
- [ ] Example app demonstrates gasless transactions

## Deployment Scripts

### Deploy Paymaster Script

```typescript
// scripts/deploy-paymaster.ts
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying SimplifiedPaymaster...');
  console.log('Deployer:', deployer.address);

  const SimplifiedPaymaster = await ethers.getContractFactory('SimplifiedPaymaster');
  const paymaster = await SimplifiedPaymaster.deploy();
  await paymaster.waitForDeployment();

  const address = await paymaster.getAddress();
  console.log('SimplifiedPaymaster deployed to:', address);

  // Initialize
  const globalDailyLimit = ethers.parseUnits('100', 6); // 100 USDC
  const globalTxLimit = 10;

  await paymaster.initialize(deployer.address, globalDailyLimit, globalTxLimit);
  console.log('Paymaster initialized');

  console.log('\n📋 UPDATE config.ts:');
  console.log(`paymasterAddress: '${address}',`);
}

main();
```

### Deploy Factory Script

```typescript
// scripts/deploy-factory.ts
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  // Get paymaster address from environment or previous deployment
  const paymasterAddress = process.env.PAYMASTER_ADDRESS!;

  console.log('Deploying VarityWalletFactory...');
  console.log('Deployer:', deployer.address);
  console.log('Paymaster:', paymasterAddress);

  const VarityWalletFactory = await ethers.getContractFactory('VarityWalletFactory');
  const factory = await VarityWalletFactory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log('VarityWalletFactory deployed to:', address);

  // Initialize
  const defaultGasBudget = ethers.parseUnits('10', 6); // 10 USDC

  await factory.initialize(paymasterAddress, defaultGasBudget);
  console.log('Factory initialized');

  console.log('\n📋 UPDATE config.ts:');
  console.log(`factoryAddress: '${address}',`);
}

main();
```

## Troubleshooting

### Issue: "Contracts not deployed"
**Solution**: Run deployment scripts and update `config.ts` with addresses

### Issue: "Insufficient balance for gas sponsorship"
**Solution**: Fund paymaster with more USDC

### Issue: "Bundler endpoint not responding"
**Solution**: Verify Conduit Bundler is installed and endpoint URL is correct

### Issue: "Transaction reverted"
**Solution**: Check that:
- Paymaster is funded
- Factory is initialized with correct paymaster address
- User's wallet has CREATE2 deployment allowance

## Next Steps

After successful deployment:

1. **Update Documentation**: Reflect actual contract addresses in README
2. **Test Gasless Transactions**: Create example app with gasless flow
3. **Monitor Gas Usage**: Track paymaster USDC consumption
4. **Set Up Alerts**: Monitor paymaster balance
5. **Production Readiness**: Audit contracts before mainnet

## Security Considerations

- [ ] Paymaster access control configured (only factory can sponsor wallets)
- [ ] Daily gas limits set appropriately
- [ ] Factory ownership transferred to multisig (for production)
- [ ] Contracts verified on block explorer
- [ ] Audit completed (before production)

## Support

For issues with deployment:
- Check Varity L3 block explorer: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz
- Review Conduit documentation: https://docs.conduit.xyz
- thirdweb Account Abstraction docs: https://portal.thirdweb.com/smart-wallet

---

**Last Updated**: January 19, 2026
**Status**: Contracts pending deployment to Varity L3
**Next Action**: Deploy SimplifiedPaymaster and VarityWalletFactory
