export type NamedFile = {
  path: string;
  bytes: number[];
};

export type EvidenceManifest = {
  input_hashes: Record<string, string>;
  ruleset_hash: string;
  output_hashes: Record<string, string>;
  files: { path: string; sha256: string; role: string }[];
  kernel_version: string;
  deterministic_statement: string;
  schema_version: string;
};

export type VerificationMismatch = {
  path: string;
  expected?: string | null;
  actual?: string | null;
  reason: string;
};

export type VerificationResult = {
  success: boolean;
  mismatches: VerificationMismatch[];
};
