# Varity Go Client - Quick Start Guide

## Installation

```bash
go get github.com/varity/client-go
```

## 5-Minute Quick Start

### 1. Import Package

```go
import "github.com/varity/client-go/thirdweb"
```

### 2. Create Client

```go
client, err := thirdweb.NewVarityClient(thirdweb.Config{
    ChainID:          33529, // Varity L3 Testnet
    PrivateKey:       "0x...", // Your private key
    ThirdwebClientID: "a35636133eb5ec6f30eb9f4c15fce2f3",
})
if err != nil {
    log.Fatal(err)
}
defer client.Close()
```

### 3. Common Operations

#### Check Balance
```go
balance, err := client.GetBalance(ctx, "0x...")
fmt.Printf("Balance: %s USDC\n", thirdweb.FormatUSDC(balance.Balance))
```

#### Transfer USDC
```go
amount, _ := thirdweb.ParseUSDC("10.50")
txHash, err := client.Transfer(ctx, recipientAddress, amount)
```

#### Sign Message
```go
signature, err := client.SignMessage("Hello, Varity!")
```

#### Deploy Contract
```go
contractAddr, txHash, err := client.DeployContract(ctx, &thirdweb.ContractDeployment{
    Bytecode: bytecode,
    ABI:      abiJSON,
}, nil)
```

#### Read from Contract
```go
result, err := client.ReadContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "balanceOf",
    Args:    []interface{}{address},
})
```

#### Write to Contract
```go
txHash, err := client.WriteContract(ctx, &thirdweb.ContractCall{
    Address: contractAddr,
    ABI:     abiJSON,
    Method:  "transfer",
    Args:    []interface{}{recipient, amount},
}, nil)
```

#### SIWE Authentication
```go
jwt, err := client.AuthenticateWithSIWE(
    "app.varity.xyz",
    "Sign in to Varity",
    "https://app.varity.xyz",
    60, // session minutes
)
```

#### Upload to IPFS
```go
result, err := client.UploadToIPFS(ctx, data, "file.txt")
fmt.Printf("CID: %s\n", result.CID)
```

## Complete Example

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/varity/client-go/thirdweb"
)

func main() {
    // 1. Create client
    client, err := thirdweb.NewVarityClient(thirdweb.Config{
        ChainID:          33529,
        PrivateKey:       "0x...",
        ThirdwebClientID: "a35636133eb5ec6f30eb9f4c15fce2f3",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    ctx := context.Background()

    // 2. Get balance
    balance, err := client.GetBalance(ctx, client.GetAddress().Hex())
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Balance: %s USDC\n", balance.FormattedBalance)

    // 3. Transfer USDC
    amount, _ := thirdweb.ParseUSDC("1.50")
    txHash, err := client.Transfer(ctx, "0x...", amount)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Transfer TX: %s\n", txHash.Hex())

    // 4. Wait for confirmation
    receipt, err := client.WaitForTransaction(ctx, txHash)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Status: %d (1=success)\n", receipt.Status)
}
```

## Environment Setup

### Using Environment Variables

```bash
export VARITY_PRIVATE_KEY="0x..."
export VARITY_CHAIN_ID="33529"
export THIRDWEB_CLIENT_ID="a35636133eb5ec6f30eb9f4c15fce2f3"
```

```go
import "os"

client, err := thirdweb.NewVarityClient(thirdweb.Config{
    ChainID:          33529,
    PrivateKey:       os.Getenv("VARITY_PRIVATE_KEY"),
    ThirdwebClientID: os.Getenv("THIRDWEB_CLIENT_ID"),
})
```

## Common Patterns

### Error Handling

```go
balance, err := client.GetBalance(ctx, address)
if err != nil {
    if verr, ok := err.(*thirdweb.Error); ok {
        fmt.Printf("Error: %s (%s)\n", verr.Message, verr.Code)
        return
    }
    return err
}
```

### Context with Timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

balance, err := client.GetBalance(ctx, address)
```

### USDC Amount Handling

```go
// Parse user input
amount, err := thirdweb.ParseUSDC("100.50")
if err != nil {
    return err
}

// Format for display
formatted := thirdweb.FormatUSDC(amount)
fmt.Printf("Amount: %s USDC\n", formatted)
```

### Address Validation

```go
if !thirdweb.ValidateAddress(userInput) {
    return errors.New("invalid address")
}

checksummed, _ := thirdweb.ToChecksumAddress(userInput)
```

## Next Steps

1. Read [THIRDWEB_README.md](./THIRDWEB_README.md) for complete API reference
2. Run examples: `go run examples/basic/main.go`
3. Read [PACKAGE_REPORT.md](./PACKAGE_REPORT.md) for detailed documentation
4. Check out the [tests](./thirdweb/client_test.go) for more examples

## Support

- Documentation: [docs.varity.xyz](https://docs.varity.xyz)
- Examples: [./examples/](./examples/)
- API Reference: [THIRDWEB_README.md](./THIRDWEB_README.md)

## Cheat Sheet

### Client
```go
client, _ := thirdweb.NewVarityClient(config)
client.GetChainID(ctx)
client.GetBlockNumber(ctx)
client.GetGasPrice(ctx)
client.Close()
```

### Wallet
```go
balance, _ := client.GetBalance(ctx, address)
signature, _ := client.SignMessage(msg)
valid, _ := client.VerifySignature(msg, sig, addr)
txHash, _ := client.Transfer(ctx, to, amount)
```

### Contracts
```go
addr, tx, _ := client.DeployContract(ctx, deployment, opts)
result, _ := client.ReadContract(ctx, call)
txHash, _ := client.WriteContract(ctx, call, opts)
receipt, _ := client.WaitForTransaction(ctx, txHash)
```

### Auth
```go
msg, _ := client.GenerateSIWEMessage(domain, addr, stmt, uri)
sig, _ := client.SignSIWEMessage(msg)
valid, _ := client.VerifySIWESignature(sig)
jwt, _ := client.CreateSession(sig, minutes)
```

### Storage
```go
result, _ := client.UploadToIPFS(ctx, data, filename)
data, _ := client.DownloadFromIPFS(ctx, cid)
result, _ := client.UploadJSON(ctx, jsonData)
url := client.GetGatewayURL(cid)
```

### Utils
```go
formatted := thirdweb.FormatUSDC(amount)
amount, _ := thirdweb.ParseUSDC("100.50")
valid := thirdweb.ValidateAddress(addr)
checksummed, _ := thirdweb.ToChecksumAddress(addr)
```
