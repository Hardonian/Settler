declare module "@settler/proofs" {
  export type EvidenceRequirement = {
    type: string;
    required?: boolean;
    description?: string;
  };

  export const STANDARD_EVIDENCE_REQUIREMENTS: Record<string, EvidenceRequirement[]>;
}
