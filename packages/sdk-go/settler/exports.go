package settler

import (
	"context"
)

// DateRange represents a date range for export operations
type DateRange struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// ExportOptions represents options for creating an export
type ExportOptions struct {
	IncludeFees        bool                   `json:"includeFees,omitempty"`
	IncludeUnmatched   bool                   `json:"includeUnmatched,omitempty"`
	IncludeRawPayloads bool                   `json:"includeRawPayloads,omitempty"`
	Columns            []string               `json:"columns,omitempty"`
	GLAccountMapping   map[string]interface{} `json:"glAccountMapping,omitempty"`
}

// CreateExportRequest represents a request to create an export
type CreateExportRequest struct {
	JobID     string        `json:"jobId"`
	Format    string        `json:"format"`
	DateRange DateRange     `json:"dateRange"`
	Options   ExportOptions `json:"options,omitempty"`
}

// ExportSummary represents the summary of an export
type ExportSummary struct {
	TotalMatches   int `json:"totalMatches"`
	TotalUnmatched int `json:"totalUnmatched"`
	TotalFees      int `json:"totalFees"`
}

// ExportResult represents the result of an export operation
type ExportResult struct {
	ExportDate string        `json:"exportDate"`
	DateRange  DateRange     `json:"dateRange"`
	Summary    ExportSummary `json:"summary"`
	Matches    []interface{} `json:"matches"`
}

// ExportsClient handles export operations
type ExportsClient struct {
	client *Client
}

// Create creates a new export of reconciled data
// The export can be in QuickBooks, CSV, or JSON format
func (c *ExportsClient) Create(ctx context.Context, req CreateExportRequest) (*ExportResult, error) {
	resp, err := c.client.request(ctx, "POST", "/exports", req, nil)
	if err != nil {
		return nil, err
	}

	result := parseExportResult(resp)
	return &result, nil
}

// parseExportResult converts a map to an ExportResult struct
func parseExportResult(data map[string]interface{}) ExportResult {
	r := ExportResult{
		ExportDate: getString(data, "exportDate"),
	}

	if dateRange, ok := data["dateRange"].(map[string]interface{}); ok {
		r.DateRange = DateRange{
			Start: getString(dateRange, "start"),
			End:   getString(dateRange, "end"),
		}
	}

	if summary, ok := data["summary"].(map[string]interface{}); ok {
		r.Summary = parseExportSummary(summary)
	}

	if matches, ok := data["matches"].([]interface{}); ok {
		r.Matches = matches
	}

	return r
}

// parseExportSummary converts a map to an ExportSummary struct
func parseExportSummary(data map[string]interface{}) ExportSummary {
	s := ExportSummary{
		TotalMatches:   getInt(data, "totalMatches"),
		TotalUnmatched: getInt(data, "totalUnmatched"),
		TotalFees:      getInt(data, "totalFees"),
	}
	return s
}
