/*
Package thirdweb provides a comprehensive Thirdweb-compatible client for Varity L3 blockchain operations.

The client provides full blockchain functionality including wallet operations, contract deployment,
SIWE authentication, and IPFS storage integration.

Example usage:

	client, err := thirdweb.NewVarityClient(thirdweb.Config{
		ChainID:          33529,
		PrivateKey:       "0x...",
		ThirdwebClientID: "acb17e07e34ab2b8317aa40cbb1b5e1d",
	})
	if err != nil {
		log.Fatal(err)
	}

	// Get wallet balance
	ctx := context.Background()
	balance, err := client.GetBalance(ctx, "0x...")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Balance: %s USDC\n", thirdweb.FormatUSDC(balance.Balance))
*/
package thirdweb

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// VarityClient is the main client for interacting with Varity L3 blockchain
type VarityClient struct {
	config       *Config
	ethClient    *ethclient.Client
	privateKey   *ecdsa.PrivateKey
	address      common.Address
	chainConfig  *ChainConfig
	thirdwebID   string
	ipfsGateway  string
}

// NewVarityClient creates a new Varity L3 blockchain client
func NewVarityClient(config Config) (*VarityClient, error) {
	// Set defaults
	if config.ChainID == 0 {
		config.ChainID = 33529 // Varity L3 Testnet
	}
	if config.RPCURL == "" {
		config.RPCURL = "https://rpc-varity-l3-testnet-33529-czcj67dz6a.t.conduit.xyz"
	}
	if config.ThirdwebClientID == "" {
		config.ThirdwebClientID = "acb17e07e34ab2b8317aa40cbb1b5e1d"
	}
	if config.IPFSGatewayURL == "" {
		config.IPFSGatewayURL = "https://gateway.pinata.cloud"
	}

	// Get chain configuration
	chainConfig := GetChainByID(config.ChainID)
	if chainConfig == nil {
		return nil, &Error{
			Code:    ErrCodeInvalidConfig,
			Message: fmt.Sprintf("Unsupported chain ID: %d", config.ChainID),
		}
	}

	// Connect to RPC
	ethClient, err := ethclient.Dial(config.RPCURL)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to connect to RPC",
			Details: err.Error(),
		}
	}

	client := &VarityClient{
		config:      &config,
		ethClient:   ethClient,
		chainConfig: chainConfig,
		thirdwebID:  config.ThirdwebClientID,
		ipfsGateway: config.IPFSGatewayURL,
	}

	// Load private key if provided
	if config.PrivateKey != "" {
		if err := client.loadPrivateKey(config.PrivateKey); err != nil {
			return nil, err
		}
	}

	return client, nil
}

// loadPrivateKey loads and validates a private key
func (c *VarityClient) loadPrivateKey(privateKeyHex string) error {
	// Remove 0x prefix if present
	if len(privateKeyHex) >= 2 && privateKeyHex[:2] == "0x" {
		privateKeyHex = privateKeyHex[2:]
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return &Error{
			Code:    ErrCodeInvalidPrivateKey,
			Message: "Invalid private key format",
			Details: err.Error(),
		}
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return &Error{
			Code:    ErrCodeInvalidPrivateKey,
			Message: "Failed to get public key",
		}
	}

	c.privateKey = privateKey
	c.address = crypto.PubkeyToAddress(*publicKeyECDSA)

	return nil
}

// GetConfig returns the client configuration
func (c *VarityClient) GetConfig() map[string]interface{} {
	return map[string]interface{}{
		"chainId":          c.config.ChainID,
		"chainName":        c.chainConfig.Name,
		"rpcUrl":           c.config.RPCURL,
		"thirdwebClientId": c.thirdwebID,
		"ipfsGateway":      c.ipfsGateway,
		"address":          c.address.Hex(),
	}
}

// GetChainConfig returns the chain configuration
func (c *VarityClient) GetChainConfig() *ChainConfig {
	return c.chainConfig
}

// GetAddress returns the wallet address (if private key is set)
func (c *VarityClient) GetAddress() common.Address {
	return c.address
}

// GetEthClient returns the underlying Ethereum client
func (c *VarityClient) GetEthClient() *ethclient.Client {
	return c.ethClient
}

// GetChainID returns the current chain ID from the network
func (c *VarityClient) GetChainID(ctx context.Context) (*big.Int, error) {
	return c.ethClient.ChainID(ctx)
}

// GetBlockNumber returns the latest block number
func (c *VarityClient) GetBlockNumber(ctx context.Context) (uint64, error) {
	return c.ethClient.BlockNumber(ctx)
}

// GetGasPrice returns the current gas price
func (c *VarityClient) GetGasPrice(ctx context.Context) (*big.Int, error) {
	return c.ethClient.SuggestGasPrice(ctx)
}

// EstimateGas estimates gas for a transaction
func (c *VarityClient) EstimateGas(ctx context.Context, msg ethereum.CallMsg) (uint64, error) {
	return c.ethClient.EstimateGas(ctx, msg)
}

// GetNonce returns the nonce for an address
func (c *VarityClient) GetNonce(ctx context.Context, address common.Address) (uint64, error) {
	return c.ethClient.PendingNonceAt(ctx, address)
}

// WaitForTransaction waits for a transaction to be mined
func (c *VarityClient) WaitForTransaction(ctx context.Context, txHash common.Hash) (*TransactionReceipt, error) {
	receipt, err := bind.WaitMined(ctx, c.ethClient, &types.Transaction{})
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeTransactionFailed,
			Message: "Failed to wait for transaction",
			Details: err.Error(),
		}
	}

	// Get full receipt
	fullReceipt, err := c.ethClient.TransactionReceipt(ctx, txHash)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeTransactionFailed,
			Message: "Failed to get transaction receipt",
			Details: err.Error(),
		}
	}

	result := &TransactionReceipt{
		TxHash:      fullReceipt.TxHash,
		Status:      fullReceipt.Status,
		BlockNumber: fullReceipt.BlockNumber,
		GasUsed:     fullReceipt.GasUsed,
		Logs:        fullReceipt.Logs,
	}

	if fullReceipt.ContractAddress != (common.Address{}) {
		result.ContractAddress = &fullReceipt.ContractAddress
	}

	return result, nil
}

// Close closes the client connection
func (c *VarityClient) Close() {
	if c.ethClient != nil {
		c.ethClient.Close()
	}
}

// Helper to check if wallet is loaded
func (c *VarityClient) hasWallet() bool {
	return c.privateKey != nil
}

// Helper to require wallet
func (c *VarityClient) requireWallet() error {
	if !c.hasWallet() {
		return &Error{
			Code:    ErrCodeInvalidConfig,
			Message: "Private key required for this operation",
		}
	}
	return nil
}

// ethereum package import helper
import (
	"github.com/ethereum/go-ethereum"
)
