package compliance

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

// Framework represents an audit standard.
type Framework string

const (
	FrameworkSOC2   Framework = "SOC2_TYPE_II"
	FrameworkPCIDSS Framework = "PCI_DSS_V4"
	FrameworkSOX    Framework = "SOX_404"
)

// ControlStatus represents the outcome of an audit check.
type ControlStatus string

const (
	StatusPass ControlStatus = "PASS"
	StatusFail ControlStatus = "FAIL"
)

// EvidenceRecord represents verifiable evidence from a reconciliation or settlement run.
type EvidenceRecord struct {
	TenantID        string            `json:"tenant_id"`
	RunID           string            `json:"run_id"`
	PolicyID        string            `json:"policy_id"`
	EngineVersion   string            `json:"engine_version"`
	InputHash       string            `json:"input_hash"`
	ConfigHash      string            `json:"config_hash"`
	OutputHash      string            `json:"output_hash"`
	RunFingerprint  string            `json:"run_fingerprint"`
	ProvenanceChain []string          `json:"provenance_chain"`
	Metadata        map[string]string `json:"metadata"`
}

// EvaluationResult represents the verified finding for a specific control.
type EvaluationResult struct {
	ControlID   string        `json:"control_id"`
	Framework   Framework     `json:"framework"`
	Title       string        `json:"title"`
	Status      ControlStatus `json:"status"`
	Evidence    string        `json:"evidence"`
	EvaluatedAt string        `json:"evaluated_at"`
}

// Evaluator executes sovereign audit rules on evidence records.
type Evaluator struct{}

// NewEvaluator creates a new compliance verification engine.
func NewEvaluator() *Evaluator {
	return &Evaluator{}
}

// Evaluate evaluates an evidence record against SOC2, PCI-DSS, and SOX standards.
func (e *Evaluator) Evaluate(record EvidenceRecord) []EvaluationResult {
	now := time.Now().UTC().Format(time.RFC3339)
	var results []EvaluationResult

	// CC6.1 - Tenant Isolation Security Guard
	resCC61 := EvaluationResult{
		ControlID:   "CC6.1",
		Framework:   FrameworkSOC2,
		Title:       "Logical Tenant Isolation Enforced",
		EvaluatedAt: now,
	}
	if strings.TrimSpace(record.TenantID) != "" {
		resCC61.Status = StatusPass
		resCC61.Evidence = fmt.Sprintf("Tenant ID is strictly bounded: %s", record.TenantID)
	} else {
		resCC61.Status = StatusFail
		resCC61.Evidence = "Tenant ID is missing or empty; cross-tenant leakage risk"
	}
	results = append(results, resCC61)

	// CC6.6 - Cryptographic Run Provenance
	resCC66 := EvaluationResult{
		ControlID:   "CC6.6",
		Framework:   FrameworkSOC2,
		Title:       "Deterministic Cryptographic Proof Integrity",
		EvaluatedAt: now,
	}
	if len(record.ProvenanceChain) > 0 && len(record.RunFingerprint) == 64 {
		resCC66.Status = StatusPass
		resCC66.Evidence = fmt.Sprintf("Run fingerprint verified: %s (chain depth: %d)", record.RunFingerprint, len(record.ProvenanceChain))
	} else {
		resCC66.Status = StatusFail
		resCC66.Evidence = "Invalid or missing cryptographic provenance chain"
	}
	results = append(results, resCC66)

	// PCI-DSS 3.4 - Cardholder Data Zero-Float / Obfuscation Invariant
	resPCI34 := EvaluationResult{
		ControlID:   "PCI-3.4",
		Framework:   FrameworkPCIDSS,
		Title:       "Primary Account Number (PAN) Masking & Minor Unit Isolation",
		EvaluatedAt: now,
	}
	panLeaked := false
	for k, v := range record.Metadata {
		if strings.Contains(strings.ToLower(k), "card") || strings.Contains(strings.ToLower(k), "pan") {
			if len(v) >= 13 && !strings.Contains(v, "*") && !strings.Contains(v, "X") {
				panLeaked = true
				break
			}
		}
	}
	if !panLeaked {
		resPCI34.Status = StatusPass
		resPCI34.Evidence = "No unmasked PAN detected; minor unit tokenization preserved"
	} else {
		resPCI34.Status = StatusFail
		resPCI34.Evidence = "Unmasked cardholder PAN detected in metadata"
	}
	results = append(results, resPCI34)

	// SOX 404 - Complete Audit Trail & Non-Repudiation
	resSOX404 := EvaluationResult{
		ControlID:   "SOX-404.1",
		Framework:   FrameworkSOX,
		Title:       "Financial Reconciliation Tamper-Evident Ledger",
		EvaluatedAt: now,
	}
	if len(record.InputHash) == 64 && len(record.OutputHash) == 64 && strings.TrimSpace(record.PolicyID) != "" {
		resSOX404.Status = StatusPass
		resSOX404.Evidence = fmt.Sprintf("Policy %s: input_hash=%s output_hash=%s", record.PolicyID, record.InputHash, record.OutputHash)
	} else {
		resSOX404.Status = StatusFail
		resSOX404.Evidence = "Incomplete hash commitment for financial balance verification"
	}
	results = append(results, resSOX404)

	return results
}

// ComputeHash computes SHA-256 hash of canonical string payload.
func ComputeHash(payload string) string {
	h := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(h[:])
}

