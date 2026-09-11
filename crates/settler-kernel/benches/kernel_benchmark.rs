use settler_kernel::EvidenceManifest;
use std::time::Instant;

fn main() {
    let manifest_json = r#"{
        "version": "1.0",
        "entries": [
            {"path": "runs/run_01/manifest.json", "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "bytes": 0}
        ]
    }"#;

    let iterations = 10_000;
    let start = Instant::now();

    for _ in 0..iterations {
        let manifest: Result<EvidenceManifest, _> = serde_json::from_str(manifest_json);
        assert!(manifest.is_ok());
    }

    let elapsed = start.elapsed();
    let nanos_per_op = elapsed.as_nanos() as f64 / iterations as f64;
    println!(
        "✅ Settler Kernel Allocation & Deserialization: {:.2}ns per manifest parse",
        nanos_per_op
    );
    assert!(
        nanos_per_op < 50_000.0,
        "Kernel benchmark regression: {:.2}ns exceeds 50µs ceiling",
        nanos_per_op
    );
}
