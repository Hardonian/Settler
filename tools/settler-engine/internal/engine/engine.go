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

const (
	SchemaVersion = "1.0.0"
	ToolVersion   = "0.1.0"
)

func Run(inputPath string) (EngineOutput, error) {
	input, err := LoadEngineInput(inputPath)
	if err != nil {
		return EngineOutput{}, err
	}
	baseDir := filepath.Dir(inputPath)
	originalInputFiles := append([]string{}, input.InputFiles...)
	input.InputFiles = resolvePaths(baseDir, input.InputFiles)
	displayPaths := map[string]string{}
	for idx, resolved := range input.InputFiles {
		displayPaths[resolved] = originalInputFiles[idx]
	}
	if input.RulesetPath != "" {
		input.RulesetPath = resolvePath(baseDir, input.RulesetPath)
	}
	if input.MappingConfigPath != "" {
		input.MappingConfigPath = resolvePath(baseDir, input.MappingConfigPath)
	}
	if input.OutputDir != "" {
		input.OutputDir = resolvePath(baseDir, input.OutputDir)
	}

	if len(input.InputFiles) == 0 {
		return EngineOutput{}, fmt.Errorf("input_files is required")
	}
	if input.RulesetPath == "" {
		return EngineOutput{}, fmt.Errorf("ruleset_path is required")
	}
	if input.OutputDir == "" {
		return EngineOutput{}, fmt.Errorf("output_dir is required")
	}
	if input.Timezone == "" {
		input.Timezone = "UTC"
	}
	if input.RoundingMode == "" {
		input.RoundingMode = "bankers"
	}

	location, err := time.LoadLocation(input.Timezone)
	if err != nil {
		return EngineOutput{}, fmt.Errorf("invalid timezone: %w", err)
	}

	mapping, err := LoadMappingConfig(input.MappingConfigPath)
	if err != nil {
		return EngineOutput{}, err
	}

	ruleset, err := LoadRuleset(input.RulesetPath)
	if err != nil {
		return EngineOutput{}, err
	}

	normalized, warnings, err := ParseInputFiles(input, mapping, location, input.RoundingMode, displayPaths)
	if err != nil {
		return EngineOutput{}, err
	}

	transactions, settlements := splitRecords(normalized)
	policyContext := BuildPolicyContext(ruleset)
	matches, variances, ruleMetrics := MatchRecords(transactions, settlements, policyContext.Snapshot, ruleset, input.RoundingMode, location)

	varianceSummary := summarizeVariances(variances)
	normalizationSummary := NormalizationSummary{
		Transactions: len(transactions),
		Settlements:  len(settlements),
		Warnings:     warnings,
	}

	if err := os.MkdirAll(input.OutputDir, 0o755); err != nil {
		return EngineOutput{}, fmt.Errorf("create output dir: %w", err)
	}

	evidenceDir := filepath.Join(input.OutputDir, "evidence")
	if err := os.MkdirAll(evidenceDir, 0o755); err != nil {
		return EngineOutput{}, fmt.Errorf("create evidence dir: %w", err)
	}

	normalizedPath := filepath.Join(evidenceDir, "normalized.jsonl")
	if err := writeNormalized(normalizedPath, normalized); err != nil {
		return EngineOutput{}, err
	}

	variancesPath := filepath.Join(evidenceDir, "variances.jsonl")
	if err := writeVariances(variancesPath, variances); err != nil {
		return EngineOutput{}, err
	}

	logPath := filepath.Join(evidenceDir, "logs")
	if err := os.MkdirAll(logPath, 0o755); err != nil {
		return EngineOutput{}, fmt.Errorf("create logs dir: %w", err)
	}

	if err := writeRunLog(filepath.Join(logPath, "run.log"), input, normalizationSummary, varianceSummary, len(matches)); err != nil {
		return EngineOutput{}, err
	}

	output := EngineOutput{
		SchemaVersion:          SchemaVersion,
		ToolVersion:            ToolVersion,
		NormalizationSummary:   normalizationSummary,
		VarianceSummary:        varianceSummary,
		VarianceItemsPath:      variancesPath,
		PolicyContext:          policyContext,
		RuleMetrics:            ruleMetrics,
		DeterministicStatement: deterministicStatement(input),
	}

	manifest, err := buildEvidenceManifest(input, normalizedPath, variancesPath)
	if err != nil {
		return EngineOutput{}, err
	}
	output.EvidenceManifest = manifest

	outputPath := filepath.Join(input.OutputDir, "engine_output.json")
	if err := writeJSON(outputPath, output); err != nil {
		return EngineOutput{}, err
	}

	manifest.Outputs = append(manifest.Outputs, EvidenceFile{Path: outputPath, Sha256: hashFileOrEmpty(outputPath)})
	manifestPath := filepath.Join(evidenceDir, "manifest.json")
	if err := writeJSON(manifestPath, manifest); err != nil {
		return EngineOutput{}, err
	}

	return output, nil
}

