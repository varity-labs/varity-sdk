package thirdweb

import (
	"context"
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewVarityClient(t *testing.T) {
	tests := []struct {
		name    string
		config  Config
		wantErr bool
	}{
		{
			name: "default configuration",
			config: Config{
				ChainID: 33529,
			},
			wantErr: false,
		},
		{
			name: "with private key",
			config: Config{
				ChainID:    33529,
				PrivateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			},
			wantErr: false,
		},
		{
			name: "custom RPC URL",
			config: Config{
				ChainID: 33529,
				RPCURL:  "https://custom-rpc.example.com",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewVarityClient(tt.config)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.NotNil(t, client)

			// Verify config
			config := client.GetConfig()
			assert.Equal(t, int64(33529), config["chainId"])
			assert.NotEmpty(t, config["chainName"])

			client.Close()
		})
	}
}

func TestChainConfiguration(t *testing.T) {
	client, err := NewVarityClient(Config{
		ChainID: 33529,
	})
	require.NoError(t, err)
	defer client.Close()

	chainConfig := client.GetChainConfig()
	assert.Equal(t, int64(33529), chainConfig.ChainID)
	assert.Equal(t, "Varity L3 Testnet", chainConfig.Name)
	assert.Equal(t, "USDC", chainConfig.NativeCurrency.Symbol)
	assert.Equal(t, 6, chainConfig.NativeCurrency.Decimals)
	assert.True(t, chainConfig.Testnet)
}

func TestUSDCFormatting(t *testing.T) {
	tests := []struct {
		name     string
		amount   *big.Int
		expected string
	}{
		{
			name:     "zero",
			amount:   big.NewInt(0),
			expected: "0.000000",
		},
		{
			name:     "one USDC",
			amount:   big.NewInt(1000000),
			expected: "1.000000",
		},
		{
			name:     "fractional USDC",
			amount:   big.NewInt(1500000),
			expected: "1.500000",
		},
		{
			name:     "large amount",
			amount:   big.NewInt(1000000000000),
			expected: "1000000.000000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatUSDC(tt.amount)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUSDCParsing(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected *big.Int
		wantErr  bool
	}{
		{
			name:     "integer",
			input:    "100",
			expected: big.NewInt(100000000),
			wantErr:  false,
		},
		{
			name:     "with decimals",
			input:    "100.5",
			expected: big.NewInt(100500000),
			wantErr:  false,
		},
		{
			name:     "full precision",
			input:    "100.500000",
			expected: big.NewInt(100500000),
			wantErr:  false,
		},
		{
			name:     "invalid format",
			input:    "abc",
			expected: nil,
			wantErr:  true,
		},
		{
			name:     "too many decimals",
			input:    "100.1234567",
			expected: nil,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseUSDC(tt.input)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.expected.String(), result.String())
		})
	}
}

func TestAddressValidation(t *testing.T) {
	tests := []struct {
		name    string
		address string
		valid   bool
	}{
		{
			name:    "valid address",
			address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
			valid:   true,
		},
		{
			name:    "zero address",
			address: "0x0000000000000000000000000000000000000000",
			valid:   true,
		},
		{
			name:    "invalid address",
			address: "0xinvalid",
			valid:   false,
		},
		{
			name:    "empty address",
			address: "",
			valid:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateAddress(tt.address)
			assert.Equal(t, tt.valid, result)
		})
	}
}

func TestChecksumAddress(t *testing.T) {
	address := "0x742d35cc6634c0532925a3b844bc9e7595f0beb"
	checksummed, err := ToChecksumAddress(address)
	require.NoError(t, err)
	assert.NotEmpty(t, checksummed)
	assert.True(t, ValidateAddress(checksummed))
}

func TestZeroAddress(t *testing.T) {
	zeroAddr := common.HexToAddress("0x0")
	assert.True(t, IsZeroAddress(zeroAddr))

	nonZeroAddr := common.HexToAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
	assert.False(t, IsZeroAddress(nonZeroAddr))
}

func TestGetChainByID(t *testing.T) {
	tests := []struct {
		name    string
		chainID int64
		wantNil bool
	}{
		{
			name:    "Varity L3 Testnet",
			chainID: 33529,
			wantNil: false,
		},
		{
			name:    "Arbitrum Sepolia",
			chainID: 421614,
			wantNil: false,
		},
		{
			name:    "unknown chain",
			chainID: 999999,
			wantNil: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chain := GetChainByID(tt.chainID)
			if tt.wantNil {
				assert.Nil(t, chain)
			} else {
				assert.NotNil(t, chain)
				assert.Equal(t, tt.chainID, chain.ChainID)
			}
		})
	}
}

func TestGetChainByName(t *testing.T) {
	tests := []struct {
		name      string
		chainName string
		wantNil   bool
	}{
		{
			name:      "varity",
			chainName: "varity",
			wantNil:   false,
		},
		{
			name:      "arbitrum-sepolia",
			chainName: "arbitrum-sepolia",
			wantNil:   false,
		},
		{
			name:      "unknown",
			chainName: "unknown",
			wantNil:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chain := GetChainByName(tt.chainName)
			if tt.wantNil {
				assert.Nil(t, chain)
			} else {
				assert.NotNil(t, chain)
			}
		})
	}
}

func TestWalletGeneration(t *testing.T) {
	privateKey, address, err := CreateRandomWallet()
	require.NoError(t, err)
	assert.NotNil(t, privateKey)
	assert.False(t, IsZeroAddress(address))

	// Convert to hex and back
	privateKeyHex := PrivateKeyToHex(privateKey)
	assert.NotEmpty(t, privateKeyHex)
	assert.True(t, len(privateKeyHex) > 10)
}

func TestFormatGas(t *testing.T) {
	gas := uint64(21000)
	formatted := FormatGas(gas)
	assert.Equal(t, "21000", formatted)
}

func TestFormatGasPrice(t *testing.T) {
	// 100 gwei in wei
	gasPrice := big.NewInt(100000000000)
	formatted := FormatGasPrice(gasPrice)
	assert.Equal(t, "100 gwei", formatted)
}

func TestKeccak256Hash(t *testing.T) {
	data := []byte("test data")
	hash := Keccak256Hash(data)
	assert.Equal(t, 32, len(hash))
}

func TestGetFunctionSelector(t *testing.T) {
	selector := GetFunctionSelector("transfer(address,uint256)")
	assert.Equal(t, 4, len(selector))
}

// Benchmark tests
func BenchmarkFormatUSDC(b *testing.B) {
	amount := big.NewInt(1234567890)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		FormatUSDC(amount)
	}
}

func BenchmarkParseUSDC(b *testing.B) {
	amount := "1234.567890"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParseUSDC(amount)
	}
}

func BenchmarkValidateAddress(b *testing.B) {
	address := "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ValidateAddress(address)
	}
}

// Integration tests (require running node)
func TestGetChainIDIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	client, err := NewVarityClient(Config{
		ChainID: 33529,
	})
	require.NoError(t, err)
	defer client.Close()

	ctx := context.Background()
	chainID, err := client.GetChainID(ctx)
	if err != nil {
		t.Skip("Node not available:", err)
		return
	}

	assert.Equal(t, int64(33529), chainID.Int64())
}

func TestGetBlockNumberIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	client, err := NewVarityClient(Config{
		ChainID: 33529,
	})
	require.NoError(t, err)
	defer client.Close()

	ctx := context.Background()
	blockNumber, err := client.GetBlockNumber(ctx)
	if err != nil {
		t.Skip("Node not available:", err)
		return
	}

	assert.Greater(t, blockNumber, uint64(0))
}
