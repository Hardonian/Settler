use clap::Parser;
use settler_kernel::{EvidenceManifest, NamedFile};
use std::fs;
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "settler-verify",
    about = "Verify Settler evidence bundles locally."
)]
struct Cli {
    #[arg(long, value_name = "PATH")]
    bundle: PathBuf,
    #[arg(long, value_name = "PATH", default_value = "verification-report.json")]
    out: PathBuf,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let manifest_path = cli.bundle.join("manifest.json");
    let manifest_bytes = fs::read(&manifest_path)?;
    let manifest: EvidenceManifest = serde_json::from_slice(&manifest_bytes)?;

    let mut files = Vec::new();
    for entry in &manifest.files {
        let path = cli.bundle.join(&entry.path);
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
        std::process::exit(2);
    }

    println!("Verification succeeded");
    Ok(())
}
