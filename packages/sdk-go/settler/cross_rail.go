package settler

import "context"

// CrossRailClient handles multi-rail settlement graph analysis.
type CrossRailClient struct {
	client *Client
}

// Analyze analyzes cross-rail transactions and bank sweeps for arbitrage and double-refunds.
func (c *CrossRailClient) Analyze(ctx context.Context, transactions []map[string]interface{}, bankSweeps []map[string]interface{}) (map[string]interface{}, error) {
	req := map[string]interface{}{
		"transactions": transactions,
	}
	if bankSweeps != nil {
		req["bankSweeps"] = bankSweeps
	}
	return c.client.request(ctx, "POST", "/reconciliation/cross-rail", req, nil)
}
