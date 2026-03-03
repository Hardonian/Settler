import type { MeterUsage } from "../economic/types";

export interface EvidenceBundle {
  run_id: string;
  created_at: string;
  tenant_id: string;
  policy_id: string;
  policy_hash: string;
  policy_version: string;
  engine_version: string;
  input_hash: string;
  config_hash: string;
  output_hash: string;
  run_fingerprint: string;
  metrics: MeterUsage;
  provenance: {
    hash_chain: string[];
    summary: string;
  };
  artifacts: {
    run: string;
    results: string;
    evidence: string;
    report: string;
  };
  metadata: {
    retention_days?: number;
    replay_required: boolean;
    evidence_level: "none" | "standard" | "full";
  };
}
