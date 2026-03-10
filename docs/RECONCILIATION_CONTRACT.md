# Reconciliation Contract

## Entities

- **Transaction:** A raw financial event from a source (e.g., Stripe Charge).
- **Normalized Record:** A standard "money movement" object (Amount, Currency, Date, Direction, Counterparty).
- **Match Group:** A set of 1+ source records and 1+ target records that balance to zero (or explainable fee).
- **Reconciliation Run:** An atomic execution of the engine on a dataset.
- **Finding:** An issue preventing a match (e.g., missing transaction, amount mismatch).
- **Review Decision:** A human or automated choice to accept/reject/override a match.
- **Audit Event:** An immutable log of any state change.

## Invariants

1.  **Idempotency:** `ReconRun(Dataset, Config)` MUST always yield the exact same `MatchGroups` and `Findings`.
2.  **Conservation of Value:** `Sum(Source.Amount) - Sum(Target.Amount) = Sum(Unmatched.Amount) + Sum(Fee.Amount)`.
3.  **Immutability of History:** A decision once made cannot be altered; it can only be superseded by a new decision event.
4.  **Explainability:** Every `MatchGroup` MUST have a `ReasonBundle` (e.g., "Exact Match on OrderID", "Fuzzy Match on Amount within $0.05 + Date within 24h").

## Confidence Scoring

| Score          | Label             | Criteria                                                              | Action                      |
| -------------- | ----------------- | --------------------------------------------------------------------- | --------------------------- |
| **1.0**        | **Deterministic** | Exact match on unique ID (Order ID, Transaction ID) AND exact amount. | Auto-approve                |
| **0.9**        | **High**          | Exact match on unique metadata (Email + Amount + Date).               | Auto-approve (Configurable) |
| **0.7 - 0.89** | **Medium**        | Fuzzy match (Amount within threshold + Date window).                  | **Human Review Required**   |
| **< 0.7**      | **Low**           | Heuristic suggestion (AI-based).                                      | **Human Review Required**   |

## Human Workflow

1.  **Unmatched Queue:** Items failing auto-match land here.
2.  **Review Actions:**
    - **Accept Suggestion:** Confirms the engine's guess.
    - **Manual Match:** User selects Source(s) and Target(s) to group.
    - **Mark as Exception:** "Receipt Missing", "Bank Error".
    - **Write-off:** Small differences (< $0.10) accepted.
3.  **Logging:** `User(ID) performed Action(Type) on Group(ID) at Time(T)`.

## Data Lifecycle

Input (Raw) -> Normalizer -> Normalized Records -> **Engine** -> Match Groups / Exceptions -> Audit Log -> Export

## Runtime Result Contract (Hardened)

The synthetic/runtime reconciliation path now emits a first-class `runtime_matches` contract per transaction with deterministic semantics:

- `classification`: typed enum (`EXACT_MATCH`, `FUZZY_MATCH`, `GROUPED_MATCH`, `UNMATCHED_SOURCE_ONLY`, `UNMATCHED_TARGET_ONLY`, `DUPLICATE_DETECTED`, `TIMING_VARIANCE`, `FEE_VARIANCE`, `FX_VARIANCE`, `STATUS_CONFLICT`, `DISPUTE_RELATED`, `REVERSAL_RELATED`, `MANUAL_REVIEW`)
- `group_id` + stable member references (`group_member_transaction_ids`, `source_member_record_ids`, `target_member_record_ids`)
- `manual_review_rationale_codes` (deterministic machine-readable reasons)
- `is_dispute_related`, `is_reversal_related`, and linked references (`linked_dispute_id`, `linked_refund_id`)

`expected_summary` and e2e verification aggregate directly from runtime-emitted classification values. Contract verification runs in strict mode via:

- `pnpm run test:reconciliation:e2e`
- `pnpm run verify:reconciliation-runtime`
- `pnpm run verify:reconciliation:strict`

## Legacy Compatibility Timeline (`legacy_match_class`)

- **Now (additive phase):** `legacy_match_class` remains available for downstream consumers that still rely on lower-case historical labels.
- **Next migration gate:** API/UI consumers should switch to `classification` + runtime semantic fields (`group_id`, `manual_review_rationale_codes`, dispute/reversal markers).
- **Deprecation target:** remove reliance in downstream consumers during the next two release trains after strict contract adoption is complete.
- **Removal condition:** all reconciliations API and UI contract tests must pass without reading `legacy_match_class`.
