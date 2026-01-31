package thirdweb

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// IPFSClient handles IPFS storage operations
type IPFSClient struct {
	gateway     string
	pinataAPI   string
	pinataJWT   string
	httpClient  *http.Client
}

// NewIPFSClient creates a new IPFS client
func NewIPFSClient(gateway string, pinataJWT string) *IPFSClient {
	if gateway == "" {
		gateway = "https://gateway.pinata.cloud"
	}

	return &IPFSClient{
		gateway:    gateway,
		pinataAPI:  "https://api.pinata.cloud",
		pinataJWT:  pinataJWT,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// UploadToIPFS uploads data to IPFS via Pinata
func (c *VarityClient) UploadToIPFS(ctx context.Context, data []byte, filename string) (*IPFSUploadResult, error) {
	if c.config.ThirdwebSecretKey == "" {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Thirdweb secret key or Pinata JWT required for IPFS uploads",
		}
	}

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add file part
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to create form file",
			Details: err.Error(),
		}
	}

	if _, err := part.Write(data); err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to write file data",
			Details: err.Error(),
		}
	}

	if err := writer.Close(); err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to close multipart writer",
			Details: err.Error(),
		}
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.pinata.cloud/pinning/pinFileToIPFS", body)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to create request",
			Details: err.Error(),
		}
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.config.ThirdwebSecretKey))

	// Send request
	httpClient := &http.Client{Timeout: 60 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to upload to IPFS",
			Details: err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "IPFS upload failed",
			Details: fmt.Sprintf("Status: %d, Body: %s", resp.StatusCode, string(respBody)),
		}
	}

	// Parse response
	var result struct {
		IpfsHash string `json:"IpfsHash"`
		PinSize  int64  `json:"PinSize"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to parse IPFS response",
			Details: err.Error(),
		}
	}

	return &IPFSUploadResult{
		CID:        result.IpfsHash,
		GatewayURL: c.GetGatewayURL(result.IpfsHash),
		Size:       result.PinSize,
		PinataPin:  true,
	}, nil
}

// DownloadFromIPFS downloads data from IPFS
func (c *VarityClient) DownloadFromIPFS(ctx context.Context, cid string) ([]byte, error) {
	url := c.GetGatewayURL(cid)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to create request",
			Details: err.Error(),
		}
	}

	httpClient := &http.Client{Timeout: 60 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to download from IPFS",
			Details: err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "IPFS download failed",
			Details: fmt.Sprintf("Status: %d", resp.StatusCode),
		}
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to read response body",
			Details: err.Error(),
		}
	}

	return data, nil
}

// PinContent pins existing IPFS content
func (c *VarityClient) PinContent(ctx context.Context, cid string) error {
	if c.config.ThirdwebSecretKey == "" {
		return &Error{
			Code:    ErrCodeStorageError,
			Message: "Thirdweb secret key or Pinata JWT required for pinning",
		}
	}

	// Create request body
	body, err := json.Marshal(map[string]interface{}{
		"hashToPin": cid,
	})
	if err != nil {
		return &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to marshal request body",
			Details: err.Error(),
		}
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.pinata.cloud/pinning/pinByHash", bytes.NewReader(body))
	if err != nil {
		return &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to create request",
			Details: err.Error(),
		}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.config.ThirdwebSecretKey))

	// Send request
	httpClient := &http.Client{Timeout: 30 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to pin content",
			Details: err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return &Error{
			Code:    ErrCodeStorageError,
			Message: "Pin request failed",
			Details: fmt.Sprintf("Status: %d, Body: %s", resp.StatusCode, string(respBody)),
		}
	}

	return nil
}

// GetGatewayURL generates an IPFS gateway URL
func (c *VarityClient) GetGatewayURL(cid string) string {
	return fmt.Sprintf("%s/ipfs/%s", c.ipfsGateway, cid)
}

// UploadJSON uploads JSON data to IPFS
func (c *VarityClient) UploadJSON(ctx context.Context, data interface{}) (*IPFSUploadResult, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to marshal JSON",
			Details: err.Error(),
		}
	}

	return c.UploadToIPFS(ctx, jsonData, "data.json")
}

// DownloadJSON downloads and parses JSON from IPFS
func (c *VarityClient) DownloadJSON(ctx context.Context, cid string, target interface{}) error {
	data, err := c.DownloadFromIPFS(ctx, cid)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, target); err != nil {
		return &Error{
			Code:    ErrCodeStorageError,
			Message: "Failed to unmarshal JSON",
			Details: err.Error(),
		}
	}

	return nil
}

// UploadMetadata uploads NFT metadata to IPFS
func (c *VarityClient) UploadMetadata(ctx context.Context, metadata map[string]interface{}) (*IPFSUploadResult, error) {
	return c.UploadJSON(ctx, metadata)
}

// UploadFile uploads a file to IPFS
func (c *VarityClient) UploadFile(ctx context.Context, filePath string) (*IPFSUploadResult, error) {
	// This would require file system operations
	// For now, return error indicating file operations need to be handled by caller
	return nil, &Error{
		Code:    "NOT_IMPLEMENTED",
		Message: "File uploads should be handled by reading the file and calling UploadToIPFS",
	}
}

// GetIPFSMetadata gets metadata from IPFS CID
func (c *VarityClient) GetIPFSMetadata(ctx context.Context, cid string) (map[string]interface{}, error) {
	var metadata map[string]interface{}
	err := c.DownloadJSON(ctx, cid, &metadata)
	if err != nil {
		return nil, err
	}
	return metadata, nil
}

// IPFSURIToHTTP converts an IPFS URI to HTTP gateway URL
func (c *VarityClient) IPFSURIToHTTP(ipfsURI string) string {
	// Handle ipfs:// protocol
	if len(ipfsURI) > 7 && ipfsURI[:7] == "ipfs://" {
		cid := ipfsURI[7:]
		return c.GetGatewayURL(cid)
	}

	// Handle /ipfs/ format
	if len(ipfsURI) > 6 && ipfsURI[:6] == "/ipfs/" {
		cid := ipfsURI[6:]
		return c.GetGatewayURL(cid)
	}

	// Assume it's just a CID
	return c.GetGatewayURL(ipfsURI)
}

// BatchUploadToIPFS uploads multiple files to IPFS
func (c *VarityClient) BatchUploadToIPFS(ctx context.Context, files map[string][]byte) ([]*IPFSUploadResult, error) {
	results := make([]*IPFSUploadResult, 0, len(files))

	for filename, data := range files {
		result, err := c.UploadToIPFS(ctx, data, filename)
		if err != nil {
			return results, &Error{
				Code:    ErrCodeStorageError,
				Message: fmt.Sprintf("Failed to upload %s", filename),
				Details: err.Error(),
			}
		}
		results = append(results, result)
	}

	return results, nil
}
