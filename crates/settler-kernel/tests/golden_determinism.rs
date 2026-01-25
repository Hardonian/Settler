use pretty_assertions::assert_eq;
use settler_kernel::{
    compute_manifest, compute_variances, NormalizedRecord, RoundingMode, Ruleset, SCHEMA_VERSION,
};
use std::collections::BTreeMap;

fn sample_records() -> (Vec<NormalizedRecord>, Vec<NormalizedRecord>) {
    let left = vec![
        NormalizedRecord {
            record_id: "left-2".to_string(),
            source: "ledger-a".to_string(),
            timestamp: "2024-01-02T00:00:00Z".to_string(),
            amount_minor_units: 2000,
            currency: "USD".to_string(),
            attributes: BTreeMap::from([("invoice".to_string(), "INV-2".to_string())]),
            schema_version: SCHEMA_VERSION.to_string(),
        },
        NormalizedRecord {
            record_id: "left-1".to_string(),
            source: "ledger-a".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
            amount_minor_units: 1000,
            currency: "USD".to_string(),
            attributes: BTreeMap::from([("invoice".to_string(), "INV-1".to_string())]),
            schema_version: SCHEMA_VERSION.to_string(),
        },
    ];

    let right = vec![NormalizedRecord {
        record_id: "right-1".to_string(),
        source: "ledger-b".to_string(),
        timestamp: "2024-01-01T00:00:00Z".to_string(),
        amount_minor_units: 1015,
        currency: "USD".to_string(),
        attributes: BTreeMap::from([("invoice".to_string(), "INV-1".to_string())]),
        schema_version: SCHEMA_VERSION.to_string(),
    }];

    (left, right)
}

fn sample_ruleset() -> Ruleset {
    Ruleset {
        match_keys: vec!["invoice".to_string()],
        compare_keys: Vec::new(),
        tolerance_minor_units: 5,
        rounding_mode: RoundingMode::Exact,
        timezone: "UTC".to_string(),
        schema_version: SCHEMA_VERSION.to_string(),
    }
}

#[test]
fn outputs_are_deterministic() {
    let (left, right) = sample_records();
    let ruleset = sample_ruleset();

    let report = compute_variances(left.clone(), right.clone(), ruleset.clone()).unwrap();
    let manifest = compute_manifest(&left, &right, &ruleset, &report).unwrap();

    let report_again = compute_variances(left.clone(), right.clone(), ruleset.clone()).unwrap();
    let manifest_again = compute_manifest(&left, &right, &ruleset, &report_again).unwrap();

    assert_eq!(report.summary_hash, report_again.summary_hash);
    assert_eq!(manifest.ruleset_hash, manifest_again.ruleset_hash);
    assert_eq!(manifest.output_hashes, manifest_again.output_hashes);
}
