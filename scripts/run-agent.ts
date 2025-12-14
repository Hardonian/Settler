/**
 * Run a specific autonomous agent manually
 * Usage: npx tsx scripts/run-agent.ts <agent-type>
 * Example: npx tsx scripts/run-agent.ts strategic_governor
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const agentType = process.argv[2];

if (!agentType) {
  console.error("Usage: npx tsx scripts/run-agent.ts <agent-type>");
  console.error("\nAvailable agents:");
  console.error("  - strategic_governor");
  console.error("  - architecture_sentinel");
  console.error("  - user_intent_synthesizer");
  console.error("  - preemptive_support");
  console.error("  - organic_growth");
  console.error("  - autonomous_cfo");
  console.error("  - release_gatekeeper");
  process.exit(1);
}

const agentFunctionMap: Record<string, string> = {
  strategic_governor: "strategic-governor-agent",
  architecture_sentinel: "architecture-sentinel-agent",
  user_intent_synthesizer: "user-intent-synthesizer-agent",
  preemptive_support: "preemptive-support-agent",
  organic_growth: "organic-growth-agent",
  autonomous_cfo: "autonomous-cfo-agent",
  release_gatekeeper: "release-gatekeeper-agent",
};

const functionName = agentFunctionMap[agentType];

if (!functionName) {
  console.error(`❌ Unknown agent type: ${agentType}`);
  process.exit(1);
}

console.log(`🚀 Running ${agentType} agent...`);

const startTime = Date.now();

fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
})
  .then(async (response) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const text = await response.text();

    if (!response.ok) {
      console.error(`❌ Agent failed (${response.status}):`);
      console.error(text);
      process.exit(1);
    }

    try {
      const data = JSON.parse(text);
      console.log(`✅ Agent completed in ${duration}s`);
      console.log("\nResult:", JSON.stringify(data, null, 2));
    } catch {
      console.log(`✅ Agent completed in ${duration}s`);
      console.log("\nResponse:", text);
    }
  })
  .catch((error) => {
    console.error(`❌ Failed to run agent: ${error.message}`);
    process.exit(1);
  });
