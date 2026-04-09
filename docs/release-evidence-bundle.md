# Release Evidence Bundle

## What It Is

The release evidence bundle is a directory of machine-readable artifacts and a
signed provenance manifest that together record the security verification state
of a specific commit at the time it was built in CI.

The bundle is produced by `pnpm run generate-release-bundle` and verified by
`pnpm run verify-release-bundle`. In CI it is signed using GitHub artifact
attestation (Sigstore OIDC), which creates a tamper-evident link between the
bundle archive, the GitHub Actions run, and the commit SHA.

---

## Bundle Location

```
security/release-bundle/
  manifest.json              # Provenance manifest (schema v1.0)
  checksums.txt              # SHA256 of every file (sha256sum-compatible)
  build-metadata.json        # Build environment (Node, pnpm, platform, CI env)
  verification-results.json  # Aggregated verification outcomes
  security-summary.md        # Human-readable evidence summary
  route-registry.json        # API route inventory (228 routes as of last run)
  tenant-coverage.json       # Tenant isolation coverage report
  cross-tenant-results.json  # Cross-tenant runtime test results
  header-probe.json          # Security header verification results
  dependency-audit.json      # Dependency audit results
```

The bundle directory is committed to the repository at a snapshot-in-time
state. The authoritative artifacts for any release are the ones uploaded as CI
artifacts by the `Release Provenance` workflow, not the directory in the repo.

---

## What the Bundle Proves

The following guarantees hold when the bundle was produced by an unmodified CI
run with `completeness: complete`:

1. **Commit linkage.** `manifest.json` records the full SHA of the commit that
   triggered the pipeline. This is captured from `git rev-parse HEAD` at bundle
   generation time, not from a user-supplied variable.

2. **CI origin.** The signed tar archive produced by the `Release Provenance`
   workflow includes a Sigstore-backed attestation that cryptographically binds
   the artifact to the GitHub Actions run ID and the OIDC token issued to that
   run. External reviewers can verify this with:

   ```
   gh attestation verify release-evidence-bundle-<sha>.tar.gz --repo <owner>/<repo>
   ```

3. **Route surface.** `route-registry.json` was produced by static filesystem
   discovery of all Next.js API routes at that commit. It represents the actual
   routes present in the codebase, not a manually curated list.

4. **Tenant isolation coverage.** `tenant-coverage.json` records which routes
   passed static analysis for the presence of at least one recognised isolation
   control token. Coverage must be 100% (for non-exempt routes) for the bundle
   to be `complete`.

5. **Cross-tenant runtime tests.** `cross-tenant-results.json` records the exit
   code of the cross-tenant isolation test suite. A `status: passed` result
   means all tests in the suite exited zero.

6. **Checksum integrity.** `checksums.txt` lists a SHA256 for every file in the
   bundle. `manifest.json` duplicates these checksums in a structured format.
   `pnpm run verify-release-bundle` recomputes and compares all hashes before
   reporting success.

7. **Degraded-mode transparency.** If any check ran in degraded mode (e.g.
   header probe skipped because no built application was available,
   `pnpm audit` backend unreachable), the bundle records this explicitly in
   `manifest.json` (`degradedChecks`, `completeness: partial`). A partial
   bundle is not suppressed — it is recorded and flagged.

---

## What the Bundle Does Not Prove

The following claims are **not** supported by the bundle. Any interpretation
that extends beyond this list is not warranted by the artifact.

1. **Not a penetration test.** No active exploitation was attempted. The bundle
   does not prove that tenant isolation is correctly enforced at runtime for all
   possible inputs — only that recognized isolation token patterns were present
   at static analysis time and that a specific set of fixture tests passed.

2. **Not a full DAST scan.** Header probe covers only non-parameterized static
   API routes reachable via GET without authentication. Authenticated flows,
   parameterized routes, edge functions, and WebSocket endpoints are outside the
   scope of the header probe included in the bundle.

3. **Not a complete CVE audit.** If the dependency audit ran in degraded mode
   (`backend-unavailable` or `osv-scanner-missing`), the absence of findings in
   `dependency-audit.json` does not mean the dependency tree is vulnerability-free.
   It means the audit tooling could not reach its data source during that run. CI
   with network access to the npm advisory registry is authoritative.

4. **Not a database security proof.** Row-Level Security policies are
   documented in `SECURITY_INVARIANTS.md` but are only verified by
   `RUN_DB_TESTS=true` integration tests against a live database. The bundle
   does not include or prove RLS enforcement.

5. **Not a proof of correct secret management.** The bundle records that
   Gitleaks and TruffleHog ran (via `security.yml`), but does not embed their
   full output. A clean scan in CI does not rule out secrets introduced after
   the scan ran or stored outside the repository.

6. **Local bundles are not signed.** Bundles generated with
   `pnpm run generate-release-bundle` outside of CI are not attested. They have
   `ci.runId: null` in `manifest.json`. Only bundles produced by the
   `Release Provenance` GitHub Actions workflow carry a Sigstore attestation.

