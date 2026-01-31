# Smart Contract Deployment Guide - Arbitrum Sepolia

## Overview

This guide will help you deploy all 5 Varity smart contracts to Arbitrum Sepolia testnet and verify them on Arbiscan.

**Contracts to Deploy:**
1. AccessControlRegistry (UUPS upgradeable)
2. DataProofRegistry (UUPS upgradeable)
3. VarityWalletFactory (UUPS upgradeable)
4. SimplifiedPaymaster (UUPS upgradeable)
5. GenericTemplate (UUPS upgradeable)

**Expected Gas Costs:** ~0.15-0.2 ETH on Arbitrum Sepolia

---

## Phase 1: Environment Setup

### Step 1: Create .env File

```bash
cd /home/macoding/blokko-internal-os/varity/packages/varity-core-backend
cp .env.example .env
```

### Step 2: Get Alchemy RPC Endpoint

1. Visit [alchemy.com](https://www.alchemy.com/)
2. Sign up for free account
3. Create new app:
   - **Chain**: Arbitrum
   - **Network**: Arbitrum Sepolia
   - **Name**: Varity Testnet
4. Copy the HTTPS RPC URL (looks like: `https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)
5. Update `.env`:
   ```bash
   ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

### Step 3: Create Deployment Wallet

**Option A: Use Existing Wallet**
- Export private key from MetaMask (Settings → Security & Privacy → Reveal Private Key)
- **⚠️ NEVER use a wallet with real funds! Create a new test wallet.**

**Option B: Generate New Wallet**
```bash
npx hardhat console --network arbitrumSepolia
```
```javascript
// In console:
const wallet = ethers.Wallet.createRandom()
console.log("Address:", wallet.address)
console.log("Private Key:", wallet.privateKey)
```

Update `.env`:
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### Step 4: Get Testnet ETH

You need **0.15-0.2 ETH** on Arbitrum Sepolia for deployment.

**Method 1: Arbitrum Sepolia Faucet**
1. Visit [faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia)
2. Enter your wallet address
3. Complete verification
4. Receive 0.1 ETH

**Method 2: Bridge from Ethereum Sepolia**
1. Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com/)
2. Bridge to Arbitrum Sepolia at [bridge.arbitrum.io](https://bridge.arbitrum.io/)
3. Select Sepolia → Arbitrum Sepolia
4. Bridge 0.2 ETH

**Verify Balance:**
```bash
npx hardhat run scripts/check-balance.ts --network arbitrumSepolia
```

### Step 5: Get Arbiscan API Key

1. Visit [arbiscan.io](https://arbiscan.io/)
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Update `.env`:
   ```bash
   ARBISCAN_API_KEY=YOUR_ARBISCAN_API_KEY
   ```

---

## Phase 2: Pre-Deployment Verification

### Step 1: Verify Environment Configuration

```bash
# Check .env file is configured
cat .env | grep -E "PRIVATE_KEY|ARBITRUM_SEPOLIA_RPC_URL|ARBISCAN_API_KEY"
```

Should show:
- ✓ PRIVATE_KEY set (starts with 0x)
- ✓ ARBITRUM_SEPOLIA_RPC_URL set (Alchemy URL)
- ✓ ARBISCAN_API_KEY set

### Step 2: Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
✓ Compiled 5 Solidity files successfully (one or more with warnings)
```

### Step 3: Test RPC Connection

```bash
npx hardhat console --network arbitrumSepolia
```
```javascript
// In console:
const balance = await ethers.provider.getBalance("YOUR_WALLET_ADDRESS")
console.log("Balance:", ethers.formatEther(balance), "ETH")
// Should show >= 0.15 ETH
```

---

## Phase 3: Deploy Contracts

### Deploy All Contracts

```bash
npx hardhat run scripts/deploy-generic-template.ts --network arbitrumSepolia
```

**Expected Output:**
```
🚀 Starting GenericTemplate deployment to arbitrumSepolia...

Network: arbitrumSepolia (Chain ID: 421614)
Deployer: 0xYourAddress
Balance: 0.2 ETH

📦 Deploying infrastructure contracts...
  ✓ AccessControlRegistry deployed to: 0xabc123...
  ✓ DataProofRegistry deployed to: 0xdef456...
  ✓ VarityWalletFactory deployed to: 0xghi789...
  ✓ SimplifiedPaymaster deployed to: 0xjkl012...

📦 Deploying GenericTemplate...
  ✓ GenericTemplate deployed to: 0xmno345...

⚙️  Configuring company settings...
  ✓ Company configured: Varity ISO Demo

🔐 Granting system roles...
  ✓ Roles granted

💾 Saving deployment addresses...
  ✓ Saved to: deployments/deployment-arbitrum-sepolia-latest.json

✅ Deployment complete!
```

**Gas Cost Breakdown:**
- AccessControlRegistry: ~0.03 ETH
- DataProofRegistry: ~0.025 ETH
- VarityWalletFactory: ~0.025 ETH
- SimplifiedPaymaster: ~0.02 ETH
- GenericTemplate: ~0.05 ETH
- **Total: ~0.15 ETH**

### Save Deployment Addresses

Deployment addresses are automatically saved to:
```
deployments/deployment-arbitrum-sepolia-latest.json
```

**⚠️ IMPORTANT:** Copy this file to a safe location! You'll need these addresses for:
- Frontend integration
- Contract verification
- Future upgrades

---

## Phase 4: Verify Contracts on Arbiscan

### Verify All Contracts

```bash
npx hardhat verify --network arbitrumSepolia CONTRACT_ADDRESS
```

**Verify Each Contract:**

```bash
# 1. AccessControlRegistry
npx hardhat verify --network arbitrumSepolia 0xACCESS_CONTROL_ADDRESS

# 2. DataProofRegistry
npx hardhat verify --network arbitrumSepolia 0xDATA_PROOF_ADDRESS

# 3. VarityWalletFactory
npx hardhat verify --network arbitrumSepolia 0xWALLET_FACTORY_ADDRESS

# 4. SimplifiedPaymaster
npx hardhat verify --network arbitrumSepolia 0xPAYMASTER_ADDRESS

# 5. GenericTemplate
npx hardhat verify --network arbitrumSepolia 0xGENERIC_TEMPLATE_ADDRESS
```

**Expected Output per Contract:**
```
Successfully verified contract on Arbiscan.
https://sepolia.arbiscan.io/address/0xYourContractAddress#code
```

---

## Phase 5: Post-Deployment Verification

### Step 1: Verify Contract Deployment

Visit each contract on Arbiscan:
```
https://sepolia.arbiscan.io/address/0xYOUR_CONTRACT_ADDRESS
```

Check:
- ✓ Contract verified (green checkmark)
- ✓ Read Contract tab available
- ✓ Write Contract tab available
- ✓ Proxy implementation visible

### Step 2: Test Contract Functions

```bash
npx hardhat run scripts/test-deployed-contracts.ts --network arbitrumSepolia
```

This will:
- Register a test entity
- Record a test transaction
- Verify access control
- Test wallet factory
- Verify all integrations

### Step 3: Check Alchemy Dashboard

1. Visit [dashboard.alchemy.com](https://dashboard.alchemy.com/)
2. Navigate to your Varity Testnet app
3. View transaction history
4. **Verify 100% success rate** ✓

Expected metrics:
- Total Requests: ~15-20 (deployment + setup)
- Success Rate: 100%
- Failed Requests: 0

---

## Phase 6: Frontend Integration

### Update Frontend with Contract Addresses

```bash
# Copy deployment addresses
cat deployments/deployment-arbitrum-sepolia-latest.json
```

Update frontend `.env`:
```bash
# varity/iso-dashboard-mvp/.env
NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=0x...
NEXT_PUBLIC_DATA_PROOF_ADDRESS=0x...
NEXT_PUBLIC_WALLET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_PAYMASTER_ADDRESS=0x...
NEXT_PUBLIC_GENERIC_TEMPLATE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

---

## Troubleshooting

### Issue: "insufficient funds for intrinsic transaction cost"
**Solution:** Get more testnet ETH (need at least 0.15 ETH)

### Issue: "nonce has already been used"
**Solution:**
```bash
npx hardhat clean
rm -rf cache/
npx hardhat compile
# Try deployment again
```

### Issue: "Verification failed"
**Solution:** Wait 30 seconds after deployment, then try verification again:
```bash
sleep 30
npx hardhat verify --network arbitrumSepolia 0xCONTRACT_ADDRESS
```

### Issue: "Network request failed"
**Solution:** Check Alchemy RPC URL is correct in .env

---

## Success Criteria

After completing this guide, you should have:

- ✅ 5 contracts deployed to Arbitrum Sepolia
- ✅ All contracts verified on Arbiscan
- ✅ 100% success rate on Alchemy dashboard
- ✅ Deployment addresses saved to JSON
- ✅ Contracts tested and functional
- ✅ Ready for frontend integration

**Next Steps:**
1. Integrate contract addresses into frontend
2. Test full user workflow
3. Prepare for mainnet deployment

---

## Resources

- **Arbitrum Sepolia Explorer:** https://sepolia.arbiscan.io/
- **Alchemy Dashboard:** https://dashboard.alchemy.com/
- **Arbitrum Bridge:** https://bridge.arbitrum.io/
- **Sepolia Faucet:** https://sepoliafaucet.com/
- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin UUPS:** https://docs.openzeppelin.com/contracts/4.x/api/proxy

---

## Emergency Contacts

If you encounter deployment issues:
1. Check Hardhat console for error messages
2. Verify .env configuration
3. Check Alchemy dashboard for RPC errors
4. Review Arbiscan for transaction status
