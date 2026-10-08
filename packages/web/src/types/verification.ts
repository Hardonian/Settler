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

export type SmtProof = {
  key_hex: string;
  value_hex?: string | null;
  siblings_hex: string[];
  root_hex: string;
  is_inclusion: boolean;
};

export type SmtVerificationResult = {
  valid: boolean;
  computed_root: string;
  expected_root: string;
  is_non_inclusion: boolean;
  error?: string | null;
};
