package engine

import (
	"time"
)

type EngineInput struct {
	InputFiles        []string          `json:"input_files"`
	InputFormat       string            `json:"input_format"`
	MappingConfigPath string            `json:"mapping_config_path"`
	RulesetPath       string            `json:"ruleset_path"`
	Currency          string            `json:"currency"`
	RoundingMode      string            `json:"rounding_mode"`
	Timezone          string            `json:"timezone"`
	OutputDir         string            `json:"output_dir"`
	Mode              string            `json:"mode"`
	Determinism       DeterminismConfig `json:"determinism"`
}

type DeterminismConfig struct {
	SortKeys []string `json:"sort_keys"`
	Rounding string   `json:"rounding"`
	Timezone string   `json:"timezone"`
}

type MappingConfig struct {
	RecordTypeField  string           `json:"record_type_field"`
	RecordTypeValues RecordTypeValues `json:"record_type_values"`
	Transactions     FieldMapping     `json:"transactions"`
	Settlements      FieldMapping     `json:"settlements"`
}

type RecordTypeValues struct {
	Transaction string `json:"transaction"`
	Settlement  string `json:"settlement"`
}

type FieldMapping struct {
	ID                    string `json:"id"`
	Amount                string `json:"amount"`
	Currency              string `json:"currency"`
	Date                  string `json:"date"`
	ReferenceID           string `json:"reference_id"`
	ProviderTransactionID string `json:"provider_transaction_id"`
	ProviderSettlementID  string `json:"provider_settlement_id"`
}

type Ruleset struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Rules              []Rule `json:"rules"`
	Priority           string `json:"priority"`
	ConflictResolution string `json:"conflictResolution"`
}

type Rule struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Field     string        `json:"field"`
	Type      string        `json:"type"`
	Tolerance RuleTolerance `json:"tolerance"`
	Priority  int           `json:"priority"`
	Enabled   bool          `json:"enabled"`
}

type RuleTolerance struct {
	Amount     string  `json:"amount"`
	Days       int     `json:"days"`
	Percentage float64 `json:"percentage"`
	Threshold  float64 `json:"threshold"`
}

type NormalizedRecord struct {
	RecordType            string    `json:"record_type"`
	ID                    string    `json:"id"`
	AmountCents           int64     `json:"amount_cents"`
	Currency              string    `json:"currency"`
	Date                  time.Time `json:"date"`
	ReferenceID           string    `json:"reference_id,omitempty"`
	ProviderTransactionID string    `json:"provider_transaction_id,omitempty"`
	ProviderSettlementID  string    `json:"provider_settlement_id,omitempty"`
	SourceFile            string    `json:"source_file"`
	SourceRow             int       `json:"source_row"`
}

type VarianceItem struct {
	ID              string `json:"id"`
	Type            string `json:"type"`
	TransactionID   string `json:"transaction_id,omitempty"`
	SettlementID    string `json:"settlement_id,omitempty"`
	Message         string `json:"message"`
	AmountDiffCents int64  `json:"amount_diff_cents,omitempty"`
	DateDiffDays    int    `json:"date_diff_days,omitempty"`
}

type NormalizationSummary struct {
	Transactions int      `json:"transactions"`
	Settlements  int      `json:"settlements"`
	Warnings     []string `json:"warnings"`
}

type VarianceSummary struct {
	Total  int             `json:"total"`
	ByType []VarianceCount `json:"by_type"`
}

type VarianceCount struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
}

type EvidenceManifest struct {
	SchemaVersion string         `json:"schema_version"`
	ToolVersion   string         `json:"tool_version"`
	GeneratedAt   string         `json:"generated_at"`
	InputFiles    []EvidenceFile `json:"input_files"`
	Outputs       []EvidenceFile `json:"outputs"`
}

type EvidenceFile struct {
	Path   string `json:"path"`
	Sha256 string `json:"sha256"`
}

type EngineOutput struct {
	SchemaVersion          string               `json:"schema_version"`
	ToolVersion            string               `json:"tool_version"`
	NormalizationSummary   NormalizationSummary `json:"normalization_summary"`
	VarianceSummary        VarianceSummary      `json:"variance_summary"`
	VarianceItemsPath      string               `json:"variance_items_path"`
	EvidenceManifest       EvidenceManifest     `json:"evidence_manifest"`
	DeterministicStatement string               `json:"deterministic_statement"`
}
