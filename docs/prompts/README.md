# Prompt Library Governance

Settler keeps reusable prompt assets under `prompts/`.

## Canonical reusable prompt assets

| Prompt                                       | Purpose                                                         | Intended model/use                                   | Required context                                                | Expected output                                        | Status |
| -------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| `prompts/STITCH_UI_PROMPT.md`                | UI stitching and implementation planning.                       | UI-capable coding/model workflows.                   | Target component scope, style constraints, acceptance criteria. | Structured implementation instructions and guardrails. | active |
| `prompts/VIDEO_PROMPT.md`                    | Video/demo generation and script framing.                       | Media-generation/model-assisted scripting workflows. | Audience, product area, call-to-action, duration limits.        | Video script/storyboard draft.                         | active |
| `prompts/GEMINI_IMAGE_PROMPT.md`             | Image generation prompt baseline.                               | Image-generation models.                             | Visual style constraints, dimensions, content restrictions.     | Reusable image prompt template.                        | active |
| `prompts/IMPLEMENTATION_EXECUTION_HEADER.md` | Default production execution framing for implementation agents. | Repo-writing agents and engineering copilots.        | Task scope, classification, verification profile, risk posture. | Structured execution block and reporting constraints.  | active |

## Historical prompt artifacts

The following one-off prompt docs were archived to `docs/archive/2026-03/execution-wave-2/prompts/`:

- `SUPABASE_AI_CHATBOT_PROMPT.md`
- `infrastructure/AI_PROMPT_COMPLETE.md`

These remain for historical traceability only.

## Curation rules

- Prompts in `prompts/` must be reusable and include assumptions/usage constraints.
- One-off execution prompts should be archived under `docs/archive/` when historically useful.
- Prompt docs with stale claims should be updated or archived, not left as canonical.

## Documentation links

- Include prompt-system changes in `docs/_meta/DOCS_CONSOLIDATION_CHANGELOG.md` when materially reorganized.
