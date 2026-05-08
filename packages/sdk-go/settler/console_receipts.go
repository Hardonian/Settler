package settler

import (
	"context"
)

// ReceiptListItem represents a receipt item shown in console
// Fields may be null depending on extraction results.
type ReceiptListItem struct {
	ID              string   `json:"id"`
	Vendor          *string  `json:"vendor"`
	Date            *string  `json:"date"`
	Currency        *string  `json:"currency"`
	Total           *float64 `json:"total"`
	ConfidenceScore *float64 `json:"confidenceScore"`
	ItemCount       int      `json:"itemCount"`
	CreatedAt       string   `json:"createdAt"`
}

// ReceiptsListResponse represents a list response for receipts
type ReceiptsListResponse struct {
	Data  []ReceiptListItem `json:"data"`
	Count int               `json:"count"`
}

// ListReceipts lists receipts available in console
func (c *ConsoleClient) ListReceipts(ctx context.Context) (*ReceiptsListResponse, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/receipts", nil, nil)
	if err != nil {
		return nil, err
	}

	receipts := parseReceipts(getSlice(resp, "receipts"))
	return &ReceiptsListResponse{Data: receipts, Count: len(receipts)}, nil
}

// GetReceipt fetches receipt details by ID
func (c *ConsoleClient) GetReceipt(ctx context.Context, receiptID string) (*ReceiptListItem, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/receipts/"+receiptID, nil, nil)
	if err != nil {
		return nil, err
	}

	if receipt, ok := resp["receipt"].(map[string]interface{}); ok {
		parsed := parseReceipt(receipt)
		return &parsed, nil
	}
	return nil, &ValidationError{Message: "invalid receipt response"}
}

func parseReceipts(items []interface{}) []ReceiptListItem {
	receipts := make([]ReceiptListItem, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			receipts = append(receipts, parseReceipt(data))
		}
	}
	return receipts
}

func parseReceipt(data map[string]interface{}) ReceiptListItem {
	return ReceiptListItem{
		ID:              getString(data, "id"),
		Vendor:          getOptionalString(data, "vendor"),
		Date:            getOptionalString(data, "date"),
		Currency:        getOptionalString(data, "currency"),
		Total:           getOptionalFloat(data, "total"),
		ConfidenceScore: getOptionalFloat(data, "confidenceScore"),
		ItemCount:       getInt(data, "itemCount"),
		CreatedAt:       getString(data, "createdAt"),
	}
}
