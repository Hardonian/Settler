package settler

import (
	"context"
)

// Adapter represents a provider adapter.
type Adapter struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Version string `json:"version"`
}

// AdaptersClient handles adapter operations.
type AdaptersClient struct {
	client *Client
}

// List lists available adapters.
func (c *AdaptersClient) List(ctx context.Context) ([]Adapter, error) {
	resp, err := c.client.request(ctx, "GET", "/adapters", nil, nil)
	if err != nil {
		return nil, err
	}

	var adapters []Adapter
	if data, ok := resp["data"].([]interface{}); ok {
		for _, item := range data {
			if m, ok := item.(map[string]interface{}); ok {
				adapters = append(adapters, Adapter{
					ID:      getString(m, "id"),
					Name:    getString(m, "name"),
					Version: getString(m, "version"),
				})
			}
		}
	}

	return adapters, nil
}
