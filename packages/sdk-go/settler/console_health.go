package settler

import (
	"context"
)

// ConsoleHealth represents the console health response
//
// Example status: { status: "ok", checks: { env: {status: "ok"}, ... } }
type ConsoleHealth struct {
	Status string `json:"status"`
	Checks struct {
		Env      HealthStatus `json:"env"`
		Supabase HealthStatus `json:"supabase"`
		Auth     HealthStatus `json:"auth"`
	} `json:"checks"`
}

// HealthStatus represents status of a health check
type HealthStatus struct {
	Status string `json:"status"`
}

// Health checks console health status
func (c *ConsoleClient) Health(ctx context.Context) (*ConsoleHealth, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/health", nil, nil)
	if err != nil {
		return nil, err
	}

	return parseConsoleHealth(resp), nil
}

func parseConsoleHealth(data map[string]interface{}) *ConsoleHealth {
	health := &ConsoleHealth{
		Status: getString(data, "status"),
	}
	if checks, ok := data["checks"].(map[string]interface{}); ok {
		if env, ok := checks["env"].(map[string]interface{}); ok {
			health.Checks.Env = HealthStatus{Status: getString(env, "status")}
		}
		if supabase, ok := checks["supabase"].(map[string]interface{}); ok {
			health.Checks.Supabase = HealthStatus{Status: getString(supabase, "status")}
		}
		if auth, ok := checks["auth"].(map[string]interface{}); ok {
			health.Checks.Auth = HealthStatus{Status: getString(auth, "status")}
		}
	}
	return health
}
