# Smart Wallet Setup - Test Guide

> **Status**: ✅ Contracts Deployed | ✅ Config Updated | ✅ Build Passing
> **Last Updated**: January 19, 2026

---

## ✅ Configuration Complete

### Deployed Contracts (Varity L3 - Chain ID 33529)

| Contract | Address | Status |
|----------|---------|:------:|
| **SimplifiedPaymaster** | `0xeF467aef91d4e626C7e56967779069bEF22c4453` | ✅ Verified |
| **VarityWalletFactory** | `0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71` | ✅ Verified |
| **ERC-4337 EntryPoint** | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | ✅ Standard |

**Deployed By**: `0x20B7d1426649D9a573ba7Fd10592456264220cbF`
**Deployment Date**: January 13, 2026

**Explorer Links**:
- Paymaster: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/address/0xeF467aef91d4e626C7e56967779069bEF22c4453
- Factory: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/address/0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71

### Conduit Bundler Configuration

| Setting | Value |
|---------|-------|
| **Bundler URL** | `https://aa.conduit.xyz/api/v3/60cd06d8-a734-453c-84e9-5387c315ee2e/chain/33529` |
| **Paymaster Balance** | $5 USDC |
| **Chain ID** | 33529 (Varity L3 Testnet) |
| **Status** | ✅ Funded & Active |

---

## 🧪 Testing Checklist

### Phase 1: Verify Contract Configuration

Run in Node.js console or browser DevTools:

```typescript
import { VARITY_SMART_WALLET_CONTRACTS, CONDUIT_BUNDLER_CONFIG, areContractsDeployed } from '@varity/ui-kit/wallets/config';

console.log('Contracts Deployed:', areContractsDeployed()); // Should return true
console.log('Factory Address:', VARITY_SMART_WALLET_CONTRACTS.factoryAddress);
console.log('Paymaster Address:', VARITY_SMART_WALLET_CONTRACTS.paymasterAddress);
console.log('Bundler URL:', CONDUIT_BUNDLER_CONFIG.bundlerUrl);
```

**Expected Output**:
```
Contracts Deployed: true
Factory Address: 0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71
Paymaster Address: 0xeF467aef91d4e626C7e56967779069bEF22c4453
Bundler URL: https://aa.conduit.xyz/api/v3/60cd06d8-a734-453c-84e9-5387c315ee2e/chain/33529
```

### Phase 2: Test SmartWalletProvider Connection

```tsx
import { createThirdwebClient } from 'thirdweb';
import { SmartWalletProvider } from '@varity/ui-kit';
import { varityL3Testnet } from '@varity/sdk';

// 1. Create thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID, // Use actual credential
});

// 2. Create config
const config = {
  client,
  chain: varityL3Testnet,
  factoryAddress: '0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71',
  gasless: {
    enabled: true, // Enable gas sponsorship
  },
};

// 3. Wrap your app
function App() {
  return (
    <SmartWalletProvider config={config}>
      <YourAppComponents />
    </SmartWalletProvider>
  );
}
```

### Phase 3: Test Wallet Connection

Inside your component:

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function WalletTest() {
  const {
    account,
    isConnected,
    isDeployed,
    isGasless,
    connect,
    disconnect
  } = useSmartWallet();

  const handleConnect = async () => {
    try {
      // This will create/connect smart wallet
      await connect();
      console.log('Connected:', account?.address);
      console.log('Deployed:', isDeployed);
      console.log('Gasless:', isGasless);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleConnect}>
        {isConnected ? `Connected: ${account?.address}` : 'Connect Smart Wallet'}
      </button>
      {isConnected && (
        <div>
          <p>Deployed: {isDeployed ? 'Yes' : 'No (will deploy on first tx)'}</p>
          <p>Gasless: {isGasless ? 'Enabled' : 'Disabled'}</p>
        </div>
      )}
    </div>
  );
}
```

### Phase 4: Test Gasless Transaction

```tsx
import { useSmartWallet } from '@varity/ui-kit';