func splitRecords(records []NormalizedRecord) ([]NormalizedRecord, []NormalizedRecord) {
	var transactions []NormalizedRecord
	var settlements []NormalizedRecord
	for _, record := range records {
		switch record.RecordType {
		case defaultTransactionType:
			transactions = append(transactions, record)
		case defaultSettlementType:
			settlements = append(settlements, record)
		}
	}
	return transactions, settlements
}

func summarizeVariances(variances []VarianceItem) VarianceSummary {
	byType := map[string]int{}
	for _, variance := range variances {
		byType[variance.Type]++
	}
	types := make([]string, 0, len(byType))
	for varianceType := range byType {
		types = append(types, varianceType)
	}
	sort.Strings(types)
	counts := make([]VarianceCount, 0, len(types))
	for _, varianceType := range types {
		counts = append(counts, VarianceCount{Type: varianceType, Count: byType[varianceType]})
	}
	return VarianceSummary{Total: len(variances), ByType: counts}
}

func writeNormalized(path string, records []NormalizedRecord) error {
	return writeJSONLines(path, records, func(record NormalizedRecord) NormalizedRecord {
		record.Date = record.Date.UTC()
		return record
	})
}

func writeVariances(path string, variances []VarianceItem) error {
	return writeJSONLines(path, variances, func(item VarianceItem) VarianceItem {
		return item
	})
}

func writeRunLog(path string, input EngineInput, normalization NormalizationSummary, variance VarianceSummary, matches int) error {
	lines := []string{
		fmt.Sprintf("tool_version=%s", ToolVersion),
		fmt.Sprintf("input_files=%d", len(input.InputFiles)),
		fmt.Sprintf("transactions=%d", normalization.Transactions),
		fmt.Sprintf("settlements=%d", normalization.Settlements),
		fmt.Sprintf("matches=%d", matches),
		fmt.Sprintf("variances=%d", variance.Total),
	}
	return os.WriteFile(path, []byte(strings.Join(lines, "\n")+"\n"), 0o644)
}

func writeJSON(path string, payload interface{}) error {
	content, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal json: %w", err)
	}
	return os.WriteFile(path, append(content, '\n'), 0o644)
}

func writeJSONLines[T any](path string, entries []T, mapFn func(T) T) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create jsonl: %w", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	for _, entry := range entries {
		mapped := mapFn(entry)
		if err := encoder.Encode(mapped); err != nil {
			return fmt.Errorf("encode jsonl: %w", err)
		}
	}
	return nil
}

func buildEvidenceManifest(input EngineInput, normalizedPath string, variancesPath string) (EvidenceManifest, error) {
	inputs := make([]EvidenceFile, 0, len(input.InputFiles)+1)
	for _, path := range input.InputFiles {
		inputs = append(inputs, EvidenceFile{Path: path, Sha256: hashFileOrEmpty(path)})
	}
	if input.RulesetPath != "" {
		inputs = append(inputs, EvidenceFile{Path: input.RulesetPath, Sha256: hashFileOrEmpty(input.RulesetPath)})
	}
	if input.MappingConfigPath != "" {
		inputs = append(inputs, EvidenceFile{Path: input.MappingConfigPath, Sha256: hashFileOrEmpty(input.MappingConfigPath)})
	}

	outputs := []EvidenceFile{
		{Path: normalizedPath, Sha256: hashFileOrEmpty(normalizedPath)},
		{Path: variancesPath, Sha256: hashFileOrEmpty(variancesPath)},
	}

	sort.Slice(inputs, func(i, j int) bool { return inputs[i].Path < inputs[j].Path })
	sort.Slice(outputs, func(i, j int) bool { return outputs[i].Path < outputs[j].Path })

	return EvidenceManifest{
		SchemaVersion: SchemaVersion,
		ToolVersion:   ToolVersion,
		GeneratedAt:   deterministicTimestamp(),
		InputFiles:    inputs,
		Outputs:       outputs,
	}, nil
}

func hashFileOrEmpty(path string) string {
	content, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return hashBytes(content)
}

func deterministicStatement(input EngineInput) string {
	sortKeys := input.Determinism.SortKeys
	if len(sortKeys) == 0 {
		sortKeys = []string{"record_type", "id", "source_file", "source_row"}
	}
	return fmt.Sprintf("Outputs are deterministic when input files, ruleset, mapping config, timezone (%s), and rounding_mode (%s) are unchanged. Records are sorted by %s and JSON is written with stable ordering. Amounts are rounded using %s.", input.Timezone, input.RoundingMode, strings.Join(sortKeys, ", "), input.RoundingMode)
}

func deterministicTimestamp() string {
	return time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC).Format(time.RFC3339)
}

func resolvePaths(baseDir string, paths []string) []string {
	resolved := make([]string, 0, len(paths))
	for _, path := range paths {
		resolved = append(resolved, resolvePath(baseDir, path))
	}
	return resolved
}

func resolvePath(baseDir string, path string) string {
	if path == "" || filepath.IsAbs(path) {
		return path
	}
	return filepath.Join(baseDir, path)
}
