/**
 * Connector Capability Registry
 *
 * Central registry of all connector capabilities, ensuring
 * connectors cannot break deterministic guarantees.
 * Enforces: output normalization, execution timeouts,
 * sandbox isolation, and retry policies.
 */

export interface ConnectorCapability {
  connectorId: string;
  displayName: string;
  category: string;
  authType: string;
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  deterministic: boolean;
  maxTimeoutMs: number;
  retryPolicy: RetryPolicy;
  sandboxLevel: "none" | "basic" | "strict";
  outputNormalization: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
};

export class ConnectorCapabilityRegistry {
  private capabilities = new Map<string, ConnectorCapability>();

  register(capability: ConnectorCapability): void {
    // Enforce minimum safety requirements
    if (capability.maxTimeoutMs <= 0) {
      throw new Error(`Connector ${capability.connectorId}: timeout must be positive`);
    }
    if (capability.maxTimeoutMs > 120_000) {
      throw new Error(`Connector ${capability.connectorId}: timeout cannot exceed 120s`);
    }
    if (!capability.outputNormalization && capability.sandboxLevel === "none") {
      throw new Error(
        `Connector ${capability.connectorId}: must have either output normalization or sandbox isolation`
      );
    }
    this.capabilities.set(capability.connectorId, capability);
  }

  get(connectorId: string): ConnectorCapability | undefined {
    return this.capabilities.get(connectorId);
  }

  list(): ConnectorCapability[] {
    return [...this.capabilities.values()];
  }

  listByCategory(category: string): ConnectorCapability[] {
    return this.list().filter((c) => c.category === category);
  }

  listDeterministic(): ConnectorCapability[] {
    return this.list().filter((c) => c.deterministic);
  }

  validateConnectorConfig(
    connectorId: string,
    config: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const cap = this.capabilities.get(connectorId);
    if (!cap) return { valid: false, errors: [`Unknown connector: ${connectorId}`] };

    const errors: string[] = [];

    // Validate timeout override doesn't exceed max
    const timeout = config.timeoutMs as number | undefined;
    if (timeout !== undefined && timeout > cap.maxTimeoutMs) {
      errors.push(`Timeout ${timeout}ms exceeds max ${cap.maxTimeoutMs}ms for ${connectorId}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get retry delay for a given attempt number
   */
  getRetryDelay(connectorId: string, attempt: number): number {
    const cap = this.capabilities.get(connectorId);
    const policy = cap?.retryPolicy ?? DEFAULT_RETRY_POLICY;

    if (attempt >= policy.maxRetries) return -1; // No more retries

    const delay = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt),
      policy.maxDelayMs
    );
    return delay;
  }
}
