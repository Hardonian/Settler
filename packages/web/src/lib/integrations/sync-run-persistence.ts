export type SyncRunPersistenceStatus = "durable_atomic" | "durable_non_atomic" | "failed_partial";

export type SyncDurabilityPresentation = {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
  description: string;
};

export function getSyncDurabilityPresentation(
  persistenceStatus: string | null | undefined,
  recoveryRequired: boolean | null | undefined
): SyncDurabilityPresentation {
  if (recoveryRequired === true || persistenceStatus === "failed_partial") {
    return {
      label: "Recovery required",
      tone: "danger",
      description:
        "Partial write detected. Review sync_recovery_required evidence before trusting this run.",
    };
  }

  if (persistenceStatus === "durable_atomic") {
    return {
      label: "Atomic durable",
      tone: "success",
      description: "Persistence completed atomically.",
    };
  }

  if (persistenceStatus === "durable_non_atomic") {
    return {
      label: "Degraded durable",
      tone: "warning",
      description: "Write completed through fallback path. Verify sync_atomic_fallback evidence.",
    };
  }

  return {
    label: "Durability unknown",
    tone: "neutral",
    description: "Run predated durability truth fields or status was not captured.",
  };
}
