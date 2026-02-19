# Settler – MODEL_SPEC.md
Last Updated: 2026-02-18

## Product Focus
Settler exists to deliver: **financial reconciliation, receipt parsing, structured exports, audit trails**.

## Non-Negotiables
- User-facing routes must not hard-500; use graceful degradation and error boundaries.
- No placeholders/TODOs in shipping changes.
- Prefer minimal diffs and deterministic behavior.
- Maintain accessible UI (WCAG AA) and consistent design tokens.
- Keep build/lint/typecheck green.

## Visual Identity
Canonical prompts live in:
- /prompts/GEMINI_IMAGE_PROMPT.md
- /prompts/VIDEO_PROMPT.md
- /prompts/STITCH_UI_PROMPT.md

Tokens and visual rules live in:
- /design/tokens.json
- /design/VISUAL_SYSTEM.md

## Agent Governance
Root files:
- /AGENTS.md
- /SKILLS.md

Sub-agents:
- /agents/*.md

Agents must update these documents when new constraints are introduced; do not delete prior constraints unless directly conflicting.
