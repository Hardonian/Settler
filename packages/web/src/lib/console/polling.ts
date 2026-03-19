export type PollableRunLike = {
  status?: string | null;
  isTerminal?: boolean | null;
};

export type PollableExceptionLike = {
  status?: "pending" | "investigating" | "resolved" | "ignored" | string | null;
};

export function hasActiveRuns(runs: PollableRunLike[]): boolean {
  return runs.some((run) => {
    if (typeof run.isTerminal === "boolean") {
      return !run.isTerminal;
    }

    const status = run.status?.toLowerCase();
    return status === "pending" || status === "running";
  });
}

export function shouldPollRuns(input: {
  autoRefresh: boolean;
  runs: PollableRunLike[];
  loadingInitialState: boolean;
  statusFilter?: string;
}): boolean {
  if (!input.autoRefresh) {
    return false;
  }

  if (input.loadingInitialState) {
    return true;
  }

  const normalizedStatus = input.statusFilter?.toLowerCase();
  if (normalizedStatus === "pending" || normalizedStatus === "running") {
    return true;
  }

  return hasActiveRuns(input.runs);
}

export function hasOpenExceptions(exceptions: PollableExceptionLike[]): boolean {
  return exceptions.some((exception) => {
    const status = exception.status?.toLowerCase();
    return status === "pending" || status === "investigating";
  });
}

export function shouldPollExceptions(input: {
  autoRefresh: boolean;
  exceptions: PollableExceptionLike[];
  loadingInitialState: boolean;
  statusFilter?: string;
  runScoped?: boolean;
}): boolean {
  if (!input.autoRefresh) {
    return false;
  }

  if (input.loadingInitialState) {
    return true;
  }

  const normalizedStatus = input.statusFilter?.toLowerCase();
  if (normalizedStatus === "resolved" || normalizedStatus === "ignored") {
    return false;
  }

  if (normalizedStatus === "pending" || normalizedStatus === "investigating") {
    return true;
  }

  if (hasOpenExceptions(input.exceptions)) {
    return true;
  }

  return Boolean(input.runScoped);
}
