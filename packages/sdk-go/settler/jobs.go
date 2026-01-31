package settler

import (
	"context"
	"fmt"
	"net/url"
)

// Job represents a reconciliation job
type Job struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenantId"`
	Provider  string    `json:"provider"`
	Status    string    `json:"status"`
	DateRange DateRange `json:"dateRange"`
	Result    JobResult `json:"result"`
	CreatedAt string    `json:"createdAt"`
	UpdatedAt string    `json:"updatedAt"`
}

// DateRange represents a date range
type DateRange struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// JobResult holds reconciliation results
type JobResult struct {
	Matched        int `json:"matched"`
	Unmatched      int `json:"unmatched"`
	TotalProcessed int `json:"totalProcessed"`
}

// CreateJobRequest represents a request to create a reconciliation job
type CreateJobRequest struct {
	Provider  string            `json:"provider"`
	DateRange DateRange         `json:"dateRange"`
	Options   *CreateJobOptions `json:"options,omitempty"`
}

// CreateJobOptions represents optional parameters for creating a job
type CreateJobOptions struct {
	AutoReconcile    bool `json:"autoReconcile"`
	NotifyOnComplete bool `json:"notifyOnComplete"`
}

// ListJobsParams represents parameters for listing jobs
type ListJobsParams struct {
	Page     int
	Limit    int
	Status   string
	Provider string
}

// ToQuery converts list parameters to query values
func (p ListJobsParams) ToQuery() url.Values {
	q := url.Values{}
	if p.Page > 0 {
		q.Set("page", fmt.Sprintf("%d", p.Page))
	}
	if p.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", p.Limit))
	}
	if p.Status != "" {
		q.Set("status", p.Status)
	}
	if p.Provider != "" {
		q.Set("provider", p.Provider)
	}
	return q
}

// JobsListResponse represents the response from listing jobs
type JobsListResponse struct {
	Data       []Job      `json:"data"`
	Pagination Pagination `json:"pagination"`
}

// JobsClient handles reconciliation job operations
type JobsClient struct {
	client *Client
}

// Create creates a new reconciliation job
func (c *JobsClient) Create(ctx context.Context, req CreateJobRequest) (*Job, error) {
	resp, err := c.client.request(ctx, "POST", "/jobs", req, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		job := parseJob(data)
		return &job, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// List retrieves a list of reconciliation jobs
func (c *JobsClient) List(ctx context.Context, params ListJobsParams) (*JobsListResponse, error) {
	query := params.ToQuery()
	resp, err := c.client.request(ctx, "GET", "/jobs", nil, query)
	if err != nil {
		return nil, err
	}

	var result JobsListResponse
	if data, ok := resp["data"].([]interface{}); ok {
		result.Data = make([]Job, len(data))
		for i, item := range data {
			if job, ok := item.(map[string]interface{}); ok {
				result.Data[i] = parseJob(job)
			}
		}
	}
	if pagination, ok := resp["pagination"].(map[string]interface{}); ok {
		result.Pagination = parsePagination(pagination)
	}

	return &result, nil
}

// Get retrieves a reconciliation job by ID
func (c *JobsClient) Get(ctx context.Context, id string) (*Job, error) {
	path := fmt.Sprintf("/jobs/%s", id)
	resp, err := c.client.request(ctx, "GET", path, nil, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		job := parseJob(data)
		return &job, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// Run starts a reconciliation job
func (c *JobsClient) Run(ctx context.Context, id string) (*Job, error) {
	path := fmt.Sprintf("/jobs/%s/run", id)
	resp, err := c.client.request(ctx, "POST", path, nil, nil)
	if err != nil {
		return nil, err
	}

	if data, ok := resp["data"].(map[string]interface{}); ok {
		job := parseJob(data)
		return &job, nil
	}

	return nil, fmt.Errorf("invalid response format")
}

// Delete deletes a reconciliation job
func (c *JobsClient) Delete(ctx context.Context, id string) error {
	path := fmt.Sprintf("/jobs/%s", id)
	_, err := c.client.request(ctx, "DELETE", path, nil, nil)
	return err
}

// parseJob converts a map to a Job struct
func parseJob(data map[string]interface{}) Job {
	j := Job{
		ID:        getString(data, "id"),
		TenantID:  getString(data, "tenantId"),
		Provider:  getString(data, "provider"),
		Status:    getString(data, "status"),
		CreatedAt: getString(data, "createdAt"),
		UpdatedAt: getString(data, "updatedAt"),
	}

	if dr, ok := data["dateRange"].(map[string]interface{}); ok {
		j.DateRange = DateRange{
			Start: getString(dr, "start"),
			End:   getString(dr, "end"),
		}
	}

	if result, ok := data["result"].(map[string]interface{}); ok {
		j.Result = JobResult{
			Matched:        getInt(result, "matched"),
			Unmatched:      getInt(result, "unmatched"),
			TotalProcessed: getInt(result, "totalProcessed"),
		}
	}

	return j
}
