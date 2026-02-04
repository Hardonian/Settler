package settler

import "context"

// UnitConversionResponse represents a unit conversion response.
type UnitConversionResponse struct {
	Value float64 `json:"value"`
	Unit  string  `json:"unit"`
}

// CurrencyConversionResponse represents a currency conversion response.
type CurrencyConversionResponse struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Rate     float64 `json:"rate"`
}

// ConvertClient handles conversion operations.
type ConvertClient struct {
	client *Client
}

// Unit converts a value between units.
func (c *ConvertClient) Unit(ctx context.Context, value float64, from string, to string) (*UnitConversionResponse, error) {
	request := map[string]interface{}{
		"value": value,
		"from":  from,
		"to":    to,
	}

	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "POST", "/v1/convert/unit", request, nil)
	if err != nil {
		return nil, err
	}

	return &UnitConversionResponse{
		Value: getFloat(resp, "value"),
		Unit:  getString(resp, "unit"),
	}, nil
}

// Currency converts an amount between currencies.
func (c *ConvertClient) Currency(ctx context.Context, amount float64, from string, to string, date string) (*CurrencyConversionResponse, error) {
	request := map[string]interface{}{
		"amount": amount,
		"from":   from,
		"to":     to,
	}
	if date != "" {
		request["date"] = date
	}

	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "POST", "/v1/convert/currency", request, nil)
	if err != nil {
		return nil, err
	}

	return &CurrencyConversionResponse{
		Amount:   getFloat(resp, "amount"),
		Currency: getString(resp, "currency"),
		Rate:     getFloat(resp, "rate"),
	}, nil
}

// Financial converts a financial amount between formats.
func (c *ConvertClient) Financial(ctx context.Context, amount float64, fromFormat string, toFormat string) (string, error) {
	request := map[string]interface{}{
		"amount":     amount,
		"fromFormat": fromFormat,
		"toFormat":   toFormat,
	}

	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "POST", "/v1/convert/financial", request, nil)
	if err != nil {
		return "", err
	}

	if value, ok := resp["value"].(string); ok {
		return value, nil
	}
	if value, ok := resp["result"].(string); ok {
		return value, nil
	}
	return "", &ValidationError{Message: "invalid financial conversion response"}
}
