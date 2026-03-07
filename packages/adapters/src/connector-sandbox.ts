import { ConnectorDriver, ConnectorError, SyncOptions } from "./connector-driver";

export interface ConnectorSandboxOptions {
  timeoutMs?: number;
  allowWallClockTime?: boolean;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ConnectorError(`Connector timed out after ${timeoutMs}ms`, "CONNECTOR_TIMEOUT", "")
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function normalizeSyncOptions(options: SyncOptions): SyncOptions {
  return {
    ...(options.since ? { since: new Date(options.since.toISOString()) } : {}),
    ...(options.until ? { until: new Date(options.until.toISOString()) } : {}),
    ...(options.cursor ? { cursor: options.cursor } : {}),
    ...(options.accountId ? { accountId: options.accountId } : {}),
    ...(typeof options.limit === "number" ? { limit: options.limit } : {}),
  };
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeError(error: unknown): ConnectorError {
  if (error instanceof ConnectorError) {
    return error;
  }

  if (error instanceof Error) {
    return new ConnectorError(error.message, "CONNECTOR_EXECUTION_FAILED", "", error);
  }

  return new ConnectorError(String(error), "CONNECTOR_EXECUTION_FAILED", "");
}

export async function executeConnectorSandboxed(params: {
  driver: ConnectorDriver;
  credentials: Record<string, unknown>;
  options: SyncOptions;
  sandbox?: ConnectorSandboxOptions;
}): Promise<Awaited<ReturnType<ConnectorDriver["sync"]>>> {
  const timeoutMs = params.sandbox?.timeoutMs ?? 30_000;
  const allowWallClockTime = params.sandbox?.allowWallClockTime ?? false;

  const fencedOptions = normalizeSyncOptions(params.options);
  const fencedCredentials = deepClone(params.credentials);

  try {
    const syncCall = params.driver.sync(fencedCredentials, fencedOptions);
    const result = await withTimeout(syncCall, timeoutMs);

    if (!allowWallClockTime && result.nextCursor && /\d{13}/.test(result.nextCursor)) {
      throw new ConnectorError(
        "Connector returned time-variant cursor; set deterministic cursor or disable strict mode",
        "NON_DETERMINISTIC_CURSOR",
        params.driver.metadata.id
      );
    }

    return result;
  } catch (error) {
    throw normalizeError(error);
  }
}
