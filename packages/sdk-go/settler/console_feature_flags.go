package settler

import (
	"context"
)

// FeatureFlag represents a console feature flag
type FeatureFlag struct {
	ID           string                   `json:"id"`
	Key          string                   `json:"key"`
	Name         string                   `json:"name"`
	Description  *string                  `json:"description"`
	Type         string                   `json:"type"`
	IsGlobal     bool                     `json:"isGlobal"`
	DefaultValue interface{}              `json:"defaultValue"`
	Environments []FeatureFlagEnvironment `json:"environments"`
	CreatedAt    string                   `json:"createdAt"`
	UpdatedAt    string                   `json:"updatedAt"`
}

// FeatureFlagEnvironment represents environment-specific flag data
// Variant is only present for multivariate flags.
type FeatureFlagEnvironment struct {
	Environment string      `json:"environment"`
	Enabled     bool        `json:"enabled"`
	Variant     interface{} `json:"variant,omitempty"`
}

// FeatureFlagsListResponse represents a list response for feature flags
type FeatureFlagsListResponse struct {
	Data  []FeatureFlag `json:"data"`
	Count int           `json:"count"`
}

// ListFeatureFlags lists feature flags available in console
func (c *ConsoleClient) ListFeatureFlags(ctx context.Context) (*FeatureFlagsListResponse, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/feature-flags", nil, nil)
	if err != nil {
		return nil, err
	}

	flags := parseFeatureFlags(getSlice(resp, "flags"))
	return &FeatureFlagsListResponse{Data: flags, Count: len(flags)}, nil
}

func parseFeatureFlags(items []interface{}) []FeatureFlag {
	flags := make([]FeatureFlag, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			flags = append(flags, parseFeatureFlag(data))
		}
	}
	return flags
}

func parseFeatureFlag(data map[string]interface{}) FeatureFlag {
	flag := FeatureFlag{
		ID:           getString(data, "id"),
		Key:          getString(data, "key"),
		Name:         getString(data, "name"),
		Description:  getOptionalString(data, "description"),
		Type:         getString(data, "type"),
		IsGlobal:     getBool(data, "isGlobal"),
		DefaultValue: data["defaultValue"],
		CreatedAt:    getString(data, "createdAt"),
		UpdatedAt:    getString(data, "updatedAt"),
	}
	if envs, ok := data["environments"].([]interface{}); ok {
		flag.Environments = make([]FeatureFlagEnvironment, 0, len(envs))
		for _, env := range envs {
			if envMap, ok := env.(map[string]interface{}); ok {
				flag.Environments = append(flag.Environments, FeatureFlagEnvironment{
					Environment: getString(envMap, "environment"),
					Enabled:     getBool(envMap, "enabled"),
					Variant:     envMap["variant"],
				})
			}
		}
	}
	return flag
}
