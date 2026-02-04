package settler

import (
	"context"
	"net/url"
	"strconv"
)

// ApiKey represents a console API key
//
// Note: Key is only returned on creation.
type ApiKey struct {
	ID         string   `json:"id"`
	Name       string   `json:"name,omitempty"`
	KeyPrefix  string   `json:"keyPrefix"`
	CreatedAt  string   `json:"createdAt"`
	LastUsedAt *string  `json:"lastUsedAt,omitempty"`
	RevokedAt  *string  `json:"revokedAt,omitempty"`
	ExpiresAt  *string  `json:"expiresAt,omitempty"`
	Scopes     []string `json:"scopes"`
}

// CreateApiKeyRequest represents the payload to create an API key
//
// ExpiresAt should be an ISO 8601 timestamp string.
type CreateApiKeyRequest struct {
	Name      string   `json:"name,omitempty"`
	Scopes    []string `json:"scopes,omitempty"`
	ExpiresAt string   `json:"expiresAt,omitempty"`
}

// CreateApiKeyResponse represents the response for creating an API key
type CreateApiKeyResponse struct {
	ID        string `json:"id"`
	Key       string `json:"key"`
	Name      string `json:"name,omitempty"`
	CreatedAt string `json:"createdAt"`
}

// ApiKeysListResponse represents a list response for API keys
type ApiKeysListResponse struct {
	Data  []ApiKey `json:"data"`
	Count int      `json:"count"`
}

// UsageSummary represents aggregate usage statistics
type UsageSummary struct {
	TotalCalls  int               `json:"totalCalls"`
	ByService   map[string]int    `json:"byService"`
	ByOperation map[string]int    `json:"byOperation"`
	ErrorRate   float64           `json:"errorRate"`
	Period      UsagePeriodWindow `json:"period"`
}

