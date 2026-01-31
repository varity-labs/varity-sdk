package thirdweb

import (
	"context"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// DeployContract deploys a smart contract
func (c *VarityClient) DeployContract(ctx context.Context, deployment *ContractDeployment, options *TransactionOptions) (common.Address, common.Hash, error) {
	if err := c.requireWallet(); err != nil {
		return common.Address{}, common.Hash{}, err
	}

	if deployment.Bytecode == nil || len(deployment.Bytecode) == 0 {
		return common.Address{}, common.Hash{}, &Error{
			Code:    "INVALID_BYTECODE",
			Message: "Contract bytecode is required",
		}
	}

	// Parse ABI if constructor args provided
	var data []byte
	if len(deployment.ConstructorArgs) > 0 {
		if deployment.ABI == "" {
			return common.Address{}, common.Hash{}, &Error{
				Code:    ErrCodeInvalidABI,
				Message: "ABI is required when constructor args are provided",
			}
		}

		parsedABI, err := abi.JSON(strings.NewReader(deployment.ABI))
		if err != nil {
			return common.Address{}, common.Hash{}, &Error{
				Code:    ErrCodeInvalidABI,
				Message: "Failed to parse ABI",
				Details: err.Error(),
			}
		}

		// Pack constructor arguments
		packedArgs, err := parsedABI.Pack("", deployment.ConstructorArgs...)
		if err != nil {
			return common.Address{}, common.Hash{}, &Error{
				Code:    "INVALID_CONSTRUCTOR_ARGS",
				Message: "Failed to pack constructor arguments",
				Details: err.Error(),
			}
		}

		// Combine bytecode and constructor args
		data = append(deployment.Bytecode, packedArgs...)
	} else {
		data = deployment.Bytecode
	}

	// Deploy contract (send to zero address)
	txHash, err := c.SendTransaction(ctx, common.Address{}, nil, data, options)
	if err != nil {
		return common.Address{}, common.Hash{}, err
	}

	// Wait for transaction to be mined
	receipt, err := c.WaitForTransaction(ctx, txHash)
	if err != nil {
		return common.Address{}, common.Hash{}, err
	}

	if receipt.Status != 1 {
		return common.Address{}, common.Hash{}, &Error{
			Code:    ErrCodeTransactionFailed,
			Message: "Contract deployment failed",
			Details: fmt.Sprintf("Transaction: %s", txHash.Hex()),
		}
	}

	if receipt.ContractAddress == nil {
		return common.Address{}, common.Hash{}, &Error{
			Code:    ErrCodeTransactionFailed,
			Message: "No contract address in receipt",
		}
	}

	return *receipt.ContractAddress, txHash, nil
}

// ReadContract reads from a contract (view/pure function)
func (c *VarityClient) ReadContract(ctx context.Context, call *ContractCall) ([]interface{}, error) {
	if call.ABI == "" {
		return nil, &Error{
			Code:    ErrCodeInvalidABI,
			Message: "ABI is required",
		}
	}

	parsedABI, err := abi.JSON(strings.NewReader(call.ABI))
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeInvalidABI,
			Message: "Failed to parse ABI",
			Details: err.Error(),
		}
	}

	// Pack method call
	data, err := parsedABI.Pack(call.Method, call.Args...)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeContractCallFailed,
			Message: "Failed to pack method call",
			Details: err.Error(),
		}
	}

	// Make call
	msg := ethereum.CallMsg{
		To:   &call.Address,
		Data: data,
	}

	result, err := c.ethClient.CallContract(ctx, msg, nil)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeContractCallFailed,
			Message: "Contract call failed",
			Details: err.Error(),
		}
	}

	// Unpack result
	method := parsedABI.Methods[call.Method]
	outputs, err := method.Outputs.Unpack(result)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeContractCallFailed,
			Message: "Failed to unpack result",
			Details: err.Error(),
		}
	}

	return outputs, nil
}

// WriteContract writes to a contract (state-changing function)
func (c *VarityClient) WriteContract(ctx context.Context, call *ContractCall, options *TransactionOptions) (common.Hash, error) {
	if err := c.requireWallet(); err != nil {
		return common.Hash{}, err
	}

	if call.ABI == "" {
		return common.Hash{}, &Error{
			Code:    ErrCodeInvalidABI,
			Message: "ABI is required",
		}
	}

	parsedABI, err := abi.JSON(strings.NewReader(call.ABI))
	if err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeInvalidABI,
			Message: "Failed to parse ABI",
			Details: err.Error(),
		}
	}

	// Pack method call
	data, err := parsedABI.Pack(call.Method, call.Args...)
	if err != nil {
		return common.Hash{}, &Error{
			Code:    ErrCodeContractCallFailed,
			Message: "Failed to pack method call",
			Details: err.Error(),
		}
	}

	// Get value from options
	var value *big.Int
	if options != nil && options.Value != nil {
		value = options.Value
	}

	// Send transaction
	return c.SendTransaction(ctx, call.Address, value, data, options)
}

