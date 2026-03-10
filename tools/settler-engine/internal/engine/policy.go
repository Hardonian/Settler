package engine

import (
	"encoding/json"
	"sort"
	"strings"
)

const policyVersion = "v2"

func BuildPolicyContext(ruleset Ruleset) PolicyContext {
	policy := ExtractPolicy(ruleset)
	policyBytes, _ := json.Marshal(policy)
	return PolicyContext{
		PolicyVersion: policyVersion,
		PolicyHash:    hashBytes(policyBytes),
		Snapshot:      policy,
	}
}

func ExtractPolicy(ruleset Ruleset) ReconciliationPolicy {
	precedence := make([]Rule, 0, len(ruleset.Rules))
	enabledRuleIDs := []string{}
	for _, rule := range ruleset.Rules {
		if !rule.Enabled {
			continue
		}
		precedence = append(precedence, rule)
		enabledRuleIDs = append(enabledRuleIDs, rule.ID)
	}
	sort.SliceStable(precedence, func(i, j int) bool {
		if precedence[i].Priority != precedence[j].Priority {
			return precedence[i].Priority < precedence[j].Priority
		}
		return precedence[i].ID < precedence[j].ID
	})
	matchPrecedence := make([]string, 0, len(precedence))
	for _, rule := range precedence {
		matchPrecedence = append(matchPrecedence, rule.Field+":"+rule.Type)
	}
	sort.Strings(enabledRuleIDs)

	conflictResolution := strings.TrimSpace(strings.ToLower(ruleset.ConflictResolution))
	if conflictResolution == "" || conflictResolution == "first-wins" {
		conflictResolution = "first-match"
	}

	return ReconciliationPolicy{
		RulesetID:                           ruleset.ID,
		RulesetName:                         ruleset.Name,
		MatchPrecedence:                     matchPrecedence,
		ConflictResolution:                  conflictResolution,
		AmountToleranceCents:                amountToleranceCents(ruleset),
		DateToleranceDays:                   dateToleranceDays(ruleset),
		FeeToleranceCents:                   feeToleranceCents(ruleset),
		FXVarianceToleranceBps:              fxToleranceBps(ruleset),
		CurrencyMismatchIsVariance:          true,
		MissingSettlementIsVariance:         true,
		MissingTransactionIsVariance:        true,
		ManualReviewAmountDeltaCents:        maxInt64(1, amountToleranceCents(ruleset)/2),
		ManualReviewDateDeltaDays:           maxInt(1, dateToleranceDays(ruleset)),
		DuplicateWindowDays:                 2,
		DuplicateAmountToleranceCents:       maxInt64(5, amountToleranceCents(ruleset)),
		DuplicateReferenceSimilarityPercent: 90,
		GroupedMatchEnabled:                 true,
		GroupedMatchMinRecords:              2,
		StatusCompatibility:                 defaultStatusCompatibility(),
		EnabledRuleIDs:                      enabledRuleIDs,
	}
}

func ApplyPolicyOverride(policy ReconciliationPolicy, override PolicyOverride) ReconciliationPolicy {
	updated := policy
	if override.AmountToleranceCents != nil {
		updated.AmountToleranceCents = *override.AmountToleranceCents
	}
	if override.DateToleranceDays != nil {
		updated.DateToleranceDays = *override.DateToleranceDays
	}
	if override.FeeToleranceCents != nil {
		updated.FeeToleranceCents = *override.FeeToleranceCents
	}
	if override.FXVarianceToleranceBps != nil {
		updated.FXVarianceToleranceBps = *override.FXVarianceToleranceBps
	}
	if override.CurrencyMismatchIsVariance != nil {
		updated.CurrencyMismatchIsVariance = *override.CurrencyMismatchIsVariance
	}
	if override.ConflictResolution != nil && strings.TrimSpace(*override.ConflictResolution) != "" {
		updated.ConflictResolution = strings.ToLower(strings.TrimSpace(*override.ConflictResolution))
	}
	if override.GroupedMatchEnabled != nil {
		updated.GroupedMatchEnabled = *override.GroupedMatchEnabled
	}
	return updated
}

func defaultStatusCompatibility() map[string][]string {
	return map[string][]string{
		"posted":     {"posted", "captured", "settled"},
		"captured":   {"captured", "posted", "settled"},
		"settled":    {"settled", "captured", "posted"},
		"pending":    {"pending", "processing"},
		"processing": {"processing", "pending"},
		"failed":     {"failed", "reversed"},
		"reversed":   {"reversed", "failed"},
	}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func maxInt64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
