package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

func SimulatePolicy(inputPath string, override PolicyOverride) (PolicySimulationOutput, error) {
	input, err := LoadEngineInput(inputPath)
	if err != nil {
		return PolicySimulationOutput{}, err
	}
	baseDir := filepath.Dir(inputPath)
	input.InputFiles = resolvePaths(baseDir, input.InputFiles)
	if input.RulesetPath != "" {
		input.RulesetPath = resolvePath(baseDir, input.RulesetPath)
	}
	if input.MappingConfigPath != "" {
		input.MappingConfigPath = resolvePath(baseDir, input.MappingConfigPath)
	}
	if input.OutputDir != "" {
		input.OutputDir = resolvePath(baseDir, input.OutputDir)
	}
	base, baselineVariances, transactions, settlements, ruleset, location, err := evaluateInput(input)
	if err != nil {
		return PolicySimulationOutput{}, err
	}

	candidatePolicy := ApplyPolicyOverride(base.PolicyContext.Snapshot, override)
	candidateContext := PolicyContext{
		PolicyVersion: base.PolicyContext.PolicyVersion,
		PolicyHash:    hashPolicy(candidatePolicy),
		Snapshot:      candidatePolicy,
	}
	candidateMatches, candidateVariances, candidateRuleMetrics := MatchRecords(transactions, settlements, candidatePolicy, ruleset, input.RoundingMode, location)
	candidateSummary := summarizeVariances(candidateVariances)

	baselineResult := PolicySimulationResult{
		PolicyContext:        base.PolicyContext,
		NormalizationSummary: base.NormalizationSummary,
		VarianceSummary:      base.VarianceSummary,
		MatchCount:           len(base.MatchIDs),
		ManualReviewCount:    countByPrefix(baselineVariances, "manual_review_"),
		GroupedMatchCount:    groupedCount(baselineVariances),
		RuleMetrics:          base.RuleMetrics,
		VarianceItems:        baselineVariances,
	}
	candidateResult := PolicySimulationResult{
		PolicyContext:        candidateContext,
		NormalizationSummary: base.NormalizationSummary,
		VarianceSummary:      candidateSummary,
		MatchCount:           len(candidateMatches),
		ManualReviewCount:    countByPrefix(candidateVariances, "manual_review_"),
		GroupedMatchCount:    groupedCount(candidateVariances),
		RuleMetrics:          candidateRuleMetrics,
		VarianceItems:        candidateVariances,
	}

	result := PolicySimulationOutput{
		SchemaVersion: SchemaVersion,
		ToolVersion:   ToolVersion,
		Baseline:      baselineResult,
		Candidate:     candidateResult,
		Diff:          diffSimulation(baselineResult, candidateResult),
	}
	if input.OutputDir != "" {
		artifactPath, err := writeSimulationEvidence(input.OutputDir, result)
		if err != nil {
			return PolicySimulationOutput{}, err
		}
		result.EvidenceArtifactPath = artifactPath
	}
	return result, nil
}

type evaluatedRun struct {
	PolicyContext        PolicyContext
	NormalizationSummary NormalizationSummary
	VarianceSummary      VarianceSummary
	RuleMetrics          []RuleMetrics
	MatchIDs             []string
}