// GetContract creates a bound contract instance (for advanced usage)
func (c *VarityClient) GetContract(address common.Address, abiJSON string) (*BoundContract, error) {
	parsedABI, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeInvalidABI,
			Message: "Failed to parse ABI",
			Details: err.Error(),
		}
	}

	return &BoundContract{
		address: address,
		abi:     parsedABI,
		client:  c,
	}, nil
}

// BoundContract represents a contract bound to an address
type BoundContract struct {
	address common.Address
	abi     abi.ABI
	client  *VarityClient
}

// Address returns the contract address
func (bc *BoundContract) Address() common.Address {
	return bc.address
}

// Call calls a view/pure function
func (bc *BoundContract) Call(ctx context.Context, method string, args ...interface{}) ([]interface{}, error) {
	return bc.client.ReadContract(ctx, &ContractCall{
		Address: bc.address,
		ABI:     bc.abi.String(),
		Method:  method,
		Args:    args,
	})
}

// Transact calls a state-changing function
func (bc *BoundContract) Transact(ctx context.Context, method string, options *TransactionOptions, args ...interface{}) (common.Hash, error) {
	return bc.client.WriteContract(ctx, &ContractCall{
		Address: bc.address,
		ABI:     bc.abi.String(),
		Method:  method,
		Args:    args,
	}, options)
}

// WatchEvents watches for contract events
func (c *VarityClient) WatchEvents(ctx context.Context, filter *EventFilter, eventChan chan<- *Event) error {
	// Create filter query
	query := ethereum.FilterQuery{
		Addresses: []common.Address{filter.Address},
		Topics:    filter.Topics,
	}

	if filter.FromBlock != nil {
		query.FromBlock = filter.FromBlock
	}
	if filter.ToBlock != nil {
		query.ToBlock = filter.ToBlock
	}

	// Subscribe to logs
	logs := make(chan types.Log)
	sub, err := c.ethClient.SubscribeFilterLogs(ctx, query, logs)
	if err != nil {
		return &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to subscribe to logs",
			Details: err.Error(),
		}
	}

	// Process logs
	go func() {
		defer sub.Unsubscribe()
		defer close(eventChan)

		for {
			select {
			case err := <-sub.Err():
				if err != nil {
					// Log error but don't crash
					fmt.Printf("Event subscription error: %v\n", err)
				}
				return
			case vLog := <-logs:
				event := &Event{
					Address:     vLog.Address,
					Topics:      vLog.Topics,
					Data:        vLog.Data,
					BlockNumber: vLog.BlockNumber,
					TxHash:      vLog.TxHash,
					TxIndex:     vLog.TxIndex,
					LogIndex:    vLog.Index,
				}

				// Send event to channel
				select {
				case eventChan <- event:
				case <-ctx.Done():
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	return nil
}

// GetPastEvents gets past contract events
func (c *VarityClient) GetPastEvents(ctx context.Context, filter *EventFilter) ([]*Event, error) {
	// Create filter query
	query := ethereum.FilterQuery{
		Addresses: []common.Address{filter.Address},
		Topics:    filter.Topics,
	}

	if filter.FromBlock != nil {
		query.FromBlock = filter.FromBlock
	}
	if filter.ToBlock != nil {
		query.ToBlock = filter.ToBlock
	}

	// Get logs
	logs, err := c.ethClient.FilterLogs(ctx, query)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeNetworkError,
			Message: "Failed to filter logs",
			Details: err.Error(),
		}
	}

	// Convert logs to events
	events := make([]*Event, len(logs))
	for i, vLog := range logs {
		events[i] = &Event{
			Address:     vLog.Address,
			Topics:      vLog.Topics,
			Data:        vLog.Data,
			BlockNumber: vLog.BlockNumber,
			TxHash:      vLog.TxHash,
			TxIndex:     vLog.TxIndex,
			LogIndex:    vLog.Index,
		}
	}

	return events, nil
}

// ParseEventLog parses an event log using ABI
func ParseEventLog(abiJSON string, eventName string, log *Event) (map[string]interface{}, error) {
	parsedABI, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeInvalidABI,
			Message: "Failed to parse ABI",
			Details: err.Error(),
		}
	}

	event, ok := parsedABI.Events[eventName]
	if !ok {
		return nil, &Error{
			Code:    "EVENT_NOT_FOUND",
			Message: fmt.Sprintf("Event %s not found in ABI", eventName),
		}
	}

	// Unpack event data
	values := make(map[string]interface{})
	err = event.Inputs.UnpackIntoMap(values, log.Data)
	if err != nil {
		return nil, &Error{
			Code:    "UNPACK_ERROR",
			Message: "Failed to unpack event data",
			Details: err.Error(),
		}
	}

	return values, nil
}

// GetEventSignature returns the event signature hash
func GetEventSignature(eventSignature string) common.Hash {
	return crypto.Keccak256Hash([]byte(eventSignature))
}

import (
	"github.com/ethereum/go-ethereum/crypto"
)
