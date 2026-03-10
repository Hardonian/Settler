package engine

import (
	"bufio"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const (
	defaultRecordTypeField = "record_type"
	defaultTransactionType = "transaction"
	defaultSettlementType  = "settlement"
)

func LoadEngineInput(path string) (EngineInput, error) {
	file, err := os.Open(path)
	if err != nil {
		return EngineInput{}, fmt.Errorf("open engine input: %w", err)
	}
	defer file.Close()

	var input EngineInput
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		return EngineInput{}, fmt.Errorf("decode engine input: %w", err)
	}
	return input, nil
}

func LoadMappingConfig(path string) (MappingConfig, error) {
	if path == "" {
		return defaultMappingConfig(), nil
	}
	file, err := os.Open(path)
	if err != nil {
		return MappingConfig{}, fmt.Errorf("open mapping config: %w", err)
	}
	defer file.Close()

	var cfg MappingConfig
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&cfg); err != nil {
		return MappingConfig{}, fmt.Errorf("decode mapping config: %w", err)
	}
	if cfg.RecordTypeField == "" {
		cfg.RecordTypeField = defaultRecordTypeField
	}
	if cfg.RecordTypeValues.Transaction == "" {
		cfg.RecordTypeValues.Transaction = defaultTransactionType
	}
	if cfg.RecordTypeValues.Settlement == "" {
		cfg.RecordTypeValues.Settlement = defaultSettlementType
	}
	cfg.Transactions = withDefaultFieldMapping(cfg.Transactions)
	cfg.Settlements = withDefaultFieldMapping(cfg.Settlements)
	return cfg, nil
}

func LoadRuleset(path string) (Ruleset, error) {
	file, err := os.Open(path)
	if err != nil {
		return Ruleset{}, fmt.Errorf("open ruleset: %w", err)
	}
	defer file.Close()

	var ruleset Ruleset
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&ruleset); err != nil {
		return Ruleset{}, fmt.Errorf("decode ruleset: %w", err)
	}
	if ruleset.Priority == "" {
		ruleset.Priority = "exact-first"
	}
	for i := range ruleset.Rules {
		if !ruleset.Rules[i].Enabled {
			ruleset.Rules[i].Enabled = true
		}
	}
	return ruleset, nil
}

func ParseInputFiles(input EngineInput, mapping MappingConfig, tz *time.Location, roundingMode string, displayPaths map[string]string) ([]NormalizedRecord, []string, error) {
	var normalized []NormalizedRecord
	warnings := []string{}

	for _, path := range input.InputFiles {
		displayPath := displayPaths[path]
		if displayPath == "" {
			displayPath = path
		}
		records, recordWarnings, err := parseInputFile(path, displayPath, input.InputFormat, mapping, tz, roundingMode)
		if err != nil {
			return nil, warnings, err
		}
		warnings = append(warnings, recordWarnings...)
		normalized = append(normalized, records...)
	}

	sort.Slice(normalized, func(i, j int) bool {
		if normalized[i].RecordType != normalized[j].RecordType {
			return normalized[i].RecordType < normalized[j].RecordType
		}
		if normalized[i].ID != normalized[j].ID {
			return normalized[i].ID < normalized[j].ID
		}
		if normalized[i].SourceFile != normalized[j].SourceFile {
			return normalized[i].SourceFile < normalized[j].SourceFile
		}
		return normalized[i].SourceRow < normalized[j].SourceRow
	})

	return normalized, warnings, nil
}

func parseInputFile(path string, displayPath string, format string, mapping MappingConfig, tz *time.Location, roundingMode string) ([]NormalizedRecord, []string, error) {
	format = strings.ToLower(strings.TrimSpace(format))
	if format == "" || format == "auto" {
		ext := strings.ToLower(filepath.Ext(path))
		switch ext {
		case ".csv":
			format = "csv"
		case ".json":
			format = "json"
		default:
			return nil, nil, fmt.Errorf("unsupported input extension %s", ext)
		}
	}

	switch format {
	case "csv":
		return parseCSV(path, displayPath, mapping, tz, roundingMode)
	case "json":
		return parseJSON(path, displayPath, mapping, tz, roundingMode)
	default:
		return nil, nil, fmt.Errorf("unsupported input format %s", format)
	}
}

