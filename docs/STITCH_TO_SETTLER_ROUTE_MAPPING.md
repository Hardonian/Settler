# Stitch Screens to Settler Routes Mapping

Based on analysis of Stitch screens in `./stitch/unpacked` and the Settler route map from `settler_expansion_prd_route_map.html`.

## Route Groups Reference (from PRD)

### Core Operations

- `/workspace` - Default Queue View
  - `/workspace/investigate/:id` - Split-pane Investigation
  - `/workspace/bulk-triage` - Bulk Action Mode
- `/exceptions` - Exceptions List
  - `/exceptions/:id` - Exception Detail Page
  - `/exceptions/playbooks` - Playbook Library
- `/runs` - Processing Monitor
  - `/runs/:id` - Run Detail & Logs

### Configuration & Data

- `/matching-rules` - Rules List
  - `/matching-rules/editor/:id` - Rule Builder (Conditions, Test Mode)
  - `/matching-rules/history/:id` - Version History & Rollback
- `/connectors` - Connectors Gallery
  - `/connectors/setup/:provider` - Multi-step Setup Wizard
  - `/connectors/:id` - Connector Health & Sync Logs
  - `/connectors/:id/mapping` - Field Mapping UI
- `/webhooks` - Webhook Delivery & API Keys

### Admin & Governance

- `/admin/team` - Members List
  - `/admin/team/invite` - Invite Flow
- `/admin/roles` - RBAC Matrix & Role Builder
- `/admin/audit-log` - Global Activity Explorer
- `/admin/security` - Session Management & Security Posture

### Reporting

- `/dashboard` - Executive Overview
- `/reports` - Report Builder & Catalog

## Stitch Screens Mapped to Settler Routes

### Core Operations → `/workspace`

- `reconciliation_workspace_investigation_view_1` → `/workspace/investigate/:id`
- `reconciliation_workspace_investigation_view_2` → `/workspace/investigate/:id`
- `workspace_ambiguous_match_state` → `/workspace` or `/workspace/investigate/:id`
- `workspace_degraded_state_stale_data` → `/workspace`
- `workspace_investigation_causal_logic` → `/workspace/investigate/:id`
- `workspace_mobile_investigation_detail` → `/workspace` (mobile view)
- `workspace_mobile_queue_view` → `/workspace` (mobile view)
- `workspace_refined_mobile_investigation` → `/workspace` (mobile view)
- `workspace_refined_mobile_queue` → `/workspace` (mobile view)
- `workspace_risk_prioritized_queue` → `/workspace`
- `review_queue_&_resolution_1` → `/workspace` (with filters)
- `review_queue_&_resolution_2` → `/workspace` (with filters)
- `rules_&_tolerances_editor_1` → `/workspace` (rule adjustment)
- `rules_&_tolerances_editor_2` → `/workspace` (rule adjustment)
- `trace_explorer_forensics_1` → `/workspace/investigate/:id` (deep dive)
- `trace_explorer_forensics_2` → `/workspace/investigate/:id` (deep dive)
- `trace_explorer_forensics_3` → `/workspace/investigate/:id` (deep dive)
- `unlock_sequence_(dark/light)` → `/workspace` (security modal)
- `user_settings_&_notifications_(dark/light)` → `/workspace` (settings panel)
- `workspace_onboarding_(dark/light)` → `/workspace` (onboarding flow)

### Core Operations → `/exceptions`

- `exceptions_causal_analysis_view` → `/exceptions/:id`
- `exceptions_breaks_management_1` → `/exceptions` (list view)
- `exceptions_breaks_management_2` → `/exceptions` (list view)
- `exceptions_mobile_dashboard` → `/exceptions` (mobile view)
- `reconciliation_transparency_(dark/light)` → `/exceptions` (transparency view)

### Core Operations → `/runs`

- `execution_control_&_runs_1` → `/runs` (list view)
- `execution_control_&_runs_2` → `/runs` (list view)
- `run_monitor_detail_view` → `/runs/:id`
- `run_monitor_system_failure_timeout` → `/runs/:id` (failure detail)
- `settlement_payout_queue` → `/runs` (payout-specific view)

### Configuration & Data → `/matching-rules`

