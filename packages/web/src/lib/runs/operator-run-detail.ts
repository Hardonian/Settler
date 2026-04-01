import type { OperatorRunDetail } from "@/types/operator-run-detail";

type OperatorRunDetailEnvelope = {
  data: OperatorRunDetail;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOperatorRunDetail(value: unknown): value is OperatorRunDetail {
  if (!isRecord(value)) return false;
  return (
    (value.runKind === "recon_job" || value.runKind === "ingestion_run") &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    isRecord(value.summary) &&
    isRecord(value.provenance) &&
    isRecord(value.config)
  );
}

export function parseOperatorRunDetailResponse(payload: unknown): OperatorRunDetail {
  if (isOperatorRunDetail(payload)) {
    return payload;
  }

  if (isRecord(payload) && "data" in payload && isOperatorRunDetail(payload.data)) {
    return (payload as OperatorRunDetailEnvelope).data;
  }

  throw new Error("Invalid operator run detail payload");
}

export function getOperatorRunDetailProvenanceSignals(detail: OperatorRunDetail): {
  traceId: string | null;
  inputHash: string | null;
} {
  return {
    traceId: detail.traceId ?? null,
    inputHash: detail.config.inputHash ?? null,
  };
}
