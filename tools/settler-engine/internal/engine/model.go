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
	Status                string `json:"status"`
	FeeAmount             string `json:"fee_amount"`
	FXRate                string `json:"fx_rate"`
	GroupKey              string `json:"group_key"`
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
	Status                string    `json:"status,omitempty"`
	FeeAmountCents        int64     `json:"fee_amount_cents,omitempty"`
	FXRateMilliBps        int64     `json:"fx_rate_milli_bps,omitempty"`
	GroupKey              string    `json:"group_key,omitempty"`
	SourceFile            string    `json:"source_file"`
	SourceRow             int       `json:"source_row"`
}

type VarianceItem struct {
	ID               string `json:"id"`
	Type             string `json:"type"`
	TransactionID    string `json:"transaction_id,omitempty"`
	SettlementID     string `json:"settlement_id,omitempty"`
	Message          string `json:"message"`
	AmountDiffCents  int64  `json:"amount_diff_cents,omitempty"`
	DateDiffDays     int    `json:"date_diff_days,omitempty"`
	FXVarianceBps    int64  `json:"fx_variance_bps,omitempty"`
	FeeDiffCents     int64  `json:"fee_diff_cents,omitempty"`
	DuplicateGroupID string `json:"duplicate_group_id,omitempty"`
	PolicyTrace      string `json:"policy_trace,omitempty"`
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

type RuleMetrics struct {
	RuleID          string `json:"rule_id"`
	Evaluations     int    `json:"evaluations"`
	Matches         int    `json:"matches"`
	Misses          int    `json:"misses"`
	FirstMatchWins  int    `json:"first_match_wins"`
	BestMatchSelect int    `json:"best_match_select"`
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
	PolicyContext          PolicyContext        `json:"policy_context"`
	RuleMetrics            []RuleMetrics        `json:"rule_metrics"`
	DeterministicStatement string               `json:"deterministic_statement"`
}

type PolicyContext struct {
	PolicyVersion string               `json:"policy_version"`
	PolicyHash    string               `json:"policy_hash"`
	Snapshot      ReconciliationPolicy `json:"snapshot"`
}

type ReconciliationPolicy struct {
	RulesetID                           string              `json:"ruleset_id"`
	RulesetName                         string              `json:"ruleset_name"`
	MatchPrecedence                     []string            `json:"match_precedence"`
	ConflictResolution                  string              `json:"conflict_resolution"`
	AmountToleranceCents                int64               `json:"amount_tolerance_cents"`
	DateToleranceDays                   int                 `json:"date_tolerance_days"`
	FeeToleranceCents                   int64               `json:"fee_tolerance_cents"`
	FXVarianceToleranceBps              int64               `json:"fx_variance_tolerance_bps"`
	CurrencyMismatchIsVariance          bool                `json:"currency_mismatch_is_variance"`
	MissingSettlementIsVariance         bool                `json:"missing_settlement_is_variance"`
	MissingTransactionIsVariance        bool                `json:"missing_transaction_is_variance"`
	ManualReviewAmountDeltaCents        int64               `json:"manual_review_amount_delta_cents"`
	ManualReviewDateDeltaDays           int                 `json:"manual_review_date_delta_days"`
	DuplicateWindowDays                 int                 `json:"duplicate_window_days"`
	DuplicateAmountToleranceCents       int64               `json:"duplicate_amount_tolerance_cents"`
	DuplicateReferenceSimilarityPercent int                 `json:"duplicate_reference_similarity_percent"`
	GroupedMatchEnabled                 bool                `json:"grouped_match_enabled"`
	GroupedMatchMinRecords              int                 `json:"grouped_match_min_records"`
	StatusCompatibility                 map[string][]string `json:"status_compatibility"`
	EnabledRuleIDs                      []string            `json:"enabled_rule_ids"`
}

type PolicyOverride struct {
	AmountToleranceCents       *int64  `json:"amount_tolerance_cents,omitempty"`
	DateToleranceDays          *int    `json:"date_tolerance_days,omitempty"`
	FeeToleranceCents          *int64  `json:"fee_tolerance_cents,omitempty"`
	FXVarianceToleranceBps     *int64  `json:"fx_variance_tolerance_bps,omitempty"`
	CurrencyMismatchIsVariance *bool   `json:"currency_mismatch_is_variance,omitempty"`
	ConflictResolution         *string `json:"conflict_resolution,omitempty"`
	GroupedMatchEnabled        *bool   `json:"grouped_match_enabled,omitempty"`
}

type PolicySimulationOutput struct {
	SchemaVersion        string                 `json:"schema_version"`
	ToolVersion          string                 `json:"tool_version"`
	Baseline             PolicySimulationResult `json:"baseline"`
	Candidate            PolicySimulationResult `json:"candidate"`
	Diff                 PolicySimulationDiff   `json:"diff"`
	EvidenceArtifactPath string                 `json:"evidence_artifact_path,omitempty"`
}

type PolicySimulationResult struct {
	PolicyContext        PolicyContext        `json:"policy_context"`
	NormalizationSummary NormalizationSummary `json:"normalization_summary"`
	VarianceSummary      VarianceSummary      `json:"variance_summary"`
	MatchCount           int                  `json:"match_count"`
	ManualReviewCount    int                  `json:"manual_review_count"`
	GroupedMatchCount    int                  `json:"grouped_match_count"`
	RuleMetrics          []RuleMetrics        `json:"rule_metrics"`
	VarianceItems        []VarianceItem       `json:"variance_items"`
}

type PolicySimulationDiff struct {
	MatchCountDelta        int      `json:"match_count_delta"`
	VarianceTotalDelta     int      `json:"variance_total_delta"`
	ManualReviewDelta      int      `json:"manual_review_delta"`
	GroupedMatchDelta      int      `json:"grouped_match_delta"`
	NewVarianceIDs         []string `json:"new_variance_ids"`
	ResolvedVarianceIDs    []string `json:"resolved_variance_ids"`
	ChangedVarianceTypeIDs []string `json:"changed_variance_type_ids"`
}
