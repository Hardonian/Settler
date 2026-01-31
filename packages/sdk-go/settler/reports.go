package settler

import (
	"context"
	"fmt"
)

// Report represents a reconciliation report
type Report struct {
	JobID     string        `json:"jobId"`
	Provider  string        `json:"provider"`
	DateRange DateRange     `json:"dateRange"`
	Summary   ReportSummary `json:"summary"`
	Status    string        `json:"status"`
	CreatedAt string        `json:"createdAt"`
}

// ReportSummary holds report summary statistics
type ReportSummary struct {
	TotalTransactions int   `json:"totalTransactions"`
	Matched           int   `json:"matched"`
	Unmatched         int   `json:"unmatched"`
	TotalAmount       Money `json:"totalAmount"`
	TotalFees         Money `json:"totalFees"`
}

// ReportsClient handles reconciliation report operations
type ReportsClient struct {
	client *Client
}

// Get retrieves a reconciliation report for a job
func (c *ReportsClient) Get(ctx context.Context, jobID string) (*Report, error) {
	path := fmt.Sprintf("/reports/%s", jobID)
	resp, err := c.client.request(ctx, "GET", path, nil, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		report := parseReport(data)
		return &report, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// GetUnmatched retrieves unmatched transactions for a job
func (c *ReportsClient) GetUnmatched(ctx context.Context, jobID string) ([]Transaction, error) {
	path := fmt.Sprintf("/reports/%s/unmatched", jobID)
	resp, err := c.client.request(ctx, "GET", path, nil, nil)
	if err != nil {
		return nil, err
	}

	var transactions []Transaction
	if data, ok := resp["data"].([]interface{}); ok {
		transactions = make([]Transaction, len(data))
		for i, item := range data {
			if tx, ok := item.(map[string]interface{}); ok {
				transactions[i] = parseTransaction(tx)
			}
		}
	}

	return transactions, nil
}

// parseReport converts a map to a Report struct
func parseReport(data map[string]interface{}) Report {
	r := Report{
		JobID:     getString(data, "jobId"),
		Provider:  getString(data, "provider"),
		Status:    getString(data, "status"),
		CreatedAt: getString(data, "createdAt"),
	}

	if dr, ok := data["dateRange"].(map[string]interface{}); ok {
		r.DateRange = DateRange{
			Start: getString(dr, "start"),
			End:   getString(dr, "end"),
		}
	}

	if summary, ok := data["summary"].(map[string]interface{}); ok {
		r.Summary = ReportSummary{
			TotalTransactions: getInt(summary, "totalTransactions"),
			Matched:           getInt(summary, "matched"),
			Unmatched:         getInt(summary, "unmatched"),
		}
		if amt, ok := summary["totalAmount"].(map[string]interface{}); ok {
			r.Summary.TotalAmount = parseMoney(amt)
		}
		if fees, ok := summary["totalFees"].(map[string]interface{}); ok {
			r.Summary.TotalFees = parseMoney(fees)
		}
	}

	return r
}
