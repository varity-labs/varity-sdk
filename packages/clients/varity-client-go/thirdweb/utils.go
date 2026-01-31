package thirdweb

import (
	"fmt"
	"math/big"
	"regexp"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"golang.org/x/crypto/sha3"
)

// FormatUSDC formats a USDC amount (6 decimals) to a human-readable string
func FormatUSDC(amount *big.Int) string {
	if amount == nil {
		return "0.000000"
	}

	// USDC has 6 decimals
	divisor := big.NewInt(1000000)
	whole := new(big.Int).Div(amount, divisor)
	remainder := new(big.Int).Mod(amount, divisor)

	return fmt.Sprintf("%s.%06d", whole.String(), remainder.Int64())
}

// ParseUSDC parses a USDC amount string to big.Int (6 decimals)
// Examples: "100", "100.5", "100.500000"
func ParseUSDC(amount string) (*big.Int, error) {
	// Remove whitespace
	amount = strings.TrimSpace(amount)

	// Check for valid format
	matched, err := regexp.MatchString(`^\d+(\.\d{1,6})?$`, amount)
	if err != nil {
		return nil, err
	}
	if !matched {
		return nil, &Error{
			Code:    "INVALID_FORMAT",
			Message: "Invalid USDC amount format",
			Details: amount,
		}
	}

	// Split into whole and decimal parts
	parts := strings.Split(amount, ".")
	whole := parts[0]
	decimal := ""
	if len(parts) == 2 {
		decimal = parts[1]
		// Pad to 6 decimals
		for len(decimal) < 6 {
			decimal += "0"
		}
	} else {
		decimal = "000000"
	}

	// Combine and parse
	combined := whole + decimal
	result, ok := new(big.Int).SetString(combined, 10)
	if !ok {
		return nil, &Error{
			Code:    "PARSE_ERROR",
			Message: "Failed to parse USDC amount",
			Details: amount,
		}
	}

	return result, nil
}

// ValidateAddress validates an Ethereum address
func ValidateAddress(address string) bool {
	return common.IsHexAddress(address)
}

// ToChecksumAddress converts an address to checksum format
func ToChecksumAddress(address string) (string, error) {
	if !ValidateAddress(address) {
		return "", &Error{
			Code:    ErrCodeInvalidAddress,
			Message: "Invalid Ethereum address",
			Details: address,
		}
	}

	addr := common.HexToAddress(address)
	return addr.Hex(), nil
}

// IsZeroAddress checks if an address is the zero address
func IsZeroAddress(address common.Address) bool {
	return address == common.HexToAddress("0x0")
}

// Keccak256Hash computes the Keccak256 hash of data
func Keccak256Hash(data []byte) []byte {
	hash := sha3.NewLegacyKeccak256()
	hash.Write(data)
	return hash.Sum(nil)
}

// Keccak256HashString computes the Keccak256 hash of a string
func Keccak256HashString(data string) []byte {
	return Keccak256Hash([]byte(data))
}

// EncodeHex encodes bytes to hex string with 0x prefix
func EncodeHex(data []byte) string {
	return hexutil.Encode(data)
}

// DecodeHex decodes a hex string (with or without 0x prefix)
func DecodeHex(hexStr string) ([]byte, error) {
	return hexutil.Decode(hexStr)
}

// WeiToGwei converts wei to gwei
func WeiToGwei(wei *big.Int) *big.Int {
	gwei := new(big.Int).Div(wei, big.NewInt(1e9))
	return gwei
}

// GweiToWei converts gwei to wei
func GweiToWei(gwei *big.Int) *big.Int {
	wei := new(big.Int).Mul(gwei, big.NewInt(1e9))
	return wei
}

// FormatGas formats gas amount to human-readable string
func FormatGas(gas uint64) string {
	return fmt.Sprintf("%d", gas)
}

// FormatGasPrice formats gas price (in wei) to gwei string
func FormatGasPrice(gasPrice *big.Int) string {
	if gasPrice == nil {
		return "0"
	}
	gwei := WeiToGwei(gasPrice)
	return fmt.Sprintf("%s gwei", gwei.String())
}

// GenerateNonce generates a random nonce for SIWE
func GenerateNonce() string {
	return fmt.Sprintf("%d", new(big.Int).SetUint64(uint64(1000000000 + (1 * 1000000000))))
}

// GetFunctionSelector returns the 4-byte function selector
func GetFunctionSelector(signature string) []byte {
	hash := Keccak256HashString(signature)
	return hash[:4]
}

// PadBytes32 pads bytes to 32 bytes (for ABI encoding)
func PadBytes32(data []byte) []byte {
	padded := make([]byte, 32)
	copy(padded[32-len(data):], data)
	return padded
}

// UnpadBytes32 removes padding from 32-byte data
func UnpadBytes32(data []byte) []byte {
	if len(data) != 32 {
		return data
	}
	// Find first non-zero byte
	for i := 0; i < len(data); i++ {
		if data[i] != 0 {
			return data[i:]
		}
	}
	return []byte{}
}

// MultiplyByDecimals multiplies an amount by 10^decimals
func MultiplyByDecimals(amount *big.Int, decimals int) *big.Int {
	multiplier := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	return new(big.Int).Mul(amount, multiplier)
}

// DivideByDecimals divides an amount by 10^decimals
func DivideByDecimals(amount *big.Int, decimals int) *big.Int {
	divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	return new(big.Int).Div(amount, divisor)
}

// FormatTokenAmount formats a token amount with decimals
func FormatTokenAmount(amount *big.Int, decimals int) string {
	if amount == nil {
		return "0"
	}

	divisor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	whole := new(big.Int).Div(amount, divisor)
	remainder := new(big.Int).Mod(amount, divisor)

	// Format remainder with proper decimal places
	remainderStr := remainder.String()
	for len(remainderStr) < decimals {
		remainderStr = "0" + remainderStr
	}

	return fmt.Sprintf("%s.%s", whole.String(), remainderStr)
}

// ParseTokenAmount parses a token amount string with decimals
func ParseTokenAmount(amount string, decimals int) (*big.Int, error) {
	amount = strings.TrimSpace(amount)

	parts := strings.Split(amount, ".")
	whole := parts[0]
	decimal := ""

	if len(parts) == 2 {
		decimal = parts[1]
		if len(decimal) > decimals {
			return nil, &Error{
				Code:    "INVALID_FORMAT",
				Message: fmt.Sprintf("Too many decimal places (max %d)", decimals),
				Details: amount,
			}
		}
		// Pad to correct decimals
		for len(decimal) < decimals {
			decimal += "0"
		}
	} else if len(parts) == 1 {
		// No decimal point, pad with zeros
		for i := 0; i < decimals; i++ {
			decimal += "0"
		}
	} else {
		return nil, &Error{
			Code:    "INVALID_FORMAT",
			Message: "Invalid token amount format",
			Details: amount,
		}
	}

	combined := whole + decimal
	result, ok := new(big.Int).SetString(combined, 10)
	if !ok {
		return nil, &Error{
			Code:    "PARSE_ERROR",
			Message: "Failed to parse token amount",
			Details: amount,
		}
	}

	return result, nil
}
