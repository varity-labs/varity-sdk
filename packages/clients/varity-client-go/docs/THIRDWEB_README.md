## # Varity Thirdweb Go Client

Comprehensive Thirdweb-compatible Go client for Varity L3 blockchain operations.

## Features

- **Wallet Operations**: Connect, sign, transfer, and manage wallets
- **Smart Contracts**: Deploy, read, write, and interact with contracts
- **SIWE Authentication**: Complete Sign-In with Ethereum flow
- **IPFS Storage**: Upload, download, and pin content to IPFS
- **Event Monitoring**: Watch and query contract events
- **USDC Native**: First-class support for 6-decimal USDC
- **Type Safe**: Full Go type safety and error handling
- **Context Support**: Proper context handling for cancellation

## Installation

```bash
go get github.com/varity/client-go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/varity/client-go/thirdweb"
)

func main() {
    // Create client
    client, err := thirdweb.NewVarityClient(thirdweb.Config{
        ChainID:          33529,
        PrivateKey:       "0x...",
        ThirdwebClientID: "a35636133eb5ec6f30eb9f4c15fce2f3",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Get balance
    ctx := context.Background()
    balance, err := client.GetBalance(ctx, "0x...")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Balance: %s USDC\n", thirdweb.FormatUSDC(balance.Balance))
}
```

## Configuration

```go
type Config struct {
    // ChainID - Varity L3 chain ID (default: 33529)
    ChainID int64

    // PrivateKey - Wallet private key (optional)
    PrivateKey string

    // RPCURL - RPC endpoint (default: Varity L3 RPC)
    RPCURL string

    // ThirdwebClientID - Thirdweb client ID
    ThirdwebClientID string

    // ThirdwebSecretKey - For server-side operations (optional)
    ThirdwebSecretKey string

    // IPFSGatewayURL - IPFS gateway (default: Pinata)
    IPFSGatewayURL string
}
```

### Supported Chains

- **Varity L3 Testnet** (Chain ID: 33529)
- **Arbitrum Sepolia** (Chain ID: 421614)

## API Reference

### Client Operations

```go
// Create client
client, err := thirdweb.NewVarityClient(config)

// Get configuration
config := client.GetConfig()
chainConfig := client.GetChainConfig()
address := client.GetAddress()

// Network operations
chainID, err := client.GetChainID(ctx)
blockNumber, err := client.GetBlockNumber(ctx)
gasPrice, err := client.GetGasPrice(ctx)
nonce, err := client.GetNonce(ctx, address)

// Close connection
client.Close()
```

### Wallet Operations

```go
// Connect wallet
err := client.ConnectWallet(privateKey)

// Get balance
balance, err := client.GetBalance(ctx, addressStr)
fmt.Printf("Balance: %s USDC\n", balance.FormattedBalance)

// Sign message
signature, err := client.SignMessage(message)

// Verify signature
valid, err := client.VerifySignature(message, signatureHex, address)

// Send transaction
txHash, err := client.SendTransaction(ctx, toAddress, value, data, options)

// Transfer USDC
amount, _ := thirdweb.ParseUSDC("100.50")
txHash, err := client.Transfer(ctx, recipientAddress, amount)

// Get transaction history
history, err := client.GetTransactionHistory(ctx, address, limit)

// Create random wallet
privateKey, address, err := thirdweb.CreateRandomWallet()
```

### Smart Contract Operations

```go
// Deploy contract
contractAddr, txHash, err := client.DeployContract(ctx, &thirdweb.ContractDeployment{
    Bytecode:        bytecode,
    ABI:             abiJSON,
    ConstructorArgs: []interface{}{arg1, arg2},
}, options)

// Read from contract (view/pure function)
result, err := client.ReadContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "balanceOf",
    Args:    []interface{}{address},
})

// Write to contract (state-changing function)
txHash, err := client.WriteContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "transfer",
    Args:    []interface{}{recipient, amount},
}, options)

// Get bound contract instance
boundContract, err := client.GetContract(contractAddr, abiJSON)
result, err := boundContract.Call(ctx, "balanceOf", address)
txHash, err := boundContract.Transact(ctx, "transfer", options, recipient, amount)

// Watch events
eventChan := make(chan *thirdweb.Event, 100)
err := client.WatchEvents(ctx, &thirdweb.EventFilter{
    Address:   contractAddr,
    Topics:    [][]common.Hash{{eventSignature}},
    FromBlock: big.NewInt(0),
}, eventChan)

// Get past events
events, err := client.GetPastEvents(ctx, eventFilter)
```

### SIWE Authentication

