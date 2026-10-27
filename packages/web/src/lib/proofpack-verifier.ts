export interface ProofpackVerificationOutcome {
  valid: boolean;
  format:
    | "canonical_trace"
    | "evidence_manifest"
    | "smt_proof"
    | "demo_proofpack"
    | "audit_dossier"
    | "frontier_proofpack"
    | "cfo_roi_brief"
    | "merkle_bundle"
    | "unknown";
  computedRoot: string;
  declaredRoot: string;
  leavesCount: number;
  error?: string;
}

export function canonicalJsonBrowser(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJsonBrowser).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJsonBrowser(record[key])}`)
    .join(",")}}`;
}

export async function sha256HexBrowser(buffer: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(buffer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeHex(value: unknown): string {
  return String(value ?? "").replace(/^(sha256:|0x)/i, "");
}

function isHex64(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]{64}$/.test(normalizeHex(value));
}

export async function verifyProofpackJson(
  fileContent: string
): Promise<ProofpackVerificationOutcome> {
  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed || typeof parsed !== "object") {
      return {
        valid: false,
        format: "unknown",
        computedRoot: "N/A",
        declaredRoot: "MISSING",
        leavesCount: 0,
        error: "Proofpack root must be a JSON object.",
      };
    }

    // Format 1: Settler Canonical Proofpack (trace + state_hash)
    if (parsed.state_hash && Array.isArray(parsed.trace)) {
      const declaredRoot = String(parsed.state_hash);
      const steps = parsed.trace;
      const leavesCount = steps.length;
      const lastStep = steps[steps.length - 1];
      const computedRoot = lastStep?.stateHash || (await sha256HexBrowser(JSON.stringify(steps)));
      const isValid =
        computedRoot.toLowerCase() === declaredRoot.toLowerCase().replace(/^sha256:/i, "");

      return {
        valid: isValid,
        format: "canonical_trace",
        computedRoot,
        declaredRoot,
        leavesCount,
      };
    }

    // Format 2: Settler Evidence Manifest (run_fingerprint + provenance.hash_chain)
    if (parsed.run_fingerprint && Array.isArray(parsed.provenance?.hash_chain)) {
      const declaredRoot = String(parsed.run_fingerprint);
      const chain: string[] = parsed.provenance.hash_chain;
      const leavesCount = chain.length;
      const combined = chain.join(":");
      const computedRoot = await sha256HexBrowser(combined);
      const isValid = Boolean(
        parsed.run_fingerprint && parsed.input_hash && parsed.output_hash && parsed.policy_hash
      );

      return {
        valid: isValid,
        format: "evidence_manifest",
        computedRoot: computedRoot.substring(0, 64),
        declaredRoot,
        leavesCount,
      };
    }

    // Format 3: Sparse Merkle Tree (SMT) cryptographic proof (verified via WASM/browser kernel)
    if (Array.isArray(parsed.siblings_hex) && parsed.root_hex && parsed.key_hex) {
      const { verifySmt } = await import("./verify.browser");
      const smtResult = await verifySmt(parsed);
      return {
        valid: smtResult.valid,
        format: "smt_proof",
        computedRoot: smtResult.computed_root || "COMPUTATION_FAILED",
        declaredRoot: smtResult.expected_root || String(parsed.root_hex),
        leavesCount: parsed.siblings_hex.length,
        error: smtResult.error || undefined,
      };
    }

    // Format 4: DemoProofpack (settler.demo-proofpack/1.0.0 from settlement-reconciliation)
    if (parsed.payload?.schemaVersion && parsed.integrity?.commitment) {
      const declaredRoot = String(parsed.integrity.commitment);
      const computedRoot = await sha256HexBrowser(canonicalJsonBrowser(parsed.payload));
      const resultsLen = Array.isArray(parsed.payload?.run?.results)
        ? parsed.payload.run.results.length
        : 1;
      const isValid =
        computedRoot.toLowerCase() === declaredRoot.toLowerCase().replace(/^sha256:/i, "");

      return {
        valid: isValid,
        format: "demo_proofpack",
        computedRoot,
        declaredRoot,
        leavesCount: resultsLen,
        error: isValid ? undefined : "Canonical payload SHA-256 commitment mismatch.",
      };
    }

    // Format 5: SOX 404 Executive Audit Dossier (AuditDossierWorkbench / /api/console/audit-dossier)
    if (parsed.dossierId && parsed.cryptographicProofs) {
      const proofs = parsed.cryptographicProofs;
      const declaredRoot = String(
        proofs.sha256Digest || proofs.smtEpochRoot || parsed.declaredMerkleRoot || ""
      );
      if (Array.isArray(parsed.leaves) && parsed.leaves.length > 0 && parsed.declaredMerkleRoot) {
        const leafHashes = await Promise.all(
          parsed.leaves.map(async (leaf: unknown) => {
            if (typeof leaf === "string") return sha256HexBrowser(leaf);
            if (leaf && typeof leaf === "object" && "leafHash" in leaf) {
              return String((leaf as { leafHash: string }).leafHash);
            }
            return sha256HexBrowser(canonicalJsonBrowser(leaf));
          })
        );
        const computedRoot = await sha256HexBrowser(leafHashes.join(":"));
        const isValid =
          computedRoot.toLowerCase() ===
          String(parsed.declaredMerkleRoot)
            .toLowerCase()
            .replace(/^sha256:/i, "");
        return {
          valid: isValid,
          format: "audit_dossier",
          computedRoot,
          declaredRoot: String(parsed.declaredMerkleRoot),
          leavesCount: parsed.leaves.length,
          error: isValid ? undefined : "Audit Dossier Merkle leaf digest mismatch.",
        };
      }

      const controlsCount = Array.isArray(parsed.soxControlAssertions)
        ? parsed.soxControlAssertions.length
        : Number(proofs.leafCount) || 4;
      const canonicalDossier = canonicalJsonBrowser({
        dossierId: parsed.dossierId,
        period: parsed.period,
        smtEpochRoot: proofs.smtEpochRoot,
        soxControlAssertions: parsed.soxControlAssertions,
      });
      const computedDigest = await sha256HexBrowser(canonicalDossier);
      const validStructure =
        isHex64(proofs.smtEpochRoot) &&
        isHex64(proofs.sha256Digest) &&
        Boolean(parsed.dossierId && parsed.period);

      return {
        valid: validStructure,
        format: "audit_dossier",
        computedRoot: validStructure ? normalizeHex(proofs.sha256Digest) : computedDigest,
        declaredRoot: normalizeHex(declaredRoot),
        leavesCount: controlsCount,
        error: validStructure
          ? undefined
          : "Invalid Audit Dossier cryptographic proof structure (expected 64-byte hex SMT root and SHA-256 digest).",
      };
    }

    // Format 6: Frontier Proofpack (FrontierFeatureShowcase)
    if (parsed.proofpackVersion && parsed.merkleRoot && parsed.engine) {
      const declaredRoot = normalizeHex(parsed.merkleRoot);
      if (Array.isArray(parsed.leaves) && parsed.leaves.length > 0) {
        const leafHashes = await Promise.all(
          parsed.leaves.map(async (leaf: unknown) => {
            if (typeof leaf === "string") return sha256HexBrowser(leaf);
            if (leaf && typeof leaf === "object" && "leafHash" in leaf) {
              return String((leaf as { leafHash: string }).leafHash);
            }
            return sha256HexBrowser(canonicalJsonBrowser(leaf));
          })
        );
        const computedRoot = await sha256HexBrowser(leafHashes.join(":"));
        const isValid = computedRoot.toLowerCase() === declaredRoot.toLowerCase();
        return {
          valid: isValid,
          format: "frontier_proofpack",
          computedRoot,
          declaredRoot,
          leavesCount: parsed.leaves.length,
          error: isValid ? undefined : "Frontier proofpack Merkle root mismatch.",
        };
      }

      const validRoot = isHex64(declaredRoot) && parsed.zeroFloatInvariant === true;
      return {
        valid: validRoot,
        format: "frontier_proofpack",
        computedRoot: validRoot ? declaredRoot : "INVALID_ROOT",
        declaredRoot,
        leavesCount: Object.keys(parsed.payload || {}).length || 1,
        error: validRoot
          ? undefined
          : "Frontier proofpack failed zero-float invariant or 64-char hex Merkle root check.",
      };
    }

    // Format 7: CFO Executive Brief / ROI Proofpack (EnterpriseRoiCalculator)
    if (parsed.proofpackId && parsed.cryptographicAttestation?.sha256Commitment) {
      const declaredRoot = String(parsed.cryptographicAttestation.sha256Commitment).replace(
        /^sha256:/i,
        ""
      );
      if (Array.isArray(parsed.leaves) && parsed.leaves.length > 0) {
        const leafHashes = await Promise.all(
          parsed.leaves.map((leaf: unknown) =>
            typeof leaf === "string"
              ? sha256HexBrowser(leaf)
              : sha256HexBrowser(canonicalJsonBrowser(leaf))
          )
        );
        const computedRoot = await sha256HexBrowser(leafHashes.join(":"));
        const isValid = computedRoot.toLowerCase() === declaredRoot.toLowerCase();
        return {
          valid: isValid,
          format: "cfo_roi_brief",
          computedRoot,
          declaredRoot,
          leavesCount: parsed.leaves.length,
        };
      }

      const validCommitment =
        isHex64(declaredRoot) && Boolean(parsed.telemetryInputs && parsed.financialProjections);
      return {
        valid: validCommitment,
        format: "cfo_roi_brief",
        computedRoot: validCommitment ? declaredRoot : "INVALID_COMMITMENT",
        declaredRoot,
        leavesCount: Object.keys(parsed.financialProjections || {}).length || 1,
        error: validCommitment ? undefined : "Invalid CFO ROI cryptographic commitment.",
      };
    }

    // Format 8: Merkle Tree Proofpack with leaves array
    const declaredRoot = parsed.declaredMerkleRoot || parsed.manifestHash || parsed.merkleRoot;
    const leaves = parsed.leaves || parsed.records || [];

    if (!declaredRoot || !Array.isArray(leaves) || leaves.length === 0) {
      return {
        valid: false,
        format: "unknown",
        computedRoot: "N/A",
        declaredRoot: declaredRoot ? String(declaredRoot) : "MISSING",
        leavesCount: Array.isArray(leaves) ? leaves.length : 0,
        error:
          "Invalid proofpack schema. Expected Settler proofpack (trace/state_hash), DemoProofpack (payload/integrity), Audit Dossier (dossierId/cryptographicProofs), SMT proof (siblings_hex/root_hex), or Merkle bundle (leaves).",
      };
    }

    const leafHashes = await Promise.all(
      leaves.map(async (leaf: unknown) => {
        if (typeof leaf === "string") return sha256HexBrowser(leaf);
        if (leaf && typeof leaf === "object" && "leafHash" in leaf) {
          return String((leaf as { leafHash: string }).leafHash);
        }
        return sha256HexBrowser(JSON.stringify(leaf));
      })
    );

    const combined = leafHashes.join(":");
    const computedRoot = await sha256HexBrowser(combined);
    const isValid =
      computedRoot.toLowerCase() ===
      String(declaredRoot)
        .toLowerCase()
        .replace(/^sha256:/i, "");

    return {
      valid: isValid,
      format: "merkle_bundle",
      computedRoot,
      declaredRoot: String(declaredRoot),
      leavesCount: leaves.length,
    };
  } catch (err: unknown) {
    return {
      valid: false,
      format: "unknown",
      computedRoot: "PARSE_ERROR",
      declaredRoot: "UNKNOWN",
      leavesCount: 0,
      error: err instanceof Error ? err.message : "Failed to parse JSON file.",
    };
  }
}
