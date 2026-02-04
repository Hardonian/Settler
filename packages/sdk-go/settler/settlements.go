package settler

import (
	"context"
	"fmt"
	"net/url"
)

// Pagination represents pagination metadata
type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// Settlement represents a settlement in the Settler system
type Settlement struct {
	ID                   string  `json:"id"`
	TenantID             string  `json:"tenantId"`
	Provider             string  `json:"provider"`
	ProviderSettlementID string  `json:"providerSettlementId"`
	Amount               Money   `json:"amount"`
	Currency             string  `json:"currency"`
	FxRate               float64 `json:"fxRate,omitempty"`
	SettlementDate       string  `json:"settlementDate,omitempty"`
	ExpectedDate         string  `json:"expectedDate,omitempty"`
	Status               string  `json:"status"`
	CreatedAt            string  `json:"createdAt"`
	UpdatedAt            string  `json:"updatedAt"`
}

// SettlementsListResponse represents the response from listing settlements
type SettlementsListResponse struct {
	Data       []Settlement `json:"data"`
	Pagination Pagination   `json:"pagination"`
}

// SettlementResponse represents the response for a single settlement
type SettlementResponse struct {
	Data Settlement `json:"data"`
}

// ListSettlementsParams represents parameters for listing settlements
type ListSettlementsParams struct {
	Page      int
	Limit     int
	Provider  string
	Status    string
	StartDate string
	EndDate   string
}

// ToQuery converts list parameters to query values
func (p ListSettlementsParams) ToQuery() url.Values {
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
	if p.StartDate != "" {
		q.Set("startDate", p.StartDate)
	}
	if p.EndDate != "" {
		q.Set("endDate", p.EndDate)
	}
	return q
}

// SettlementsClient handles settlement operations
type SettlementsClient struct {
	client *Client
}

// List retrieves a list of settlements with optional filtering
func (c *SettlementsClient) List(ctx context.Context, params ListSettlementsParams) (*SettlementsListResponse, error) {
	query := params.ToQuery()
	resp, err := c.client.request(ctx, "GET", "/settlements", nil, query)
	if err != nil {
		return nil, err
	}

	var result SettlementsListResponse
	if data, ok := resp["data"].([]interface{}); ok {
		result.Data = make([]Settlement, len(data))
		for i, item := range data {
			if settlement, ok := item.(map[string]interface{}); ok {
				result.Data[i] = parseSettlement(settlement)
			}
		}
	}
	if pagination, ok := resp["pagination"].(map[string]interface{}); ok {
		result.Pagination = parsePagination(pagination)
	}

	return &result, nil
}

// Get retrieves a settlement by its ID
func (c *SettlementsClient) Get(ctx context.Context, id string) (*Settlement, error) {
	path := fmt.Sprintf("/settlements/%s", id)
	resp, err := c.client.request(ctx, "GET", path, nil, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		settlement := parseSettlement(data)
		return &settlement, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// parseSettlement converts a map to a Settlement struct
func parseSettlement(data map[string]interface{}) Settlement {
	s := Settlement{
		ID:                   getString(data, "id"),
		TenantID:             getString(data, "tenantId"),
		Provider:             getString(data, "provider"),
		ProviderSettlementID: getString(data, "providerSettlementId"),
		Currency:             getString(data, "currency"),
		Status:               getString(data, "status"),
		CreatedAt:            getString(data, "createdAt"),
		UpdatedAt:            getString(data, "updatedAt"),
	}

	if amount, ok := data["amount"].(map[string]interface{}); ok {
		s.Amount = parseMoney(amount)
	}

	if fxRate, ok := data["fxRate"].(float64); ok {
		s.FxRate = fxRate
	}

	if settlementDate, ok := data["settlementDate"].(string); ok {
		s.SettlementDate = settlementDate
	}

	if expectedDate, ok := data["expectedDate"].(string); ok {
		s.ExpectedDate = expectedDate
	}

	return s
}

// getString safely extracts a string value from a map
func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}

// parseMoney converts a map to a Money struct
func parseMoney(data map[string]interface{}) Money {
	m := Money{
		Currency: getString(data, "currency"),
	}
	if val, ok := data["value"].(float64); ok {
		m.Value = val
	}
	return m
}

// parsePagination converts a map to a Pagination struct
func parsePagination(data map[string]interface{}) Pagination {
	p := Pagination{
		Page:       getInt(data, "page"),
		Limit:      getInt(data, "limit"),
		Total:      getInt(data, "total"),
		TotalPages: getInt(data, "totalPages"),
	}
	return p
}

// getInt safely extracts an int value from a map
func getInt(data map[string]interface{}, key string) int {
	if value, ok := data[key]; ok {
		switch typed := value.(type) {
		case float64:
			return int(typed)
		case int:
			return typed
		case int64:
			return int(typed)
		}
	}
	return 0
}