```go
// Generate SIWE message
message, err := client.GenerateSIWEMessage(
    "app.varity.xyz",
    address,
    "Sign in to Varity",
    "https://app.varity.xyz",
)

// Format SIWE message (EIP-4361)
formatted := thirdweb.FormatSIWEMessage(message)

// Sign SIWE message
signature, err := client.SignSIWEMessage(message)

// Verify SIWE signature
valid, err := client.VerifySIWESignature(signature)

// Create JWT session
jwt, err := client.CreateSession(signature, sessionMinutes)

// Verify JWT session
verifiedJWT, err := client.VerifySession(jwt.Token)

// Complete authentication flow
jwt, err := client.AuthenticateWithSIWE(
    "app.varity.xyz",
    "Sign in to Varity",
    "https://app.varity.xyz/login",
    60, // session minutes
)
```

### IPFS Storage

```go
// Upload to IPFS
result, err := client.UploadToIPFS(ctx, data, "filename.txt")
fmt.Printf("CID: %s\n", result.CID)
fmt.Printf("Gateway URL: %s\n", result.GatewayURL)

// Download from IPFS
data, err := client.DownloadFromIPFS(ctx, cid)

// Upload JSON
result, err := client.UploadJSON(ctx, jsonData)

// Download JSON
var target MyStruct
err := client.DownloadJSON(ctx, cid, &target)

// Pin content
err := client.PinContent(ctx, cid)

// Get gateway URL
url := client.GetGatewayURL(cid)

// Convert IPFS URI to HTTP
httpURL := client.IPFSURIToHTTP("ipfs://QmHash...")

// Batch upload
results, err := client.BatchUploadToIPFS(ctx, map[string][]byte{
    "file1.txt": data1,
    "file2.txt": data2,
})
```

### Utility Functions

```go
// USDC formatting (6 decimals)
formatted := thirdweb.FormatUSDC(amount)
amount, err := thirdweb.ParseUSDC("100.50")

// Address validation
valid := thirdweb.ValidateAddress(address)
checksummed, err := thirdweb.ToChecksumAddress(address)
isZero := thirdweb.IsZeroAddress(address)

// Hash functions
hash := thirdweb.Keccak256Hash(data)
hash := thirdweb.Keccak256HashString(text)

// Hex encoding/decoding
hex := thirdweb.EncodeHex(data)
data, err := thirdweb.DecodeHex(hex)

// Gas utilities
gwei := thirdweb.WeiToGwei(wei)
wei := thirdweb.GweiToWei(gwei)
formatted := thirdweb.FormatGasPrice(gasPrice)

// Function selectors
selector := thirdweb.GetFunctionSelector("transfer(address,uint256)")

// Event signatures
eventHash := thirdweb.GetEventSignature("Transfer(address,address,uint256)")

// Token amount formatting
formatted := thirdweb.FormatTokenAmount(amount, decimals)
amount, err := thirdweb.ParseTokenAmount("100.5", decimals)
```

### Chain Configuration

```go
// Get chain by ID
chain := thirdweb.GetChainByID(33529)

// Get chain by name
chain := thirdweb.GetChainByName("varity")

// List all supported chains
chains := thirdweb.SupportedChains()

// Predefined chains
varietyL3 := thirdweb.VarityL3Testnet
arbSepolia := thirdweb.ArbitrumSepolia
```

## Examples

### Basic Usage

```go
client, err := thirdweb.NewVarityClient(thirdweb.Config{
    ChainID:          33529,
    ThirdwebClientID: "a35636133eb5ec6f30eb9f4c15fce2f3",
})
if err != nil {
    log.Fatal(err)
}
defer client.Close()

ctx := context.Background()

// Get network information
chainID, _ := client.GetChainID(ctx)
blockNumber, _ := client.GetBlockNumber(ctx)
gasPrice, _ := client.GetGasPrice(ctx)

fmt.Printf("Chain ID: %s\n", chainID)
fmt.Printf("Block: %d\n", blockNumber)
fmt.Printf("Gas Price: %s\n", thirdweb.FormatGasPrice(gasPrice))
```

### Wallet Operations

```go
// Create wallet
privateKey, address, _ := thirdweb.CreateRandomWallet()

// Connect client with wallet
client, _ := thirdweb.NewVarityClient(thirdweb.Config{
    ChainID:    33529,
    PrivateKey: thirdweb.PrivateKeyToHex(privateKey),
})

// Check balance
balance, _ := client.GetBalance(ctx, address.Hex())
fmt.Printf("Balance: %s USDC\n", balance.FormattedBalance)

// Transfer
amount, _ := thirdweb.ParseUSDC("10.50")
txHash, _ := client.Transfer(ctx, "0x...", amount)
fmt.Printf("TX: %s\n", txHash.Hex())
```

### Smart Contract Interaction

```go
// Read from contract
result, err := client.ReadContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "balanceOf",
    Args:    []interface{}{address},
})
balance := result[0].(*big.Int)

// Write to contract
txHash, err := client.WriteContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "transfer",
    Args:    []interface{}{recipient, amount},
}, nil)

// Wait for transaction
receipt, _ := client.WaitForTransaction(ctx, txHash)
fmt.Printf("Status: %d\n", receipt.Status)
```

