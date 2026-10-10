use clap::Parser;
use settler_kernel::{EvidenceManifest, NamedFile, SmtProof};
use std::fs;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(
    name = "settler-verify",
    about = "Verify Settler proof artifacts and Sparse Merkle Tree (SMT) proofs locally."
)]
pub struct Cli {
    #[arg(long, value_name = "PATH")]
    pub bundle: Option<PathBuf>,
    #[arg(long, value_name = "PATH")]
    pub smt: Option<PathBuf>,
    #[arg(long, value_name = "PATH", default_value = "verification-report.json")]
    pub out: PathBuf,
}

pub fn run_cli(cli: Cli) -> Result<bool, Box<dyn std::error::Error>> {
    if let Some(smt_path) = cli.smt {
        let proof_bytes = fs::read(&smt_path)?;
        let proof: SmtProof = serde_json::from_slice(&proof_bytes)?;
        let result = settler_kernel::verify_smt_proof(&proof);
        let output = serde_json::to_vec_pretty(&result)?;
        fs::write(&cli.out, output)?;

        if !result.valid {
            eprintln!("SMT verification failed: {:?}", result.error);
            return Ok(false);
        }

        println!(
            "SMT verification succeeded (computed root: {})",
            result.computed_root
        );
        return Ok(true);
    }

    let bundle_path = match cli.bundle {
        Some(b) => b,
        None => {
            eprintln!("Error: either --bundle <PATH> or --smt <PATH> must be specified.");
            return Ok(false);
        }
    };

    let manifest_path = bundle_path.join("manifest.json");
    let manifest_bytes = fs::read(&manifest_path)?;
    let manifest: EvidenceManifest = serde_json::from_slice(&manifest_bytes)?;

    let mut files = Vec::new();
    for entry in &manifest.files {
        let path = bundle_path.join(&entry.path);
        let bytes = fs::read(&path)?;
        files.push(NamedFile {
            path: entry.path.clone(),
            bytes,
        });
    }

    let result = settler_kernel::verify_manifest(&manifest, &files);
    let output = serde_json::to_vec_pretty(&result)?;
    fs::write(&cli.out, output)?;

    if !result.success {
        eprintln!(
            "Verification failed with {} mismatches",
            result.mismatches.len()
        );
        return Ok(false);
    }

    println!("Verification succeeded");
    Ok(true)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    match run_cli(cli)? {
        true => Ok(()),
        false => std::process::exit(2),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use settler_kernel::{ManifestFile, SparseMerkleTree};
    use sha2::{Digest, Sha256};
    use std::collections::BTreeMap;

    #[test]
    fn test_cli_manifest_verification_success() {
        let temp_dir = tempfile::tempdir().unwrap();
        let file_path = temp_dir.path().join("data.json");
        let content = b"{\"transaction_id\":\"tx_01\",\"amount\":1000}";
        fs::write(&file_path, content).unwrap();

        let mut hasher = Sha256::new();
        hasher.update(content);
        let hash = hex::encode(hasher.finalize());

        let manifest = EvidenceManifest {
            input_hashes: BTreeMap::new(),
            ruleset_hash: "rule-123".to_string(),
            output_hashes: BTreeMap::new(),
            files: vec![ManifestFile {
                path: "data.json".to_string(),
                sha256: hash,
                role: "input".to_string(),
            }],
            kernel_version: "1.6.0".to_string(),
            deterministic_statement: "deterministic".to_string(),
            schema_version: "v1".to_string(),
        };

        let manifest_path = temp_dir.path().join("manifest.json");
        fs::write(&manifest_path, serde_json::to_vec(&manifest).unwrap()).unwrap();

        let report_path = temp_dir.path().join("report.json");
        let cli = Cli {
            bundle: Some(temp_dir.path().to_path_buf()),
            smt: None,
            out: report_path.clone(),
        };

        let result = run_cli(cli).unwrap();
        assert!(result, "Verification must succeed");
        assert!(report_path.exists());
    }

    #[test]
    fn test_cli_manifest_verification_tamper_detected() {
        let temp_dir = tempfile::tempdir().unwrap();
        let file_path = temp_dir.path().join("data.json");
        fs::write(
            &file_path,
            b"{\"transaction_id\":\"tx_01\",\"amount\":9999999}",
        )
        .unwrap();

        let manifest = EvidenceManifest {
            input_hashes: BTreeMap::new(),
            ruleset_hash: "rule-123".to_string(),
            output_hashes: BTreeMap::new(),
            files: vec![ManifestFile {
                path: "data.json".to_string(),
                sha256: "0000000000000000000000000000000000000000000000000000000000000000"
                    .to_string(),
                role: "input".to_string(),
            }],
            kernel_version: "1.6.0".to_string(),
            deterministic_statement: "deterministic".to_string(),
            schema_version: "v1".to_string(),
        };

        let manifest_path = temp_dir.path().join("manifest.json");
        fs::write(&manifest_path, serde_json::to_vec(&manifest).unwrap()).unwrap();

        let report_path = temp_dir.path().join("report.json");
        let cli = Cli {
            bundle: Some(temp_dir.path().to_path_buf()),
            smt: None,
            out: report_path.clone(),
        };

        let result = run_cli(cli).unwrap();
        assert!(!result, "Verification must fail on tampered file");
    }

    #[test]
    fn test_cli_smt_inclusion_verification() {
        let mut tree = SparseMerkleTree::new();
        let key = Sha256::digest(b"tx_settlement_2026").into();
        let val = Sha256::digest(b"amount_cents=100000:status=settled").into();
        tree.update(&key, &val);

        let proof = tree.prove_inclusion(&key).unwrap();
        let temp_dir = tempfile::tempdir().unwrap();
        let proof_path = temp_dir.path().join("smt_proof.json");
        fs::write(&proof_path, serde_json::to_vec_pretty(&proof).unwrap()).unwrap();

        let report_path = temp_dir.path().join("report.json");
        let cli = Cli {
            bundle: None,
            smt: Some(proof_path),
            out: report_path.clone(),
        };

        let result = run_cli(cli).unwrap();
        assert!(result, "SMT inclusion proof must verify");
        assert!(report_path.exists());
    }

    #[test]
    fn test_cli_smt_non_inclusion_verification() {
        let mut tree = SparseMerkleTree::new();
        let key_a = Sha256::digest(b"tx_settlement_2026").into();
        let val_a = Sha256::digest(b"amount_cents=100000:status=settled").into();
        tree.update(&key_a, &val_a);

        let missing_key = Sha256::digest(b"tx_non_existent").into();
        let proof = tree.prove_non_inclusion(&missing_key).unwrap();

        let temp_dir = tempfile::tempdir().unwrap();
        let proof_path = temp_dir.path().join("smt_proof.json");
        fs::write(&proof_path, serde_json::to_vec_pretty(&proof).unwrap()).unwrap();

        let report_path = temp_dir.path().join("report.json");
        let cli = Cli {
            bundle: None,
            smt: Some(proof_path),
            out: report_path.clone(),
        };

        let result = run_cli(cli).unwrap();
        assert!(result, "SMT non-inclusion proof must verify");
        assert!(report_path.exists());
    }
}
