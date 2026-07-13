package settler

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	defaultBaseURL   = "https://api.settler.io/api/v1"
	defaultTimeout   = 30 * time.Second
	defaultUserAgent = "settler-go/1.0.0"
)

// Client is the main SDK client for the Settler API
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	userAgent  string
}

// ClientOption is a functional option for configuring the Client
type ClientOption func(*Client)

// WithAPIKey sets the API key for authentication
func WithAPIKey(apiKey string) ClientOption {
	return func(c *Client) {
		c.apiKey = apiKey
	}
}

// WithBaseURL sets a custom base URL
func WithBaseURL(baseURL string) ClientOption {
	return func(c *Client) {
		c.baseURL = strings.TrimSuffix(baseURL, "/")
	}
}

// WithHTTPClient sets a custom HTTP client
func WithHTTPClient(httpClient *http.Client) ClientOption {
	return func(c *Client) {
		c.httpClient = httpClient
	}
}

// WithUserAgent sets a custom user agent
func WithUserAgent(userAgent string) ClientOption {
	return func(c *Client) {
		c.userAgent = userAgent
	}
}

// NewClient creates a new Settler API client
func NewClient(options ...ClientOption) (*Client, error) {
	client := &Client{
		baseURL:   defaultBaseURL,
		userAgent: defaultUserAgent,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}

	for _, option := range options {
		option(client)
	}

	if client.apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	return client, nil
}

// request makes an HTTP request to the API
func (c *Client) request(ctx context.Context, method, path string, body interface{}, query url.Values) (map[string]interface{}, error) {
	return c.requestWithBase(ctx, c.baseURL, method, path, body, query)
}

// requestWithBase makes an HTTP request to the API with a custom base URL
func (c *Client) requestWithBase(ctx context.Context, baseURL, method, path string, body interface{}, query url.Values) (map[string]interface{}, error) {
	baseURL = strings.TrimSuffix(baseURL, "/")
	url := baseURL + path
	if query != nil {
		url = url + "?" + query.Encode()
	}

	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, &ValidationError{Message: fmt.Sprintf("failed to marshal request body: %v", err)}
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
	if err != nil {
		return nil, &NetworkError{Message: fmt.Sprintf("failed to create request: %v", err)}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", c.userAgent)
	req.Header.Set("Accept-Encoding", "gzip")

	// Generate unique request ID
	reqIDBytes := make([]byte, 16)
	rand.Read(reqIDBytes)
	reqID := hex.EncodeToString(reqIDBytes)
	req.Header.Set("X-Request-ID", reqID)

	// Add idempotency key for mutations
	if method == "POST" || method == "PUT" || method == "PATCH" {
		req.Header.Set("Idempotency-Key", reqID)
	}

	// Set authentication header
	if strings.HasPrefix(c.apiKey, "rk_") {
		req.Header.Set("X-API-Key", c.apiKey)
	} else {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, &NetworkError{Message: fmt.Sprintf("request failed: %v", err)}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &NetworkError{Message: fmt.Sprintf("failed to read response body: %v", err)}
	}

	// Handle non-2xx responses
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, c.parseError(resp, respBody)
	}

	// Parse response
	var result map[string]interface{}
	if len(respBody) > 0 {
		if err := json.Unmarshal(respBody, &result); err != nil {
			return nil, fmt.Errorf("failed to unmarshal response: %v", err)
		}
	}

	return result, nil
}

// parseError converts HTTP error responses to appropriate error types
func (c *Client) parseError(resp *http.Response, body []byte) error {
	var errorData map[string]interface{}
	if len(body) > 0 {
		json.Unmarshal(body, &errorData)
	}

	message := "Unknown error"
	if msg, ok := errorData["message"].(string); ok && msg != "" {
		message = msg
	} else if err, ok := errorData["error"].(string); ok && err != "" {
		message = err
	}

	switch resp.StatusCode {
	case 400:
		return &ValidationError{Message: message}
	case 401, 403:
		return &AuthenticationError{Message: message}
	case 404:
		return &NotFoundError{Message: message}
	case 429:
		return &RateLimitError{Message: message}
	case 500, 502, 503, 504:
		return &ServerError{Message: message, StatusCode: resp.StatusCode}
	default:
		return &SettlerError{Message: message, StatusCode: resp.StatusCode}
	}
}

// Transactions returns a TransactionsClient for transaction operations
func (c *Client) Transactions() *TransactionsClient {
	return &TransactionsClient{client: c}
}

// Settlements returns a SettlementsClient for settlement operations
func (c *Client) Settlements() *SettlementsClient {
	return &SettlementsClient{client: c}
}

// Fees returns a FeesClient for fee operations
func (c *Client) Fees() *FeesClient {
	return &FeesClient{client: c}
}

// Currency returns a CurrencyClient for currency conversion operations
func (c *Client) Currency() *CurrencyClient {
	return &CurrencyClient{client: c}
}

// Exports returns an ExportsClient for export operations
func (c *Client) Exports() *ExportsClient {
	return &ExportsClient{client: c}
}

// Webhooks returns a WebhooksClient for webhook operations
func (c *Client) Webhooks() *WebhooksClient {
	return &WebhooksClient{client: c}
}

// Jobs returns a JobsClient for reconciliation job operations
func (c *Client) Jobs() *JobsClient {
	return &JobsClient{client: c}
}

// Reports returns a ReportsClient for reconciliation report operations
func (c *Client) Reports() *ReportsClient {
	return &ReportsClient{client: c}
}

// Console returns a ConsoleClient for console operations
func (c *Client) Console() *ConsoleClient {
	return &ConsoleClient{client: c}
}

// Flags returns a FlagsClient for feature flag operations
func (c *Client) Flags() *FlagsClient {
	return &FlagsClient{client: c}
}

// Convert returns a ConvertClient for unit/currency conversions
func (c *Client) Convert() *ConvertClient {
	return &ConvertClient{client: c}
}

// Receipts returns a ReceiptsClient for receipt operations
func (c *Client) Receipts() *ReceiptsClient {
	return &ReceiptsClient{client: c}
}

// Adapters returns an AdaptersClient for adapter operations
func (c *Client) Adapters() *AdaptersClient {
	return &AdaptersClient{client: c}
}

// PaginationParams represents common pagination parameters
type PaginationParams struct {
	Page  int
	Limit int
}

// ToQuery converts pagination params to query values
func (p PaginationParams) ToQuery() url.Values {
	q := url.Values{}
	if p.Page > 0 {
		q.Set("page", strconv.Itoa(p.Page))
	}
	if p.Limit > 0 {
		q.Set("limit", strconv.Itoa(p.Limit))
	}
	return q
}

func (c *Client) rootBaseURL() string {
	base := strings.TrimSuffix(c.baseURL, "/")
	if strings.HasSuffix(base, "/api/v1") {
		return strings.TrimSuffix(base, "/api/v1")
	}
	if strings.HasSuffix(base, "/api") {
		return strings.TrimSuffix(base, "/api")
	}
	return base
}
