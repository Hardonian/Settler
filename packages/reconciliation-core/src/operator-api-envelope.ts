/**
 * Stable wrapper for operator-facing JSON APIs — explicit machine-readable state on every response.
 */

import type { OperatorRunDetail } from "./operator-run-detail.js";

export type OperatorApiSchemaVersion = "operator.v1";

export type OperatorResponseMeta = {
  state: "available" | "degraded" | "unavailable";
  reasonCodes: string[];
  operatorMessage: string;
  apiSchemaVersion: OperatorApiSchemaVersion;
  route: string;
};

export type OperatorEnvelope<T> = {
  data: T;
  response_meta: OperatorResponseMeta;
};

/** Wrap run detail using embedded {@link OperatorRunDetail.intelligence} when present */
export function envelopeOperatorRunDetail(
  route: string,
  detail: OperatorRunDetail
): OperatorEnvelope<OperatorRunDetail> {
  const intel = detail.intelligence;
  const state = intel?.state ?? "available";
  const reasonCodes = intel?.reasonCodes ?? [];
  const operatorMessage =
    intel?.operatorMessage ??
    "Canonical operator run payload; intelligence block absent — treat as baseline available.";
  return {
    data: detail,
    response_meta: {
      state,
      reasonCodes,
      operatorMessage,
      apiSchemaVersion: "operator.v1",
      route,
    },
  };
}

/** Top-level meta for GET /api/runs list — degraded when any row used proof summary fallback */
export function metaForRunList(params: {
  route: string;
  items: Array<{ compactProofSummaryContext?: { fallbackReasonCode: string | null } | null }>;
}): OperatorResponseMeta {
  const degraded = params.items.some((i) =>
    Boolean(i.compactProofSummaryContext?.fallbackReasonCode)
  );
  return {
    state: degraded ? "degraded" : "available",
    reasonCodes: degraded ? ["LIST_COMPACT_PROOF_FALLBACK_PRESENT"] : [],
    operatorMessage: degraded
      ? "One or more rows used compact proof fallback; see per-item compactProofSummaryContext."
      : "Run list aligned with merged canonical reconciliation rows.",
    apiSchemaVersion: "operator.v1",
    route: params.route,
  };
}
