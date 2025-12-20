# Archive Index

**Last Updated:** January 2026  
**Purpose:** This document catalogs all archived content and explains why it was moved from the repository root or active documentation.

---

## Archive Structure

```
/archive/
├── completion-reports/     # Feature completion summaries
├── internal-notes/         # Internal development notes
├── setup-guides/          # Redundant or superseded setup guides
├── db-migrations/         # Historical/unused database migrations
├── build-outputs/         # Build output logs and artifacts
├── yaml-configs/         # YAML configuration files (experiments, snapshots)
├── audit-reports/        # Audit and review reports
├── implementation-reports/ # Implementation completion reports
└── ARCHIVE_INDEX.md       # This file
```

---

## Completion Reports (`/archive/completion-reports/`)

These documents were completion summaries for specific features or initiatives. They are preserved for historical reference but are not needed in the active repository root.

### Files Archived

1. **`AI_PRICING_IMPLEMENTATION_COMPLETE.md`**
   - **Reason:** Feature completion report
   - **Status:** Historical reference
   - **Relevant To:** AI pricing feature implementation (Jan 2025)

2. **`PRODUCTION_HARDENING_COMPLETE.md`**
   - **Reason:** Production hardening completion summary
   - **Status:** Historical reference
   - **Relevant To:** Production readiness initiative (Jan 2024)

3. **`FINAL_POLISH_SUMMARY.md`**
   - **Reason:** Final polish completion summary
   - **Status:** Historical reference
   - **Relevant To:** Repository polish initiative

4. **`INTEGRATION_COMPLETE.md`**
   - **Reason:** Integration completion report
   - **Status:** Historical reference
   - **Relevant To:** Integration work completion

5. **`VALIDATION_REPORT.md`**
   - **Reason:** Validation completion report
   - **Status:** Historical reference
   - **Relevant To:** Validation work completion

6. **`DOCUMENTATION_CLEANUP_REPORT.md`**
   - **Reason:** Documentation cleanup completion report
   - **Status:** Historical reference
   - **Relevant To:** Documentation cleanup initiative

7. **`E2E_DATABASE_OPTIMIZATION_SUMMARY.md`**
   - **Reason:** Database optimization completion summary
   - **Status:** Historical reference
   - **Relevant To:** Database optimization work

8. **`CONSOLE_MIGRATION_SUMMARY.md`**
   - **Reason:** Console migration completion summary
   - **Status:** Historical reference
   - **Relevant To:** Console migration work

**Note:** These reports may contain useful historical context but are not needed for day-to-day development or external stakeholders.

---

## Internal Notes (`/archive/internal-notes/`)

These are internal development notes and reminders that were in the repository root. They are preserved for reference but do not belong in the active documentation.

### Files Archived

1. **`PUSH_AND_MERGE.md`**
   - **Reason:** Internal deployment reminder
   - **Status:** Historical reference
   - **Action:** Superseded by CI/CD automation

2. **`REDEPLOY_NOW.md`**
   - **Reason:** Internal deployment reminder
   - **Status:** Historical reference
   - **Action:** Superseded by CI/CD automation

3. **`OPEN_CORE_READY_TO_MERGE.md`**
   - **Reason:** Internal merge readiness note
   - **Status:** Historical reference
   - **Action:** Merge completed

4. **`SUPABASE_AI_VERIFICATION_PROMPT.md`**
   - **Reason:** Internal verification prompt/note
   - **Status:** Historical reference
   - **Action:** Verification completed

**Note:** These notes were temporary reminders and are no longer relevant for active development.

---

## Setup Guides (`/archive/setup-guides/`)

These setup guides were redundant or have been superseded by consolidated documentation in `/docs`.

### Files Archived

1. **`QUICK_START_GUIDE.md`**
   - **Reason:** Redundant with `/docs/GETTING_STARTED.md`
   - **Status:** Superseded
   - **Action:** Content consolidated into `/docs/GETTING_STARTED.md`

2. **`SETUP_GUIDE.md`**
   - **Reason:** Redundant with `/docs/GETTING_STARTED.md`
   - **Status:** Superseded
   - **Action:** Content consolidated into `/docs/GETTING_STARTED.md`

3. **`APPLY_MIGRATIONS_INSTRUCTIONS.md`**
   - **Reason:** Redundant with `/docs/DEPLOYMENT.md`
   - **Status:** Superseded
   - **Action:** Content consolidated into `/docs/DEPLOYMENT.md`

4. **`STRIPE_WEBHOOK_SETUP_GUIDE.md`**
   - **Reason:** Redundant with `/docs/INTEGRATION.md` or `/docs/CONFIGURATION.md`
   - **Status:** Superseded
   - **Action:** Content consolidated into integration documentation

5. **`repo-structure.md`**
   - **Reason:** Redundant with `/docs/ARCHITECTURE.md`
   - **Status:** Superseded
   - **Action:** Content consolidated into architecture documentation

