package settler

// getString safely extracts a string value from a map
func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}

// getInt safely extracts an int value from a map
func getInt(data map[string]interface{}, key string) int {
	if value, ok := data[key]; ok {
		switch typed := value.(type) {
		case float64:
			return int(typed)
		case int:
			return typed
		case int64:
			return int(typed)
		}
	}
	return 0
}

func getSlice(data map[string]interface{}, key string) []interface{} {
	if items, ok := data[key].([]interface{}); ok {
		return items
	}
	return []interface{}{}
}

func getOptionalString(data map[string]interface{}, key string) *string {
	if value, ok := data[key]; ok {
		if str, ok := value.(string); ok {
			return &str
		}
	}
	return nil
}

func getOptionalFloat(data map[string]interface{}, key string) *float64 {
	if value, ok := data[key]; ok {
		switch typed := value.(type) {
		case float64:
			return &typed
		case int:
			v := float64(typed)
			return &v
		case int64:
			v := float64(typed)
			return &v
		}
	}
	return nil
}

func getStringSlice(data map[string]interface{}, key string) []string {
	values := []string{}
	if items, ok := data[key].([]interface{}); ok {
		for _, item := range items {
			if str, ok := item.(string); ok {
				values = append(values, str)
			}
		}
	}
	return values
}

func getStringIntMap(data map[string]interface{}, key string) map[string]int {
	result := map[string]int{}
	if items, ok := data[key].(map[string]interface{}); ok {
		for k, v := range items {
			switch typed := v.(type) {
			case float64:
				result[k] = int(typed)
			case int:
				result[k] = typed
			case int64:
				result[k] = int(typed)
			}
		}
	}
	return result
}

func getMap(data map[string]interface{}, key string) map[string]interface{} {
	if value, ok := data[key].(map[string]interface{}); ok {
		return value
	}
	return nil
}

func getFloat(data map[string]interface{}, key string) float64 {
	if value, ok := data[key]; ok {
		switch typed := value.(type) {
		case float64:
			return typed
		case int:
			return float64(typed)
		case int64:
			return float64(typed)
		}
	}
	return 0
}

func getBool(data map[string]interface{}, key string) bool {
	if value, ok := data[key]; ok {
		if typed, ok := value.(bool); ok {
			return typed
		}
	}
	return false
}
