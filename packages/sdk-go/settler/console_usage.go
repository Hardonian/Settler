package settler

import (
	"context"
	"net/url"
	"strconv"
)

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