// UsagePeriodWindow represents the window for usage data
type UsagePeriodWindow struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// UsageEvent represents a single usage event
type UsageEvent struct {
	ID        string                 `json:"id"`
	Timestamp string                 `json:"timestamp"`
	Service   string                 `json:"service"`
	Operation string                 `json:"operation"`
	Quantity  int                    `json:"quantity"`
	Unit      *string                `json:"unit,omitempty"`
	Status    *string                `json:"status,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// UsageResponse represents console usage response
type UsageResponse struct {
	Summary UsageSummary `json:"summary"`
	Events  []UsageEvent `json:"events"`
}

// Activity represents a console activity entry
type Activity struct {
	ID           string                 `json:"id"`
	ActivityType string                 `json:"activityType"`
	Action       string                 `json:"action"`
	Title        string                 `json:"title"`
	Status       string                 `json:"status"`
	Metadata     map[string]interface{} `json:"metadata"`
	CreatedAt    string                 `json:"created_at"`
}

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

// FeatureFlag represents a console feature flag
type FeatureFlag struct {
	ID           string                   `json:"id"`
	Key          string                   `json:"key"`
	Name         string                   `json:"name"`
	Description  *string                  `json:"description"`
	Type         string                   `json:"type"`
	IsGlobal     bool                     `json:"isGlobal"`
	DefaultValue interface{}              `json:"defaultValue"`
	Environments []FeatureFlagEnvironment `json:"environments"`
	CreatedAt    string                   `json:"createdAt"`
	UpdatedAt    string                   `json:"updatedAt"`
}

// FeatureFlagEnvironment represents environment-specific flag data
// Variant is only present for multivariate flags.
type FeatureFlagEnvironment struct {
	Environment string      `json:"environment"`
	Enabled     bool        `json:"enabled"`
	Variant     interface{} `json:"variant,omitempty"`
}

// FeatureFlagsListResponse represents a list response for feature flags
type FeatureFlagsListResponse struct {
	Data  []FeatureFlag `json:"data"`
	Count int           `json:"count"`
}

// ReceiptsListResponse represents a list response for receipts
type ReceiptsListResponse struct {
	Data  []ReceiptListItem `json:"data"`
	Count int               `json:"count"`
}

// ConsoleHealth represents the console health response
//
// Example status: { status: "ok", checks: { env: {status: "ok"}, ... } }
type ConsoleHealth struct {
	Status string `json:"status"`
	Checks struct {
		Env      HealthStatus `json:"env"`
		Supabase HealthStatus `json:"supabase"`
		Auth     HealthStatus `json:"auth"`
	} `json:"checks"`
}

// HealthStatus represents status of a health check
type HealthStatus struct {
	Status string `json:"status"`
}

// ConsoleClient handles console operations
//
// These endpoints live under /api/console rather than /api/v1.
type ConsoleClient struct {
	client *Client
}

// ListApiKeys lists all API keys
func (c *ConsoleClient) ListApiKeys(ctx context.Context) (*ApiKeysListResponse, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/api-keys", nil, nil)
	if err != nil {
		return nil, err
	}

	keys := parseApiKeys(getSlice(resp, "keys"))
	return &ApiKeysListResponse{Data: keys, Count: len(keys)}, nil
}

// CreateApiKey creates a new API key
func (c *ConsoleClient) CreateApiKey(ctx context.Context, request CreateApiKeyRequest) (*CreateApiKeyResponse, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "POST", "/api/console/api-keys", request, nil)
	if err != nil {
		return nil, err
	}

	return parseCreateApiKeyResponse(resp), nil
}

// RevokeApiKey revokes an API key by ID
func (c *ConsoleClient) RevokeApiKey(ctx context.Context, keyID string) error {
	_, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "DELETE", "/api/console/api-keys/"+keyID, nil, nil)
	return err
}

// GetUsage retrieves usage statistics for the specified number of days (default 7)
func (c *ConsoleClient) GetUsage(ctx context.Context, days int) (*UsageResponse, error) {
	if days <= 0 {
		days = 7
	}
	query := url.Values{}
	query.Set("days", strconv.Itoa(days))
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/usage", nil, query)
	if err != nil {
		return nil, err
	}

	return parseUsageResponse(resp), nil
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

// ListFeatureFlags lists feature flags available in console
func (c *ConsoleClient) ListFeatureFlags(ctx context.Context) (*FeatureFlagsListResponse, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/feature-flags", nil, nil)
	if err != nil {
		return nil, err
	}

	flags := parseFeatureFlags(getSlice(resp, "flags"))
	return &FeatureFlagsListResponse{Data: flags, Count: len(flags)}, nil
}

// GetActivities retrieves recent console activities
func (c *ConsoleClient) GetActivities(ctx context.Context) ([]Activity, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/activities", nil, nil)
	if err != nil {
		return nil, err
	}

	return parseActivities(getSlice(resp, "activities")), nil
}

// Health checks console health status
func (c *ConsoleClient) Health(ctx context.Context) (*ConsoleHealth, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/health", nil, nil)
	if err != nil {
		return nil, err
	}

	return parseConsoleHealth(resp), nil
}

func parseApiKeys(items []interface{}) []ApiKey {
	keys := make([]ApiKey, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			keys = append(keys, parseApiKey(data))
		}
	}
	return keys
}

func parseApiKey(data map[string]interface{}) ApiKey {
	return ApiKey{
		ID:         getString(data, "id"),
		Name:       getString(data, "name"),
		KeyPrefix:  getString(data, "keyPrefix"),
		CreatedAt:  getString(data, "createdAt"),
		LastUsedAt: getOptionalString(data, "lastUsedAt"),
		RevokedAt:  getOptionalString(data, "revokedAt"),
		ExpiresAt:  getOptionalString(data, "expiresAt"),
		Scopes:     getStringSlice(data, "scopes"),
	}
}

func parseCreateApiKeyResponse(data map[string]interface{}) *CreateApiKeyResponse {
	return &CreateApiKeyResponse{
		ID:        getString(data, "id"),
		Key:       getString(data, "key"),
		Name:      getString(data, "name"),
		CreatedAt: getString(data, "createdAt"),
	}
}

func parseUsageResponse(data map[string]interface{}) *UsageResponse {
	response := &UsageResponse{}
	if summary, ok := data["summary"].(map[string]interface{}); ok {
		response.Summary = parseUsageSummary(summary)
	}
	if events, ok := data["events"].([]interface{}); ok {
		response.Events = parseUsageEvents(events)
	}
	return response
}

func parseUsageSummary(data map[string]interface{}) UsageSummary {
	summary := UsageSummary{
		TotalCalls:  getInt(data, "totalCalls"),
		ByService:   getStringIntMap(data, "byService"),
		ByOperation: getStringIntMap(data, "byOperation"),
		ErrorRate:   getFloat(data, "errorRate"),
	}
	if period, ok := data["period"].(map[string]interface{}); ok {
		summary.Period = UsagePeriodWindow{
			Start: getString(period, "start"),
			End:   getString(period, "end"),
		}
	}
	return summary
}

func parseUsageEvents(items []interface{}) []UsageEvent {
	events := make([]UsageEvent, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			events = append(events, UsageEvent{
				ID:        getString(data, "id"),
				Timestamp: getString(data, "timestamp"),
				Service:   getString(data, "service"),
				Operation: getString(data, "operation"),
				Quantity:  getInt(data, "quantity"),
				Unit:      getOptionalString(data, "unit"),
				Status:    getOptionalString(data, "status"),
				Metadata:  getMap(data, "metadata"),
			})
		}
	}
	return events
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

func parseFeatureFlags(items []interface{}) []FeatureFlag {
	flags := make([]FeatureFlag, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			flags = append(flags, parseFeatureFlag(data))
		}
	}
	return flags
}

func parseFeatureFlag(data map[string]interface{}) FeatureFlag {
	flag := FeatureFlag{
		ID:           getString(data, "id"),
		Key:          getString(data, "key"),
		Name:         getString(data, "name"),
		Description:  getOptionalString(data, "description"),
		Type:         getString(data, "type"),
		IsGlobal:     getBool(data, "isGlobal"),
		DefaultValue: data["defaultValue"],
		CreatedAt:    getString(data, "createdAt"),
		UpdatedAt:    getString(data, "updatedAt"),
	}
	if envs, ok := data["environments"].([]interface{}); ok {
		flag.Environments = make([]FeatureFlagEnvironment, 0, len(envs))
		for _, env := range envs {
			if envMap, ok := env.(map[string]interface{}); ok {
				flag.Environments = append(flag.Environments, FeatureFlagEnvironment{
					Environment: getString(envMap, "environment"),
					Enabled:     getBool(envMap, "enabled"),
					Variant:     envMap["variant"],
				})
			}
		}
	}
	return flag
}

func parseActivities(items []interface{}) []Activity {
	activities := make([]Activity, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			activities = append(activities, Activity{
				ID:           getString(data, "id"),
				ActivityType: getString(data, "activityType"),
				Action:       getString(data, "action"),
				Title:        getString(data, "title"),
				Status:       getString(data, "status"),
				Metadata:     getMap(data, "metadata"),
				CreatedAt:    getString(data, "created_at"),
			})
		}
	}
	return activities
}

func parseConsoleHealth(data map[string]interface{}) *ConsoleHealth {
	health := &ConsoleHealth{
		Status: getString(data, "status"),
	}
	if checks, ok := data["checks"].(map[string]interface{}); ok {
		if env, ok := checks["env"].(map[string]interface{}); ok {
			health.Checks.Env = HealthStatus{Status: getString(env, "status")}
		}
		if supabase, ok := checks["supabase"].(map[string]interface{}); ok {
			health.Checks.Supabase = HealthStatus{Status: getString(supabase, "status")}
		}
		if auth, ok := checks["auth"].(map[string]interface{}); ok {
			health.Checks.Auth = HealthStatus{Status: getString(auth, "status")}
		}
	}
	return health
}

func getSlice(data map[string]interface{}, key string) []interface{} {
	if items, ok := data[key].([]interface{}); ok {
		return items
	}
	return []interface{}{}
}

func getOptionalString(data map[string]interface{}, key string) *string {
	if value, ok := data[key]; ok {
		if str, ok := value.(string); ok {
			return &str
		}
	}
	return nil
}

func getOptionalFloat(data map[string]interface{}, key string) *float64 {
	if value, ok := data[key]; ok {
		switch typed := value.(type) {
		case float64:
			return &typed
		case int:
			v := float64(typed)
			return &v
		case int64:
			v := float64(typed)
			return &v
		}
	}
	return nil
}

func getStringSlice(data map[string]interface{}, key string) []string {
	values := []string{}
	if items, ok := data[key].([]interface{}); ok {
		for _, item := range items {
			if str, ok := item.(string); ok {
				values = append(values, str)
			}
		}
	}
	return values
}

func getStringIntMap(data map[string]interface{}, key string) map[string]int {
	result := map[string]int{}
	if items, ok := data[key].(map[string]interface{}); ok {
		for k, v := range items {
			switch typed := v.(type) {
			case float64:
				result[k] = int(typed)
			case int:
				result[k] = typed
			case int64:
				result[k] = int(typed)
			}
		}
	}
	return result
}

func getMap(data map[string]interface{}, key string) map[string]interface{} {
	if value, ok := data[key].(map[string]interface{}); ok {
		return value
	}
	return nil
}

func getFloat(data map[string]interface{}, key string) float64 {
	if value, ok := data[key]; ok {
		switch typed := value.(type) {
		case float64:
			return typed
		case int:
			return float64(typed)
		case int64:
			return float64(typed)
		}
	}
	return 0
}

func getBool(data map[string]interface{}, key string) bool {
	if value, ok := data[key]; ok {
		if typed, ok := value.(bool); ok {
			return typed
		}
	}
	return false
}
