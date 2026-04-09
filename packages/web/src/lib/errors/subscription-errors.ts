/**
 * Subscription Error Types
 *
 * Standardized error types for subscription-related failures
 */

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly tier?: string,
    public readonly requiredTier?: string,
    public readonly upgradeUrl?: string
  ) {
    super(message);
    this.name = "SubscriptionError";
    Object.setPrototypeOf(this, SubscriptionError.prototype);
  }
}

export class InsufficientTierError extends SubscriptionError {
  constructor(tier: string, requiredTier: string, feature: string) {
    super(
      `${feature} requires ${requiredTier} subscription. Current tier: ${tier}`,
      "INSUFFICIENT_TIER",
      tier,
      requiredTier,
      "/console/billing"
    );
    this.name = "InsufficientTierError";
    Object.setPrototypeOf(this, InsufficientTierError.prototype);
  }
}

export class SubscriptionCheckFailedError extends SubscriptionError {
  constructor(originalError?: Error) {
    super(
      `Failed to check subscription status: ${originalError?.message ?? "Unknown error"}`,
      "SUBSCRIPTION_CHECK_FAILED"
    );
    this.name = "SubscriptionCheckFailedError";
    Object.setPrototypeOf(this, SubscriptionCheckFailedError.prototype);
  }
}
