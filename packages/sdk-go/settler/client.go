// Receipts returns a ReceiptsClient
func (c *Client) Receipts() *ReceiptsClient {
	return &ReceiptsClient{client: c}
}

// Flags returns a FlagsClient
func (c *Client) Flags() *FlagsClient {
	return &FlagsClient{client: c}
}

// Convert returns a ConvertClient
func (c *Client) Convert() *ConvertClient {
	return &ConvertClient{client: c}
}

// ReceiptsClient handles receipt operations
type ReceiptsClient struct {
	client *Client
}

// Parse parses a receipt from a URL
func (rc *ReceiptsClient) Parse(fileURL string, options map[string]interface{}) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"url": fileURL,
	}
	if options != nil {
		data["options"] = options
	}
	resp, err := rc.client.request("POST", "/api/v1/receipts/parse", data, nil)
	if err != nil {
		return nil, err
	}
	if d, ok := resp["data"].(map[string]interface{}); ok {
		return d, nil
	}
	return resp, nil
}

// Get retrieves parsed receipt details
func (rc *ReceiptsClient) Get(receiptID string) (map[string]interface{}, error) {
	resp, err := rc.client.request("GET", "/api/v1/receipts/"+receiptID, nil, nil)
	if err != nil {
		return nil, err
	}
	if d, ok := resp["data"].(map[string]interface{}); ok {
		return d, nil
	}
	return resp, nil
}

// FlagsClient handles feature flag operations
type FlagsClient struct {
	client *Client
}

// Evaluate evaluates a feature flag
func (fc *FlagsClient) Evaluate(flagKey string, context map[string]interface{}, defaultValue interface{}) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"flagKey":      flagKey,
		"context":      context,
		"defaultValue": defaultValue,
	}
	resp, err := fc.client.request("POST", "/api/v1/feature-flags/evaluate", data, nil)
	if err != nil {
		if defaultValue != nil {
			return map[string]interface{}{
				"flagKey": flagKey,
				"value":   defaultValue,
				"reason":  "error_fallback",
			}, nil
		}
		return nil, err
	}
	if d, ok := resp["data"].(map[string]interface{}); ok {
		return d, nil
	}
	return resp, nil
}

// ConvertClient handles conversion operations
type ConvertClient struct {
	client *Client
}

// Unit converts units
func (cc *ConvertClient) Unit(value float64, fromUnit, toUnit string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"value": value,
		"from":  fromUnit,
		"to":    toUnit,
	}
	resp, err := cc.client.request("POST", "/api/v1/convert/unit", data, nil)
	if err != nil {
		return nil, err
	}
	if d, ok := resp["data"].(map[string]interface{}); ok {
		return d, nil
	}
	return resp, nil
}

// Currency converts currency
func (cc *ConvertClient) Currency(amount float64, fromCurrency, toCurrency string, date string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"amount": amount,
		"from":   fromCurrency,
		"to":     toCurrency,
	}
	if date != "" {
		data["date"] = date
	}
	resp, err := cc.client.request("POST", "/api/v1/convert/currency", data, nil)
	if err != nil {
		return nil, err
	}
	if d, ok := resp["data"].(map[string]interface{}); ok {
		return d, nil
	}
	return resp, nil
}
