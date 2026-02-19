# Migration Guide: Ethers.js → Thirdweb Wrapper

## Overview

Varity SDK v2.0.0-beta.2 adds **optional Thirdweb wrapper support** while maintaining **100% backwards compatibility** with ethers.js. This guide helps you migrate at your own pace.

## Why Migrate to Thirdweb?

### Benefits

- **Faster Deployment**: Optimized contract deployment with built-in retry logic
- **Better IPFS Integration**: Native decentralized storage support
- **Enhanced Wallet Support**: Improved wallet detection and connection flows
- **Simplified API**: More intuitive contract interaction methods
- **Future-Proof**: Access to Thirdweb ecosystem features (NFT drops, marketplaces, etc.)
- **Better TypeScript Support**: Stronger type inference and autocomplete

### When to Migrate

✅ **Good Use Cases**:
- New projects starting fresh
- Adding IPFS/decentralized storage features
- Need for advanced wallet connection flows
- Want simplified contract deployment
- Building NFT or marketplace features

⚠️ **Consider Keeping Ethers.js** if:
- Existing codebase works well
- Deep integration with ethers.js-specific features
- Team unfamiliar with Thirdweb SDK
- No need for IPFS or advanced features

## Migration Options

### Option 1: Keep Using Ethers.js (No Changes)

**Best for**: Production apps that work well, teams wanting stability

```typescript
import { VaritySDK } from '@varity/sdk';

// All existing code continues to work
const sdk = new VaritySDK({
  network: 'varity-testnet',
  privateKey: process.env.PRIVATE_KEY,
});

await sdk.deploy(...);  // Still works
```

**No action required!** All existing functionality preserved.

---

### Option 2: Gradual Migration (Recommended)

**Best for**: Most teams, allows testing before full commitment

Use Thirdweb for new features while keeping existing ethers.js code:

```typescript
import { VaritySDK, ThirdwebWrapper, VarityTestnet } from '@varity/sdk';

// Existing code (keep as-is)
const sdk = new VaritySDK({
  network: 'varity-testnet',
  privateKey: process.env.PRIVATE_KEY,
});

// New features use Thirdweb
const wrapper = new ThirdwebWrapper({
  chainId: VarityTestnet.chainId,
  rpcUrl: VarityTestnet.rpc[0],
  clientId: process.env.THIRDWEB_CLIENT_ID,
  privateKey: process.env.PRIVATE_KEY,
});

// Mix and match!
await sdk.existingFeature();  // Ethers.js
await wrapper.uploadToIPFS(data);  // Thirdweb
```

**Migration Steps**:

1. Install Thirdweb SDK:
   ```bash
   npm install @thirdweb-dev/sdk @thirdweb-dev/storage
   ```

2. Get Thirdweb Client ID from [https://thirdweb.com/dashboard](https://thirdweb.com/dashboard)

3. Add to `.env`:
   ```bash
   THIRDWEB_CLIENT_ID=your_client_id_here
   ```

4. Use ThirdwebWrapper for new features only

5. Gradually migrate existing features when convenient

---

### Option 3: Full Migration

**Best for**: New projects, greenfield development

Replace all ethers.js calls with Thirdweb equivalents:

#### Contract Deployment

**Before (Ethers.js):**
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(...args);
await contract.waitForDeployment();
const address = await contract.getAddress();
```

**After (Thirdweb):**
```typescript
import { ThirdwebWrapper, VarityTestnet } from '@varity/sdk';

const wrapper = new ThirdwebWrapper({
  chainId: VarityTestnet.chainId,
  rpcUrl: VarityTestnet.rpc[0],
  clientId: process.env.THIRDWEB_CLIENT_ID,
  privateKey: process.env.PRIVATE_KEY,
});

const address = await wrapper.deployContract({
  name: 'MyContract',
  abi,
  bytecode,
  constructorArgs: [...args],
});
```

**Lines of Code**: 7 → 3 (57% reduction)

#### Contract Interaction (Read)

**Before (Ethers.js):**
```typescript
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(ADDRESS, ABI, provider);
const balance = await contract.balanceOf(userAddress);
```

**After (Thirdweb):**
```typescript
const contract = await wrapper.getContract(ADDRESS);
const balance = await contract.call('balanceOf', [userAddress]);
```

**Lines of Code**: 3 → 2 (33% reduction)

#### Contract Interaction (Write)

**Before (Ethers.js):**
```typescript
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(ADDRESS, ABI, wallet);
const tx = await contract.transfer(recipient, amount);
const receipt = await tx.wait();
```

**After (Thirdweb):**
```typescript
const contract = await wrapper.getContract(ADDRESS);
const tx = await contract.call('transfer', [recipient, amount]);
// Transaction automatically waits for confirmation
```

**Lines of Code**: 5 → 2 (60% reduction)

#### IPFS Upload

**Before (Manual):**
```typescript
const formData = new FormData();
formData.append('file', fileBlob);

const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
  method: 'POST',
  body: formData,
});