### SIWE Authentication

```go
// Complete auth flow
jwt, err := client.AuthenticateWithSIWE(
    "app.varity.xyz",
    "Sign in to access your dashboard",
    "https://app.varity.xyz",
    60, // 1 hour session
)

fmt.Printf("JWT: %s\n", jwt.Token)
fmt.Printf("Address: %s\n", jwt.Address.Hex())

// Later, verify the JWT
verified, err := client.VerifySession(jwt.Token)
if err == nil {
    fmt.Printf("User: %s\n", verified.Address.Hex())
}
```

### IPFS Storage

```go
// Upload file
data := []byte("Hello, Varity!")
result, err := client.UploadToIPFS(ctx, data, "hello.txt")
fmt.Printf("CID: %s\n", result.CID)
fmt.Printf("URL: %s\n", result.GatewayURL)

// Download file
downloaded, err := client.DownloadFromIPFS(ctx, result.CID)
fmt.Printf("Content: %s\n", string(downloaded))

// Upload JSON metadata
metadata := map[string]interface{}{
    "name":        "My NFT",
    "description": "NFT on Varity L3",
    "image":       "ipfs://...",
}
result, err := client.UploadJSON(ctx, metadata)
```

## Testing

```bash
# Run all tests
go test ./thirdweb -v

# Run with coverage
go test ./thirdweb -cover

# Run integration tests (requires node)
go test ./thirdweb -v -run Integration

# Run benchmarks
go test ./thirdweb -bench=.

# Run specific test
go test ./thirdweb -run TestNewVarityClient
```

## Examples

Run the example programs:

```bash
# Basic example
go run examples/basic/main.go

# Wallet operations
go run examples/wallet/main.go

# SIWE authentication
go run examples/auth/main.go

# Smart contracts
go run examples/contracts/main.go
```

## Error Handling

All operations return proper Go errors:

```go
balance, err := client.GetBalance(ctx, address)
if err != nil {
    if verr, ok := err.(*thirdweb.Error); ok {
        fmt.Printf("Error Code: %s\n", verr.Code)
        fmt.Printf("Message: %s\n", verr.Message)
        fmt.Printf("Details: %v\n", verr.Details)
    }
    return err
}
```

Common error codes:
- `INVALID_CONFIG` - Invalid client configuration
- `INVALID_ADDRESS` - Invalid Ethereum address
- `INVALID_PRIVATE_KEY` - Invalid private key format
- `INSUFFICIENT_BALANCE` - Not enough balance for operation
- `TRANSACTION_FAILED` - Transaction execution failed
- `CONTRACT_CALL_FAILED` - Contract call failed
- `INVALID_ABI` - Invalid contract ABI
- `INVALID_SIGNATURE` - Signature verification failed
- `STORAGE_ERROR` - IPFS storage operation failed
- `NETWORK_ERROR` - Network connection error

## USDC Handling

Varity L3 uses USDC as the native gas token with 6 decimals:

```go
// Format USDC (6 decimals)
amount := big.NewInt(1500000) // 1.5 USDC in smallest unit
formatted := thirdweb.FormatUSDC(amount)
fmt.Println(formatted) // "1.500000"

// Parse USDC
amount, err := thirdweb.ParseUSDC("100.50")
// amount = 100500000 (smallest unit)

// Transfer
txHash, err := client.Transfer(ctx, recipient, amount)
```

## Context Support

All network operations support context for cancellation:

```go
// With timeout
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

balance, err := client.GetBalance(ctx, address)

// With cancellation
ctx, cancel := context.WithCancel(context.Background())
go func() {
    time.Sleep(5 * time.Second)
    cancel()
}()

result, err := client.ReadContract(ctx, call)
```

## Thread Safety

The client is safe for concurrent use from multiple goroutines.

## Production Considerations

1. **Private Key Security**: Never hardcode private keys. Use environment variables or secure key management.

2. **Error Handling**: Always check errors and implement proper retry logic.

3. **Context Timeouts**: Use appropriate timeouts for network operations.

4. **Gas Estimation**: Estimate gas before transactions to avoid failures.

5. **Transaction Monitoring**: Wait for transaction confirmations in production.

6. **IPFS Pinning**: Ensure important content is properly pinned.

7. **Rate Limiting**: Implement rate limiting for RPC requests.

## Documentation

- [API Documentation](https://pkg.go.dev/github.com/varity/client-go/thirdweb)
- [Examples](./examples/)
- [Tests](./thirdweb/)

## Support

For issues and questions:
- GitHub Issues: [varity/client-go](https://github.com/varity/client-go/issues)
- Documentation: [docs.varity.xyz](https://docs.varity.xyz)

## License

MIT License - see [LICENSE](../LICENSE) for details.
