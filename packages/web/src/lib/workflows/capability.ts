export const WORKFLOW_MUTATION_UNAVAILABLE_CODE = "WORKFLOW_AUTOMATION_UNAVAILABLE" as const;

export const WORKFLOWS_CAPABILITY_REASON = "workflow_automation_thin_surface" as const;

export const WORKFLOWS_CAPABILITY_MESSAGE =
  "Workflow automation is currently limited in this build. Create, edit, delete, and dry-run actions are unavailable.";

export const WORKFLOWS_CAPABILITY = {
  state: "unavailable" as const,
  reason: WORKFLOWS_CAPABILITY_REASON,
  message: WORKFLOWS_CAPABILITY_MESSAGE,
};

export const WORKFLOW_HISTORY_CAPABILITY = {
  state: "available" as const,
  mode: "history_only" as const,
};
