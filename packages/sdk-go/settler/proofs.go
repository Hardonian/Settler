package settler

import "context"

// ProofsClient handles zero-knowledge and cryptographic audit proofs.
type ProofsClient struct {
	client *Client
}

// Verify verifies an RFC 6962 proofpack or SMT inclusion proof.
func (c *ProofsClient) Verify(ctx context.Context, proofpack map[string]interface{}) (map[string]interface{}, error) {
	return c.client.request(ctx, "POST", "/zkp/verify", proofpack, nil)
}

// AuditSampling executes deterministic Monetary Unit Sampling (MUS) with Merkle manifest.
func (c *ProofsClient) AuditSampling(ctx context.Context, population []map[string]interface{}, sampleSize int, seed string) (map[string]interface{}, error) {
	req := map[string]interface{}{
		"population": population,
	}
	if sampleSize > 0 {
		req["sampleSize"] = sampleSize
	}
	if seed != "" {
		req["seed"] = seed
	}
	return c.client.request(ctx, "POST", "/auditor/samples", req, nil)
}
