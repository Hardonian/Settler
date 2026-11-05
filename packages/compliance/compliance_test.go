package compliance

import (
	"testing"
)

func TestEvaluateValidEvidence(t *testing.T) {
	evaluator := NewEvaluator()
	record := EvidenceRecord{
		TenantID:        "tenant-corp-alpha",
		RunID:           "run-7721",
		PolicyID:        "deterministic.strict.v1",
		EngineVersion:   "1.7.0",
		InputHash:       "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		ConfigHash:      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		OutputHash:      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		RunFingerprint:  "fbd5951d6e50c33f56d84768d084e5ded4288cf10e740f44370d261700bffb18",
		ProvenanceChain: []string{"genesis", "leaf-1"},
		Metadata: map[string]string{
			"masked_card": "4111********1111",
		},
	}

	results := evaluator.Evaluate(record)
	if len(results) != 4 {
		t.Fatalf("expected 4 control evaluations, got %d", len(results))
	}

	for _, res := range results {
		if res.Status != StatusPass {
			t.Errorf("control %s expected PASS, got %s: %s", res.ControlID, res.Status, res.Evidence)
		}
	}
}

func TestEvaluateTenantMissingFailsSOC2(t *testing.T) {
	evaluator := NewEvaluator()
	record := EvidenceRecord{
		TenantID:        "",
		RunID:           "run-bad-tenant",
		PolicyID:        "p1",
		InputHash:       "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		OutputHash:      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		RunFingerprint:  "fbd5951d6e50c33f56d84768d084e5ded4288cf10e740f44370d261700bffb18",
		ProvenanceChain: []string{"genesis"},
	}

	results := evaluator.Evaluate(record)
	for _, res := range results {
		if res.ControlID == "CC6.1" {
			if res.Status != StatusFail {
				t.Errorf("expected CC6.1 to fail on empty tenant ID")
			}
			return
		}
	}
	t.Fatalf("CC6.1 not found in results")
}

func TestEvaluateLeakedPANFailsPCI(t *testing.T) {
	evaluator := NewEvaluator()
	record := EvidenceRecord{
		TenantID:        "tenant-safe",
		RunID:           "run-pan-leak",
		PolicyID:        "p1",
		InputHash:       "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		OutputHash:      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		RunFingerprint:  "fbd5951d6e50c33f56d84768d084e5ded4288cf10e740f44370d261700bffb18",
		ProvenanceChain: []string{"genesis"},
		Metadata: map[string]string{
			"customer_pan": "4111222233334444",
		},
	}

	results := evaluator.Evaluate(record)
	for _, res := range results {
		if res.ControlID == "PCI-3.4" {
			if res.Status != StatusFail {
				t.Errorf("expected PCI-3.4 to fail on raw PAN leak")
			}
			return
		}
	}
	t.Fatalf("PCI-3.4 not found in results")
}

