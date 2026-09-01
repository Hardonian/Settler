# Governance

Settler is maintained by a core team of maintainers who review and approve changes.

## Decision Making

- **Minor changes** (bug fixes, docs updates, small improvements) are approved through standard pull request review by any maintainer.
- **Significant changes** (architecture, security model, breaking behavior, new engine primitives) require maintainer consensus. These are discussed in the PR or a linked GitHub issue before implementation.
- **If consensus cannot be reached**, the decision and dissenting views are documented in the pull request. The project lead (see [CODEOWNERS](CODEOWNERS)) makes the final call.
- **Significant architectural decisions** are recorded as Architecture Decision Records (ADRs) in [docs/ARCHITECTURE_DECISION_RECORDS.md](docs/ARCHITECTURE_DECISION_RECORDS.md).

## Roles

### Maintainers

Review and merge changes, set technical direction, manage releases, and triage issues. Maintainers are listed in [CODEOWNERS](CODEOWNERS).

### Contributors

Submit issues, pull requests, and documentation improvements. All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md) and the guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

### Becoming a Maintainer

Contributors may be invited to become maintainers based on:

- Sustained, high-quality contributions over 3+ months
- Demonstrated understanding of the security invariants and tenant isolation model
- Track record of thorough code reviews
- Alignment with the [MODEL_SPEC.md](MODEL_SPEC.md) operating doctrine

Maintainer nominations are discussed privately among existing maintainers and require consensus.

## Release Cadence

- **Patch releases:** As needed for bug fixes and security patches.
- **Minor releases:** Roughly monthly, containing new features and non-breaking improvements.
- **Major releases:** When breaking changes are necessary. Breaking changes are documented in [CHANGELOG.md](CHANGELOG.md) with migration guidance.

## Deprecation Policy

- Features are deprecated with at least one minor release of notice before removal.
- Deprecated features are marked in documentation and emit warnings where practical.
- Migration paths are documented for all breaking changes.

## Backwards Compatibility

- Public API endpoints, SDK interfaces, and evidence bundle formats are treated as stable within a major version.
- Internal implementation details (database schema, internal module structure) may change between minor releases.
- Configuration format changes include migration guidance.

## Communication

- **Code changes:** GitHub issues and pull requests
- **Design discussions:** GitHub Discussions (if enabled) or linked issues
- **Security:** Private reporting per [SECURITY.md](SECURITY.md)
- **General questions:** GitHub Discussions Q&A category

## Roadmap Visibility

The public roadmap is outlined in [docs/ROADMAP_90D.md](docs/ROADMAP_90D.md). Roadmap items are subject to change based on community feedback and project priorities. Features listed on the roadmap are not commitments — they represent current direction and intent.