function GaslessTransactionTest() {
  const { sendTransaction, isConnected } = useSmartWallet();

  const handleSendTransaction = async () => {
    if (!isConnected) {
      alert('Connect wallet first!');
      return;
    }

    try {
      const txHash = await sendTransaction({
        to: '0x0000000000000000000000000000000000000000', // Test address
        data: '0x', // Empty data (just a transfer)
        value: '0', // 0 USDC (just testing gasless)
      });

      console.log('Transaction sent! Hash:', txHash);
      console.log('Explorer:', `https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/tx/${txHash}`);

      alert(`Success! View on explorer: ${txHash.slice(0, 10)}...`);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert(`Failed: ${error.message}`);
    }
  };

  return (
    <button onClick={handleSendTransaction} disabled={!isConnected}>
      Send Gasless Transaction
    </button>
  );
}
```

### Phase 5: Monitor Paymaster Balance

Check Conduit Dashboard for paymaster usage:
1. Go to Conduit Dashboard → Account Abstraction Tab
2. View paymaster balance (starts at $5 USDC)
3. Monitor gas sponsored per transaction
4. Add more funds when balance gets low

**Typical Gas Costs**:
- Simple transfer: ~0.01-0.02 USDC
- Contract interaction: ~0.02-0.05 USDC
- Complex transaction: ~0.05-0.10 USDC

**$5 USDC allows**: ~100-500 gasless transactions

---

## 🐛 Troubleshooting

### Issue: "Smart wallet not connected"

**Cause**: Need to call `connect()` first

**Fix**:
```tsx
const { connect } = useSmartWallet();
await connect();
```

### Issue: "Insufficient funds in paymaster"

**Cause**: $5 USDC paymaster balance depleted

**Fix**:
1. Go to Conduit Dashboard → Account Abstraction Tab
2. Add more USDC to paymaster balance
3. Retry transaction

### Issue: "Transaction failed: bundler rejected"

**Possible Causes**:
1. Invalid `to` address (must be valid hex address starting with 0x)
2. Invalid `data` field (must be hex string starting with 0x)
3. Paymaster out of funds
4. Factory not initialized

**Fix**:
```tsx
// Ensure proper hex formatting
const tx = {
  to: '0x...' as `0x${string}`, // Valid address
  data: '0x' as `0x${string}`, // Valid hex data
  value: '0',
};
```

### Issue: "Contract not deployed"

**Check**:
```bash
# Check if factory is deployed
curl https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71","latest"],"id":1}'

# Should return bytecode (not "0x" or "0x0")
```

### Issue: Factory needs initialization

**If factory contract requires initialization**:

```typescript
// Call factory.initialize(paymasterAddress, gasbudget)
// This may have been done during deployment - check factory contract
```

---

## 📊 Expected Behavior

### First-Time User Flow

1. **User connects wallet** → Creates smart wallet (off-chain)
2. **User sends first transaction** → Deploys smart wallet (paymaster pays gas)
3. **Subsequent transactions** → Uses existing smart wallet (gasless)

### Gas Sponsorship Flow

1. User initiates transaction
2. SmartWalletProvider prepares transaction
3. Bundler submits to paymaster for approval
4. Paymaster sponsors gas (using $5 USDC balance)
5. Transaction executes on-chain
6. User sees success (no gas deducted from their wallet)

---

## ✅ Success Criteria

- [x] Contracts deployed to Varity L3
- [x] Bundler URL configured
- [x] Paymaster funded with $5 USDC
- [x] SmartWalletProvider builds without errors
- [ ] Smart wallet connects successfully
- [ ] Gasless transaction executes successfully
- [ ] Transaction visible on Varity L3 explorer
- [ ] Paymaster balance decreases by gas cost

---

## 📝 Next Steps After Testing

1. **Verify factory initialization**
   - Check if `factory.initialize()` was called during deployment
   - If not, call it with paymaster address and gas budget

2. **Monitor paymaster balance**
   - Set up alerts for low balance ($1 USDC threshold)
   - Plan to top up regularly based on usage

3. **Integration testing**
   - Test with generic-template-dashboard
   - Test wallet creation flow
   - Test gasless transactions in production app

4. **Production deployment**
   - Deploy contracts to Varity L3 mainnet (when live)
   - Update config with mainnet addresses
   - Fund mainnet paymaster with sufficient USDC

---

## 🔗 Quick Links

- **Varity L3 Explorer**: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz
- **Factory Contract**: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/address/0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71
- **Paymaster Contract**: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/address/0xeF467aef91d4e626C7e56967779069bEF22c4453
- **Conduit Dashboard**: https://conduit.xyz/dashboard
- **Account Abstraction Tab**: Check paymaster balance and usage

---

**Last Updated**: January 19, 2026
**Status**: ✅ Ready for Testing
**Estimated Test Time**: 30-45 minutes
