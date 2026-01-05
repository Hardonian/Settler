# Reconciliation Contract

## Entities

*   **Transaction:** A raw financial event from a source (e.g., Stripe Charge).
*   **Normalized Record:** A standard "money movement" object (Amount, Currency, Date, Direction, Counterparty).
*   **Match Group:** A set of 1+ source records and 1+ target records that balance to zero (or explainable fee).
*   **Reconciliation Run:** An atomic execution of the engine on a dataset.
*   **Finding:** An issue preventing a match (e.g., missing transaction, amount mismatch).
*   **Review Decision:** A human or automated choice to accept/reject/override a match.
*   **Audit Event:** An immutable log of any state change.

## Invariants

1.  **Idempotency:** `ReconRun(Dataset, Config)` MUST always yield the exact same `MatchGroups` and `Findings`.
2.  **Conservation of Value:** `Sum(Source.Amount) - Sum(Target.Amount) = Sum(Unmatched.Amount) + Sum(Fee.Amount)`.
3.  **Immutability of History:** A decision once made cannot be altered; it can only be superseded by a new decision event.
4.  **Explainability:** Every `MatchGroup` MUST have a `ReasonBundle` (e.g., "Exact Match on OrderID", "Fuzzy Match on Amount within $0.05 + Date within 24h").

## Confidence Scoring

| Score | Label | Criteria | Action |
|-------|-------|----------|--------|
| **1.0** | **Deterministic** | Exact match on unique ID (Order ID, Transaction ID) AND exact amount. | Auto-approve |
| **0.9** | **High** | Exact match on unique metadata (Email + Amount + Date). | Auto-approve (Configurable) |
| **0.7 - 0.89** | **Medium** | Fuzzy match (Amount within threshold + Date window). | **Human Review Required** |
| **< 0.7** | **Low** | Heuristic suggestion (AI-based). | **Human Review Required** |

## Human Workflow

1.  **Unmatched Queue:** Items failing auto-match land here.
2.  **Review Actions:**
    *   **Accept Suggestion:** Confirms the engine's guess.
    *   **Manual Match:** User selects Source(s) and Target(s) to group.
    *   **Mark as Exception:** "Receipt Missing", "Bank Error".
    *   **Write-off:** Small differences (< $0.10) accepted.
3.  **Logging:** `User(ID) performed Action(Type) on Group(ID) at Time(T)`.

## Data Lifecycle

Input (Raw) -> Normalizer -> Normalized Records -> **Engine** -> Match Groups / Exceptions -> Audit Log -> Export
