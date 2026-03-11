package engine

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"
)

type MatchResult struct {
	Transaction string
	Settlement  string
	RuleID      string
}

type ruleEvaluation struct {
	settlementID string
	ruleID       string
	priority     int
}

func MatchRecords(transactions []NormalizedRecord, settlements []NormalizedRecord, policy ReconciliationPolicy, ruleset Ruleset, roundingMode string, tz *time.Location) ([]MatchResult, []VarianceItem, []RuleMetrics) {
	var matches []MatchResult
	var variances []VarianceItem

	sort.SliceStable(ruleset.Rules, func(i, j int) bool {
		return ruleset.Rules[i].Priority < ruleset.Rules[j].Priority
	})
	ruleStats := initRuleMetrics(ruleset)

	settlementByID := map[string]NormalizedRecord{}
	for _, settlement := range settlements {
		settlementByID[settlement.ID] = settlement
	}

	settlementMatched := map[string]bool{}
	for _, txn := range transactions {
		evaluation := evaluateMatches(txn, settlements, settlementMatched, ruleset, roundingMode, tz, ruleStats)
		match, found := selectMatch(evaluation, policy)
		if found {
			match.Transaction = txn.ID
			matches = append(matches, match)
			settlementMatched[match.Settlement] = true
			if metric, ok := ruleStats[match.RuleID]; ok {
				if strings.EqualFold(policy.ConflictResolution, "best-score") {
					metric.BestMatchSelect++
				} else {
					metric.FirstMatchWins++
				}
			}
			settlement := settlementByID[match.Settlement]
			variances = append(variances, compareMatch(txn, settlement, policy, tz)...)
		} else if policy.MissingSettlementIsVariance {
			variances = append(variances, VarianceItem{
				ID:            fmt.Sprintf("variance-%s-missing-settlement", txn.ID),
				Type:          "missing_settlement",
				TransactionID: txn.ID,
				Message:       "No settlement matched this transaction; discrepancy surfaced.",
				PolicyTrace:   "no rule matched within configured policy precedence",
			})
		}
	}

	for _, settlement := range settlements {
		if settlementMatched[settlement.ID] || !policy.MissingTransactionIsVariance {
			continue
		}
		variances = append(variances, VarianceItem{
			ID:           fmt.Sprintf("variance-%s-missing-transaction", settlement.ID),
			Type:         "missing_transaction",
			SettlementID: settlement.ID,
			Message:      "No transaction matched this settlement; discrepancy surfaced.",
			PolicyTrace:  "no transaction matched settlement across enabled match precedence",
		})
	}

	variances = append(variances, detectDuplicateVariances(transactions, policy)...)
	variances = append(variances, detectDuplicateVariances(settlements, policy)...)
	variances = append(variances, detectGroupedMatchVariances(transactions, settlements, settlementMatched, policy)...)

	sort.SliceStable(variances, func(i, j int) bool {
		if variances[i].Type != variances[j].Type {
			return variances[i].Type < variances[j].Type
		}
		if variances[i].TransactionID != variances[j].TransactionID {
			return variances[i].TransactionID < variances[j].TransactionID
		}
		return variances[i].SettlementID < variances[j].SettlementID
	})

	metrics := finalizeRuleMetrics(ruleStats)
	return matches, variances, metrics
}

func initRuleMetrics(ruleset Ruleset) map[string]*RuleMetrics {
	metrics := map[string]*RuleMetrics{}
	for _, rule := range ruleset.Rules {
		metrics[rule.ID] = &RuleMetrics{RuleID: rule.ID}
	}
	return metrics
}

func finalizeRuleMetrics(metrics map[string]*RuleMetrics) []RuleMetrics {
	out := make([]RuleMetrics, 0, len(metrics))
	for _, metric := range metrics {
		metric.Misses = metric.Evaluations - metric.Matches
		out = append(out, *metric)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].RuleID < out[j].RuleID })
	return out
}

