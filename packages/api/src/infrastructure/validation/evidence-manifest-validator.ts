import Ajv2020, { ErrorObject } from "ajv/dist/2020";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const EVIDENCE_MANIFEST_SCHEMA_PATH = resolve(
  join(__dirname, "..", "..", "..", "..", "contracts", "evidence-manifest.schema.json")
);

interface EvidenceManifestFile {
  path: string;
  sha256: string;
  role: string;
}

export interface EvidenceManifest {
  input_hashes: Record<string, string>;
  ruleset_hash: string;
  output_hashes: Record<string, string>;
  files: EvidenceManifestFile[];
  kernel_version: string;
  deterministic_statement: string;
  schema_version: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
}

let cachedValidator: ReturnType<typeof compileValidator> | null = null;

function compileValidator() {
  const schemaRaw = readFileSync(EVIDENCE_MANIFEST_SCHEMA_PATH, "utf-8");
  const schema = JSON.parse(schemaRaw);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function getValidator() {
  if (!cachedValidator) {
    cachedValidator = compileValidator();
  }
  return cachedValidator;
}

export function validateEvidenceManifest(data: unknown): ValidationResult {
  const validate = getValidator();
  const valid = validate(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors ?? []).map((err: ErrorObject) => ({
    path: err.instancePath || "/",
    message: err.message ?? "unknown validation error",
  }));

  return { valid: false, errors };
}

export function isValidEvidenceManifest(data: unknown): data is EvidenceManifest {
  return validateEvidenceManifest(data).valid;
}
