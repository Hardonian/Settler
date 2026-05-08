package settler

import (
	"context"
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