func evaluateMatches(txn NormalizedRecord, settlements []NormalizedRecord, matched map[string]bool, ruleset Ruleset, roundingMode string, tz *time.Location, metrics map[string]*RuleMetrics) []ruleEvaluation {
	evaluations := []ruleEvaluation{}
	for _, rule := range ruleset.Rules {
		if !rule.Enabled {
			continue
		}
		for _, settlement := range settlements {
			if matched[settlement.ID] {
				continue
			}
			if metric, ok := metrics[rule.ID]; ok {
				metric.Evaluations++
			}
			if ruleMatches(rule, txn, settlement, roundingMode, tz) {
				evaluations = append(evaluations, ruleEvaluation{settlementID: settlement.ID, ruleID: rule.ID, priority: rule.Priority})
				if metric, ok := metrics[rule.ID]; ok {
					metric.Matches++
				}
			}
		}
	}
	return evaluations
}

func selectMatch(evaluations []ruleEvaluation, policy ReconciliationPolicy) (MatchResult, bool) {
	if len(evaluations) == 0 {
		return MatchResult{}, false
	}
	sort.SliceStable(evaluations, func(i, j int) bool {
		if evaluations[i].priority != evaluations[j].priority {
			return evaluations[i].priority < evaluations[j].priority
		}
		if evaluations[i].ruleID != evaluations[j].ruleID {
			return evaluations[i].ruleID < evaluations[j].ruleID
		}
		return evaluations[i].settlementID < evaluations[j].settlementID
	})
	best := evaluations[0]
	if strings.EqualFold(policy.ConflictResolution, "best-score") {
		best = evaluations[len(evaluations)-1]
	}
	return MatchResult{Settlement: best.settlementID, RuleID: best.ruleID}, true
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
	case "status":
		return matchString(rule, txn.Status, settlement.Status)
	default:
		return false
	}
}

func compareMatch(txn NormalizedRecord, settlement NormalizedRecord, policy ReconciliationPolicy, tz *time.Location) []VarianceItem {
	variances := []VarianceItem{}
	amountDiff := absInt64(txn.AmountCents - settlement.AmountCents)
	if amountDiff > policy.AmountToleranceCents {
		varianceType := "amount_mismatch"
		if amountDiff <= policy.ManualReviewAmountDeltaCents+policy.AmountToleranceCents {
			varianceType = "manual_review_amount"
		}
		variances = append(variances, VarianceItem{
			ID:              fmt.Sprintf("variance-%s-%s-amount", txn.ID, settlement.ID),
			Type:            varianceType,
			TransactionID:   txn.ID,
			SettlementID:    settlement.ID,
			AmountDiffCents: amountDiff,
			Message:         "Amounts differ beyond configured tolerance; discrepancy surfaced.",
			PolicyTrace:     fmt.Sprintf("amount difference %d exceeded tolerance %d", amountDiff, policy.AmountToleranceCents),
		})
	}

	dateDiff := absInt(daysBetween(txn.Date.In(tz), settlement.Date.In(tz)))
	if dateDiff > policy.DateToleranceDays {
		varianceType := "date_mismatch"
		if dateDiff <= policy.ManualReviewDateDeltaDays+policy.DateToleranceDays {
			varianceType = "manual_review_date"
		}
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-date", txn.ID, settlement.ID),
			Type:          varianceType,
			TransactionID: txn.ID,
			SettlementID:  settlement.ID,
			DateDiffDays:  dateDiff,
			Message:       "Dates differ beyond configured tolerance; discrepancy surfaced.",
			PolicyTrace:   fmt.Sprintf("date difference %d exceeded tolerance %d", dateDiff, policy.DateToleranceDays),
		})
	}

	feeDiff := absInt64(txn.FeeAmountCents - settlement.FeeAmountCents)
	if feeDiff > policy.FeeToleranceCents && (txn.FeeAmountCents != 0 || settlement.FeeAmountCents != 0) {
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-fee", txn.ID, settlement.ID),
			Type:          "fee_mismatch",
			TransactionID: txn.ID,
			SettlementID:  settlement.ID,
			FeeDiffCents:  feeDiff,
			Message:       "Fee deltas exceed configured tolerance.",
			PolicyTrace:   fmt.Sprintf("fee difference %d exceeded tolerance %d", feeDiff, policy.FeeToleranceCents),
		})
	}

	if fxVariance, ok := computeFXVarianceBps(txn, settlement); ok && fxVariance > policy.FXVarianceToleranceBps {
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-fx", txn.ID, settlement.ID),
			Type:          "fx_mismatch",
			TransactionID: txn.ID,
			SettlementID:  settlement.ID,
			FXVarianceBps: fxVariance,
			Message:       "FX variance exceeds configured basis-point threshold.",
			PolicyTrace:   fmt.Sprintf("fx variance %d bps exceeded tolerance %d bps", fxVariance, policy.FXVarianceToleranceBps),
		})
	}

	if policy.CurrencyMismatchIsVariance && !strings.EqualFold(txn.Currency, settlement.Currency) {
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-currency", txn.ID, settlement.ID),
			Type:          "currency_mismatch",
			TransactionID: txn.ID,
			SettlementID:  settlement.ID,
			Message:       "Currencies differ; discrepancy surfaced.",
			PolicyTrace:   "currency mismatch enforcement is enabled in policy",
		})
	}

	if !statusesCompatible(txn.Status, settlement.Status, policy.StatusCompatibility) {
		variances = append(variances, VarianceItem{
			ID:            fmt.Sprintf("variance-%s-%s-status", txn.ID, settlement.ID),
			Type:          "status_mismatch",
			TransactionID: txn.ID,
			SettlementID:  settlement.ID,
			Message:       "Transaction and settlement statuses are incompatible under policy matrix.",
			PolicyTrace:   fmt.Sprintf("status '%s' is not compatible with '%s'", strings.ToLower(strings.TrimSpace(txn.Status)), strings.ToLower(strings.TrimSpace(settlement.Status))),
		})
	}

	return variances
}

