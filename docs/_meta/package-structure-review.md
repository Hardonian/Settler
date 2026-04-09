# Package Structure Review

Date: 2026-03-11

## Monorepo posture

`package.json` defines workspaces under `packages/*` with explicit exclusions for language SDK/workhorse packages.

## Findings

- Workspace structure is coherent for a multi-surface platform (web/api/cli + supporting packages).
- Excluded workspaces (`sdk-go`, `sdk-python`, `sdk-ruby`, `workhorse`) are intentional but should be documented in package-level READMEs if retained in-tree.

## Flags

- Potentially abandoned/parked packages should be marked with status (active/experimental/archived) to reduce contributor ambiguity.

## Actions taken

- No package boundary refactors in this pass (risk-managed).
