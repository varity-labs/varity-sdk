# Varity Thirdweb Go Client - API Reference Card

## Quick Reference

### Package Import
```go
import "github.com/varity/client-go/thirdweb"
```

---

## Client Operations

### NewVarityClient
```go
client, err := thirdweb.NewVarityClient(thirdweb.Config{
    ChainID:          33529,
    PrivateKey:       "0x...",
    ThirdwebClientID: "a35636133eb5ec6f30eb9f4c15fce2f3",
    RPCURL:           "https://...",
    ThirdwebSecretKey: "...",
    IPFSGatewayURL:   "https://gateway.pinata.cloud",
})
```

### Client Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `GetConfig()` | `map[string]interface{}` | Get client configuration |
| `GetChainConfig()` | `*ChainConfig` | Get chain configuration |
| `GetAddress()` | `common.Address` | Get wallet address |
| `GetEthClient()` | `*ethclient.Client` | Get underlying eth client |
| `GetChainID(ctx)` | `*big.Int, error` | Get network chain ID |
| `GetBlockNumber(ctx)` | `uint64, error` | Get latest block number |
| `GetGasPrice(ctx)` | `*big.Int, error` | Get current gas price |
| `GetNonce(ctx, addr)` | `uint64, error` | Get account nonce |
| `Close()` | - | Close connection |

---

## Wallet Operations

| Method | Returns | Description |
|--------|---------|-------------|
| `ConnectWallet(key)` | `error` | Connect with private key |
| `GetBalance(ctx, addr)` | `*WalletBalance, error` | Get USDC balance |
| `SignMessage(msg)` | `[]byte, error` | Sign arbitrary message |
| `SignMessageHash(hash)` | `[]byte, error` | Sign message hash |
| `VerifySignature(msg, sig, addr)` | `bool, error` | Verify signature |
| `SendTransaction(ctx, to, val, data, opts)` | `common.Hash, error` | Send raw transaction |
| `Transfer(ctx, to, amount)` | `common.Hash, error` | Transfer USDC |
| `GetTransactionHistory(ctx, addr, limit)` | `*TransactionHistory, error` | Get transaction history |
| `CreateRandomWallet()` | `*ecdsa.PrivateKey, common.Address, error` | Generate new wallet |
| `PrivateKeyToHex(key)` | `string` | Convert key to hex |

---

## Smart Contract Operations

### Deploy Contract
```go
contractAddr, txHash, err := client.DeployContract(ctx, &thirdweb.ContractDeployment{
    Bytecode:        bytecode,
    ABI:             abiJSON,
    ConstructorArgs: []interface{}{arg1, arg2},
}, options)
```

### Read Contract
```go
result, err := client.ReadContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "balanceOf",
    Args:    []interface{}{address},
})
```

### Write Contract
```go
txHash, err := client.WriteContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "transfer",
    Args:    []interface{}{recipient, amount},
}, options)
```

### Contract Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `DeployContract(ctx, deployment, opts)` | `common.Address, common.Hash, error` | Deploy contract |
| `ReadContract(ctx, call)` | `[]interface{}, error` | Call view function |
| `WriteContract(ctx, call, opts)` | `common.Hash, error` | Call state-changing function |
| `GetContract(addr, abi)` | `*BoundContract, error` | Get bound contract |
| `WatchEvents(ctx, filter, chan)` | `error` | Subscribe to events |
| `GetPastEvents(ctx, filter)` | `[]*Event, error` | Query past events |
| `WaitForTransaction(ctx, hash)` | `*TransactionReceipt, error` | Wait for confirmation |

---

## SIWE Authentication

### Quick Auth Flow
```go
jwt, err := client.AuthenticateWithSIWE(
    "app.varity.xyz",
    "Sign in to Varity",
    "https://app.varity.xyz",
    60, // session minutes
)
```

