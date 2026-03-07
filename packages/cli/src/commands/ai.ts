import { Command } from "commander";
import { AICopilot, ConnectorRegistry, CopilotRequest } from "../lib/platform-extension";

type AIProviderOption = "openai" | "anthropic" | "local" | "mcp";

interface BaseAIOptions {
  provider: AIProviderOption;
  model: string;
  prompt: string;
  connector?: string;
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function getCopilot(): AICopilot {
  return new AICopilot(new ConnectorRegistry());
}

function buildRequest(options: BaseAIOptions): CopilotRequest {
  return {
    provider: options.provider,
    model: options.model,
    prompt: options.prompt,
    connectorHint: options.connector,
  };
}

export const aiCommand = new Command("ai").description("AI execution copilot (advisory + audited)");

aiCommand
  .command("suggest-workflow")
  .requiredOption("--prompt <text>", "Workflow prompt")
  .option("--provider <provider>", "openai|anthropic|local|mcp", "openai")
  .option("--model <model>", "Model name", "gpt-5-mini")
  .option("--connector <name>", "Connector hint for guidance")
  .action((options: BaseAIOptions) => {
    const result = getCopilot().suggestWorkflow(buildRequest(options));
    printJson(result);
  });

aiCommand
  .command("analyze-execution")
  .requiredOption("--prompt <text>", "Execution summary to analyze")
  .option("--provider <provider>", "openai|anthropic|local|mcp", "anthropic")
  .option("--model <model>", "Model name", "claude-sonnet")
  .option("--connector <name>", "Connector hint for guidance")
  .action((options: BaseAIOptions) => {
    const result = getCopilot().analyzeExecution(buildRequest(options));
    printJson(result);
  });

aiCommand
  .command("suggest-policy")
  .requiredOption("--prompt <text>", "Policy context")
  .option("--provider <provider>", "openai|anthropic|local|mcp", "local")
  .option("--model <model>", "Model name", "llama3.1")
  .option("--connector <name>", "Connector hint for guidance")
  .action((options: BaseAIOptions) => {
    const result = getCopilot().suggestPolicy(buildRequest(options));
    printJson(result);
  });

aiCommand
  .command("detect-anomaly")
  .requiredOption("--prompt <text>", "Telemetry summary")
  .option("--provider <provider>", "openai|anthropic|local|mcp", "mcp")
  .option("--model <model>", "Model name", "mcp-runtime")
  .option("--connector <name>", "Connector hint for guidance")
  .action((options: BaseAIOptions) => {
    const result = getCopilot().detectAnomaly(buildRequest(options));
    printJson(result);
  });

aiCommand
  .command("connector-guidance")
  .requiredOption("--prompt <text>", "Connector integration prompt")
  .option("--provider <provider>", "openai|anthropic|local|mcp", "openai")
  .option("--model <model>", "Model name", "gpt-5-mini")
  .requiredOption("--connector <name>", "Connector name from registry")
  .action((options: BaseAIOptions) => {
    const result = getCopilot().connectorGuidance(buildRequest(options));
    printJson(result);
  });

aiCommand
  .command("audit")
  .description("List AI audit trail entries")
  .action(() => {
    printJson(getCopilot().readAuditTrail());
  });
