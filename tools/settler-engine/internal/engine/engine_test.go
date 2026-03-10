package engine

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

type expectedSummary struct {
	Transactions   int            `json:"transactions"`
	Settlements    int            `json:"settlements"`
	VariancesTotal int            `json:"variances_total"`
	VarianceByType map[string]int `json:"variance_by_type"`
}

func TestFixtureRun(t *testing.T) {
	root := filepath.Join("..", "..")
	inputPath := filepath.Join(root, "fixtures", "input", "engine_input.json")
	outputDir := filepath.Join(root, "fixtures", "output")
	_ = os.RemoveAll(outputDir)

	output, err := Run(inputPath)
	if err != nil {
		t.Fatalf("run engine: %v", err)
	}

	expectedPath := filepath.Join(root, "fixtures", "expected", "summary.json")
	content, err := os.ReadFile(expectedPath)
	if err != nil {
		t.Fatalf("read expected summary: %v", err)
	}
	var expected expectedSummary
	if err := json.Unmarshal(content, &expected); err != nil {
		t.Fatalf("parse expected summary: %v", err)
	}

	if output.NormalizationSummary.Transactions != expected.Transactions {
		t.Fatalf("transactions mismatch: got %d want %d", output.NormalizationSummary.Transactions, expected.Transactions)
	}
	if output.NormalizationSummary.Settlements != expected.Settlements {
		t.Fatalf("settlements mismatch: got %d want %d", output.NormalizationSummary.Settlements, expected.Settlements)
	}
	if output.VarianceSummary.Total != expected.VariancesTotal {
		t.Fatalf("variances total mismatch: got %d want %d", output.VarianceSummary.Total, expected.VariancesTotal)
	}

	counts := map[string]int{}
	for _, item := range output.VarianceSummary.ByType {
		counts[item.Type] = item.Count
	}
	for varianceType, expectedCount := range expected.VarianceByType {
		if counts[varianceType] != expectedCount {
			t.Fatalf("variance %s mismatch: got %d want %d", varianceType, counts[varianceType], expectedCount)
		}
	}

	if output.EvidenceManifest.GeneratedAt == "" {
		t.Fatalf("expected deterministic timestamp")
	}
	if output.PolicyContext.PolicyHash == "" {
		t.Fatalf("expected policy hash to be populated")
	}
	if output.PolicyContext.Snapshot.AmountToleranceCents != 1 {
		t.Fatalf("expected amount tolerance to be 1 cent, got %d", output.PolicyContext.Snapshot.AmountToleranceCents)
	}
	if len(output.RuleMetrics) == 0 {
		t.Fatalf("expected rule metrics in output")
	}
}

func TestPolicySimulationDiff(t *testing.T) {
	root := filepath.Join("..", "..")
	inputPath := filepath.Join(root, "fixtures", "input", "engine_input.json")
	currencyVariance := false
	simulation, err := SimulatePolicy(inputPath, PolicyOverride{CurrencyMismatchIsVariance: &currencyVariance})
	if err != nil {
		t.Fatalf("simulate policy: %v", err)
	}
	if simulation.Baseline.PolicyContext.PolicyHash == simulation.Candidate.PolicyContext.PolicyHash {
		t.Fatalf("expected candidate policy hash to differ from baseline")
	}
	if simulation.Diff.VarianceTotalDelta >= 0 {
		t.Fatalf("expected disabling currency variance to reduce variances, got %d", simulation.Diff.VarianceTotalDelta)
	}
	if len(simulation.Diff.ResolvedVarianceIDs) == 0 {
		t.Fatalf("expected resolved variances in candidate simulation")
	}
	if simulation.EvidenceArtifactPath == "" {
		t.Fatalf("expected simulation evidence artifact path")
	}
	if _, err := os.Stat(simulation.EvidenceArtifactPath); err != nil {
		t.Fatalf("expected simulation artifact to exist: %v", err)
	}
}

func TestEngineOutputMigrationBackfillsPolicyContext(t *testing.T) {
	tmp := t.TempDir()
	legacyPath := filepath.Join(tmp, "legacy_output.json")
	legacy := map[string]interface{}{
		"schema_version": "1.0.0",
		"tool_version":   "0.0.1",
		"normalization_summary": map[string]interface{}{
			"transactions": 1,
			"settlements":  1,
			"warnings":     []string{},
		},
		"variance_summary": map[string]interface{}{
			"total":   0,
			"by_type": []interface{}{},
		},
		"variance_items_path": "legacy/path.jsonl",
		"evidence_manifest": map[string]interface{}{
			"schema_version": "1.0.0",
			"tool_version":   "0.0.1",
			"generated_at":   "2000-01-01T00:00:00Z",
			"input_files":    []interface{}{},
			"outputs":        []interface{}{},
		},
		"deterministic_statement": "legacy",
	}
	body, _ := json.Marshal(legacy)
	if err := os.WriteFile(legacyPath, body, 0o644); err != nil {
		t.Fatalf("write legacy output: %v", err)
	}
	migrated, err := LoadEngineOutputWithMigration(legacyPath)
	if err != nil {
		t.Fatalf("migrate output: %v", err)
	}
	if migrated.PolicyContext.PolicyVersion == "" {
		t.Fatalf("expected policy context to be backfilled")
	}
	if migrated.PolicyContext.Snapshot.ConflictResolution == "" {
		t.Fatalf("expected conflict resolution defaults in migrated snapshot")
	}
}
