package thirdweb

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

// ConnectWallet connects a wallet using a private key
func (c *VarityClient) ConnectWallet(privateKey string) error {
	return c.loadPrivateKey(privateKey)
}

// GetBalance returns the USDC balance for an address (6 decimals)
func (c *VarityClient) GetBalance(ctx context.Context, addressStr string) (*WalletBalance, error) {
	if !ValidateAddress(addressStr) {
		return nil, &Error{
			Code:    ErrCodeInvalidAddress,
			Message: "Invalid Ethereum address",
			Details: addressStr,
		}
	}

	address := common.HexToAddress(addressStr)
	balance, err := c.ethClient.BalanceAt(ctx, address, nil)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to get balance",
			Details: err.Error(),
		}
	}

	return &WalletBalance{
		Address:          address,
		Balance:          balance,
		FormattedBalance: FormatUSDC(balance),
	}, nil
}

// SignMessage signs an arbitrary message
func (c *VarityClient) SignMessage(message string) ([]byte, error) {
	if err := c.requireWallet(); err != nil {
		return nil, err
	}

	// Prepare message with Ethereum signed message prefix
	prefixedMessage := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(prefixedMessage))

	signature, err := crypto.Sign(hash.Bytes(), c.privateKey)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeInvalidSignature,
			Message: "Failed to sign message",
			Details: err.Error(),
		}
	}

	// Adjust V value for Ethereum
	signature[64] += 27

	return signature, nil
}

// SignMessageHash signs a message hash directly
func (c *VarityClient) SignMessageHash(hash []byte) ([]byte, error) {
	if err := c.requireWallet(); err != nil {
		return nil, err
	}

	signature, err := crypto.Sign(hash, c.privateKey)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeInvalidSignature,
			Message: "Failed to sign message hash",
			Details: err.Error(),
		}
	}

	// Adjust V value for Ethereum
	signature[64] += 27

	return signature, nil
}

// VerifySignature verifies a signature for a message
func (c *VarityClient) VerifySignature(message string, signatureHex string, expectedAddress string) (bool, error) {
	if !ValidateAddress(expectedAddress) {
		return false, &Error{
			Code:    ErrCodeInvalidAddress,
			Message: "Invalid Ethereum address",
			Details: expectedAddress,
		}
	}

	signature, err := DecodeHex(signatureHex)
	if err != nil {
		return false, &Error{
			Code:    ErrCodeInvalidSignature,
			Message: "Invalid signature hex",
			Details: err.Error(),
		}
	}

	if len(signature) != 65 {
		return false, &Error{
			Code:    ErrCodeInvalidSignature,
			Message: "Invalid signature length",
			Details: fmt.Sprintf("Expected 65 bytes, got %d", len(signature)),
		}
	}

	// Adjust V value back from Ethereum format
	if signature[64] >= 27 {
		signature[64] -= 27
	}

	// Prepare message with Ethereum signed message prefix
	prefixedMessage := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(prefixedMessage))

	// Recover public key
	pubKey, err := crypto.SigToPub(hash.Bytes(), signature)
	if err != nil {
		return false, &Error{
			Code:    ErrCodeInvalidSignature,
			Message: "Failed to recover public key",
			Details: err.Error(),
		}
	}

	// Get address from public key
	recoveredAddress := crypto.PubkeyToAddress(*pubKey)
	expectedAddr := common.HexToAddress(expectedAddress)

	return recoveredAddress == expectedAddr, nil
}

// SendTransaction sends a transaction
func (c *VarityClient) SendTransaction(ctx context.Context, to common.Address, value *big.Int, data []byte, options *TransactionOptions) (common.Hash, error) {
	if err := c.requireWallet(); err != nil {
		return common.Hash{}, err
	}

	// Get nonce
	nonce, err := c.ethClient.PendingNonceAt(ctx, c.address)
	if err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to get nonce",
			Details: err.Error(),
		}
	}

	// Override nonce if provided
	if options != nil && options.Nonce != nil {
		nonce = *options.Nonce
	}

	// Get gas price
	gasPrice, err := c.ethClient.SuggestGasPrice(ctx)
	if err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to get gas price",
			Details: err.Error(),
		}
	}

	// Override gas price if provided
	if options != nil && options.GasPrice != nil {
		gasPrice = options.GasPrice
	}

	// Set default value
	if value == nil {
		value = big.NewInt(0)
	}

	// Estimate gas limit
	gasLimit := uint64(21000) // Default for simple transfer
	if len(data) > 0 || options != nil && options.GasLimit != nil {
		msg := ethereum.CallMsg{
			From:     c.address,
			To:       &to,
			Value:    value,
			Data:     data,
			GasPrice: gasPrice,
		}
		estimatedGas, err := c.ethClient.EstimateGas(ctx, msg)
		if err != nil {
			return common.Hash{}, &Error{
				Code:    ErrCodeNetworkError,
				Message: "Failed to estimate gas",
				Details: err.Error(),
			}
		}
		gasLimit = estimatedGas
	}

	// Override gas limit if provided
	if options != nil && options.GasLimit != nil {
		gasLimit = *options.GasLimit
	}

	// Create transaction
	tx := types.NewTransaction(nonce, to, value, gasLimit, gasPrice, data)

	// Get chain ID
	chainID, err := c.ethClient.ChainID(ctx)
	if err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to get chain ID",
			Details: err.Error(),
		}
	}

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), c.privateKey)
	if err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeTransactionFailed,
			Message: "Failed to sign transaction",
			Details: err.Error(),
		}
	}

	// Send transaction
	if err := c.ethClient.SendTransaction(ctx, signedTx); err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeTransactionFailed,
			Message: "Failed to send transaction",
			Details: err.Error(),
		}
	}

	return signedTx.Hash(), nil
}