### SIWE Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `GenerateSIWEMessage(domain, addr, stmt, uri)` | `*SIWEMessage, error` | Create SIWE message |
| `FormatSIWEMessage(msg)` | `string` | Format per EIP-4361 |
| `SignSIWEMessage(msg)` | `*SIWESignature, error` | Sign SIWE message |
| `VerifySIWESignature(sig)` | `bool, error` | Verify SIWE signature |
| `CreateSession(sig, minutes)` | `*JWTToken, error` | Generate JWT token |
| `VerifySession(token)` | `*JWTToken, error` | Verify JWT token |
| `AuthenticateWithSIWE(domain, stmt, uri, min)` | `*JWTToken, error` | Complete auth flow |

---

## IPFS Storage

### Upload File
```go
result, err := client.UploadToIPFS(ctx, data, "file.txt")
fmt.Printf("CID: %s\n", result.CID)
fmt.Printf("URL: %s\n", result.GatewayURL)
```

### Storage Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `UploadToIPFS(ctx, data, filename)` | `*IPFSUploadResult, error` | Upload file |
| `DownloadFromIPFS(ctx, cid)` | `[]byte, error` | Download file |
| `UploadJSON(ctx, data)` | `*IPFSUploadResult, error` | Upload JSON |
| `DownloadJSON(ctx, cid, target)` | `error` | Download JSON |
| `PinContent(ctx, cid)` | `error` | Pin content |
| `GetGatewayURL(cid)` | `string` | Generate gateway URL |
| `IPFSURIToHTTP(uri)` | `string` | Convert IPFS URI |
| `BatchUploadToIPFS(ctx, files)` | `[]*IPFSUploadResult, error` | Upload multiple files |

---

## Utility Functions

### USDC Operations (6 decimals)
```go
// Format: 1500000 → "1.500000"
formatted := thirdweb.FormatUSDC(amount)

// Parse: "100.50" → 100500000
amount, err := thirdweb.ParseUSDC("100.50")
```

### Address Operations
```go
valid := thirdweb.ValidateAddress(addr)
checksummed, err := thirdweb.ToChecksumAddress(addr)
isZero := thirdweb.IsZeroAddress(addr)
```

### Hash Functions
```go
hash := thirdweb.Keccak256Hash(data)
hash := thirdweb.Keccak256HashString(text)
selector := thirdweb.GetFunctionSelector("transfer(address,uint256)")
eventHash := thirdweb.GetEventSignature("Transfer(address,address,uint256)")
```

### Hex Operations
```go
hex := thirdweb.EncodeHex(data)
data, err := thirdweb.DecodeHex(hexStr)
```

### Gas Utilities
```go
gwei := thirdweb.WeiToGwei(wei)
wei := thirdweb.GweiToWei(gwei)
formatted := thirdweb.FormatGasPrice(gasPrice)
formatted := thirdweb.FormatGas(gas)
```

### Token Operations
```go
formatted := thirdweb.FormatTokenAmount(amount, decimals)
amount, err := thirdweb.ParseTokenAmount("100.5", decimals)
```

### All Utility Functions
| Function | Returns | Description |
|----------|---------|-------------|
| `FormatUSDC(amount)` | `string` | Format USDC (6 decimals) |
| `ParseUSDC(str)` | `*big.Int, error` | Parse USDC string |
| `ValidateAddress(addr)` | `bool` | Validate address |
| `ToChecksumAddress(addr)` | `string, error` | Checksum format |
| `IsZeroAddress(addr)` | `bool` | Check if zero |
| `Keccak256Hash(data)` | `[]byte` | Hash data |
| `Keccak256HashString(str)` | `[]byte` | Hash string |
| `EncodeHex(data)` | `string` | Encode to hex |
| `DecodeHex(hex)` | `[]byte, error` | Decode from hex |
| `WeiToGwei(wei)` | `*big.Int` | Convert to gwei |
| `GweiToWei(gwei)` | `*big.Int` | Convert to wei |
| `FormatGasPrice(price)` | `string` | Format gas price |
| `FormatGas(gas)` | `string` | Format gas amount |
| `GetFunctionSelector(sig)` | `[]byte` | Get 4-byte selector |
| `PadBytes32(data)` | `[]byte` | Pad to 32 bytes |
| `UnpadBytes32(data)` | `[]byte` | Remove padding |
| `FormatTokenAmount(amt, dec)` | `string` | Format token amount |
| `ParseTokenAmount(str, dec)` | `*big.Int, error` | Parse token amount |

