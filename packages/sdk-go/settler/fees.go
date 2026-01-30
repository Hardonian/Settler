package settler

import (
	"context"
	"net/url"
)

// Fee represents a fee in the Settler system
type Fee struct {
	ID            string  `json:"id"`
	TenantID      string  `json:"tenantId"`
	TransactionID string  `json:"transactionId,omitempty"`
	SettlementID  string  `json:"settlementId,omitempty"`
	Type          string  `json:"type"`
	Amount        Money   `json:"amount"`
	Description   string  `json:"description,omitempty"`
	Rate          float64 `json:"rate,omitempty"`
	CreatedAt     string  `json:"createdAt"`
}

// FeesListResponse represents the response from listing fees
type FeesListResponse struct {
	Data []Fee `json:"data"`
}

// EffectiveRateItem represents a single effective rate calculation result
type EffectiveRateItem struct {
	TransactionID     string  `json:"transactionId"`
	Provider          string  `json:"provider"`
	TransactionAmount float64 `json:"transactionAmount"`
	TotalFees         float64 `json:"totalFees"`
	EffectiveRate     float64 `json:"effectiveRate"`
}

// EffectiveRateResponse represents the response from calculating effective rates
type EffectiveRateResponse struct {
	Data []EffectiveRateItem `json:"data"`
}

// ListFeesParams represents parameters for listing fees
type ListFeesParams struct {
	TransactionID string
	SettlementID  string
	Type          string
}

// ToQuery converts list parameters to query values
func (p ListFeesParams) ToQuery() url.Values {
	q := url.Values{}
	if p.TransactionID != "" {
		q.Set("transactionId", p.TransactionID)
	}
	if p.SettlementID != "" {
		q.Set("settlementId", p.SettlementID)
	}
	if p.Type != "" {
		q.Set("type", p.Type)
	}
	return q
}

// CalculateEffectiveRateParams represents parameters for calculating effective rate
type CalculateEffectiveRateParams struct {
	TransactionID string
	Provider      string
	StartDate     string
	EndDate       string
}

// ToQuery converts effective rate parameters to query values
func (p CalculateEffectiveRateParams) ToQuery() url.Values {
	q := url.Values{}
	if p.TransactionID != "" {
		q.Set("transactionId", p.TransactionID)
	}
	if p.Provider != "" {
		q.Set("provider", p.Provider)
	}
	if p.StartDate != "" {
		q.Set("startDate", p.StartDate)
	}
	if p.EndDate != "" {
		q.Set("endDate", p.EndDate)
	}
	return q
}

// FeesClient handles fee operations
type FeesClient struct {
	client *Client
}

// List retrieves a list of fees with optional filtering
func (c *FeesClient) List(ctx context.Context, params ListFeesParams) (*FeesListResponse, error) {
	query := params.ToQuery()
	resp, err := c.client.request(ctx, "GET", "/fees", nil, query)
	if err != nil {
		return nil, err
	}

	var result FeesListResponse
	if data, ok := resp["data"].([]interface{}); ok {
		result.Data = make([]Fee, len(data))
		for i, item := range data {
			if fee, ok := item.(map[string]interface{}); ok {
				result.Data[i] = parseFee(fee)
			}
		}
	}

	return &result, nil
}

// CalculateEffectiveRate calculates the effective processing rate for transactions
func (c *FeesClient) CalculateEffectiveRate(ctx context.Context, params CalculateEffectiveRateParams) (*EffectiveRateResponse, error) {
	query := params.ToQuery()
	resp, err := c.client.request(ctx, "GET", "/fees/effective-rate", nil, query)
	if err != nil {
		return nil, err
	}

	var result EffectiveRateResponse
	if data, ok := resp["data"].([]interface{}); ok {
		result.Data = make([]EffectiveRateItem, len(data))
		for i, item := range data {
			if rateItem, ok := item.(map[string]interface{}); ok {
				result.Data[i] = parseEffectiveRateItem(rateItem)
			}
		}
	}

	return &result, nil
}

// parseFee converts a map to a Fee struct
func parseFee(data map[string]interface{}) Fee {
	f := Fee{
		ID:            getString(data, "id"),
		TenantID:      getString(data, "tenantId"),
		TransactionID: getString(data, "transactionId"),
		SettlementID:  getString(data, "settlementId"),
		Type:          getString(data, "type"),
		Description:   getString(data, "description"),
		CreatedAt:     getString(data, "createdAt"),
	}

	if amount, ok := data["amount"].(map[string]interface{}); ok {
		f.Amount = parseMoney(amount)
	}

	if rate, ok := data["rate"].(float64); ok {
		f.Rate = rate
	}

	return f
}

// parseEffectiveRateItem converts a map to an EffectiveRateItem struct
func parseEffectiveRateItem(data map[string]interface{}) EffectiveRateItem {
	item := EffectiveRateItem{
		TransactionID: getString(data, "transactionId"),
		Provider:      getString(data, "provider"),
	}

	if val, ok := data["transactionAmount"].(float64); ok {
		item.TransactionAmount = val
	}

	if val, ok := data["totalFees"].(float64); ok {
		item.TotalFees = val
	}

	if val, ok := data["effectiveRate"].(float64); ok {
		item.EffectiveRate = val
	}

	return item
}