7. **Attestation proves CI origin, not code correctness.** The Sigstore
   attestation proves that a specific file was produced by a specific GitHub
   Actions run. It does not prove that the code in that run is secure, correct,
   or free of vulnerabilities.

---

## Verifying a Bundle

### Local verification (checksums only)

```bash
pnpm run verify-release-bundle
```

This recomputes SHA256 for every file in `security/release-bundle/`,
cross-checks against `checksums.txt` and `manifest.json`, verifies required
fields, and reports pass/fail for each artifact.

To also fail on partial completeness:

```bash
pnpm exec tsx scripts/verify-release-bundle.ts --strict
```

### External verification (CI provenance attestation)

Download the signed archive from the CI run (GitHub Actions → Artifacts) and
verify with the GitHub CLI:

```bash
gh attestation verify release-evidence-bundle-<commit-sha>.tar.gz \
  --repo <owner>/<repo>
```

This confirms:

- The archive was produced by the named repository's GitHub Actions
- The attestation is signed by Sigstore using the OIDC identity of the CI job
- The content has not been modified since signing

### Manual checksum verification

```bash
cd security/release-bundle
sha256sum -c checksums.txt
```

This verifies every non-checksum file using the standard GNU sha256sum format.

---

## How the Bundle Is Generated

1. `pnpm run security:evidence` runs the security pipeline and writes artifacts
   to `security/evidence/`.
2. `pnpm run generate-release-bundle` copies those artifacts to
   `security/release-bundle/`, generates `build-metadata.json`,
   `verification-results.json`, `manifest.json`, and `checksums.txt`.
3. In CI, the `Release Provenance` workflow packages the bundle into a tar
   archive and passes it to `actions/attest-build-provenance`, which signs it
   using the Sigstore OIDC token issued to the job.
4. The signed archive and the expanded bundle directory are both uploaded as
   GitHub Actions artifacts with 90-day retention.

---

## Manifest Schema Reference

`manifest.json` fields:

| Field                     | Type                          | Description                                              |
| ------------------------- | ----------------------------- | -------------------------------------------------------- |
| `schemaVersion`           | `"1.0"`                       | Schema version for forward compatibility                 |
| `bundleType`              | `"release-evidence"`          | Always `release-evidence`                                |
| `generatedAt`             | ISO 8601                      | When the bundle was generated                            |
| `git.commitSha`           | string                        | Full SHA of the HEAD commit                              |
| `git.branch`              | string                        | Branch name at time of generation                        |
| `git.tag`                 | string \| null                | Tag if triggered on a tag push                           |
| `git.ref`                 | string                        | Full git ref                                             |
| `ci.runId`                | string \| null                | GitHub Actions run ID (`null` if local)                  |
| `ci.runUrl`               | string \| null                | Direct URL to the Actions run                            |
| `ci.workflowName`         | string \| null                | Workflow that produced this bundle                       |
| `ci.actor`                | string \| null                | GitHub actor that triggered the run                      |
| `ci.repository`           | string \| null                | `owner/repo`                                             |
| `environment.nodeVersion` | string                        | Node.js version used                                     |
| `environment.pnpmVersion` | string                        | pnpm version used                                        |
| `policy.auditMode`        | `strict` \| `warn` \| `off`   | Dependency audit policy                                  |
| `completeness`            | `complete` \| `partial`       | Whether all checks ran without degradation               |
| `overallStatus`           | `pass` \| `partial` \| `fail` | Aggregate verification outcome                           |
| `degradedChecks`          | object                        | Per-check degraded flags                                 |
| `artifacts`               | array                         | List of artifact files with source, presence, and SHA256 |
| `checksumAlgorithm`       | `"sha256"`                    | Hash algorithm used                                      |
| `checksums`               | object                        | `filename → sha256` map for all bundle files             |

---

## Completeness States

| State      | Meaning                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `complete` | All required artifacts present; no check ran in degraded mode                                                       |
| `partial`  | One or more checks ran in degraded mode (e.g. audit backend unavailable, header probe skipped due to missing build) |

A `partial` bundle is not a failure — it is a faithful record of what was
verifiable in the environment where the pipeline ran. The `degradedChecks` map
identifies which specific checks were affected.

`BUNDLE_REQUIRE_COMPLETE=1` can be set to make `generate-release-bundle` exit
non-zero on a partial bundle. The `Release Provenance` workflow exposes this as
a workflow input (`require_complete`).

---

## Adding New Artifacts

To include a new security artifact in future bundles:

1. Ensure the artifact is written to `security/evidence/<name>.json` by the
   security pipeline.
2. Add an `collectArtifact(...)` call in `scripts/generate-release-bundle.ts`.
3. Update the `aggregateVerificationResults` function if the artifact affects
   the `overallStatus` or `degradedChecks` logic.
4. Update this document to describe what the new artifact proves.

Do not add artifacts that cannot be produced deterministically from the
repository source — such artifacts would undermine the bundle's lineage claim.
