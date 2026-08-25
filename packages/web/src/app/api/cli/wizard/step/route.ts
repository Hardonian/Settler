import { NextRequest, NextResponse } from "next/server";
import { requireTenantRequestContext } from "@/lib/api/tenant-context";

const ADAPTER_CONFIG_SCHEMAS: Record<
  string,
  {
    required: string[];
    fields: Record<string, { description: string; type: string; example: string }>;
  }
> = {
  stripe: {
    required: ["apiKey"],
    fields: {
      apiKey: { description: "Stripe Secret Key", type: "password", example: "sk_test_..." },
      webhookSecret: {
        description: "Webhook Secret (optional)",
        type: "password",
        example: "whsec_...",
      },
    },
  },
  shopify: {
    required: ["apiKey", "shopDomain"],
    fields: {
      apiKey: { description: "Shopify API Key", type: "text", example: "shpat_..." },
      shopDomain: { description: "Shop Domain", type: "text", example: "your-store.myshopify.com" },
      webhookSecret: { description: "Webhook Secret (optional)", type: "password", example: "..." },
    },
  },
  quickbooks: {
    required: ["clientId", "clientSecret", "realmId", "accessToken", "refreshToken"],
    fields: {
      clientId: { description: "Client ID", type: "text", example: "..." },
      clientSecret: { description: "Client Secret", type: "password", example: "..." },
      realmId: { description: "Realm ID", type: "text", example: "..." },
      accessToken: { description: "Access Token", type: "password", example: "..." },
      refreshToken: { description: "Refresh Token", type: "password", example: "..." },
    },
  },
};

function getSuggestedRules(sourceAdapter: string, targetAdapter: string) {
  if (sourceAdapter === "shopify" && targetAdapter === "stripe") {
    return [
      {
        field: "order_id",
        type: "exact",
        description: "Match Shopify order ID with Stripe payment metadata",
      },
      {
        field: "amount",
        type: "exact",
        tolerance: 0.01,
        description: "Match amounts within $0.01 tolerance",
      },
      {
        field: "date",
        type: "range",
        days: 1,
        description: "Allow 1 day difference for processing delays",
      },
    ];
  }
  return [
    { field: "transaction_id", type: "exact", description: "Match transaction IDs exactly" },
    {
      field: "amount",
      type: "exact",
      tolerance: 0.01,
      description: "Match amounts within tolerance",
    },
  ];
}

function generateGuidance(step: number, answers: Record<string, unknown>): string {
  if (step === 1)
    return "Select the platform where your transactions originate (e.g., Shopify orders, Stripe payments)";
  if (step === 2) {
    const sourceAdapter = answers.sourceAdapter as string;
    return `Select the platform to match ${sourceAdapter} transactions against (e.g., QuickBooks for accounting, Stripe for payments)`;
  }
  if (step === 3)
    return "Enter your source platform API credentials. These are stored securely and never exposed.";
  if (step === 4)
    return "Enter your target platform API credentials. These are stored securely and never exposed.";
  if (step === 5)
    return "Configure matching rules. Exact matches are most accurate, fuzzy matches handle variations, range matches account for timing differences.";
  return "";
}

function generateJobConfig(answers: Record<string, unknown>): Record<string, unknown> {
  const config: Record<string, unknown> = {
    name: `${answers.sourceAdapter} \u2192 ${answers.targetAdapter} Reconciliation`,
    source: {
      adapter: answers.sourceAdapter,
      config: answers.sourceConfig,
    },
    target: {
      adapter: answers.targetAdapter,
      config: answers.targetConfig,
    },
    rules: {
      matching: answers.rules || [],
    },
  };

  if (answers.schedule && typeof answers.schedule === "object" && answers.schedule !== null) {
    config.schedule = answers.schedule;
  }

  return config;
}

function generateCLICommand(jobConfig: Record<string, unknown>): string {
  const source = jobConfig.source as Record<string, unknown> | undefined;
  const target = jobConfig.target as Record<string, unknown> | undefined;
  const sourceAdapter = source?.adapter ?? "unknown";
  const sourceConfig = source?.config ?? {};
  const targetAdapter = target?.adapter ?? "unknown";
  const targetConfig = target?.config ?? {};

  return `settler jobs create \\\\\n  --name "${jobConfig.name}" \\\\\n  --source-adapter ${sourceAdapter} \\\\\n  --source-config '${JSON.stringify(sourceConfig)}' \\\\\n  --target-adapter ${targetAdapter} \\\\\n  --target-config '${JSON.stringify(targetConfig)}' \\\\\n  --rules '${JSON.stringify(jobConfig.rules)}'`;
}

export async function POST(request: NextRequest) {
  try {
    await requireTenantRequestContext(request);
    const body = await request.json();
    const { step, answers } = body;

    if (!step || !answers) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "step and answers are required" } },
        { status: 400 }
      );
    }

    // Validate step answers
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (step === 1 && !answers.sourceAdapter) {
      errors.push({
        field: "sourceAdapter",
        message: "Source adapter is required",
        code: "REQUIRED_FIELD",
      });
    }

    if (step === 2) {
      if (!answers.targetAdapter) {
        errors.push({
          field: "targetAdapter",
          message: "Target adapter is required",
          code: "REQUIRED_FIELD",
        });
      }
      if (answers.sourceAdapter === answers.targetAdapter) {
        errors.push({
          field: "targetAdapter",
          message: "Source and target must be different",
          code: "INVALID_VALUE",
        });
      }
    }

    if (step === 3) {
      const sourceAdapter = answers.sourceAdapter as string;
      const sourceConfig = (answers.sourceConfig as Record<string, unknown>) || {};
      const schema = ADAPTER_CONFIG_SCHEMAS[sourceAdapter];
      if (schema) {
        for (const field of schema.required) {
          if (!sourceConfig[field]) {
            errors.push({
              field: `sourceConfig.${field}`,
              message: `Required field '${field}' is missing`,
              code: "REQUIRED_FIELD",
            });
          }
        }
      }
    }

    if (step === 4) {
      const targetAdapter = answers.targetAdapter as string;
      const targetConfig = (answers.targetConfig as Record<string, unknown>) || {};
      const schema = ADAPTER_CONFIG_SCHEMAS[targetAdapter];
      if (schema) {
        for (const field of schema.required) {
          if (!targetConfig[field]) {
            errors.push({
              field: `targetConfig.${field}`,
              message: `Required field '${field}' is missing`,
              code: "REQUIRED_FIELD",
            });
          }
        }
      }
    }

    if (step === 5) {
      const rules = (answers.rules as unknown[]) || [];
      if (rules.length === 0) {
        errors.push({
          field: "rules",
          message: "At least one matching rule is required",
          code: "REQUIRED_FIELD",
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid wizard step answers",
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Generate response
    const sourceAdapter = answers.sourceAdapter as string;
    const targetAdapter = answers.targetAdapter as string;
    const suggestedRules = getSuggestedRules(sourceAdapter, targetAdapter);
    const guidance = generateGuidance(step, answers);

    const response: Record<string, unknown> = {
      valid: true,
      nextStep: step < 5 ? step + 1 : null,
      guidance,
      suggestedRules,
    };

    if (step === 5) {
      const jobConfig = generateJobConfig(answers);
      const command = generateCLICommand(jobConfig);
      response.jobConfig = jobConfig;
      response.command = command;
    }

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Wizard step error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process wizard step" } },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST to process wizard steps" } },
    { status: 405 }
  );
}
