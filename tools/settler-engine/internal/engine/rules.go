package engine

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"
)

type MatchResult struct {
	Transaction NormalizedRecord
	Settlement  NormalizedRecord
}

func MatchRecords(transactions []NormalizedRecord, settlements []NormalizedRecord, ruleset Ruleset, roundingMode string, tz *time.Location) ([]MatchResult, []VarianceItem) {
	var matches []MatchResult
	var variances []VarianceItem

	sort.SliceStable(ruleset.Rules, func(i, j int) bool {
		return ruleset.Rules[i].Priority < ruleset.Rules[j].Priority
	})

	settlementMatched := map[string]bool{}

	for _, txn := range transactions {
		match, found := findMatch(txn, settlements, settlementMatched, ruleset, roundingMode, tz)
		if found {
			matches = append(matches, match)
			settlementMatched[match.Settlement.ID] = true
			variances = append(variances, compareMatch(match, ruleset, roundingMode, tz)...)
		} else {
			variances = append(variances, VarianceItem{
				ID:            fmt.Sprintf("variance-%s-missing-settlement", txn.ID),
				Type:          "missing_settlement",
				TransactionID: txn.ID,
				Message:       "No settlement matched this transaction; discrepancy surfaced.",
			})
		}
	}

	for _, settlement := range settlements {
		if settlementMatched[settlement.ID] {
			continue
		}
		variances = append(variances, VarianceItem{
			ID:           fmt.Sprintf("variance-%s-missing-transaction", settlement.ID),
			Type:         "missing_transaction",
			SettlementID: settlement.ID,
			Message:      "No transaction matched this settlement; discrepancy surfaced.",
		})
	}

	sort.SliceStable(variances, func(i, j int) bool {
		if variances[i].Type != variances[j].Type {
			return variances[i].Type < variances[j].Type
		}
		if variances[i].TransactionID != variances[j].TransactionID {
			return variances[i].TransactionID < variances[j].TransactionID
		}
		return variances[i].SettlementID < variances[j].SettlementID
	})

	return matches, variances
}

func findMatch(txn NormalizedRecord, settlements []NormalizedRecord, matched map[string]bool, ruleset Ruleset, roundingMode string, tz *time.Location) (MatchResult, bool) {
	for _, rule := range ruleset.Rules {
		if !rule.Enabled {
			continue
		}
		for _, settlement := range settlements {
			if matched[settlement.ID] {
				continue
			}
			if ruleMatches(rule, txn, settlement, roundingMode, tz) {
				return MatchResult{Transaction: txn, Settlement: settlement}, true
			}
		}
	}
	return MatchResult{}, false
}

func ruleMatches(rule Rule, txn NormalizedRecord, settlement NormalizedRecord, roundingMode string, tz *time.Location) bool {
	switch rule.Field {
	case "transactionId", "providerTransactionId":
		return matchString(rule, txn.ProviderTransactionID, settlement.ProviderTransactionID)
	case "providerSettlementId":
		return matchString(rule, txn.ProviderSettlementID, settlement.ProviderSettlementID)
	case "referenceId":
		return matchString(rule, txn.ReferenceID, settlement.ReferenceID)
	case "amount":
		return matchAmount(rule, txn.AmountCents, settlement.AmountCents)
	case "date":
		return matchDate(rule, txn.Date, settlement.Date, tz)
	case "currency":
		return matchString(rule, txn.Currency, settlement.Currency)
	default:
		return false
	}
}