func statusesCompatible(left string, right string, matrix map[string][]string) bool {
	left = strings.ToLower(strings.TrimSpace(left))
	right = strings.ToLower(strings.TrimSpace(right))
	if left == "" || right == "" || left == right {
		return true
	}
	compatible := matrix[left]
	for _, status := range compatible {
		if status == right {
			return true
		}
	}
	return false
}

func detectDuplicateVariances(records []NormalizedRecord, policy ReconciliationPolicy) []VarianceItem {
	variances := []VarianceItem{}
	for i := 0; i < len(records); i++ {
		for j := i + 1; j < len(records); j++ {
			a := records[i]
			b := records[j]
			if absInt(daysBetween(a.Date, b.Date)) > policy.DuplicateWindowDays {
				continue
			}
			if absInt64(a.AmountCents-b.AmountCents) > policy.DuplicateAmountToleranceCents {
				continue
			}
			if referenceSimilarityPercent(a.ReferenceID, b.ReferenceID) < policy.DuplicateReferenceSimilarityPercent {
				continue
			}
			groupID := fmt.Sprintf("dup-%s", hashBytes([]byte(strings.Join([]string{a.ID, b.ID}, "::")))[:10])
			variances = append(variances, VarianceItem{
				ID:               fmt.Sprintf("variance-%s-%s-duplicate", a.ID, b.ID),
				Type:             "duplicate_suspected",
				TransactionID:    a.ID,
				SettlementID:     b.ID,
				DuplicateGroupID: groupID,
				Message:          "Potential duplicate detected by policy thresholds.",
				PolicyTrace:      "duplicate window/amount/reference thresholds triggered",
			})
		}
	}
	return variances
}