- `matching_rules_configurator_1` → `/matching-rules` (list view)
- `matching_rules_configurator_2` → `/matching-rules` (list view)
- `matching_rules_logic_editor` → `/matching-rules/editor/:id`
- `rules_conflicting_signals_state` → `/matching-rules` (conflict resolution)
- `rules_editor_logic_conflict_state` → `/matching-rules/editor/:id` (conflict resolution)

### Configuration & Data → `/connectors`

- `connector_partial_truth_state` → `/connectors/:id` (health view)
- `connector_setup_field_mapping` → `/connectors/setup/:provider/mapping` or `/connectors/:id/mapping`
- `integrations_data_sources_1` → `/connectors` (gallery view)
- `integrations_data_sources_2` → `/connectors` (gallery view)
- `time_standards_lineage` → `/connectors/:id` (lineage view)

### Admin & Governance → `/admin`

- `admin_audit_log_explorer` → `/admin/audit-log`
- `admin_team_management_1` → `/admin/team`
- `admin_team_management_2` → `/admin/team` (detail view)
- `enterprise_security_&_trust_(dark/light)` → `/admin/security`
- `internal_glossary_(dark/light)` → `/admin/roles` or `/admin/security` (reference)
- `system_freeze_(dark/light)` → `/admin/security` (security action)
- `system_recovery_(dark/light)` → `/admin/security` (security action)
- `technical_architecture_&_security_1` → `/admin/security` (reference)
- `technical_architecture_&_security_2` → `/admin/security` (reference)

### Reporting → `/dashboard`

- `cost_&_ai_governance_1` → `/dashboard` (cost metrics)
- `cost_&_ai_governance_2` → `/dashboard` (cost metrics detail)
- `control_plane_overview_1` → `/dashboard` (system overview)
- `control_plane_overview_2` → `/dashboard` (system overview detail)
- `executive_health_dashboard_1` → `/dashboard` (executive view)
- `executive_health_dashboard_2` → `/dashboard` (executive view detail)
- `refined_dashboard_visual_stability` → `/dashboard` (stability metrics)
- `refined_workspace_calm_tone` → `/dashboard` (workspace view)

### Reporting → `/reports`

- `compliance_bundle_detail_(dark/light)` → `/reports` (compliance report)
- `compliance_export_bundle_(dark/light)` → `/reports` (export configuration)
- `export_evidence_pack_config` → `/reports` (evidence pack builder)
- `export_evidence_pack_ready` → `/reports` (evidence pack preview)
- `forensic_trace_analysis` → `/reports` (forensic report)
- `pipeline_management_1` → `/reports` (pipeline analytics)
- `pipeline_management_2` → `/reports` (pipeline analytics detail)
- `period_close_attestation_flow` → `/reports` (period close workflow)
- `period_close_checklist_1` → `/reports` (checklist view)
- `period_close_checklist_2` → `/reports` (checklist view)
- `period_close_digital_signature` → `/reports` (signature workflow)
- `refined_period_close_checklist` → `/reports` (enhanced checklist)
- `refined_period_close_workflow` → `/reports` (workflow view)

## UI Component Types Determination

Based on screen analysis:

### Pages (Full Navigation)

- Dashboard views (`/dashboard`)
- List views (`/workspace`, `/exceptions`, `/matching-rules`, `/connectors`)
- Detail views with ID (`/workspace/investigate/:id`, `/exceptions/:id`, `/runs/:id`, `/matching-rules/editor/:id`)
- Setup wizards (`/connectors/setup/:provider`)

### Drawers (Slide-in Panels)

- Evidence drawers (from workspace investigation)
- Playbook panels (from exceptions detail)
- Test mode sidebars (from matching rules editor)
- Filter panels (from various list views)
- Configuration panels (from connector setup)

### Modals (Centered Popups)

- Delete/confirmation dialogs
- Bulk action confirmations
- Settings modals
- Help/tutorial modals
- Error/alert dialogs

### Panels (Embedded Sections)

- RCA (Root Cause Analysis) panels in exception cards
- Metric cards in dashboards
- Summary sections in detail views
- Tabbed content areas

### Special Cases

- Bottom sheets (mobile) for quick actions
- Full-screen sheets (mobile) for deep investigations
- Tab persistence for context maintenance
