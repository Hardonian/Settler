package settler

import (
	"context"
	"fmt"
)

// WebhookEvent represents a processed webhook event
type WebhookEvent struct {
	// Event fields will vary based on the provider
	// Using map to handle different event structures
}

// ReceiveWebhookResponse represents the response from receiving a webhook
type ReceiveWebhookResponse struct {
	Data struct {
		Processed bool                     `json:"processed"`
		Events    []map[string]interface{} `json:"events"`
	} `json:"data"`
}

// WebhooksClient handles webhook operations
type WebhooksClient struct {
	client *Client
}

// Receive processes a webhook from a payment provider
// Supported adapters: stripe, paypal, square
func (c *WebhooksClient) Receive(ctx context.Context, adapter string, payload map[string]interface{}) (*ReceiveWebhookResponse, error) {
	validAdapters := map[string]bool{
		"stripe": true,
		"paypal": true,
		"square": true,
	}

	if !validAdapters[adapter] {
		return nil, fmt.Errorf("invalid adapter: %s. Must be one of: stripe, paypal, square", adapter)
	}

	path := fmt.Sprintf("/webhooks/receive/%s", adapter)
	resp, err := c.client.request(ctx, "POST", path, payload, nil)
	if err != nil {
		return nil, err
	}

	var result ReceiveWebhookResponse
	if data, ok := resp["data"].(map[string]interface{}); ok {
		if processed, ok := data["processed"].(bool); ok {
			result.Data.Processed = processed
		}
		if events, ok := data["events"].([]interface{}); ok {
			result.Data.Events = make([]map[string]interface{}, len(events))
			for i, event := range events {
				if eventMap, ok := event.(map[string]interface{}); ok {
					result.Data.Events[i] = eventMap
				}
			}
		}
	}

	return &result, nil
}
