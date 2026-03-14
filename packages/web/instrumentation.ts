/**
 * Next.js Instrumentation
 * Runs before the application starts
 * Perfect for environment validation and startup checks
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side startup validation
    await validateServerEnvironment();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime startup validation
    await validateEdgeEnvironment();
  }
}

/**
 * Validate server environment on startup
 * Fails fast if critical configuration is missing
 */
async function validateServerEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if billing is enabled
  const billingEnabled = !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET);

  if (billingEnabled) {
    // If any Stripe key is set, we assume billing is intended to work
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push("STRIPE_SECRET_KEY is required when billing is enabled");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      errors.push(
        "STRIPE_WEBHOOK_SECRET is required when billing is enabled. " +
          "Without this, webhook signature verification will fail, creating a security risk."
      );
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      warnings.push(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Client-side checkout will not work."
      );
    }
  }

  // Check critical database configuration
  if (!process.env.DATABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("Either DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set");
  }

  // Production-specific validations
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_SECRET === "dev-secret-change-in-production-min-32-chars") {
      errors.push(
        "JWT_SECRET is still set to default development value in production! This is a critical security risk."
      );
    }

    if (process.env.ENCRYPTION_KEY === "dev-encryption-key-32-chars-!!!") {
      errors.push(
        "ENCRYPTION_KEY is still set to default development value in production! This is a critical security risk."
      );
    }

    if (process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true" && !process.env.SENTRY_DSN) {
      warnings.push("Sentry is enabled but SENTRY_DSN is not set. Error tracking will not work.");
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error("❌ STARTUP VALIDATION FAILED:");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nApplication cannot start safely. Fix these errors and restart.");
    console.error("See .env.example for required environment variables.\n");

    // In production, throw to prevent startup (unless running verification checks)
    if (process.env.NODE_ENV === "production" && !process.env.SETTLER_VERIFY_MODE) {
      throw new Error("Critical environment variables are missing or misconfigured");
    } else {
      console.error(
        "⚠️  Continuing in non-production mode, but fix these errors before deploying!\n"
      );
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️  STARTUP VALIDATION WARNINGS:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn("");
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ Startup validation passed");
  }
}

/**
 * Validate edge runtime environment
 * Edge runtime has limited access to env vars
 */
async function validateEdgeEnvironment() {
  // Edge runtime validation (if needed)
  // Most validation happens on Node.js runtime
}