---

## Chain Configuration

### Supported Chains
```go
// Varity L3 Testnet
chain := thirdweb.VarityL3Testnet
// ChainID: 33529
// Currency: USDC (6 decimals)

// Arbitrum Sepolia
chain := thirdweb.ArbitrumSepolia
// ChainID: 421614
// Currency: ETH (18 decimals)
```

### Chain Methods
| Function | Returns | Description |
|----------|---------|-------------|
| `GetChainByID(id)` | `*ChainConfig` | Get chain by ID |
| `GetChainByName(name)` | `*ChainConfig` | Get chain by name |
| `SupportedChains()` | `[]ChainConfig` | List all chains |

---

## Type Definitions

### Config
```go
type Config struct {
    ChainID           int64
    PrivateKey        string
    RPCURL            string
    ThirdwebClientID  string
    ThirdwebSecretKey string
    IPFSGatewayURL    string
}
```

### WalletBalance
```go
type WalletBalance struct {
    Address          common.Address
    Balance          *big.Int
    FormattedBalance string
}
```

### TransactionReceipt
```go
type TransactionReceipt struct {
    TxHash          common.Hash
    Status          uint64
    BlockNumber     *big.Int
    GasUsed         uint64
    ContractAddress *common.Address
    Logs            []*types.Log
}
```

### SIWEMessage
```go
type SIWEMessage struct {
    Domain         string
    Address        common.Address
    Statement      string
    URI            string
    Version        string
    ChainId        int64
    Nonce          string
    IssuedAt       string
    ExpirationTime string
    NotBefore      string
}
```

### IPFSUploadResult
```go
type IPFSUploadResult struct {
    CID        string
    GatewayURL string
    Size       int64
    PinataPin  bool
}
```

---

## Error Handling

### Error Type
```go
type Error struct {
    Code    string
    Message string
    Details interface{}
}
```

### Error Codes
- `INVALID_CONFIG` - Invalid configuration
- `INVALID_ADDRESS` - Invalid address format
- `INVALID_PRIVATE_KEY` - Invalid private key
- `INSUFFICIENT_BALANCE` - Not enough balance
- `TRANSACTION_FAILED` - Transaction failed
- `CONTRACT_CALL_FAILED` - Contract call failed
- `INVALID_ABI` - Invalid ABI
- `INVALID_SIGNATURE` - Signature verification failed
- `STORAGE_ERROR` - IPFS error
- `NETWORK_ERROR` - Network connection error

### Usage
```go
result, err := client.GetBalance(ctx, address)
if err != nil {
    if verr, ok := err.(*thirdweb.Error); ok {
        fmt.Printf("Error: %s (%s)\n", verr.Message, verr.Code)
    }
}
```

---

## Context Usage

### With Timeout
```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

balance, err := client.GetBalance(ctx, address)
```

### With Cancellation
```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()

// Cancel from another goroutine
go func() {
    time.Sleep(5 * time.Second)
    cancel()
}()

result, err := client.ReadContract(ctx, call)
```

---

## Common Patterns

### Check Balance Before Transfer
```go
balance, err := client.GetBalance(ctx, address)
if err != nil {
    return err
}

amount, _ := thirdweb.ParseUSDC("100.50")
if balance.Balance.Cmp(amount) < 0 {
    return errors.New("insufficient balance")
}

txHash, err := client.Transfer(ctx, recipient, amount)
```

