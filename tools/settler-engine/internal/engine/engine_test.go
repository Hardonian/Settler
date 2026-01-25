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
}
