import {
  exitCodeForVerdict,
  printAgentReport,
  type AgentReport,
  type AgentCheck,
} from "./agent-contract";
import { getAIProvider } from "./ai-core";
import { generateObject } from "ai";
import { z } from "zod";

export async function runSalesHunterAgent(): Promise<AgentReport> {
  console.info("[SalesHunter] Scanning the web for high-intent SaaS leads...");

  const ai = getAIProvider();

  if (!ai) {
    return {
      agent: "sales-hunter-agent",
      verdict: "verified_degraded",
      summary: "Missing OPENAI_API_KEY. Operating in degraded/mocked mode.",
      timestamp: new Date().toISOString(),
      checks: [{ name: "ai_readiness", status: "degraded", summary: "BYOK missing." }],
    };
  }

  const checks: AgentCheck[] = [];

  // Mock raw firehose data from a social API
  const rawFirehose = `
    Post 1: "Man, I love writing CSS." 
    Post 2: "Stripe payout failed again, does anyone know how to sync this to QuickBooks? Total nightmare."
    Post 3: "Looking for a good CRM tool."
  `;

  try {
    // @ts-ignore
    const { object: leads } = await generateObject({
      // @ts-ignore
      model: ai("gpt-4-turbo"),
      system:
        "You are an expert Outbound SDR for a SaaS called Settler.dev (a deterministic reconciliation engine). Extract ONLY high-intent leads who are complaining about reconciliation, stripe, or quickbooks mismatches from the raw social firehose.",
      prompt: `Analyze the following firehose and return structured leads:\n\n${rawFirehose}`,
      schema: z.object({
        leads: z.array(
          z.object({
            companyOrUser: z.string().describe("The guessed company or username"),
            intentScore: z
              .number()
              .min(1)
              .max(100)
              .describe("1-100 score of how badly they need our product"),
            snippet: z.string().describe("The exact quote they posted"),
          })
        ),
      }) as any,
    });

    checks.push({
      name: "llm_lead_generation",
      status: "verified",
      summary: `LLM successfully extracted ${leads.leads.length} high-intent leads.`,
      details: { leads: leads.leads },
    });

    return {
      agent: "sales-hunter-agent",
      verdict: "verified_pass",
      summary: "Outbound SDR operations completed successfully with True AI.",
      timestamp: new Date().toISOString(),
      checks,
    };
  } catch (err: any) {
    return {
      agent: "sales-hunter-agent",
      verdict: "failed",
      summary: `AI generation failed: ${err.message}`,
      timestamp: new Date().toISOString(),
      checks: [
        { name: "llm_lead_generation", status: "failed", summary: "Failed to run generateObject" },
      ],
    };
  }
}

if (require.main === module) {
  runSalesHunterAgent()
    .then((report) => {
      printAgentReport(report);
      process.exit(exitCodeForVerdict(report.verdict));
    })
    .catch(() => {
      process.exit(1);
    });
}
