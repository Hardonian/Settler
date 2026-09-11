use settler_verify_wasm::verify_manifest;
use std::time::Instant;

fn main() {
    let manifest_json = r#"{
        "version": "1.0",
        "entries": [
            {"path": "runs/run_01/manifest.json", "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "bytes": 0},
            {"path": "runs/run_01/proofpack.stlr.json", "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "bytes": 0}
        ]
    }"#;

    let files_json = r#"[
        {"path": "runs/run_01/manifest.json", "bytes": []},
        {"path": "runs/run_01/proofpack.stlr.json", "bytes": []}
    ]"#;

    // Warmup
    for _ in 0..100 {
        let _ = verify_manifest(manifest_json, files_json);
    }

    // Measure 1,000 iterations
    let iterations = 1000;
    let start = Instant::now();
    for _ in 0..iterations {
        let res = verify_manifest(manifest_json, files_json);
        assert!(res.contains("\"success\":true"));
    }
    let elapsed = start.elapsed();
    let avg_micros = elapsed.as_micros() as f64 / iterations as f64;

    println!(
        "✅ Settler WASM Proof Verification: avg {:.2}µs per proof (Threshold < 500µs)",
        avg_micros
    );
    assert!(
        avg_micros < 500.0,
        "Performance regression: average proof verification took {:.2}µs (exceeds 500µs limit)",
        avg_micros
    );
}
