use serde::Serialize;
use settler_kernel::{EvidenceManifest, NamedFile, VerificationMismatch, VerificationResult};
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
struct WasmVerificationResult {
    success: bool,
    mismatches: Vec<VerificationMismatch>,
    error: Option<String>,
}

#[wasm_bindgen]
pub fn verify_manifest(manifest_json: &str, files_json: &str) -> String {
    let parsed = parse_inputs(manifest_json, files_json);
    let (result, error_message) = match parsed {
        Ok((manifest, files)) => (settler_kernel::verify_manifest(&manifest, &files), None),
        Err(error) => (
            VerificationResult {
                success: false,
                mismatches: Vec::new(),
            },
            Some(error.to_string()),
        ),
    };

    let response = WasmVerificationResult {
        success: result.success,
        mismatches: result.mismatches,
        error: error_message,
    };

    serde_json::to_string(&response).unwrap_or_else(|_| {
        "{\"success\":false,\"mismatches\":[],\"error\":\"serialization_failed\"}".to_string()
    })
}

fn parse_inputs(
    manifest_json: &str,
    files_json: &str,
) -> Result<(EvidenceManifest, Vec<NamedFile>), serde_json::Error> {
    let manifest: EvidenceManifest = serde_json::from_str(manifest_json)?;
    let files: Vec<NamedFile> = serde_json::from_str(files_json)?;
    Ok((manifest, files))
}

#[wasm_bindgen]
pub fn verify_smt(proof_json: &str) -> String {
    let parsed: Result<settler_kernel::SmtProof, serde_json::Error> =
        serde_json::from_str(proof_json);
    let result = match parsed {
        Ok(proof) => settler_kernel::verify_smt_proof(&proof),
        Err(err) => settler_kernel::SmtVerificationResult {
            valid: false,
            computed_root: String::new(),
            expected_root: String::new(),
            is_non_inclusion: false,
            error: Some(format!("Invalid proof JSON: {err}")),
        },
    };

    serde_json::to_string(&result).unwrap_or_else(|_| {
        "{\"valid\":false,\"computed_root\":\"\",\"expected_root\":\"\",\"is_non_inclusion\":false,\"error\":\"serialization_failed\"}".to_string()
    })
}
