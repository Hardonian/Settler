package settler

import (
	"context"
	"fmt"
	"net/url"
)

// Transaction represents a transaction in the Settler system
type Transaction struct {
	ID                    string `json:"id"`
	TenantID              string `json:"tenantId"`
	PaymentID             string `json:"paymentId"`
	Provider              string `json:"provider"`
	ProviderTransactionID string `json:"providerTransactionId"`
	Type                  string `json:"type"`
	Amount                Money  `json:"amount"`
	NetAmount             Money  `json:"netAmount"`
	Status                string `json:"status"`
	CreatedAt             string `json:"createdAt"`
	UpdatedAt             string `json:"updatedAt"`
}

// TransactionsListResponse represents the response from listing transactions
type TransactionsListResponse struct {
	Data       []Transaction `json:"data"`
	Pagination Pagination    `json:"pagination"`
}

// ListTransactionsParams represents parameters for listing transactions
type ListTransactionsParams struct {
	Page      int
	Limit     int
	Provider  string
	Status    string
	Type      string
	PaymentID string
	StartDate string
	EndDate   string
}

// ToQuery converts list parameters to query values
func (p ListTransactionsParams) ToQuery() url.Values {
	q := url.Values{}
	if p.Page > 0 {
		q.Set("page", fmt.Sprintf("%d", p.Page))
	}
	if p.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", p.Limit))
	}
	if p.Provider != "" {
		q.Set("provider", p.Provider)
	}
	if p.Status != "" {
		q.Set("status", p.Status)
	}
	if p.Type != "" {
		q.Set("type", p.Type)
	}
	if p.PaymentID != "" {
		q.Set("paymentId", p.PaymentID)
	}
	if p.StartDate != "" {
		q.Set("startDate", p.StartDate)
	}
	if p.EndDate != "" {
		q.Set("endDate", p.EndDate)
	}
	return q
}

// TransactionsClient handles transaction operations
type TransactionsClient struct {
	client *Client
}

// List retrieves a list of transactions with optional filtering
func (c *TransactionsClient) List(ctx context.Context, params ListTransactionsParams) (*TransactionsListResponse, error) {
	query := params.ToQuery()
	resp, err := c.client.request(ctx, "GET", "/transactions", nil, query)
	if err != nil {
		return nil, err
	}

	var result TransactionsListResponse
	if data, ok := resp["data"].([]interface{}); ok {
		result.Data = make([]Transaction, len(data))
		for i, item := range data {
			if transaction, ok := item.(map[string]interface{}); ok {
				result.Data[i] = parseTransaction(transaction)
			}
		}
	}
	if pagination, ok := resp["pagination"].(map[string]interface{}); ok {
		result.Pagination = parsePagination(pagination)
	}

	return &result, nil
}

// Get retrieves a transaction by its ID
func (c *TransactionsClient) Get(ctx context.Context, id string) (*Transaction, error) {
	path := fmt.Sprintf("/transactions/%s", id)
	resp, err := c.client.request(ctx, "GET", path, nil, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		transaction := parseTransaction(data)
		return &transaction, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// parseTransaction converts a map to a Transaction struct
func parseTransaction(data map[string]interface{}) Transaction {
	t := Transaction{
		ID:                    getString(data, "id"),
		TenantID:              getString(data, "tenantId"),
		PaymentID:             getString(data, "paymentId"),
		Provider:              getString(data, "provider"),
		ProviderTransactionID: getString(data, "providerTransactionId"),
		Type:                  getString(data, "type"),
		Status:                getString(data, "status"),
		CreatedAt:             getString(data, "createdAt"),
		UpdatedAt:             getString(data, "updatedAt"),
	}

	if amount, ok := data["amount"].(map[string]interface{}); ok {
		t.Amount = parseMoney(amount)
	}

	if netAmount, ok := data["netAmount"].(map[string]interface{}); ok {
		t.NetAmount = parseMoney(netAmount)
	}

	return t
}
