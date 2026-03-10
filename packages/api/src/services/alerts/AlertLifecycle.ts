export type AlertLifecycleState = "open" | "resolved";

export class AlertTransitionError extends Error {
  readonly code = "INVALID_ALERT_TRANSITION";

  constructor(
    message: string,
    public readonly currentState: AlertLifecycleState,
    public readonly attemptedAction: "resolve"
  ) {
    super(message);
    this.name = "AlertTransitionError";
  }
}

export function assertCanResolveAlert(state: AlertLifecycleState): void {
  if (state !== "open") {
    throw new AlertTransitionError(`Cannot resolve alert from state ${state}`, state, "resolve");
  }
}
