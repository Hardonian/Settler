use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap, HashSet};

pub const SCHEMA_VERSION: &str = "v1";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RoundingMode {
    Exact,
    Up,
    Down,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum VarianceType {
    MissingLeft,
    MissingRight,
    AmountDelta,
    AttributeMismatch,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NormalizedRecord {
    pub record_id: String,
    pub source: String,
    pub timestamp: String,
    pub amount_minor_units: i64,
    pub currency: String,
    #[serde(default)]
    pub attributes: BTreeMap<String, String>,
    pub schema_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Ruleset {
    #[serde(default)]
    pub match_keys: Vec<String>,
    #[serde(default)]
    pub compare_keys: Vec<String>,
    pub tolerance_minor_units: i64,
    pub rounding_mode: RoundingMode,
    pub timezone: String,
    pub schema_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Variance {
    pub variance_id: String,
    pub variance_type: VarianceType,
    pub severity: Severity,
    pub left_record_id: Option<String>,
    pub right_record_id: Option<String>,
    pub amount_delta_minor_units: Option<i64>,
    pub rationale: String,
    pub schema_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VarianceReport {
    pub variances: Vec<Variance>,
    pub summary_hash: String,
    pub schema_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ManifestFile {
    pub path: String,
    pub sha256: String,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EvidenceManifest {
    pub input_hashes: BTreeMap<String, String>,
    pub ruleset_hash: String,
    pub output_hashes: BTreeMap<String, String>,
    pub files: Vec<ManifestFile>,
    pub kernel_version: String,
    pub deterministic_statement: String,
    pub schema_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VerificationMismatch {
    pub path: String,
    pub expected: Option<String>,
    pub actual: Option<String>,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VerificationResult {
    pub success: bool,
    pub mismatches: Vec<VerificationMismatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NamedFile {
    pub path: String,
    #[serde(with = "serde_bytes")]
    pub bytes: Vec<u8>,
}

fn hash_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

fn hash_json<T: Serialize>(value: &T) -> Result<String, serde_json::Error> {
    let bytes = serde_json::to_vec(value)?;
    Ok(hash_bytes(&bytes))
}

fn stable_record_sort_key(
    record: &NormalizedRecord,
) -> (String, String, String, i64, String, Vec<(String, String)>) {
    let attrs = record
        .attributes
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect::<Vec<_>>();
    (
        record.record_id.clone(),
        record.source.clone(),
        record.timestamp.clone(),
        record.amount_minor_units,
        record.currency.clone(),
        attrs,
    )
}

fn canonicalize_records(mut records: Vec<NormalizedRecord>) -> Vec<NormalizedRecord> {
    for record in &mut records {
        if record.schema_version.is_empty() {
            record.schema_version = SCHEMA_VERSION.to_string();
        }
    }
    records.sort_by(|a, b| stable_record_sort_key(a).cmp(&stable_record_sort_key(b)));
    records
}

fn match_value(record: &NormalizedRecord, key: &str) -> String {
    match key {
        "record_id" => record.record_id.clone(),
        "source" => record.source.clone(),
        "timestamp" => record.timestamp.clone(),
        "currency" => record.currency.clone(),
        _ => record
            .attributes
            .get(key)
            .cloned()
            .unwrap_or_else(|| "<missing>".to_string()),
    }
}

fn make_match_key(record: &NormalizedRecord, ruleset: &Ruleset) -> String {
    if ruleset.match_keys.is_empty() {
        return record.record_id.clone();
    }
    ruleset
        .match_keys
        .iter()
        .map(|key| match_value(record, key))
        .collect::<Vec<_>>()
        .join("\u{1f}")
}

fn apply_rounding(value: i64, mode: &RoundingMode) -> i64 {
    match mode {
        RoundingMode::Exact => value,
        RoundingMode::Up => value,
        RoundingMode::Down => value,
    }
}

pub fn compute_variances(
    records_left: Vec<NormalizedRecord>,
    records_right: Vec<NormalizedRecord>,
    ruleset: Ruleset,
) -> Result<VarianceReport, serde_json::Error> {
    let left = canonicalize_records(records_left);
    let right = canonicalize_records(records_right);

    let mut left_map: HashMap<String, Vec<NormalizedRecord>> = HashMap::new();
    let mut right_map: HashMap<String, Vec<NormalizedRecord>> = HashMap::new();

    for record in left {
        left_map
            .entry(make_match_key(&record, &ruleset))
            .or_default()
            .push(record);
    }
    for record in right {
        right_map
            .entry(make_match_key(&record, &ruleset))
            .or_default()
            .push(record);
    }

    let mut all_keys = left_map
        .keys()
        .chain(right_map.keys())
        .cloned()
        .collect::<Vec<_>>();
    all_keys.sort();
    all_keys.dedup();

    let mut variances = Vec::new();

    for key in all_keys {
        let mut left_records = left_map.remove(&key).unwrap_or_default();
        let mut right_records = right_map.remove(&key).unwrap_or_default();

        left_records.sort_by(|a, b| stable_record_sort_key(a).cmp(&stable_record_sort_key(b)));
        right_records.sort_by(|a, b| stable_record_sort_key(a).cmp(&stable_record_sort_key(b)));

        let max_len = left_records.len().max(right_records.len());
        for idx in 0..max_len {
            let left_record = left_records.get(idx).cloned();
            let right_record = right_records.get(idx).cloned();

            match (left_record, right_record) {
                (Some(left_record), Some(right_record)) => {
                    let delta = left_record.amount_minor_units - right_record.amount_minor_units;
                    let rounded_delta = apply_rounding(delta, &ruleset.rounding_mode);
                    let abs_delta = rounded_delta.abs();

                    if abs_delta > ruleset.tolerance_minor_units {
                        let variance = build_variance(
                            VarianceType::AmountDelta,
                            Severity::Warning,
                            Some(left_record.record_id.clone()),
                            Some(right_record.record_id.clone()),
                            Some(rounded_delta),
                            format!(
                                "Amount delta {} exceeds tolerance {}. Timezone rule {}.",
                                rounded_delta, ruleset.tolerance_minor_units, ruleset.timezone
                            ),
                        )?;
                        variances.push(variance);
                    }

                    for key in &ruleset.compare_keys {
                        let left_value = match_value(&left_record, key);
                        let right_value = match_value(&right_record, key);
                        if left_value != right_value {
                            let variance = build_variance(
                                VarianceType::AttributeMismatch,
                                Severity::Info,
                                Some(left_record.record_id.clone()),
                                Some(right_record.record_id.clone()),
                                None,
                                format!(
                                    "Mismatch on {} (left: {}, right: {}).",
                                    key, left_value, right_value
                                ),
                            )?;
                            variances.push(variance);
                        }
                    }
                }
                (Some(left_record), None) => {
                    let variance = build_variance(
                        VarianceType::MissingRight,
                        Severity::Critical,
                        Some(left_record.record_id.clone()),
                        None,
                        None,
                        "Record present on left but missing on right.".to_string(),
                    )?;
                    variances.push(variance);
                }
                (None, Some(right_record)) => {
                    let variance = build_variance(
                        VarianceType::MissingLeft,
                        Severity::Critical,
                        None,
                        Some(right_record.record_id.clone()),
                        None,
                        "Record present on right but missing on left.".to_string(),
                    )?;
                    variances.push(variance);
                }
                (None, None) => {}
            }
        }
    }

    variances.sort_by(|a, b| {
        (
            &a.variance_type,
            &a.left_record_id,
            &a.right_record_id,
            &a.amount_delta_minor_units,
            &a.rationale,
        )
            .cmp(&(
                &b.variance_type,
                &b.left_record_id,
                &b.right_record_id,
                &b.amount_delta_minor_units,
                &b.rationale,
            ))
    });

    let summary_hash = hash_json(&variances)?;

    Ok(VarianceReport {
        variances,
        summary_hash,
        schema_version: SCHEMA_VERSION.to_string(),
    })
}

fn build_variance(
    variance_type: VarianceType,
    severity: Severity,
    left_record_id: Option<String>,
    right_record_id: Option<String>,
    amount_delta_minor_units: Option<i64>,
    rationale: String,
) -> Result<Variance, serde_json::Error> {
    let mut variance = Variance {
        variance_id: String::new(),
        variance_type,
        severity,
        left_record_id,
        right_record_id,
        amount_delta_minor_units,
        rationale,
        schema_version: SCHEMA_VERSION.to_string(),
    };
    let variance_id = hash_json(&variance)?;
    variance.variance_id = variance_id;
    Ok(variance)
}

pub fn compute_manifest(
    records_left: &[NormalizedRecord],
    records_right: &[NormalizedRecord],
    ruleset: &Ruleset,
    variance_report: &VarianceReport,
) -> Result<EvidenceManifest, serde_json::Error> {
    let left_hash = hash_json(&canonicalize_records(records_left.to_vec()))?;
    let right_hash = hash_json(&canonicalize_records(records_right.to_vec()))?;
    let ruleset_hash = hash_json(ruleset)?;
    let report_hash = hash_json(variance_report)?;

    let mut input_hashes = BTreeMap::new();
    input_hashes.insert("records_left".to_string(), left_hash.clone());
    input_hashes.insert("records_right".to_string(), right_hash.clone());

    let mut output_hashes = BTreeMap::new();
    output_hashes.insert("variance_report".to_string(), report_hash.clone());

    let files = vec![
        ManifestFile {
            path: "records-left.json".to_string(),
            sha256: left_hash,
            role: "input".to_string(),
        },
        ManifestFile {
            path: "records-right.json".to_string(),
            sha256: right_hash,
            role: "input".to_string(),
        },
        ManifestFile {
            path: "ruleset.json".to_string(),
            sha256: ruleset_hash.clone(),
            role: "ruleset".to_string(),
        },
        ManifestFile {
            path: "variance-report.json".to_string(),
            sha256: report_hash,
            role: "output".to_string(),
        },
    ];

    Ok(EvidenceManifest {
        input_hashes,
        ruleset_hash,
        output_hashes,
        files,
        kernel_version: env!("CARGO_PKG_VERSION").to_string(),
        deterministic_statement: "Deterministic outputs use stable ordering, explicit rounding modes, and explicit timezone handling. This surfaces discrepancies rather than fixing them.".to_string(),
        schema_version: SCHEMA_VERSION.to_string(),
    })
}

pub fn verify_manifest(manifest: &EvidenceManifest, files: &[NamedFile]) -> VerificationResult {
    let mut mismatches = Vec::new();
    let mut file_map: HashMap<String, String> = HashMap::new();

    for file in files {
        file_map.insert(file.path.clone(), hash_bytes(&file.bytes));
    }

    if manifest.schema_version != SCHEMA_VERSION {
        mismatches.push(VerificationMismatch {
            path: "manifest.json".to_string(),
            expected: Some(SCHEMA_VERSION.to_string()),
            actual: Some(manifest.schema_version.clone()),
            reason: "Unsupported manifest schema version".to_string(),
        });
    }

    for entry in &manifest.files {
        match file_map.get(&entry.path) {
            Some(actual) if actual == &entry.sha256 => {}
            Some(actual) => mismatches.push(VerificationMismatch {
                path: entry.path.clone(),
                expected: Some(entry.sha256.clone()),
                actual: Some(actual.clone()),
                reason: "Hash mismatch".to_string(),
            }),
            None => mismatches.push(VerificationMismatch {
                path: entry.path.clone(),
                expected: Some(entry.sha256.clone()),
                actual: None,
                reason: "Missing file".to_string(),
            }),
        }
    }

    let declared_paths: HashSet<String> = manifest
        .files
        .iter()
        .map(|file| file.path.clone())
        .collect();
    for path in file_map.keys() {
        if !declared_paths.contains(path) {
            mismatches.push(VerificationMismatch {
                path: path.clone(),
                expected: None,
                actual: file_map.get(path).cloned(),
                reason: "Unexpected file".to_string(),
            });
        }
    }

    mismatches.sort_by(|a, b| {
        (a.path.clone(), a.reason.clone()).cmp(&(b.path.clone(), b.reason.clone()))
    });

    VerificationResult {
        success: mismatches.is_empty(),
        mismatches,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    fn sample_records() -> (Vec<NormalizedRecord>, Vec<NormalizedRecord>) {
        let left = vec![NormalizedRecord {
            record_id: "left-1".to_string(),
            source: "ledger-a".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
            amount_minor_units: 1050,
            currency: "USD".to_string(),
            attributes: BTreeMap::from([
                ("invoice".to_string(), "INV-1".to_string()),
                ("region".to_string(), "us".to_string()),
            ]),
            schema_version: SCHEMA_VERSION.to_string(),
        }];

        let right = vec![NormalizedRecord {
            record_id: "right-1".to_string(),
            source: "ledger-b".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
            amount_minor_units: 1000,
            currency: "USD".to_string(),
            attributes: BTreeMap::from([
                ("invoice".to_string(), "INV-1".to_string()),
                ("region".to_string(), "us".to_string()),
            ]),
            schema_version: SCHEMA_VERSION.to_string(),
        }];

        (left, right)
    }

    fn sample_ruleset() -> Ruleset {
        Ruleset {
            match_keys: vec!["invoice".to_string()],
            compare_keys: vec!["region".to_string()],
            tolerance_minor_units: 10,
            rounding_mode: RoundingMode::Exact,
            timezone: "UTC".to_string(),
            schema_version: SCHEMA_VERSION.to_string(),
        }
    }

    #[test]
    fn determinism_for_variance_report() {
        let (left, right) = sample_records();
        let ruleset = sample_ruleset();

        let report_a = compute_variances(left.clone(), right.clone(), ruleset.clone()).unwrap();
        let report_b = compute_variances(left, right, ruleset).unwrap();

        assert_eq!(report_a.summary_hash, report_b.summary_hash);
        assert_eq!(report_a.variances, report_b.variances);
    }

    #[test]
    fn manifest_hashes_are_stable() {
        let (left, right) = sample_records();
        let ruleset = sample_ruleset();
        let report = compute_variances(left.clone(), right.clone(), ruleset.clone()).unwrap();

        let manifest_a = compute_manifest(&left, &right, &ruleset, &report).unwrap();
        let manifest_b = compute_manifest(&left, &right, &ruleset, &report).unwrap();

        assert_eq!(manifest_a.ruleset_hash, manifest_b.ruleset_hash);
        assert_eq!(manifest_a.input_hashes, manifest_b.input_hashes);
        assert_eq!(manifest_a.output_hashes, manifest_b.output_hashes);
    }
}
