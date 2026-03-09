# Reconciliation Scenario Matrix

| Category                   | Validates                                  | Typical expected class |
| -------------------------- | ------------------------------------------ | ---------------------- |
| HAPPY_PATH                 | 1:1 same-day exact join                    | exact_match            |
| TIMING_MISMATCHES          | auth/capture/payout settlement drift       | timing_variance        |
| FEES_NET_VS_GROSS          | processor fee withholding vs bank net      | fee_variance           |
| REFUNDS_REVERSALS          | full/partial/delayed refunds               | manual_review          |
| DISPUTES_CHARGEBACKS       | dispute + fee + loss path                  | manual_review          |
| DUPLICATES_NEAR_DUPLICATES | replayed exports/webhooks                  | duplicate_detected     |
| SPLIT_MERGED_MATCHING      | one-to-many/many-to-one settlement mapping | grouped_match          |
| FX_CURRENCY                | cross-currency + FX timing rounding        | fx_variance            |
| MISSING_BROKEN_REFERENCES  | blank/truncated malformed refs             | fuzzy_match            |
| STATUS_MISMATCHES          | succeeded vs pending ledger drift          | status_conflict        |
| EDGE_CASE_SWAMP            | nulls, tiny diffs, orphaned structures     | manual_review          |
