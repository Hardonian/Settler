package settler

import (
	"context"
	"net/url"
)

// InterchangeClient handles interchange analysis, rates, and L2/L3 optimization.
type InterchangeClient struct {
	client *Client
}

// Rates returns interchange benchmark rates.
func (c *InterchangeClient) Rates(ctx context.Context, rail string, cardTier string) (map[string]interface{}, error) {
	q := url.Values{}
	q.Set("rail", rail)
	if cardTier != "" {
		q.Set("cardTier", cardTier)
	}
	return c.client.request(ctx, "GET", "/interchange/rates", nil, q)
}

// Analyze evaluates transaction fee breakdowns against interchange schedules.
func (c *InterchangeClient) Analyze(ctx context.Context, transactions []map[string]interface{}) (map[string]interface{}, error) {
	req := map[string]interface{}{
		"transactions": transactions,
	}
	return c.client.request(ctx, "POST", "/interchange/analyze", req, nil)
}

// Portfolio returns interchange portfolio optimization metrics.
func (c *InterchangeClient) Portfolio(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	q := url.Values{}
	if tenantID != "" {
		q.Set("tenantId", tenantID)
	}
	return c.client.request(ctx, "GET", "/interchange/portfolio", nil, q)
}

// EnrichL3 synthesizes Level 2/3 line-item and tax data for B2B card qualification.
func (c *InterchangeClient) EnrichL3(ctx context.Context, transactions []map[string]interface{}) (map[string]interface{}, error) {
	req := map[string]interface{}{
		"transactions": transactions,
	}
	return c.client.request(ctx, "POST", "/interchange/enrich-l3", req, nil)
}
