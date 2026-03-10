export type CapabilityState = "available" | "degraded" | "unavailable";

export interface CapabilityStatus {
  key: string;
  state: CapabilityState;
  source: "oss" | "private";
  available: boolean;
  reason?: string;
  guarantee?: "distributed_shared" | "local_only" | "degraded" | "unavailable";
}

export interface CapabilityRegistry {
  list(): CapabilityStatus[];
  get(key: string): CapabilityStatus | undefined;
}
