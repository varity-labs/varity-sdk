# Varity Client API Reference

Complete API documentation for @varity/client-js v2.0.0

## Table of Contents

- [VarityClient](#varityclient)
- [WalletManager](#walletmanager)
- [ContractManager](#contractmanager)
- [SIWEAuth](#siweauth)
- [StorageManager](#storagemanager)
- [Utility Functions](#utility-functions)
- [React Hooks](#react-hooks)
- [Types](#types)
- [Errors](#errors)

---

## VarityClient

Main client class for Varity L3 blockchain interactions.

### Constructor

```typescript
new VarityClient(config?: VarityClientConfig)
```

**Parameters:**
- `config.clientId?: string` - Thirdweb client ID (default: Varity's client ID)
- `config.secretKey?: string` - Thirdweb secret key (server-side only)
- `config.chain?: 'varity-l3' | 'arbitrum-sepolia' | 'arbitrum-one' | Chain`
- `config.customChain?: ChainConfig` - Custom chain configuration

**Example:**
```typescript
const client = new VarityClient({
  clientId: 'your-client-id',
  chain: 'varity-l3'
});
```

### Properties

#### client.contracts
**Type:** `ContractManager`

Smart contract operations manager.

#### client.wallet
**Type:** `WalletManager`

Wallet connection and operations manager.

#### client.auth
**Type:** `SIWEAuth`

SIWE authentication manager.

#### client.storage
**Type:** `StorageManager`

IPFS storage operations manager.

### Methods

#### getConfig()
Get client configuration.

**Returns:** `Object`
- `chainId: number`
- `chainName: string`
- `rpcUrl: string`
- `nativeCurrency: Object`
- `isVarityL3: boolean`

#### getChain()
Get active chain object.

**Returns:** `Chain`

#### getChainId()
Get chain ID.

**Returns:** `number`

#### getChainName()
Get chain name.

**Returns:** `string`

#### isVarityL3()
Check if connected to Varity L3.

**Returns:** `boolean`

#### getNativeCurrency()
Get native currency information.

**Returns:** `Object`
- `name: string`
- `symbol: string`
- `decimals: number`

#### dispose()
Cleanup resources and disconnect.

**Returns:** `void`

---

## WalletManager

Manage wallet connections and operations.

### Methods

#### connect(options)
Connect to a wallet.

**Parameters:**
- `options.walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'injected' | 'embedded'`
- `options.walletConnectProjectId?: string` - Required for WalletConnect

**Returns:** `Promise<Account>`

**Example:**
```typescript
const account = await client.wallet.connect({
  walletType: 'metamask'
});
```

#### disconnect()
Disconnect wallet.

**Returns:** `void`

#### getAccount()
Get connected account.

**Returns:** `Account | null`

#### isConnected()
Check if wallet is connected.

**Returns:** `boolean`

#### getAddress()
Get wallet address.

**Returns:** `string | null`

#### getBalance()
Get native balance in smallest unit.

**Returns:** `Promise<bigint>`

**Example:**
```typescript
const balance = await client.wallet.getBalance();
console.log(formatUSDC(balance), 'USDC');
```

#### getWalletInfo()
Get complete wallet information.

**Returns:** `Promise<WalletInfo>`
- `address: string`
- `balance: string` (raw)
- `balanceFormatted: string`
- `chainId: number`

#### signMessage(message)
Sign a message.

**Parameters:**
- `message: string`

**Returns:** `Promise<string>` - Signature

#### signTypedData(domain, types, value)
Sign typed data (EIP-712).

**Parameters:**
- `domain: Object` - Domain separator
- `types: Object` - Type definitions
- `value: Object` - Value to sign

**Returns:** `Promise<string>` - Signature

#### sendTransaction(to, amount)
Send native currency transaction.

**Parameters:**
- `to: string` - Recipient address
- `amount: bigint` - Amount in smallest unit

**Returns:** `Promise<string>` - Transaction hash

**Example:**
```typescript
const txHash = await client.wallet.sendTransaction(
  '0xRecipient...',
  parseUSDC('1.5')
);
```

#### switchChain(chainId)
Switch to different chain.

**Parameters:**
- `chainId: number`

**Returns:** `Promise<void>`

#### getChainId()
Get current chain ID.

**Returns:** `Promise<number>`

#### addToken(address, symbol, decimals, image?)
Add custom token to wallet.

**Parameters:**
- `address: string` - Token contract address
- `symbol: string` - Token symbol
- `decimals: number` - Token decimals
- `image?: string` - Token image URL

**Returns:** `Promise<void>`

---

## ContractManager

Smart contract interactions.

### Methods

#### read(options)
Read from contract (no gas required).

**Parameters:**
- `options.address: string` - Contract address
- `options.abi: any[]` - Contract ABI
- `options.functionName: string` - Function to call
- `options.args?: any[]` - Function arguments

**Returns:** `Promise<any>` - Contract return value

**Example:**
```typescript
const balance = await client.contracts.read({
  address: '0x...',
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: ['0x...']
});
```

#### write(options, account)
Write to contract (requires gas and signature).

**Parameters:**
- `options.address: string`
- `options.abi: any[]`
- `options.functionName: string`
- `options.args?: any[]`
- `options.value?: bigint` - ETH/USDC value to send
- `account: Account` - Signer account

**Returns:** `Promise<TransactionResult>`

#### deploy(options, account)
Deploy new contract.

**Parameters:**
- `options.abi: any[]`
- `options.bytecode: string`
- `options.constructorArgs?: any[]`
- `account: Account`

**Returns:** `Promise<{address: string, transactionHash: string}>`

#### getEvents(filter)
Get contract events.

**Parameters:**
- `filter.address: string`
- `filter.abi: any[]`
- `filter.eventName: string`
- `filter.fromBlock?: number`
- `filter.toBlock?: number`

**Returns:** `Promise<ContractEvent[]>`

#### watchEvents(filter, callback)
Watch events in real-time.

**Parameters:**
- `filter: ContractEventFilter`
- `callback: (event: ContractEvent) => void`

**Returns:** `() => void` - Cleanup function

**Example:**
```typescript
const stopWatching = client.contracts.watchEvents({
  address: '0x...',
  abi: ERC20_ABI,
  eventName: 'Transfer',
  fromBlock: 'latest'
}, (event) => {
  console.log('New transfer:', event);
});

// Stop watching
stopWatching();
```

#### estimateGas(options, account)
Estimate gas for transaction.

**Parameters:**
- `options: ContractWriteOptions`
- `account: Account`

**Returns:** `Promise<bigint>`

#### batchRead(calls)
Read multiple contracts in parallel.

**Parameters:**
- `calls: ContractReadOptions[]`

**Returns:** `Promise<any[]>`

#### batchWrite(calls, account)
Write to multiple contracts in sequence.

**Parameters:**
- `calls: ContractWriteOptions[]`
- `account: Account`

**Returns:** `Promise<TransactionResult[]>`

---

## SIWEAuth

Sign-In with Ethereum authentication.

### Methods

#### generateMessage(params)
Generate SIWE message (EIP-4361).

**Parameters:**
- `params.domain?: string` - Domain (default: window.location.host)
- `params.address: string` - Wallet address
- `params.statement?: string` - Statement text
- `params.uri?: string` - URI (default: window.location.origin)
- `params.version?: string` - Version (default: '1')
- `params.chainId?: number` - Chain ID
- `params.nonce?: string` - Random nonce
- `params.issuedAt?: string` - Issued timestamp
- `params.expirationTime?: string` - Expiration
- `params.notBefore?: string` - Not before time
- `params.requestId?: string` - Request ID
- `params.resources?: string[]` - Resource list

**Returns:** `Promise<string>` - SIWE message

#### signMessage(message, account)
Sign SIWE message.

**Parameters:**
- `message: string` - SIWE message
- `account: Account` - Signer account

**Returns:** `Promise<SIWESignatureResult>`

#### verify(result)
Verify SIWE signature.

**Parameters:**
- `result: SIWESignatureResult`

**Returns:** `Promise<SIWEVerifyResult>`

#### createSession(result, expiresInSeconds?)
Create authentication session.

**Parameters:**
- `result: SIWESignatureResult`
- `expiresInSeconds?: number` - Session duration (default: 86400)

**Returns:** `Promise<SIWESession>`

#### getSession(address)
Get active session for address.

**Parameters:**
- `address: string`

**Returns:** `SIWESession | null`

#### deleteSession(address)
Delete session.

**Parameters:**
- `address: string`

**Returns:** `void`

#### clearAllSessions()
Clear all sessions.

**Returns:** `void`

#### authenticateWithAPI(result, apiUrl)
Authenticate with backend API.

**Parameters:**
- `result: SIWESignatureResult`
- `apiUrl: string`

**Returns:** `Promise<string>` - Auth token

#### validateWithAPI(token, apiUrl)
Validate token with API.

**Parameters:**
- `token: string`
- `apiUrl: string`

**Returns:** `Promise<boolean>`

---

## StorageManager

IPFS storage operations via Thirdweb.

### Methods

#### upload(file, options?)
Upload file to IPFS.

**Parameters:**
- `file: File | Blob | Buffer | string`
- `options?.metadata: Record<string, any>`
- `options?.onProgress: (progress: number) => void`

**Returns:** `Promise<StorageUploadResult>`

#### uploadBatch(files, options?)
Upload multiple files.

**Parameters:**
- `files: (File | Blob | Buffer | string)[]`
- `options?: StorageUploadOptions`

**Returns:** `Promise<StorageUploadResult[]>`

#### uploadJSON(data, options?)
Upload JSON data.

**Parameters:**
- `data: any`
- `options?: StorageUploadOptions`

**Returns:** `Promise<StorageUploadResult>`

#### download(cid, options?)
Download from IPFS.

**Parameters:**
- `cid: string` - IPFS CID
- `options?: StorageDownloadOptions`

**Returns:** `Promise<any>`

#### downloadJSON(cid, options?)
Download JSON from IPFS.

**Parameters:**
- `cid: string`
- `options?: StorageDownloadOptions`

**Returns:** `Promise<any>`

#### uploadNFTMetadata(metadata)
Upload NFT metadata.

**Parameters:**
- `metadata.name: string`
- `metadata.description: string`
- `metadata.image: string`
- `metadata.attributes?: Array<{trait_type: string, value: any}>`

**Returns:** `Promise<StorageUploadResult>`

#### uploadDirectory(files)
Upload directory to IPFS.

**Parameters:**
- `files: Array<{name: string, content: File | Blob | Buffer | string}>`

**Returns:** `Promise<StorageUploadResult>`

#### getGatewayUrl(cid, gateway?)
Get IPFS gateway URL.

**Parameters:**
- `cid: string`
- `gateway?: string` - Custom gateway URL

**Returns:** `string`

#### getIPFSUri(cid)
Get IPFS URI.

**Parameters:**
- `cid: string`

**Returns:** `string` - `ipfs://{cid}`

#### isValidCID(cid)
Validate IPFS CID.

**Parameters:**
- `cid: string`

**Returns:** `boolean`

---

## Utility Functions

### USDC Functions

#### formatUSDC(amount)
Format raw USDC to human-readable.

```typescript
formatUSDC(BigInt(1_500_000)) // "1.500000"
```

#### parseUSDC(amount)
Parse human-readable USDC to raw.

```typescript
parseUSDC("2.5") // BigInt(2_500_000)
```

#### getUSDCAmount(amount)
Get amount object.

**Returns:** `USDCAmount`
- `raw: bigint`
- `formatted: string`
- `decimals: number`

### Address Functions

#### isValidAddress(address)
Validate Ethereum address.

#### formatAddress(address)
Format address with checksum.

#### shortenAddress(address, chars?)
Shorten address for display.

```typescript
shortenAddress("0x1234...7890", 4) // "0x1234...7890"
```

### Chain Functions

#### getChainName(chainId)
Get chain name from ID.

#### getBlockExplorerUrl(chainId)
Get block explorer URL.

#### getTxUrl(chainId, txHash)
Get transaction URL.

#### getAddressUrl(chainId, address)
Get address URL.

---

## React Hooks

### useVarityClient(config?)
Initialize Varity client.

**Returns:** `VarityClient`

### useVarityWallet(client)
Wallet management hook.

**Returns:**
- `connect: (options) => Promise<void>`
- `disconnect: () => void`
- `isConnected: boolean`
- `isConnecting: boolean`
- `account: Account | null`
- `walletInfo: WalletInfo | null`
- `address: string | null`
- `balance: string`
- `chainId: number | null`
- `refreshBalance: () => Promise<void>`
- `error: Error | null`

### useVarityBalance(client, autoRefresh?, refreshInterval?)
Balance tracking with auto-refresh.

**Returns:**
- `balance: string`
- `isLoading: boolean`
- `error: Error | null`
- `refresh: () => Promise<void>`

### useVarityContract(client, account)
Contract interactions hook.

**Returns:**
- `read: (options) => Promise<any>`
- `write: (options) => Promise<TransactionResult>`
- `isLoading: boolean`
- `error: Error | null`

### useVarityAuth(client, account)
SIWE authentication hook.

**Returns:**
- `signIn: (statement?) => Promise<SIWESession>`
- `signOut: () => void`
- `isAuthenticated: boolean`
- `session: SIWESession | null`
- `isLoading: boolean`
- `error: Error | null`

### useVarityStorage(client)
IPFS storage hook.

**Returns:**
- `upload: (file, options?) => Promise<StorageUploadResult>`
- `download: (cid) => Promise<any>`
- `uploadJSON: (data, options?) => Promise<StorageUploadResult>`
- `isUploading: boolean`
- `uploadProgress: number`
- `error: Error | null`

### useVarityChain(client)
Chain information hook.

**Returns:**
- `chainId: number`
- `chainName: string`
- `rpcUrl: string`
- `nativeCurrency: Object`
- `isVarityL3: boolean`

---

## Types

### VarityClientConfig
```typescript
interface VarityClientConfig {
  clientId?: string;
  secretKey?: string;
  chain?: 'varity-l3' | 'arbitrum-sepolia' | 'arbitrum-one' | Chain;
  customChain?: ChainConfig;
}
```

### ChainConfig
```typescript
interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
}
```

### WalletInfo
```typescript
interface WalletInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  chainId: number;
}
```

### SIWESession
```typescript
interface SIWESession {
  address: string;
  chainId: number;
  issuedAt: Date;
  expiresAt: Date;
  signature: string;
}
```

### StorageUploadResult
```typescript
interface StorageUploadResult {
  cid: string;
  url: string;
  gateway: string;
}
```

### USDCAmount
```typescript
interface USDCAmount {
  raw: bigint;
  formatted: string;
  decimals: number;
}
```

---

## Errors

### VarityError
Base error class.

**Properties:**
- `message: string`
- `code: string`
- `details?: any`

### WalletError
Wallet operation errors.

### ContractError
Smart contract errors.

### TransactionError
Transaction errors.

### StorageError
IPFS storage errors.

### AuthenticationError
SIWE authentication errors.

---

## Constants

### USDC_DECIMALS
```typescript
const USDC_DECIMALS = 6;
```

### USDC_MULTIPLIER
```typescript
const USDC_MULTIPLIER = BigInt(10 ** 6);
```

### Chain Configurations
```typescript
export const VARITY_L3_CHAIN: ChainConfig;
export const ARBITRUM_SEPOLIA_CHAIN: ChainConfig;
export const ARBITRUM_ONE_CHAIN: ChainConfig;
```

---

**Version:** 2.0.0
**Last Updated:** 2025-11-14
**License:** MIT
