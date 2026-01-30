package settler

import (
	"context"
	"fmt"
	"net/url"
)

// Money represents a monetary amount with currency
type Money struct {
	Value    float64 `json:"value"`
	Currency string  `json:"currency"`
}

// ConvertCurrencyRequest represents a currency conversion request
type ConvertCurrencyRequest struct {
	Amount struct {
		Value    float64 `json:"value"`
		Currency string  `json:"currency"`
	} `json:"amount"`
	ToCurrency string `json:"toCurrency"`
	Date       string `json:"date,omitempty"`
}

// ConvertCurrencyResponse represents the response from converting currency
type ConvertCurrencyResponse struct {
	Data struct {
		Original  Money `json:"original"`
		Converted Money `json:"converted"`
	} `json:"data"`
}

// FXRate represents an FX rate response
type FXRate struct {
	FromCurrency string  `json:"fromCurrency"`
	ToCurrency   string  `json:"toCurrency"`
	Rate         float64 `json:"rate"`
	Date         string  `json:"date"`
}

// FXRateResponse represents the response from getting an FX rate
type FXRateResponse struct {
	Data FXRate `json:"data"`
}

// GetFXRateParams represents parameters for getting an FX rate
type GetFXRateParams struct {
	FromCurrency string
	ToCurrency   string
	Date         string
}

// ToQuery converts FX rate parameters to query values
func (p GetFXRateParams) ToQuery() url.Values {
	q := url.Values{}
	q.Set("fromCurrency", p.FromCurrency)
	q.Set("toCurrency", p.ToCurrency)
	if p.Date != "" {
		q.Set("date", p.Date)
	}
	return q
}

// CurrencyClient handles currency conversion operations
type CurrencyClient struct {
	client *Client
}

// Convert converts an amount to a target currency
func (c *CurrencyClient) Convert(ctx context.Context, req ConvertCurrencyRequest) (*ConvertCurrencyResponse, error) {
	resp, err := c.client.request(ctx, "POST", "/currency/convert", req, nil)
	if err != nil {
		return nil, err
	}

	var result ConvertCurrencyResponse
	if data, ok := resp["data"].(map[string]interface{}); ok {
		if original, ok := data["original"].(map[string]interface{}); ok {
			result.Data.Original = parseMoney(original)
		}
		if converted, ok := data["converted"].(map[string]interface{}); ok {
			result.Data.Converted = parseMoney(converted)
		}
	}

	return &result, nil
}

// GetFXRate retrieves the FX rate for a currency pair
func (c *CurrencyClient) GetFXRate(ctx context.Context, params GetFXRateParams) (*FXRate, error) {
	if params.FromCurrency == "" {
		return nil, fmt.Errorf("fromCurrency is required")
	}
	if params.ToCurrency == "" {
		return nil, fmt.Errorf("toCurrency is required")
	}

	query := params.ToQuery()
	resp, err := c.client.request(ctx, "GET", "/currency/fx-rate", nil, query)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		rate := parseFXRate(data)
		return &rate, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// parseFXRate converts a map to an FXRate struct
func parseFXRate(data map[string]interface{}) FXRate {
	r := FXRate{
		FromCurrency: getString(data, "fromCurrency"),
		ToCurrency:   getString(data, "toCurrency"),
		Date:         getString(data, "date"),
	}

	if rate, ok := data["rate"].(float64); ok {
		r.Rate = rate
	}

	return r
}