func compareMatch(match MatchResult, ruleset Ruleset, roundingMode string, tz *time.Location) []VarianceItem {
	variances := []VarianceItem{}
	amountTolerance := amountToleranceCents(ruleset)
	dateTolerance := dateToleranceDays(ruleset)

	amountDiff := match.Transaction.AmountCents - match.Settlement.AmountCents
	if amountDiff < 0 {
		amountDiff = -amountDiff
	}
	if amountDiff > amountTolerance {
		variances = append(variances, VarianceItem{
			ID:              fmt.Sprintf("variance-%s-%s-amount", match.Transaction.ID, match.Settlement.ID),
			Type:            "amount_mismatch",
			TransactionID:   match.Transaction.ID,
			SettlementID:    match.Settlement.ID,
			AmountDiffCents: amountDiff,
			Message:         "Amounts differ beyond configured tolerance; discrepancy surfaced.",
		})
	}

	dateDiff := daysBetween(match.Transaction.Date.In(tz), match.Settlement.Date.In(tz))
	if dateDiff < 0 {
		dateDiff = -dateDiff
	}
	if dateDiff > dateTolerance {
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-date", match.Transaction.ID, match.Settlement.ID),
			Type:          "date_mismatch",
			TransactionID: match.Transaction.ID,
			SettlementID:  match.Settlement.ID,
			DateDiffDays:  dateDiff,
			Message:       "Dates differ beyond configured tolerance; discrepancy surfaced.",
		})
	}

	if !strings.EqualFold(match.Transaction.Currency, match.Settlement.Currency) {
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-currency", match.Transaction.ID, match.Settlement.ID),
			Type:          "currency_mismatch",
			TransactionID: match.Transaction.ID,
			SettlementID:  match.Settlement.ID,
			Message:       "Currencies differ; discrepancy surfaced.",
		})
	}

	return variances
}

func matchAmount(rule Rule, amount int64, other int64) bool {
	diff := amount - other
	if diff < 0 {
		diff = -diff
	}
	switch strings.ToLower(rule.Type) {
	case "exact", "":
		return diff == 0
	case "range":
		return diff <= amountToleranceCentsFromRule(rule)
	case "fuzzy":
		return diff <= amountToleranceCentsFromRule(rule)
	default:
		return diff == 0
	}
}

func matchDate(rule Rule, a time.Time, b time.Time, tz *time.Location) bool {
	diff := daysBetween(a.In(tz), b.In(tz))
	if diff < 0 {
		diff = -diff
	}
	switch strings.ToLower(rule.Type) {
	case "exact", "":
		return diff == 0
	case "range":
		return diff <= rule.Tolerance.Days
	case "fuzzy":
		return diff <= rule.Tolerance.Days
	default:
		return diff == 0
	}
}

func daysBetween(a time.Time, b time.Time) int {
	a = time.Date(a.Year(), a.Month(), a.Day(), 0, 0, 0, 0, a.Location())
	b = time.Date(b.Year(), b.Month(), b.Day(), 0, 0, 0, 0, b.Location())
	diff := b.Sub(a)
	return int(diff.Hours() / 24)
}

func normalizeString(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.ReplaceAll(value, " ", "")
	return value
}

func matchString(rule Rule, left string, right string) bool {
	leftNormalized := normalizeString(left)
	rightNormalized := normalizeString(right)
	if leftNormalized == "" || rightNormalized == "" {
		return false
	}
	switch strings.ToLower(rule.Type) {
	case "regex":
		pattern := strings.TrimSpace(rule.Name)
		if pattern == "" {
			return leftNormalized == rightNormalized
		}
		re, err := regexp.Compile(pattern)
		if err != nil {
			return false
		}
		return re.MatchString(left) || re.MatchString(right)
	case "fuzzy":
		return leftNormalized == rightNormalized
	default:
		return leftNormalized == rightNormalized
	}
}

func amountToleranceCents(ruleset Ruleset) int64 {
	var tolerance int64
	for _, rule := range ruleset.Rules {
		if rule.Field == "amount" {
			if candidate := amountToleranceCentsFromRule(rule); candidate > tolerance {
				tolerance = candidate
			}
		}
	}
	return tolerance
}

func amountToleranceCentsFromRule(rule Rule) int64 {
	if strings.TrimSpace(rule.Tolerance.Amount) == "" {
		return 0
	}
	amount, err := parseAmountToCents(rule.Tolerance.Amount, "bankers")
	if err != nil {
		return 0
	}
	if amount < 0 {
		return -amount
	}
	return amount
}

func dateToleranceDays(ruleset Ruleset) int {
	var tolerance int
	for _, rule := range ruleset.Rules {
		if rule.Field == "date" {
			if rule.Tolerance.Days > tolerance {
				tolerance = rule.Tolerance.Days
			}
		}
	}
	return tolerance
}
