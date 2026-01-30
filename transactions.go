package settler

import (
	"context"
	"fmt"
	"net/url"
)

// Transaction represents a payment transaction
type Transaction struct {
	ID                    string                 `json:"id"`
	TenantID              string                 `json:"tenantId"`
	PaymentID             string                 `json:"paymentId"`
	Provider              string                 `json:"provider"`
	ProviderTransactionID string                 `json:"providerTransactionId"`
	Type                  string                 `json:"type"`
	Amount                Money                  `json:"amount"`
	NetAmount             Money                  `json:"netAmount"`
	Status                string                 `json:"status"`
	RawPayload            map[string]interface{} `json:"rawPayload,omitempty"`
	CreatedAt             string                 `json:"createdAt"`
	UpdatedAt             string                 `json:"updatedAt"`
}

// Money represents a monetary amount with currency
type Money struct {
	Value    float64 `json:"value"`
	Currency string  `json:"currency"`
}

// Pagination represents pagination metadata
type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// ListTransactionsResponse represents the response from listing transactions
type ListTransactionsResponse struct {
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

// ToQuery converts params to query values
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

// List lists transactions with filtering and pagination
func (tc *TransactionsClient) List(ctx context.Context, params ListTransactionsParams) (*ListTransactionsResponse, error) {
	resp, err := tc.client.request(ctx, "GET", "/transactions", nil, params.ToQuery())
	if err != nil {
		return nil, err
	}

	data, ok := resp["data"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format: missing data array")
	}

	transactions := make([]Transaction, 0, len(data))
	for _, item := range data {
		if txMap, ok := item.(map[string]interface{}); ok {
			var tx Transaction
			if jsonData, err := json.Marshal(txMap); err == nil {
				json.Unmarshal(jsonData, &tx)
				transactions = append(transactions, tx)
			}
		}
	}

	var pagination Pagination
	if pgMap, ok := resp["pagination"].(map[string]interface{}); ok {
		if jsonData, err := json.Marshal(pgMap); err == nil {
			json.Unmarshal(jsonData, &pagination)
		}
	}

	return &ListTransactionsResponse{
		Data:       transactions,
		Pagination: pagination,
	}, nil
}

// Get retrieves a transaction by ID
func (tc *TransactionsClient) Get(ctx context.Context, id string) (*Transaction, error) {
	resp, err := tc.client.request(ctx, "GET", fmt.Sprintf("/transactions/%s", id), nil, nil)
	if err != nil {
		return nil, err
	}

	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format: missing data object")
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal transaction data: %v", err)
	}

	var transaction Transaction
	if err := json.Unmarshal(jsonData, &transaction); err != nil {
		return nil, fmt.Errorf("failed to unmarshal transaction: %v", err)
	}

	return &transaction, nil
}