### Deploy and Interact with Contract
```go
// Deploy
contractAddr, txHash, err := client.DeployContract(ctx, deployment, nil)
if err != nil {
    return err
}

// Wait for deployment
receipt, err := client.WaitForTransaction(ctx, txHash)
if err != nil || receipt.Status != 1 {
    return errors.New("deployment failed")
}

// Read from contract
result, err := client.ReadContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "getValue",
    Args:    []interface{}{},
})
```

### Complete SIWE Auth
```go
// Step 1: Generate and sign
message, _ := client.GenerateSIWEMessage(domain, address, statement, uri)
signature, _ := client.SignSIWEMessage(message)

// Step 2: Verify and create session
valid, _ := client.VerifySIWESignature(signature)
if !valid {
    return errors.New("invalid signature")
}

jwt, _ := client.CreateSession(signature, 60)

// Step 3: Later, verify session
verified, err := client.VerifySession(jwt.Token)
if err != nil {
    return errors.New("session expired")
}
```

### Upload and Download from IPFS
```go
// Upload
data := []byte("Hello, Varity!")
result, err := client.UploadToIPFS(ctx, data, "hello.txt")
if err != nil {
    return err
}

fmt.Printf("Uploaded: %s\n", result.CID)

// Download
downloaded, err := client.DownloadFromIPFS(ctx, result.CID)
if err != nil {
    return err
}

fmt.Printf("Content: %s\n", string(downloaded))
```

---

## Best Practices

### 1. Always Close Client
```go
client, err := thirdweb.NewVarityClient(config)
if err != nil {
    return err
}
defer client.Close()
```

### 2. Use Context with Timeout
```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
```

### 3. Check Errors
```go
result, err := client.DoSomething(ctx)
if err != nil {
    return fmt.Errorf("operation failed: %w", err)
}
```

### 4. Validate Addresses
```go
if !thirdweb.ValidateAddress(userInput) {
    return errors.New("invalid address")
}
```

### 5. Format USDC Properly
```go
amount, err := thirdweb.ParseUSDC(userInput)
if err != nil {
    return err
}
formatted := thirdweb.FormatUSDC(amount)
```

---

## Quick Examples

### Get Balance
```go
balance, _ := client.GetBalance(ctx, "0x...")
fmt.Printf("Balance: %s USDC\n", balance.FormattedBalance)
```

### Transfer
```go
amount, _ := thirdweb.ParseUSDC("10.50")
txHash, _ := client.Transfer(ctx, "0x...", amount)
fmt.Printf("TX: %s\n", txHash.Hex())
```

### Sign Message
```go
signature, _ := client.SignMessage("Hello!")
fmt.Printf("Sig: %s\n", thirdweb.EncodeHex(signature))
```

### Deploy Contract
```go
addr, tx, _ := client.DeployContract(ctx, deployment, nil)
fmt.Printf("Contract: %s\n", addr.Hex())
```

### Authenticate
```go
jwt, _ := client.AuthenticateWithSIWE(domain, statement, uri, 60)
fmt.Printf("Token: %s\n", jwt.Token)
```

### Upload to IPFS
```go
result, _ := client.UploadToIPFS(ctx, data, "file.txt")
fmt.Printf("CID: %s\n", result.CID)
```

---

## Testing

### Run Tests
```bash
go test ./thirdweb -v              # All tests
go test ./thirdweb -cover          # With coverage
go test ./thirdweb -run TestName   # Specific test
go test ./thirdweb -bench=.        # Benchmarks
```

### Run Examples
```bash
go run examples/basic/main.go
go run examples/wallet/main.go
go run examples/auth/main.go
go run examples/contracts/main.go
```

---

## Package Info

- **Module**: github.com/varity/client-go
- **Package**: thirdweb
- **Version**: v1.0.0
- **Go Version**: 1.21+
- **License**: MIT

---

## Links

- [Quick Start Guide](./QUICK_START.md)
- [Complete Documentation](./THIRDWEB_README.md)
- [Package Report](./PACKAGE_REPORT.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [GitHub](https://github.com/varity/client-go)
- [Documentation](https://docs.varity.xyz)
