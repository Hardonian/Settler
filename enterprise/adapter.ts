export type ReviewResult = {
  discrepancyId: string;
  reviewedAt: string;
  note?: string;
};

export type EvidenceExport = {
  runId: string;
  exportedAt: string;
  format: "json" | "csv" | "log" | "bundle";
  payload: string;
};

export interface EnterpriseReviewAdapter {
  markReviewed: (discrepancyId: string, note?: string) => Promise<ReviewResult>;
  exportEvidence: (runId: string) => Promise<EvidenceExport | null>;
}

export const NoopEnterpriseAdapter: EnterpriseReviewAdapter = {
  async markReviewed(discrepancyId, note) {
    return {
      discrepancyId,
      reviewedAt: new Date(0).toISOString(),
      note,
    };
  },
  async exportEvidence(runId) {
    return {
      runId,
      exportedAt: new Date(0).toISOString(),
      format: "json",
      payload: "{}",
    };
  },
};