func evaluateInput(input EngineInput) (evaluatedRun, []VarianceItem, []NormalizedRecord, []NormalizedRecord, Ruleset, *time.Location, error) {
	if input.Timezone == "" {
		input.Timezone = "UTC"
	}
	if input.RoundingMode == "" {
		input.RoundingMode = "bankers"
	}
	location := mustLoadLocation(input.Timezone)
	mapping, err := LoadMappingConfig(input.MappingConfigPath)
	if err != nil {
		return evaluatedRun{}, nil, nil, nil, Ruleset{}, nil, err
	}
	ruleset, err := LoadRuleset(input.RulesetPath)
	if err != nil {
		return evaluatedRun{}, nil, nil, nil, Ruleset{}, nil, err
	}
	normalized, warnings, err := ParseInputFiles(input, mapping, location, input.RoundingMode, map[string]string{})
	if err != nil {
		return evaluatedRun{}, nil, nil, nil, Ruleset{}, nil, err
	}
	transactions, settlements := splitRecords(normalized)
	policyContext := BuildPolicyContext(ruleset)
	matches, variances, ruleMetrics := MatchRecords(transactions, settlements, policyContext.Snapshot, ruleset, input.RoundingMode, location)
	ids := make([]string, 0, len(matches))
	for _, match := range matches {
		ids = append(ids, match.Transaction+"::"+match.Settlement)
	}
	sort.Strings(ids)
	return evaluatedRun{
		PolicyContext: policyContext,
		NormalizationSummary: NormalizationSummary{
			Transactions: len(transactions),
			Settlements:  len(settlements),
			Warnings:     warnings,
		},
		VarianceSummary: summarizeVariances(variances),
		RuleMetrics:     ruleMetrics,
		MatchIDs:        ids,
	}, variances, transactions, settlements, ruleset, location, nil
}

func diffSimulation(base PolicySimulationResult, candidate PolicySimulationResult) PolicySimulationDiff {
	baseByID := map[string]VarianceItem{}
	candByID := map[string]VarianceItem{}
	for _, v := range base.VarianceItems {
		baseByID[v.ID] = v
	}
	for _, v := range candidate.VarianceItems {
		candByID[v.ID] = v
	}
	newIDs := []string{}
	resolved := []string{}
	changedType := []string{}
	for id, cv := range candByID {
		if bv, ok := baseByID[id]; !ok {
			newIDs = append(newIDs, id)
		} else if bv.Type != cv.Type {
			changedType = append(changedType, id)
		}
	}
	for id := range baseByID {
		if _, ok := candByID[id]; !ok {
			resolved = append(resolved, id)
		}
	}
	sort.Strings(newIDs)
	sort.Strings(resolved)
	sort.Strings(changedType)
	return PolicySimulationDiff{
		MatchCountDelta:        candidate.MatchCount - base.MatchCount,
		VarianceTotalDelta:     candidate.VarianceSummary.Total - base.VarianceSummary.Total,
		ManualReviewDelta:      candidate.ManualReviewCount - base.ManualReviewCount,
		GroupedMatchDelta:      candidate.GroupedMatchCount - base.GroupedMatchCount,
		NewVarianceIDs:         newIDs,
		ResolvedVarianceIDs:    resolved,
		ChangedVarianceTypeIDs: changedType,
	}
}

func groupedCount(items []VarianceItem) int {
	total := 0
	for _, item := range items {
		if strings.HasPrefix(item.Type, "grouped_") {
			total++
		}
	}
	return total
}

func countByPrefix(items []VarianceItem, prefix string) int {
	total := 0
	for _, item := range items {
		if strings.HasPrefix(item.Type, prefix) {
			total++
		}
	}
	return total
}

func hashPolicy(policy ReconciliationPolicy) string {
	policyBytes, _ := json.Marshal(policy)
	return hashBytes(policyBytes)
}

func mustLoadLocation(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		return time.UTC
	}
	return loc
}

func writeSimulationEvidence(outputDir string, simulation PolicySimulationOutput) (string, error) {
	evidenceDir := filepath.Join(outputDir, "evidence")
	if err := os.MkdirAll(evidenceDir, 0o755); err != nil {
		return "", fmt.Errorf("create simulation evidence dir: %w", err)
	}
	name := fmt.Sprintf("simulation-%s-%s.json", simulation.Baseline.PolicyContext.PolicyHash[:8], simulation.Candidate.PolicyContext.PolicyHash[:8])
	path := filepath.Join(evidenceDir, name)
	content, err := json.MarshalIndent(simulation, "", "  ")
	if err != nil {
		return "", fmt.Errorf("marshal simulation evidence: %w", err)
	}
	if err := os.WriteFile(path, append(content, '\n'), 0o644); err != nil {
		return "", fmt.Errorf("write simulation evidence: %w", err)
	}
	return path, nil
}
