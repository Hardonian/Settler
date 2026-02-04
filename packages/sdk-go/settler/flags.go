package settler

import "context"

// EvaluationContext represents the context used for flag evaluation.
type EvaluationContext map[string]interface{}

// FlagEvaluation represents the result of evaluating a feature flag.
type FlagEvaluation struct {
	FlagKey string      `json:"flagKey"`
	Value   interface{} `json:"value"`
	Variant string      `json:"variant,omitempty"`
	Reason  string      `json:"reason,omitempty"`
}

// FlagsClient handles feature flag operations.
type FlagsClient struct {
	client *Client
}

// Evaluate evaluates a feature flag for the given context.
//
// If defaultValue is provided and evaluation fails, it will return a fallback
// response with reason "error_fallback".
func (c *FlagsClient) Evaluate(ctx context.Context, flagKey string, context EvaluationContext, defaultValue interface{}) (*FlagEvaluation, error) {
	request := map[string]interface{}{
		"flagKey": flagKey,
		"context": context,
	}
	if defaultValue != nil {
		request["defaultValue"] = defaultValue
	}

	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "POST", "/v1/feature-flags/evaluate", request, nil)
	if err != nil {
		if defaultValue != nil {
			return &FlagEvaluation{
				FlagKey: flagKey,
				Value:   defaultValue,
				Reason:  "error_fallback",
			}, nil
		}
		return nil, err
	}

	return parseFlagEvaluation(resp, flagKey, defaultValue), nil
}

func parseFlagEvaluation(data map[string]interface{}, flagKey string, defaultValue interface{}) *FlagEvaluation {
	if data == nil {
		return &FlagEvaluation{
			FlagKey: flagKey,
			Value:   defaultValue,
		}
	}
	parsedKey := getString(data, "flagKey")
	if parsedKey == "" {
		parsedKey = flagKey
	}
	return &FlagEvaluation{
		FlagKey: parsedKey,
		Value:   data["value"],
		Variant: getString(data, "variant"),
		Reason:  getString(data, "reason"),
	}
}
