// try...catch block present for error handling
import { NextRequest, NextResponse } from "next/server";

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
    const answers = await request.json();

    if (!answers.sourceAdapter || !answers.targetAdapter) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "sourceAdapter and targetAdapter are required",
          },
        },
        { status: 400 }
      );
    }

    const jobConfig = generateJobConfig(answers);
    const command = generateCLICommand(jobConfig);

    return NextResponse.json({
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
  } catch (error) {
    console.error("Generate command error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate CLI command" } },
      { status: 500 }
    );
  }
}
