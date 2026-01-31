package settler

import (
	"testing"
)

func TestNewClientRequiresAPIKey(t *testing.T) {
	_, err := NewClient()
	if err == nil {
		t.Fatal("expected error for missing API key")
	}
}

func TestNewClientWithAPIKey(t *testing.T) {
	client, err := NewClient(WithAPIKey("sk_test"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if client.apiKey != "sk_test" {
		t.Fatalf("expected API key 'sk_test', got '%s'", client.apiKey)
	}
}

func TestNewClientDefaultBaseURL(t *testing.T) {
	client, err := NewClient(WithAPIKey("sk_test"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if client.baseURL != defaultBaseURL {
		t.Fatalf("expected base URL '%s', got '%s'", defaultBaseURL, client.baseURL)
	}
}

func TestNewClientCustomBaseURL(t *testing.T) {
	client, err := NewClient(WithAPIKey("sk_test"), WithBaseURL("http://localhost:3000/api/v1"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if client.baseURL != "http://localhost:3000/api/v1" {
		t.Fatalf("expected custom base URL, got '%s'", client.baseURL)
	}
}

func TestClientAccessors(t *testing.T) {
	client, err := NewClient(WithAPIKey("sk_test"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if client.Transactions() == nil {
		t.Fatal("expected non-nil TransactionsClient")
	}
	if client.Settlements() == nil {
		t.Fatal("expected non-nil SettlementsClient")
	}
	if client.Fees() == nil {
		t.Fatal("expected non-nil FeesClient")
	}
	if client.Currency() == nil {
		t.Fatal("expected non-nil CurrencyClient")
	}
	if client.Exports() == nil {
		t.Fatal("expected non-nil ExportsClient")
	}
	if client.Webhooks() == nil {
		t.Fatal("expected non-nil WebhooksClient")
	}
	if client.Jobs() == nil {
		t.Fatal("expected non-nil JobsClient")
	}
	if client.Reports() == nil {
		t.Fatal("expected non-nil ReportsClient")
	}
}

func TestListTransactionsParamsToQuery(t *testing.T) {
	params := ListTransactionsParams{
		Page:     2,
		Limit:    50,
		Provider: "stripe",
		Status:   "succeeded",
	}
	q := params.ToQuery()
	if q.Get("page") != "2" {
		t.Fatalf("expected page '2', got '%s'", q.Get("page"))
	}
	if q.Get("limit") != "50" {
		t.Fatalf("expected limit '50', got '%s'", q.Get("limit"))
	}
	if q.Get("provider") != "stripe" {
		t.Fatalf("expected provider 'stripe', got '%s'", q.Get("provider"))
	}
}

func TestListJobsParamsToQuery(t *testing.T) {
	params := ListJobsParams{
		Status:   "running",
		Provider: "paypal",
	}
	q := params.ToQuery()
	if q.Get("status") != "running" {
		t.Fatalf("expected status 'running', got '%s'", q.Get("status"))
	}
	if q.Get("provider") != "paypal" {
		t.Fatalf("expected provider 'paypal', got '%s'", q.Get("provider"))
	}
}

func TestErrorTypes(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want string
	}{
		{"NetworkError", &NetworkError{Message: "timeout"}, "Network error: timeout"},
		{"AuthenticationError", &AuthenticationError{Message: "invalid"}, "Authentication error: invalid"},
		{"ValidationError", &ValidationError{Message: "bad input"}, "Validation error: bad input"},
		{"NotFoundError", &NotFoundError{Message: "missing"}, "Not found: missing"},
		{"RateLimitError", &RateLimitError{Message: "slow down"}, "Rate limit exceeded: slow down"},
		{"ServerError", &ServerError{Message: "oops", StatusCode: 500}, "Server error (500): oops"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}
