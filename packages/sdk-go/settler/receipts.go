package settler

import (
	"context"
	"fmt"
)

// Receipt represents an uploaded receipt.
type Receipt struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	CreatedAt string `json:"createdAt"`
}

// ReceiptsClient handles receipt operations.
type ReceiptsClient struct {
	client *Client
}

// Upload uploads a receipt.
func (c *ReceiptsClient) Upload(ctx context.Context, fileBase64 string, fileName string, contentType string) (*Receipt, error) {
	request := map[string]interface{}{
		"file":        fileBase64,
		"fileName":    fileName,
		"contentType": contentType,
	}

	resp, err := c.client.request(ctx, "POST", "/receipts/upload", request, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		return &Receipt{
			ID:        getString(data, "id"),
			URL:       getString(data, "url"),
			CreatedAt: getString(data, "createdAt"),
		}, nil
	}

	return nil, fmt.Errorf("invalid response format")
}