// Transfer sends USDC to an address
func (c *VarityClient) Transfer(ctx context.Context, to string, amount *big.Int) (common.Hash, error) {
	if !ValidateAddress(to) {
		return common.Hash{}, &Error{
			Code:    ErrCodeInvalidAddress,
			Message: "Invalid recipient address",
			Details: to,
		}
	}

	// Check balance
	balance, err := c.GetBalance(ctx, c.address.Hex())
	if err != nil {
		return common.Hash{}, err
	}

	if balance.Balance.Cmp(amount) < 0 {
		return common.Hash{}, &Error{
			Code:    ErrCodeInsufficientBalance,
			Message: "Insufficient balance",
			Details: fmt.Sprintf("Balance: %s, Required: %s", FormatUSDC(balance.Balance), FormatUSDC(amount)),
		}
	}

	toAddr := common.HexToAddress(to)
	return c.SendTransaction(ctx, toAddr, amount, nil, nil)
}

// GetTransactionHistory gets transaction history for an address
func (c *VarityClient) GetTransactionHistory(ctx context.Context, addressStr string, limit int) (*TransactionHistory, error) {
	if !ValidateAddress(addressStr) {
		return nil, &Error{
			Code:    ErrCodeInvalidAddress,
			Message: "Invalid Ethereum address",
			Details: addressStr,
		}
	}

	address := common.HexToAddress(addressStr)

	// Get latest block number
	latestBlock, err := c.ethClient.BlockNumber(ctx)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to get latest block",
			Details: err.Error(),
		}
	}

	// Scan last N blocks for transactions
	transactions := []*Transaction{}
	blocksToScan := 1000 // Scan last 1000 blocks
	if limit > 0 && limit < 100 {
		blocksToScan = limit * 10 // Scan more blocks if limit is small
	}

	startBlock := latestBlock
	if latestBlock > uint64(blocksToScan) {
		startBlock = latestBlock - uint64(blocksToScan)
	}

	for blockNum := latestBlock; blockNum > startBlock && len(transactions) < limit; blockNum-- {
		block, err := c.ethClient.BlockByNumber(ctx, big.NewInt(int64(blockNum)))
		if err != nil {
			continue // Skip blocks we can't fetch
		}

		for _, tx := range block.Transactions() {
			msg, err := tx.AsMessage(types.NewEIP155Signer(tx.ChainId()), nil)
			if err != nil {
				continue
			}

			// Check if transaction involves this address
			if msg.From() == address || (tx.To() != nil && *tx.To() == address) {
				receipt, err := c.ethClient.TransactionReceipt(ctx, tx.Hash())
				if err != nil {
					continue
				}

				transaction := &Transaction{
					Hash:           tx.Hash(),
					From:           msg.From(),
					To:             tx.To(),
					Value:          tx.Value(),
					FormattedValue: FormatUSDC(tx.Value()),
					GasUsed:        receipt.GasUsed,
					GasPrice:       tx.GasPrice(),
					BlockNumber:    big.NewInt(int64(blockNum)),
					Timestamp:      block.Time(),
					Status:         receipt.Status,
				}

				transactions = append(transactions, transaction)

				if len(transactions) >= limit {
					break
				}
			}
		}
	}

	return &TransactionHistory{
		Transactions: transactions,
		Total:        len(transactions),
		HasMore:      len(transactions) == limit,
	}, nil
}

// GetPrivateKey returns the private key (use with caution)
func (c *VarityClient) GetPrivateKey() *ecdsa.PrivateKey {
	return c.privateKey
}

// CreateRandomWallet creates a new random wallet
func CreateRandomWallet() (*ecdsa.PrivateKey, common.Address, error) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return nil, common.Address{}, &Error{
			Code:    "WALLET_CREATION_FAILED",
			Message: "Failed to generate private key",
			Details: err.Error(),
		}
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, common.Address{}, &Error{
			Code:    "WALLET_CREATION_FAILED",
			Message: "Failed to get public key",
		}
	}

	address := crypto.PubkeyToAddress(*publicKeyECDSA)

	return privateKey, address, nil
}

// PrivateKeyToHex converts a private key to hex string
func PrivateKeyToHex(privateKey *ecdsa.PrivateKey) string {
	return EncodeHex(crypto.FromECDSA(privateKey))
}

import (
	"github.com/ethereum/go-ethereum"
)
