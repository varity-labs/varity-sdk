package thirdweb

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// GenerateSIWEMessage creates a Sign-In with Ethereum message
func (c *VarityClient) GenerateSIWEMessage(domain string, address common.Address, statement string, uri string) (*SIWEMessage, error) {
	// Generate random nonce
	nonceBytes := make([]byte, 16)
	if _, err := rand.Read(nonceBytes); err != nil {
		return nil, &Error{
			Code:    "NONCE_GENERATION_FAILED",
			Message: "Failed to generate nonce",
			Details: err.Error(),
		}
	}
	nonce := hex.EncodeToString(nonceBytes)

	// Create SIWE message
	message := &SIWEMessage{
		Domain:     domain,
		Address:    address,
		Statement:  statement,
		URI:        uri,
		Version:    "1",
		ChainId:    c.config.ChainID,
		Nonce:      nonce,
		IssuedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	return message, nil
}

// FormatSIWEMessage formats a SIWE message according to EIP-4361
func FormatSIWEMessage(message *SIWEMessage) string {
	var builder strings.Builder

	builder.WriteString(fmt.Sprintf("%s wants you to sign in with your Ethereum account:\n", message.Domain))
	builder.WriteString(fmt.Sprintf("%s\n\n", message.Address.Hex()))

	if message.Statement != "" {
		builder.WriteString(fmt.Sprintf("%s\n\n", message.Statement))
	}

	builder.WriteString(fmt.Sprintf("URI: %s\n", message.URI))
	builder.WriteString(fmt.Sprintf("Version: %s\n", message.Version))
	builder.WriteString(fmt.Sprintf("Chain ID: %d\n", message.ChainId))
	builder.WriteString(fmt.Sprintf("Nonce: %s\n", message.Nonce))
	builder.WriteString(fmt.Sprintf("Issued At: %s", message.IssuedAt))

	if message.ExpirationTime != "" {
		builder.WriteString(fmt.Sprintf("\nExpiration Time: %s", message.ExpirationTime))
	}

	if message.NotBefore != "" {
		builder.WriteString(fmt.Sprintf("\nNot Before: %s", message.NotBefore))
	}

	return builder.String()
}

// SignSIWEMessage signs a SIWE message
func (c *VarityClient) SignSIWEMessage(message *SIWEMessage) (*SIWESignature, error) {
	if err := c.requireWallet(); err != nil {
		return nil, err
	}

	// Format message
	formattedMessage := FormatSIWEMessage(message)

	// Sign message
	signature, err := c.SignMessage(formattedMessage)
	if err != nil {
		return nil, err
	}

	return &SIWESignature{
		Message:      message,
		Signature:    signature,
		SignatureHex: EncodeHex(signature),
	}, nil
}

// VerifySIWESignature verifies a SIWE signature
func (c *VarityClient) VerifySIWESignature(siweSignature *SIWESignature) (bool, error) {
	// Format message
	formattedMessage := FormatSIWEMessage(siweSignature.Message)

	// Verify signature
	return c.VerifySignature(formattedMessage, siweSignature.SignatureHex, siweSignature.Message.Address.Hex())
}

// CreateSession creates a JWT session token from a SIWE signature
func (c *VarityClient) CreateSession(siweSignature *SIWESignature, expirationMinutes int) (*JWTToken, error) {
	// Verify signature first
	valid, err := c.VerifySIWESignature(siweSignature)
	if err != nil {
		return nil, err
	}

	if !valid {
		return nil, &Error{
			Code:    ErrCodeInvalidSignature,
			Message: "Invalid SIWE signature",
		}
	}

	// Check expiration if set
	if siweSignature.Message.ExpirationTime != "" {
		expirationTime, err := time.Parse(time.RFC3339, siweSignature.Message.ExpirationTime)
		if err == nil && time.Now().After(expirationTime) {
			return nil, &Error{
				Code:    "EXPIRED_MESSAGE",
				Message: "SIWE message has expired",
			}
		}
	}

	// Check NotBefore if set
	if siweSignature.Message.NotBefore != "" {
		notBeforeTime, err := time.Parse(time.RFC3339, siweSignature.Message.NotBefore)
		if err == nil && time.Now().Before(notBeforeTime) {
			return nil, &Error{
				Code:    "NOT_YET_VALID",
				Message: "SIWE message is not yet valid",
			}
		}
	}

	// Create simple JWT token (in production, use proper JWT library)
	expiresAt := time.Now().Add(time.Duration(expirationMinutes) * time.Minute).Unix()

	// Create token payload
	payload := fmt.Sprintf("%s:%d:%s", siweSignature.Message.Address.Hex(), expiresAt, siweSignature.Message.Nonce)

	// Sign payload with server key (in this case, use the client's private key as example)
	hash := crypto.Keccak256Hash([]byte(payload))
	tokenSignature, err := crypto.Sign(hash.Bytes(), c.privateKey)
	if err != nil {
		return nil, &Error{
			Code:    "TOKEN_GENERATION_FAILED",
			Message: "Failed to generate JWT token",
			Details: err.Error(),
		}
	}

	// Create JWT token (simplified format)
	token := fmt.Sprintf("%s.%s", hex.EncodeToString([]byte(payload)), hex.EncodeToString(tokenSignature))

	return &JWTToken{
		Token:     token,
		ExpiresAt: expiresAt,
		Address:   siweSignature.Message.Address,
	}, nil
}

// VerifySession verifies a JWT session token
func (c *VarityClient) VerifySession(tokenString string) (*JWTToken, error) {
	// Split token
	parts := strings.Split(tokenString, ".")
	if len(parts) != 2 {
		return nil, &Error{
			Code:    "INVALID_TOKEN",
			Message: "Invalid JWT token format",
		}
	}

	// Decode payload
	payloadBytes, err := hex.DecodeString(parts[0])
	if err != nil {
		return nil, &Error{
			Code:    "INVALID_TOKEN",
			Message: "Failed to decode token payload",
			Details: err.Error(),
		}
	}

	payload := string(payloadBytes)

	// Parse payload
	payloadParts := strings.Split(payload, ":")
	if len(payloadParts) != 3 {
		return nil, &Error{
			Code:    "INVALID_TOKEN",
			Message: "Invalid token payload format",
		}
	}

	address := common.HexToAddress(payloadParts[0])
	expiresAt := int64(0)
	fmt.Sscanf(payloadParts[1], "%d", &expiresAt)
	nonce := payloadParts[2]

	// Check expiration
	if time.Now().Unix() > expiresAt {
		return nil, &Error{
			Code:    "TOKEN_EXPIRED",
			Message: "JWT token has expired",
		}
	}

	// Verify signature
	signatureBytes, err := hex.DecodeString(parts[1])
	if err != nil {
		return nil, &Error{
			Code:    "INVALID_TOKEN",
			Message: "Failed to decode token signature",
			Details: err.Error(),
		}
	}

	hash := crypto.Keccak256Hash(payloadBytes)

	// Recover public key from signature
	pubKey, err := crypto.SigToPub(hash.Bytes(), signatureBytes)
	if err != nil {
		return nil, &Error{
			Code:    "INVALID_TOKEN",
			Message: "Failed to recover public key",
			Details: err.Error(),
		}
	}

	// Verify it matches the client's address (in production, verify against server key)
	recoveredAddress := crypto.PubkeyToAddress(*pubKey)
	if recoveredAddress != c.address {
		return nil, &Error{
			Code:    "INVALID_TOKEN",
			Message: "Token signature verification failed",
		}
	}

	return &JWTToken{
		Token:     tokenString,
		ExpiresAt: expiresAt,
		Address:   address,
	}, nil
}

// GenerateSIWEMessageWithOptions creates a SIWE message with custom options
func (c *VarityClient) GenerateSIWEMessageWithOptions(
	domain string,
	address common.Address,
	statement string,
	uri string,
	expirationMinutes int,
	notBeforeMinutes int,
) (*SIWEMessage, error) {
	message, err := c.GenerateSIWEMessage(domain, address, statement, uri)
	if err != nil {
		return nil, err
	}

	if expirationMinutes > 0 {
		expirationTime := time.Now().Add(time.Duration(expirationMinutes) * time.Minute)
		message.ExpirationTime = expirationTime.UTC().Format(time.RFC3339)
	}

	if notBeforeMinutes > 0 {
		notBeforeTime := time.Now().Add(time.Duration(notBeforeMinutes) * time.Minute)
		message.NotBefore = notBeforeTime.UTC().Format(time.RFC3339)
	}

	return message, nil
}

// AuthenticateWithSIWE performs the complete SIWE authentication flow
func (c *VarityClient) AuthenticateWithSIWE(domain string, statement string, uri string, sessionMinutes int) (*JWTToken, error) {
	if err := c.requireWallet(); err != nil {
		return nil, err
	}

	// Generate SIWE message
	message, err := c.GenerateSIWEMessage(domain, c.address, statement, uri)
	if err != nil {
		return nil, err
	}

	// Set expiration to 5 minutes for the message itself
	expirationTime := time.Now().Add(5 * time.Minute)
	message.ExpirationTime = expirationTime.UTC().Format(time.RFC3339)

	// Sign message
	signature, err := c.SignSIWEMessage(message)
	if err != nil {
		return nil, err
	}

	// Create session
	return c.CreateSession(signature, sessionMinutes)
}
