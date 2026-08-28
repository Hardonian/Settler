#!/usr/bin/env tsx
/**
 * Environment Variables Verification Script
 *
 * Verifies that all required environment variables are set for production.
 * Run this before deploying to catch missing configuration early.
 *
 * Usage:
 *   tsx scripts/verify-env-vars.ts [--mode=production|development]
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  category: "critical" | "important" | "optional";
  defaultValue?: string;
  validate?: (value: string) => boolean | string;
}

const ENV_VARS: EnvVar[] = [
  // Critical - Required for core functionality
  {
    name: "SUPABASE_URL",
    required: true,
    description: "Supabase project URL (required for database and auth)",
    category: "critical",
    validate: (value) => {
      if (!value.startsWith("https://")) {
        return "Must start with https://";
      }
      if (!value.includes(".supabase.co")) {
        return "Must be a valid Supabase URL";
      }
      return true;
    },
  },
  {
    name: "SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anonymous key (required for client-side operations)",
    category: "critical",
    validate: (value) => {
      if (value.length < 20) {
        return "Key seems too short";
      }
      return true;
    },
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Supabase service role key (required for server-side operations)",
    category: "critical",
    validate: (value) => {
      if (value.length < 20) {
        return "Key seems too short";
      }
      return true;
    },
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Public Supabase URL (required for client-side)",
    category: "critical",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Public Supabase anonymous key (required for client-side)",
    category: "critical",
  },

  // Important - Required for specific features
  {
    name: "NEXT_PUBLIC_SITE_URL",
    required: false,
    description: "Public site URL (defaults to https://settler.dev)",
    category: "important",
    defaultValue: "https://settler.dev",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: false,
    description: "Public app URL (defaults to https://settler.dev)",
    category: "important",
    defaultValue: "https://settler.dev",
  },
  {
    name: "STRIPE_SECRET_KEY",
    required: false,
    description: "Stripe secret key (required for billing features)",
    category: "important",
    validate: (value) => {
      if (!value.startsWith("sk_")) {
        return "Must start with sk_";
      }
      return true;
    },
  },
  {
    name: "RESEND_API_KEY",
    required: false,
    description: "Resend API key (required for email features)",
    category: "important",
    validate: (value) => {
      if (!value.startsWith("re_")) {
        return "Must start with re_";
      }
      return true;
    },
  },
  {
    name: "JWT_SECRET",
    required: false,
    description: "JWT secret for authentication (must be 32+ characters)",
    category: "important",
    validate: (value) => {
      if (value.length < 32) {
        return "Must be at least 32 characters";
      }
      return true;
    },
  },

  // Optional - Nice to have
  {
    name: "REDIS_URL",
    required: false,
    description: "Redis URL for caching and queues",
    category: "optional",
  },
  {
    name: "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
    required: false,
    description: "Google Analytics 4 measurement ID",
    category: "optional",
  },
  {
    name: "NEXT_PUBLIC_POSTHOG_KEY",
    required: false,
    description: "PostHog API key",
    category: "optional",
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    required: false,
    description: "Sentry DSN for error tracking",
    category: "optional",
  },
];

interface VerificationResult {
  name: string;
  status: "ok" | "missing" | "invalid" | "warning";
  value?: string;
  message?: string;
  category: string;
}

function verifyEnvVar(envVar: EnvVar): VerificationResult {
  const value = process.env[envVar.name];
  const hasDefault = envVar.defaultValue !== undefined;
  const effectiveValue = value || envVar.defaultValue || "";

  if (envVar.required && !value && !hasDefault) {
    return {
      name: envVar.name,
      status: "missing",
      message: `Required but not set: ${envVar.description}`,
      category: envVar.category,
    };
  }

  if (!value && hasDefault) {
    return {
      name: envVar.name,
      status: "warning",
      value: `(using default: ${envVar.defaultValue})`,
      message: `Not set, using default value`,
      category: envVar.category,
    };
  }

  if (!value) {
    return {
      name: envVar.name,
      status: "warning",
      message: `Optional: ${envVar.description}`,
      category: envVar.category,
    };
  }

  if (envVar.validate) {
    const validation = envVar.validate(value);
    if (validation !== true) {
      return {
        name: envVar.name,
        status: "invalid",
        value: value.substring(0, 20) + "...",
        message: `Invalid format: ${validation}`,
        category: envVar.category,
      };
    }
  }

  return {
    name: envVar.name,
    status: "ok",
    value: value.length > 50 ? value.substring(0, 50) + "..." : value,
    message: envVar.description,
    category: envVar.category,
  };
}

function printResults(results: VerificationResult[]) {
  const critical = results.filter((r) => r.category === "critical");
  const important = results.filter((r) => r.category === "important");
  const optional = results.filter((r) => r.category === "optional");

  console.log("\n🔍 Environment Variables Verification\n");
  console.log("=".repeat(60));

  function printCategory(category: VerificationResult[], title: string) {
    if (category.length === 0) return;

    console.log(`\n${title}:`);
    console.log("-".repeat(60));

    for (const result of category) {
      const icon =
        result.status === "ok"
          ? "✅"
          : result.status === "missing"
            ? "❌"
            : result.status === "invalid"
              ? "⚠️ "
              : "ℹ️ ";

      console.log(`${icon} ${result.name}`);
      if (result.value) {
        console.log(`   Value: ${result.value}`);
      }
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      console.log("");
    }
  }

  printCategory(critical, "🔴 CRITICAL (Required for core functionality)");
  printCategory(important, "🟠 IMPORTANT (Required for specific features)");
  printCategory(optional, "🟢 OPTIONAL (Nice to have)");

  const missing = results.filter((r) => r.status === "missing");
  const invalid = results.filter((r) => r.status === "invalid");
  const warnings = results.filter((r) => r.status === "warning" && r.category === "important");

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`   ✅ Valid: ${results.filter((r) => r.status === "ok").length}`);
  console.log(`   ❌ Missing: ${missing.length}`);
  console.log(`   ⚠️  Invalid: ${invalid.length}`);
  console.log(`   ℹ️  Warnings: ${warnings.length}`);

  if (missing.length > 0 || invalid.length > 0) {
    console.log("\n❌ FAILED: Critical issues found!");
    console.log("\nMissing or invalid environment variables:");
    [...missing, ...invalid].forEach((r) => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  WARNING: Some important variables are not set.");
    console.log("The application will work but some features may be disabled.");
    warnings.forEach((r) => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  console.log("\n✅ All critical environment variables are set correctly!");
}

function main() {
  const mode = process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] || "production";
  const isProduction = mode === "production";

  console.log(`\n🔍 Verifying environment variables (mode: ${mode})...\n`);

  const results = ENV_VARS.map(verifyEnvVar);
  printResults(results);

  // In production mode, be stricter
  if (isProduction) {
    const criticalMissing = results.filter((r) => r.category === "critical" && r.status !== "ok");

    if (criticalMissing.length > 0) {
      console.log("\n❌ Production deployment requires all critical variables!");
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

export { verifyEnvVar, ENV_VARS };
