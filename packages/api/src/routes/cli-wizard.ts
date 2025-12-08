/**
 * CLI Wizard API
 * E3: Developer DX - Interactive CLI wizard for job creation
 * Future-forward: AI-powered suggestions, step-by-step guidance, validation
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";
import { listAdapters, getAdapterConfigSchema } from "../utils/adapter-config-validator";

const router = Router();

const wizardStepSchema = z.object({
  body: z.object({
    step: z.number().min(1).max(5),
    answers: z.record(z.unknown()),
  }),
});

// Get wizard steps
router.get(
  "/cli/wizard/steps",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const steps = [
        {
          step: 1,
          title: "Choose Source Platform",
          description: "Where are your transactions coming from?",
          type: "select",
          options: listAdapters().map(a => ({
            value: a.id,
            label: a.name,
            description: `Reconcile ${a.name} transactions`,
          })),
          required: true,
        },
        {
          step: 2,
          title: "Choose Target Platform",
          description: "Where should transactions be matched against?",
          type: "select",
          options: listAdapters().map(a => ({
            value: a.id,
            label: a.name,
            description: `Match against ${a.name} transactions`,
          })),
          required: true,
        },
        {
          step: 3,
          title: "Configure Source Connection",
          description: "Enter your source platform credentials",
          type: "form",
          fields: (answers: Record<string, unknown>) => {
            const adapter = answers.sourceAdapter as string;
            const schema = getAdapterConfigSchema(adapter);
            if (!schema) return [];

            return schema.required.map(field => ({
              name: field,
              label: schema.fields?.[field]?.description || field,
              type: schema.fields?.[field]?.type || "string",
              required: true,
              placeholder: schema.fields?.[field]?.example || "",
            }));
          },
          required: true,
        },
        {
          step: 4,
          title: "Configure Target Connection",
          description: "Enter your target platform credentials",
          type: "form",
          fields: (answers: Record<string, unknown>) => {
            const adapter = answers.targetAdapter as string;
            const schema = getAdapterConfigSchema(adapter);
            if (!schema) return [];

            return schema.required.map(field => ({
              name: field,
              label: schema.fields?.[field]?.description || field,
              type: schema.fields?.[field]?.type || "string",
              required: true,
              placeholder: schema.fields?.[field]?.example || "",
            }));
          },
          required: true,
        },
        {
          step: 5,
          title: "Configure Matching Rules",
          description: "How should transactions be matched?",
          type: "rules-builder",
          suggestions: (answers: Record<string, unknown>) => {
            const sourceAdapter = answers.sourceAdapter as string;
            const targetAdapter = answers.targetAdapter as string;

            // AI-powered rule suggestions
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
              {
                field: "transaction_id",
                type: "exact",
                description: "Match transaction IDs exactly",
              },
              {
                field: "amount",
                type: "exact",
                tolerance: 0.01,
                description: "Match amounts within tolerance",
              },
            ];
          },
          required: true,
        },
      ];

      res.json({
        data: steps,
        totalSteps: steps.length,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get wizard steps", 500, { userId: req.userId });
    }
  }
);

// Process wizard step
router.post(
  "/cli/wizard/step",
  requirePermission(Permission.JOBS_WRITE),
  validateRequest(wizardStepSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { step, answers } = req.body;

      // Validate step answers
      const validation = validateWizardStep(step, answers);

      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid wizard step answers",
            type: "ValidationError",
            details: validation.errors,
          },
        });
      }

      // Generate next step guidance
      const guidance = generateGuidance(step, answers);

      res.json({
        data: {
          step,
          valid: true,
          nextStep: step < 5 ? step + 1 : null,
          guidance,
          ...(step === 5 && {
            jobConfig: generateJobConfig(answers),
          }),
        },
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to process wizard step", 500, { userId: req.userId });
      return;
    }
  }
);

// Generate CLI command from wizard answers
router.post(
  "/cli/wizard/generate-command",
  requirePermission(Permission.JOBS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const answers = req.body as Record<string, unknown>;

      const jobConfig = generateJobConfig(answers);
      const command = generateCLICommand(jobConfig);

      res.json({
        data: {
          command,
          jobConfig,
          nextSteps: [
            "Run the command to create your reconciliation job",
            "Use `settler jobs run <job-id>` to run reconciliation",
            "Use `settler reports get <job-id>` to view results",
          ],
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate CLI command", 500, { userId: req.userId });
    }
  }
);

// Helper functions

function validateWizardStep(step: number, answers: Record<string, unknown>): {
  valid: boolean;
  errors?: Array<{ field: string; message: string; code: string }>;
} {
  const errors: Array<{ field: string; message: string; code: string }> = [];

  if (step === 1) {
    if (!answers.sourceAdapter) {
      errors.push({
        field: "sourceAdapter",
        message: "Source adapter is required",
        code: "REQUIRED_FIELD",
      });
    }
  }

  if (step === 2) {
    if (!answers.targetAdapter) {
      errors.push({
        field: "targetAdapter",
        message: "Target adapter is required",
        code: "REQUIRED_FIELD",
      });
    }
  }

  if (step === 3) {
    const sourceAdapter = answers.sourceAdapter as string;
    const sourceConfig = answers.sourceConfig as Record<string, unknown>;
    const schema = getAdapterConfigSchema(sourceAdapter);

    if (schema) {
      for (const requiredField of schema.required) {
        if (!sourceConfig || !sourceConfig[requiredField]) {
          errors.push({
            field: `sourceConfig.${requiredField}`,
            message: `Required field '${requiredField}' is missing`,
            code: "REQUIRED_FIELD",
          });
        }
      }
    }
  }

  if (step === 4) {
    const targetAdapter = answers.targetAdapter as string;
    const targetConfig = answers.targetConfig as Record<string, unknown>;
    const schema = getAdapterConfigSchema(targetAdapter);

    if (schema) {
      for (const requiredField of schema.required) {
        if (!targetConfig || !targetConfig[requiredField]) {
          errors.push({
            field: `targetConfig.${requiredField}`,
            message: `Required field '${requiredField}' is missing`,
            code: "REQUIRED_FIELD",
          });
        }
      }
    }
  }

  if (step === 5) {
    const rules = answers.rules as unknown[];
    if (!rules || rules.length === 0) {
      errors.push({
        field: "rules",
        message: "At least one matching rule is required",
        code: "REQUIRED_FIELD",
      });
    }
  }

  return {
    valid: errors.length === 0,
    ...(errors.length > 0 && { errors }),
  };
}

function generateGuidance(step: number, answers: Record<string, unknown>): string {
  if (step === 1) {
    return "Select the platform where your transactions originate (e.g., Shopify orders, Stripe payments)";
  }

  if (step === 2) {
    const sourceAdapter = answers.sourceAdapter as string;
    return `Select the platform to match ${sourceAdapter} transactions against (e.g., QuickBooks for accounting, Stripe for payments)`;
  }

  if (step === 3) {
    return "Enter your source platform API credentials. These are stored securely and never exposed.";
  }

  if (step === 4) {
    return "Enter your target platform API credentials. These are stored securely and never exposed.";
  }

  if (step === 5) {
    return "Configure matching rules. Exact matches are most accurate, fuzzy matches handle variations, range matches account for timing differences.";
  }

  return "";
}

function generateJobConfig(answers: Record<string, unknown>): Record<string, unknown> {
  const config: Record<string, unknown> = {
    name: `${answers.sourceAdapter} → ${answers.targetAdapter} Reconciliation`,
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
  
  if (answers.schedule && typeof answers.schedule === 'object' && answers.schedule !== null) {
    config.schedule = answers.schedule;
  }
  
  return config;
}

function generateCLICommand(jobConfig: Record<string, unknown>): string {
  const source = jobConfig.source as Record<string, unknown> | undefined;
  const target = jobConfig.target as Record<string, unknown> | undefined;
  const sourceAdapter = source?.adapter ?? 'unknown';
  const sourceConfig = source?.config ?? {};
  const targetAdapter = target?.adapter ?? 'unknown';
  const targetConfig = target?.config ?? {};
  
  return `settler jobs create \\
  --name "${jobConfig.name}" \\
  --source-adapter ${sourceAdapter} \\
  --source-config '${JSON.stringify(sourceConfig)}' \\
  --target-adapter ${targetAdapter} \\
  --target-config '${JSON.stringify(targetConfig)}' \\
  --rules '${JSON.stringify(jobConfig.rules)}'`;
}

export { router as cliWizardRouter };