func parseCSV(path string, displayPath string, mapping MappingConfig, tz *time.Location, roundingMode string) ([]NormalizedRecord, []string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, nil, fmt.Errorf("open csv: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(bufio.NewReader(file))
	reader.TrimLeadingSpace = true
	reader.ReuseRecord = false
	reader.FieldsPerRecord = -1

	headers, err := reader.Read()
	if err != nil {
		return nil, nil, fmt.Errorf("read csv header: %w", err)
	}
	for i := range headers {
		headers[i] = strings.TrimSpace(headers[i])
	}

	var normalized []NormalizedRecord
	warnings := []string{}
	row := 1
	for {
		row++
		record, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, warnings, fmt.Errorf("read csv row %d: %w", row, err)
		}
		rowMap := map[string]string{}
		for i, value := range record {
			if i < len(headers) {
				rowMap[headers[i]] = strings.TrimSpace(value)
			}
		}

		recordType := rowMap[mapping.RecordTypeField]
		if recordType == "" {
			warnings = append(warnings, fmt.Sprintf("row %d missing record_type", row))
			continue
		}

		var fieldMap FieldMapping
		switch recordType {
		case mapping.RecordTypeValues.Transaction:
			fieldMap = mapping.Transactions
		case mapping.RecordTypeValues.Settlement:
			fieldMap = mapping.Settlements
		default:
			warnings = append(warnings, fmt.Sprintf("row %d unknown record_type %s", row, recordType))
			continue
		}

		normalizedRecord, err := normalizeRow(recordType, fieldMap, rowMap, tz, roundingMode, displayPath, row)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("row %d: %s", row, err.Error()))
			continue
		}
		normalized = append(normalized, normalizedRecord)
	}

	return normalized, warnings, nil
}

func parseJSON(path string, displayPath string, mapping MappingConfig, tz *time.Location, roundingMode string) ([]NormalizedRecord, []string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, nil, fmt.Errorf("open json: %w", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	decoder.UseNumber()

	var payload interface{}
	if err := decoder.Decode(&payload); err != nil {
		return nil, nil, fmt.Errorf("decode json: %w", err)
	}

	warnings := []string{}
	var normalized []NormalizedRecord
	switch value := payload.(type) {
	case map[string]interface{}:
		transactions, ok := value["transactions"].([]interface{})
		if ok {
			records, warn := parseJSONRecords(transactions, mapping, mapping.RecordTypeValues.Transaction, tz, roundingMode, displayPath)
			warnings = append(warnings, warn...)
			normalized = append(normalized, records...)
		}
		settlements, ok := value["settlements"].([]interface{})
		if ok {
			records, warn := parseJSONRecords(settlements, mapping, mapping.RecordTypeValues.Settlement, tz, roundingMode, displayPath)
			warnings = append(warnings, warn...)
			normalized = append(normalized, records...)
		}
		if !ok && len(normalized) == 0 {
			warnings = append(warnings, "json file missing transactions or settlements arrays")
		}
	case []interface{}:
		records, warn := parseJSONRecords(value, mapping, "", tz, roundingMode, displayPath)
		warnings = append(warnings, warn...)
		normalized = append(normalized, records...)
	default:
		return nil, nil, fmt.Errorf("unsupported json structure")
	}

	return normalized, warnings, nil
}

func parseJSONRecords(records []interface{}, mapping MappingConfig, forcedType string, tz *time.Location, roundingMode string, path string) ([]NormalizedRecord, []string) {
	warnings := []string{}
	var normalized []NormalizedRecord
	for idx, item := range records {
		recordMap, ok := item.(map[string]interface{})
		if !ok {
			warnings = append(warnings, fmt.Sprintf("record %d not object", idx+1))
			continue
		}
		rowMap := map[string]string{}
		for key, value := range recordMap {
			rowMap[key] = fmt.Sprintf("%v", value)
		}
		recordType := forcedType
		if recordType == "" {
			recordType = rowMap[defaultRecordTypeField]
		}
		if recordType == "" {
			warnings = append(warnings, fmt.Sprintf("record %d missing record_type", idx+1))
			continue
		}

		fieldMap := mapping.Transactions
		if recordType == mapping.RecordTypeValues.Settlement {
			fieldMap = mapping.Settlements
		}
		normalizedRecord, err := normalizeRow(recordType, fieldMap, rowMap, tz, roundingMode, path, idx+1)
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("record %d: %s", idx+1, err.Error()))
			continue
		}
		normalized = append(normalized, normalizedRecord)
	}
	return normalized, warnings
}