const { Hash } = await response.json();
const uri = `ipfs://${Hash}`;
```

**After (Thirdweb):**
```typescript
const uri = await wrapper.uploadToIPFS(data);
// Returns: ipfs://QmXxx...
```

**Lines of Code**: 9 → 1 (89% reduction)

---

## Common Migration Patterns

### Pattern 1: Provider Access

**Ethers.js:**
```typescript
const provider = new ethers.JsonRpcProvider(RPC_URL);
const blockNumber = await provider.getBlockNumber();
```

**Thirdweb (with fallback to ethers.js):**
```typescript
const wrapper = new ThirdwebWrapper({ ... });
const provider = wrapper.getEthersProvider();
const blockNumber = await provider.getBlockNumber();
```

### Pattern 2: Wallet Connection

**Ethers.js:**
```typescript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
```

**Thirdweb:**
```typescript
const sdk = wrapper.getSDK();
const signer = sdk.getSigner();
```

### Pattern 3: Contract Events

**Ethers.js:**
```typescript
const contract = new ethers.Contract(ADDRESS, ABI, provider);
contract.on('Transfer', (from, to, amount) => {
  console.log(`Transfer: ${from} → ${to} (${amount})`);
});
```

**Thirdweb:**
```typescript
const contract = await wrapper.getContract(ADDRESS);
const events = await contract.events.getEvents('Transfer');
events.forEach(event => {
  console.log(`Transfer: ${event.data.from} → ${event.data.to}`);
});
```

---

## Environment Configuration

### Ethers.js Only

```bash
# .env
DEPLOYER_PRIVATE_KEY=0x...
VARITY_TESTNET_RPC=https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
```

### Adding Thirdweb

```bash
# .env
DEPLOYER_PRIVATE_KEY=0x...
VARITY_TESTNET_RPC=https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz

# New: Thirdweb configuration
THIRDWEB_CLIENT_ID=your_client_id_here
THIRDWEB_SECRET_KEY=your_secret_key_here  # Optional, for backend
```

Get your Thirdweb credentials from: [https://thirdweb.com/dashboard](https://thirdweb.com/dashboard)

---

## VarityKit CLI Integration

Both ethers.js-based and Thirdweb-based deployment work side-by-side:

### Ethers.js Deployment (Existing)

```bash
varity deploy run
```

### Thirdweb Deployment (New)

```bash
varity thirdweb deploy ./out/MyContract.sol/MyContract.json
```

Both commands work! Choose based on preference.

---

## Testing Strategy

### 1. Test Thirdweb in Isolation

Create a test file to validate Thirdweb setup:

```typescript
// test-thirdweb.ts
import { ThirdwebWrapper, VarityTestnet } from '@varity/sdk';

async function testThirdweb() {
  const wrapper = new ThirdwebWrapper({
    chainId: VarityTestnet.chainId,
    rpcUrl: VarityTestnet.rpc[0],
    clientId: process.env.THIRDWEB_CLIENT_ID!,
    privateKey: process.env.DEPLOYER_PRIVATE_KEY!,
  });

  console.log('✅ Thirdweb wrapper initialized');

  // Test IPFS upload
  const uri = await wrapper.uploadToIPFS({ test: 'data' });
  console.log('✅ IPFS upload successful:', uri);

  // Test IPFS download
  const data = await wrapper.downloadFromIPFS(uri);
  console.log('✅ IPFS download successful:', data);
}

testThirdweb();
```

Run:
```bash
npx ts-node test-thirdweb.ts
```

### 2. Migrate One Component at a Time

Example: Migrate IPFS operations first

```typescript
// Before
import { uploadToIPFS } from './utils/ipfs-ethers';
const uri = await uploadToIPFS(data);

// After
import { wrapper } from './config/thirdweb';
const uri = await wrapper.uploadToIPFS(data);
```

### 3. Keep Fallbacks During Migration

```typescript
async function deployContract(params) {
  try {
    // Try Thirdweb first
    return await wrapper.deployContract(params);
  } catch (error) {
    console.warn('Thirdweb deployment failed, falling back to ethers.js');
    // Fallback to ethers.js
    return await ethersDeployContract(params);
  }
}
```

---

## Troubleshooting

### Issue: "Thirdweb SDK not installed"

**Solution:**
```bash
npm install @thirdweb-dev/sdk @thirdweb-dev/storage
```

### Issue: "Missing client ID"

**Solution:**
1. Go to [https://thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Create or select a project
3. Copy Client ID
4. Add to `.env`: `THIRDWEB_CLIENT_ID=...`

### Issue: "Chain not supported"

**Solution:**

Varity L3 is pre-configured in the SDK. If you see this error, ensure you're using the correct chain config:

```typescript
import { VarityTestnet } from '@varity/sdk';

const wrapper = new ThirdwebWrapper({
  chainId: VarityTestnet.chainId,  // 33529
  rpcUrl: VarityTestnet.rpc[0],     // Varity RPC URL
  clientId: process.env.THIRDWEB_CLIENT_ID,
  privateKey: process.env.PRIVATE_KEY,
});
```

### Issue: "Transaction failed"

**Solution:**

Check that your wallet has sufficient USDC (Varity L3 uses USDC as gas token):

```bash
# Check balance
varity thirdweb read 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d balanceOf \
  --params '["YOUR_ADDRESS"]'
```

---

## Migration Checklist

- [ ] Install Thirdweb SDK dependencies
- [ ] Get Thirdweb Client ID from dashboard
- [ ] Add `THIRDWEB_CLIENT_ID` to `.env`
- [ ] Test Thirdweb wrapper initialization
- [ ] Test IPFS upload/download
- [ ] Test contract deployment
- [ ] Test contract read operations
- [ ] Test contract write operations
- [ ] Update documentation for team
- [ ] Migrate one component at a time
- [ ] Keep ethers.js code as fallback
- [ ] Remove fallbacks after stability confirmed

---

## Support

Questions about migration?

- **Documentation**: [SDK README](../README.md)
- **CLI Reference**: [CLI_THIRDWEB_COMMANDS.md](./CLI_THIRDWEB_COMMANDS.md)
- **Examples**: [thirdweb-deployment-example.ts](../examples/thirdweb-deployment-example.ts)
- **Discord**: https://discord.gg/varity
- **Email**: support@varity.so

---

**Remember**: Migration is optional! Your existing ethers.js code will continue to work perfectly.