**Note:** If you need information from these guides, check the consolidated documentation in `/docs`.

---

## Database Migrations (`/archive/db-migrations/`)

Historical or unused database migrations are preserved here for reference but are not part of the active migration path.

### Status

- **Active Migrations:** Located in `/supabase/migrations/`
- **Archived Migrations:** To be moved here if identified as unused/historical

**Note:** Only migrations that are confirmed unused or superseded should be archived. Active migrations remain in `/supabase/migrations/`.

---

## Archive Policy

### What Gets Archived

1. **Completion Reports:** Feature completion summaries after feature is stable
2. **Internal Notes:** Temporary reminders, deployment notes, merge readiness notes
3. **Redundant Guides:** Superseded setup guides after consolidation
4. **Historical Migrations:** Unused or superseded database migrations

### What Does NOT Get Archived

1. **Active Documentation:** Current guides, architecture docs, API references
2. **Legal Documents:** Terms, privacy policy, licenses (remain in `/LEGAL`)
3. **Security Documentation:** Security policies, threat models (remain in root or `/docs`)
4. **Build Configuration:** CI/CD configs, package.json, etc. (remain in root)
5. **Active Migrations:** Current database migrations (remain in `/supabase/migrations/`)

### Archive Maintenance

- **Review Frequency:** Quarterly
- **Retention:** Indefinite (for historical reference)
- **Access:** Public (archived content is still accessible)
- **Restoration:** If archived content is needed, it can be moved back to active location

---

## Finding Archived Content

If you're looking for information that was previously in the root:

1. **Completion Reports:** Check `/archive/completion-reports/`
2. **Setup Guides:** Check `/docs/GETTING_STARTED.md` or `/docs/DEPLOYMENT.md` (consolidated)
3. **Internal Notes:** Check `/archive/internal-notes/` (historical reference only)
4. **Architecture Info:** Check `/docs/ARCHITECTURE.md` (consolidated)

---

## Questions?

If you need to find archived content or have questions about the archive structure, check:
- `/docs/README.md` - Documentation index
- `/REPO_AUDIT_REPORT.md` - Repository audit report with archive rationale

---

## January 2026 Archive (Enterprise Polish)

### Root-Level Cleanup

As part of enterprise repository polish, the following categories of files were moved from root to archive:

#### Completion Reports (`/archive/completion-reports/`)
- All `*_COMPLETE*.md`, `*_SUMMARY*.md`, `*_REPORT*.md` files
- Implementation reports, build fix reports, audit reports
- Examples: `FINAL_COMPLETE_SUMMARY.md`, `OPERATIONAL_EXCELLENCE_SUMMARY.md`, `BUILD_OPTIMIZATION_COMPLETE.md`

#### Internal Notes (`/archive/internal-notes/`)
- Temporary notes, reminders, deployment checklists
- Examples: `NOTES.md`, `QUICK_*.md`, `READY_TO_*.md`, `PR_READY.md`

#### Setup Guides (`/archive/setup-guides/`)
- Redundant setup guides superseded by consolidated docs
- Migration guides, OSS setup guides
- Examples: `APPLY_MIGRATIONS_GUIDE.md`, `OSS_REPO_SETUP_COMPLETE.md`

#### Build Outputs (`/archive/build-outputs/`)
- Build log files: `build-output*.txt`, `FINAL_SUMMARY.txt`

#### YAML Configs (`/archive/yaml-configs/`)
- Internal configuration files: `experiments.yaml`, `investor-narrative.yaml`, `pitch-assets.yaml`, `settler-context-snapshot.yaml`

#### Audit Reports (`/archive/audit-reports/`)
- Audit phase reports: `SETTLER_AUDIT_PHASE*.md`

#### Implementation Reports (`/archive/implementation-reports/`)
- Feature implementation summaries: `*_IMPLEMENTATION*.md`

### Files Kept in Root

The following files remain in root as they are essential for repository operation:
- `README.md` - Main entry point
- `LICENSE` - License file
- `SECURITY.md` - Security policy
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history
- `REPO_POLICY.md` - Open-core architecture policy

### Files Moved to `/docs/`

The following files were moved to `/docs/` for better organization:
- `ARCHITECTURE.md` → `/docs/ARCHITECTURE.md`
- `DEVELOPER_GUIDE.md` → `/docs/DEVELOPER_GUIDE.md`
- `DOCUMENTATION_INDEX.md` → `/docs/DOCUMENTATION_INDEX.md`
- `OPERATIONS_RUNBOOK.md` → `/docs/OPERATIONS_RUNBOOK.md`
- `TROUBLESHOOTING_GUIDE.md` → `/docs/TROUBLESHOOTING_GUIDE.md`
- `TERMINOLOGY.md` → `/docs/TERMINOLOGY.md`
- `VERIFY.md` → `/docs/VERIFY.md`

---

**This archive index is maintained as part of repository hygiene and enterprise readiness.**