func normalizeRow(recordType string, mapping FieldMapping, data map[string]string, tz *time.Location, roundingMode string, sourceFile string, row int) (NormalizedRecord, error) {
	id := strings.TrimSpace(data[mapping.ID])
	if id == "" {
		return NormalizedRecord{}, fmt.Errorf("missing id")
	}
	amountRaw := strings.TrimSpace(data[mapping.Amount])
	if amountRaw == "" {
		return NormalizedRecord{}, fmt.Errorf("missing amount")
	}
	amountCents, err := parseAmountToCents(amountRaw, roundingMode)
	if err != nil {
		return NormalizedRecord{}, fmt.Errorf("invalid amount: %w", err)
	}
	currency := strings.TrimSpace(data[mapping.Currency])
	if currency == "" {
		currency = "USD"
	}
	dateRaw := strings.TrimSpace(data[mapping.Date])
	if dateRaw == "" {
		return NormalizedRecord{}, fmt.Errorf("missing date")
	}
	dateValue, err := parseDate(dateRaw, tz)
	if err != nil {
		return NormalizedRecord{}, fmt.Errorf("invalid date: %w", err)
	}
	feeAmountCents := int64(0)
	if feeRaw := strings.TrimSpace(data[mapping.FeeAmount]); feeRaw != "" {
		feeAmountCents, err = parseAmountToCents(feeRaw, roundingMode)
		if err != nil {
			return NormalizedRecord{}, fmt.Errorf("invalid fee amount: %w", err)
		}
	}
	fxRateMilliBps := int64(0)
	if fxRaw := strings.TrimSpace(data[mapping.FXRate]); fxRaw != "" {
		fxRateMilliBps, err = parseRateToMilliBps(fxRaw)
		if err != nil {
			return NormalizedRecord{}, fmt.Errorf("invalid fx rate: %w", err)
		}
	}

	return NormalizedRecord{
		RecordType:            recordType,
		ID:                    id,
		AmountCents:           amountCents,
		Currency:              currency,
		Date:                  dateValue,
		ReferenceID:           strings.TrimSpace(data[mapping.ReferenceID]),
		ProviderTransactionID: strings.TrimSpace(data[mapping.ProviderTransactionID]),
		ProviderSettlementID:  strings.TrimSpace(data[mapping.ProviderSettlementID]),
		Status:                strings.TrimSpace(data[mapping.Status]),
		FeeAmountCents:        feeAmountCents,
		FXRateMilliBps:        fxRateMilliBps,
		GroupKey:              strings.TrimSpace(data[mapping.GroupKey]),
		SourceFile:            sourceFile,
		SourceRow:             row,
	}, nil
}

func defaultMappingConfig() MappingConfig {
	return MappingConfig{
		RecordTypeField: defaultRecordTypeField,
		RecordTypeValues: RecordTypeValues{
			Transaction: defaultTransactionType,
			Settlement:  defaultSettlementType,
		},
		Transactions: FieldMapping{
			ID:                    "id",
			Amount:                "amount",
			Currency:              "currency",
			Date:                  "date",
			ReferenceID:           "reference_id",
			ProviderTransactionID: "provider_transaction_id",
			ProviderSettlementID:  "provider_settlement_id",
			Status:                "status",
			FeeAmount:             "fee_amount",
			FXRate:                "fx_rate",
			GroupKey:              "group_key",
		},
		Settlements: FieldMapping{
			ID:                    "id",
			Amount:                "amount",
			Currency:              "currency",
			Date:                  "date",
			ReferenceID:           "reference_id",
			ProviderTransactionID: "provider_transaction_id",
			ProviderSettlementID:  "provider_settlement_id",
			Status:                "status",
			FeeAmount:             "fee_amount",
			FXRate:                "fx_rate",
			GroupKey:              "group_key",
		},
	}
}

func withDefaultFieldMapping(mapping FieldMapping) FieldMapping {
	defaults := defaultMappingConfig().Transactions
	if mapping.ID == "" {
		mapping.ID = defaults.ID
	}
	if mapping.Amount == "" {
		mapping.Amount = defaults.Amount
	}
	if mapping.Currency == "" {
		mapping.Currency = defaults.Currency
	}
	if mapping.Date == "" {
		mapping.Date = defaults.Date
	}
	if mapping.ReferenceID == "" {
		mapping.ReferenceID = defaults.ReferenceID
	}
	if mapping.ProviderTransactionID == "" {
		mapping.ProviderTransactionID = defaults.ProviderTransactionID
	}
	if mapping.ProviderSettlementID == "" {
		mapping.ProviderSettlementID = defaults.ProviderSettlementID
	}
	if mapping.Status == "" {
		mapping.Status = defaults.Status
	}
	if mapping.FeeAmount == "" {
		mapping.FeeAmount = defaults.FeeAmount
	}
	if mapping.FXRate == "" {
		mapping.FXRate = defaults.FXRate
	}
	if mapping.GroupKey == "" {
		mapping.GroupKey = defaults.GroupKey
	}
	return mapping
}
