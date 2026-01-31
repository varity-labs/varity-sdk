package thirdweb

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// Config represents the configuration for Varity Thirdweb client
type Config struct {
	// ChainID is the Varity L3 chain ID (default: 33529)
	ChainID int64

	// PrivateKey is the private key for wallet operations (optional)
	PrivateKey string

	// RPC URL for Varity L3 (default: https://rpc-varity-l3-testnet-33529-czcj67dz6a.t.conduit.xyz)
	RPCURL string

	// ThirdwebClientID for Thirdweb services
	ThirdwebClientID string

	// ThirdwebSecretKey for server-side operations (optional)
	ThirdwebSecretKey string

	// IPFSGatewayURL for storage operations (default: https://gateway.pinata.cloud)
	IPFSGatewayURL string
}

// ContractDeployment represents a contract deployment configuration
type ContractDeployment struct {
	// Bytecode is the contract bytecode
	Bytecode []byte

	// ABI is the contract ABI
	ABI string

	// ConstructorArgs are the constructor arguments
	ConstructorArgs []interface{}
}

// ContractCall represents a contract function call
type ContractCall struct {
	// Address is the contract address
	Address common.Address

	// ABI is the contract ABI
	ABI string

	// Method is the function name
	Method string

	// Args are the function arguments
	Args []interface{}
}

// TransactionOptions represents transaction configuration
type TransactionOptions struct {
	// GasLimit for the transaction (optional)
	GasLimit *uint64

	// GasPrice for the transaction (optional, in wei)
	GasPrice *big.Int

	// Value to send with transaction (optional, in USDC smallest unit - 6 decimals)
	Value *big.Int

	// Nonce for the transaction (optional)
	Nonce *uint64
}

// WalletBalance represents wallet balance information
type WalletBalance struct {
	// Address is the wallet address
	Address common.Address

	// Balance in USDC (6 decimals)
	Balance *big.Int

	// FormattedBalance as string (e.g., "100.500000")
	FormattedBalance string
}

// TransactionReceipt represents a transaction receipt
type TransactionReceipt struct {
	// TxHash is the transaction hash
	TxHash common.Hash

	// Status (1 = success, 0 = failure)
	Status uint64

	// BlockNumber where transaction was included
	BlockNumber *big.Int

	// GasUsed for the transaction
	GasUsed uint64

	// ContractAddress if this was a contract deployment
	ContractAddress *common.Address

	// Logs from the transaction
	Logs []*types.Log
}

// SIWEMessage represents a Sign-In with Ethereum message
type SIWEMessage struct {
	// Domain requesting the signature
	Domain string

	// Address performing the signing
	Address common.Address

	// Statement for the user
	Statement string

	// URI for the application
	URI string

	// Version of the SIWE message
	Version string

	// ChainId for the network
	ChainId int64

	// Nonce for replay protection
	Nonce string

	// IssuedAt timestamp
	IssuedAt string

	// ExpirationTime (optional)
	ExpirationTime string

	// NotBefore time (optional)
	NotBefore string
}

// SIWESignature represents a signed SIWE message
type SIWESignature struct {
	// Message is the SIWE message
	Message *SIWEMessage

	// Signature is the signature bytes
	Signature []byte

	// SignatureHex is the hex-encoded signature
	SignatureHex string
}

// JWTToken represents a JWT authentication token
type JWTToken struct {
	// Token is the JWT token string
	Token string

	// ExpiresAt timestamp
	ExpiresAt int64

	// Address that the token was issued for
	Address common.Address
}

// IPFSUploadResult represents the result of an IPFS upload
type IPFSUploadResult struct {
	// CID is the IPFS content identifier
	CID string

	// GatewayURL is the HTTP gateway URL
	GatewayURL string

	// Size of the uploaded content
	Size int64

	// PinataPin indicates if it was pinned to Pinata
	PinataPin bool
}

// EventFilter represents an event filter for watching contract events
type EventFilter struct {
	// Address to filter events from
	Address common.Address

	// Topics to filter (event signature + indexed parameters)
	Topics [][]common.Hash

	// FromBlock to start filtering from
	FromBlock *big.Int

	// ToBlock to filter until (nil = latest)
	ToBlock *big.Int
}

// Event represents a contract event
type Event struct {
	// Name of the event
	Name string

	// Address of the contract
	Address common.Address

	// Topics from the log
	Topics []common.Hash

	// Data from the log
	Data []byte

	// BlockNumber where event was emitted
	BlockNumber uint64

	// TxHash of the transaction that emitted the event
	TxHash common.Hash

	// TxIndex in the block
	TxIndex uint

	// LogIndex in the transaction
	LogIndex uint
}

// TransactionHistory represents transaction history for an address
type TransactionHistory struct {
	// Transactions list
	Transactions []*Transaction

	// Total count
	Total int

	// HasMore indicates if there are more transactions
	HasMore bool
}

// Transaction represents a blockchain transaction
type Transaction struct {
	// Hash of the transaction
	Hash common.Hash

	// From address
	From common.Address

	// To address (nil for contract creation)
	To *common.Address

	// Value in USDC (6 decimals)
	Value *big.Int

	// FormattedValue as string
	FormattedValue string

	// GasUsed for the transaction
	GasUsed uint64

	// GasPrice for the transaction
	GasPrice *big.Int

	// BlockNumber where transaction was included
	BlockNumber *big.Int

	// Timestamp of the block
	Timestamp uint64

	// Status (1 = success, 0 = failure)
	Status uint64
}

// ChainConfig represents blockchain configuration
type ChainConfig struct {
	// ChainID
	ChainID int64

	// Name of the chain
	Name string

	// NativeCurrency configuration
	NativeCurrency Currency

	// RPCUrls
	RPCUrls []string

	// BlockExplorerUrls
	BlockExplorerUrls []string

	// Testnet flag
	Testnet bool
}

// Currency represents currency configuration
type Currency struct {
	// Name of the currency
	Name string

	// Symbol (e.g., "USDC")
	Symbol string

	// Decimals (6 for USDC)
	Decimals int
}

// Error types
type Error struct {
	Code    string
	Message string
	Details interface{}
}

func (e *Error) Error() string {
	return e.Message
}

// Common error codes
const (
	ErrCodeInvalidConfig       = "INVALID_CONFIG"
	ErrCodeInvalidAddress      = "INVALID_ADDRESS"
	ErrCodeInvalidPrivateKey   = "INVALID_PRIVATE_KEY"
	ErrCodeInsufficientBalance = "INSUFFICIENT_BALANCE"
	ErrCodeTransactionFailed   = "TRANSACTION_FAILED"
	ErrCodeContractCallFailed  = "CONTRACT_CALL_FAILED"
	ErrCodeInvalidABI          = "INVALID_ABI"
	ErrCodeInvalidSignature    = "INVALID_SIGNATURE"
	ErrCodeStorageError        = "STORAGE_ERROR"
	ErrCodeNetworkError        = "NETWORK_ERROR"
)
