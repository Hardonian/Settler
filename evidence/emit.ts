import fs from "node:fs/promises";
import path from "node:path";
import type { EvidenceBundle } from "./types";

export async function emitEvidenceBundle(baseDir: string, bundle: EvidenceBundle): Promise<void> {
  await fs.mkdir(baseDir, { recursive: true });

  const evidencePath = path.join(baseDir, "evidence.json");
  await fs.writeFile(evidencePath, JSON.stringify(bundle, null, 2), "utf8");

  const reportPath = path.join(baseDir, "report.html");
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Settler Evidence Report</title><style>body{font-family:system-ui;padding:24px;max-width:900px;margin:auto}code{background:#f4f4f4;padding:2px 6px;border-radius:4px}</style></head><body><h1>Settler Evidence Report</h1><p><strong>Run Fingerprint:</strong> <code>${bundle.run_fingerprint}</code></p><ul><li>Tenant: ${bundle.tenant_id}</li><li>Policy: ${bundle.policy_id}@${bundle.policy_version}</li><li>Engine: ${bundle.engine_version}</li><li>Input Hash: <code>${bundle.input_hash}</code></li><li>Config Hash: <code>${bundle.config_hash}</code></li><li>Output Hash: <code>${bundle.output_hash}</code></li></ul><h2>Economic Metrics</h2><pre>${JSON.stringify(bundle.metrics, null, 2)}</pre><h2>Provenance Hash Chain</h2><pre>${JSON.stringify(bundle.provenance.hash_chain, null, 2)}</pre></body></html>`;
  await fs.writeFile(reportPath, html, "utf8");
}