func detectGroupedMatchVariances(transactions []NormalizedRecord, settlements []NormalizedRecord, settlementMatched map[string]bool, policy ReconciliationPolicy) []VarianceItem {
	if !policy.GroupedMatchEnabled {
		return nil
	}
	bucketTxn := map[string][]NormalizedRecord{}
	bucketSet := map[string][]NormalizedRecord{}
	for _, txn := range transactions {
		if txn.GroupKey != "" {
			bucketTxn[txn.GroupKey] = append(bucketTxn[txn.GroupKey], txn)
		}
	}
	for _, settlement := range settlements {
		if settlement.GroupKey != "" {
			bucketSet[settlement.GroupKey] = append(bucketSet[settlement.GroupKey], settlement)
		}
	}
	variances := []VarianceItem{}
	for key, txns := range bucketTxn {
		sets := bucketSet[key]
		if len(txns) < policy.GroupedMatchMinRecords || len(sets) < policy.GroupedMatchMinRecords {
			continue
		}
		var txnTotal int64
		for _, t := range txns {
			txnTotal += t.AmountCents
		}
		var setTotal int64
		for _, s := range sets {
			setTotal += s.AmountCents
		}
		diff := absInt64(txnTotal - setTotal)
		if diff > policy.AmountToleranceCents {
			variances = append(variances, VarianceItem{
				ID:              fmt.Sprintf("variance-group-%s-amount", key),
				Type:            "grouped_amount_mismatch",
				AmountDiffCents: diff,
				Message:         "Grouped split/merge total exceeds configured tolerance.",
				PolicyTrace:     fmt.Sprintf("group key %s totals differ beyond %d", key, policy.AmountToleranceCents),
			})
		}
		for _, settlement := range sets {
			if !settlementMatched[settlement.ID] {
				variances = append(variances, VarianceItem{
					ID:           fmt.Sprintf("variance-group-%s-unmatched-%s", key, settlement.ID),
					Type:         "grouped_unmatched_settlement",
					SettlementID: settlement.ID,
					Message:      "Grouped settlement remained unmatched.",
					PolicyTrace:  "grouped matching enabled and settlement remained unmatched",
				})
			}
		}
	}
	return variances
}

func referenceSimilarityPercent(left string, right string) int {
	left = normalizeString(left)
	right = normalizeString(right)
	if left == "" || right == "" {
		return 0
	}
	longer := len(left)
	if len(right) > longer {
		longer = len(right)
	}
	if longer == 0 {
		return 100
	}
	matches := 0
	for i := 0; i < minInt(len(left), len(right)); i++ {
		if left[i] == right[i] {
			matches++
		}
	}
	return (matches * 100) / longer
}

func computeFXVarianceBps(txn NormalizedRecord, settlement NormalizedRecord) (int64, bool) {
	if txn.FXRateMilliBps == 0 || settlement.FXRateMilliBps == 0 {
		return 0, false
	}
	diff := absInt64(txn.FXRateMilliBps - settlement.FXRateMilliBps)
	return diff / 100, true
}

func matchAmount(rule Rule, amount int64, other int64) bool {
	diff := amount - other
	if diff < 0 {
		diff = -diff
	}
	switch strings.ToLower(rule.Type) {
	case "exact", "":
		return diff == 0
	case "range", "fuzzy":
		return diff <= amountToleranceCentsFromRule(rule)
	default:
		return diff == 0
	}
}

func matchDate(rule Rule, a time.Time, b time.Time, tz *time.Location) bool {
	diff := absInt(daysBetween(a.In(tz), b.In(tz)))
	switch strings.ToLower(rule.Type) {
	case "exact", "":
		return diff == 0
	case "range", "fuzzy":
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

func feeToleranceCents(ruleset Ruleset) int64 {
	var tolerance int64
	for _, rule := range ruleset.Rules {
		if rule.Field == "fee" {
			if candidate := amountToleranceCentsFromRule(rule); candidate > tolerance {
				tolerance = candidate
			}
		}
	}
	if tolerance == 0 {
		return 5
	}
	return tolerance
}

func fxToleranceBps(ruleset Ruleset) int64 {
	var tolerance int64
	for _, rule := range ruleset.Rules {
		if rule.Field == "fx_rate" && rule.Tolerance.Threshold > 0 {
			candidate := int64(rule.Tolerance.Threshold)
			if candidate > tolerance {
				tolerance = candidate
			}
		}
	}
	if tolerance == 0 {
		return 25
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
		if rule.Field == "date" && rule.Tolerance.Days > tolerance {
			tolerance = rule.Tolerance.Days
		}
	}
	return tolerance
}

func absInt(v int) int {
	if v < 0 {
		return -v
	}
	return v
}

func absInt64(v int64) int64 {
	if v < 0 {
		return -v
	}
	return v
}

func minInt(a int, b int) int {
	if a < b {
		return a
	}
	return b
}
