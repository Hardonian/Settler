package settler

import (
	"context"
)

// Activity represents a console activity entry
type Activity struct {
	ID           string                 `json:"id"`
	ActivityType string                 `json:"activityType"`
	Action       string                 `json:"action"`
	Title        string                 `json:"title"`
	Status       string                 `json:"status"`
	Metadata     map[string]interface{} `json:"metadata"`
	CreatedAt    string                 `json:"created_at"`
}

// GetActivities retrieves recent console activities
func (c *ConsoleClient) GetActivities(ctx context.Context) ([]Activity, error) {
	resp, err := c.client.requestWithBase(ctx, c.client.rootBaseURL(), "GET", "/api/console/activities", nil, nil)
	if err != nil {
		return nil, err
	}

	return parseActivities(getSlice(resp, "activities")), nil
}

func parseActivities(items []interface{}) []Activity {
	activities := make([]Activity, 0, len(items))
	for _, item := range items {
		if data, ok := item.(map[string]interface{}); ok {
			activities = append(activities, Activity{
				ID:           getString(data, "id"),
				ActivityType: getString(data, "activityType"),
				Action:       getString(data, "action"),
				Title:        getString(data, "title"),
				Status:       getString(data, "status"),
				Metadata:     getMap(data, "metadata"),
				CreatedAt:    getString(data, "created_at"),
			})
		}
	}
	return activities
}
