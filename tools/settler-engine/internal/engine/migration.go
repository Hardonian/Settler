package engine

import (
	"encoding/json"
	"fmt"
	"os"
)

func LoadEngineOutputWithMigration(path string) (EngineOutput, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return EngineOutput{}, fmt.Errorf("read engine output: %w", err)
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(content, &raw); err != nil {
		return EngineOutput{}, fmt.Errorf("decode engine output: %w", err)
	}
	if _, ok := raw["policy_context"]; !ok {
		raw["policy_context"] = mustRawJSON(PolicyContext{
			PolicyVersion: "v1-migrated",
			PolicyHash:    "",
			Snapshot: ReconciliationPolicy{
				RulesetID:                           "unknown",
				RulesetName:                         "unknown",
				ConflictResolution:                  "first-match",
				MatchPrecedence:                     []string{},
				CurrencyMismatchIsVariance:          true,
				MissingSettlementIsVariance:         true,
				MissingTransactionIsVariance:        true,
				StatusCompatibility:                 defaultStatusCompatibility(),
				EnabledRuleIDs:                      []string{},
				GroupedMatchEnabled:                 true,
				GroupedMatchMinRecords:              2,
				DuplicateWindowDays:                 2,
				DuplicateReferenceSimilarityPercent: 90,
				FeeToleranceCents:                   5,
				FXVarianceToleranceBps:              25,
			},
		})
	}
	if _, ok := raw["rule_metrics"]; !ok {
		raw["rule_metrics"] = mustRawJSON([]RuleMetrics{})
	}
	migrated, err := json.Marshal(raw)
	if err != nil {
		return EngineOutput{}, fmt.Errorf("marshal migrated output: %w", err)
	}
	var output EngineOutput
	if err := json.Unmarshal(migrated, &output); err != nil {
		return EngineOutput{}, fmt.Errorf("decode migrated output: %w", err)
	}
	return output, nil
}

func mustRawJSON(v interface{}) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}
