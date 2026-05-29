/**
 * Competitor Intelligence Monitor
 *
 * Tracks competitor activities, pricing, announcements
 * Usage: ts-node competitor-monitor.ts --competitor=blackline
 */

interface Competitor {
  name: string;
  website: string;
  category: "direct" | "indirect" | "enterprise";
  lastUpdate: string;
  changes: Change[];
}

interface Change {
  type: "pricing" | "feature" | "announcement" | "hiring" | "funding";
  description: string;
  date: string;
  impact: "high" | "medium" | "low";
  recommendedAction?: string;
}

const competitors: Competitor[] = [
  {
    name: "BlackLine",
    website: "blackline.com",
    category: "enterprise",
    lastUpdate: "2026-04-08",
    changes: [
      {
        type: "pricing",
        description: "Increased enterprise pricing by 15%",
        date: "2026-03-15",
        impact: "high",
        recommendedAction: 'Target enterprise customers with "Switch and Save" campaign',
      },
      {
        type: "feature",
        description: "Launched AI-powered matching",
        date: "2026-02-20",
        impact: "medium",
        recommendedAction: "Develop competitive comparison content",
      },
    ],
  },
  {
    name: "FloQast",
    website: "floqast.com",
    category: "direct",
    lastUpdate: "2026-04-09",
    changes: [
      {
        type: "announcement",
        description: "Partnership with Workiva announced",
        date: "2026-04-05",
        impact: "medium",
        recommendedAction: "Monitor partnership traction, prepare counter-messaging",
      },
      {
        type: "hiring",
        description: "Hiring 50+ sales reps",
        date: "2026-03-28",
        impact: "high",
        recommendedAction: "Accelerate partnership and channel strategy",
      },
    ],
  },
  {
    name: "AutoRek",
    website: "autorek.com",
    category: "direct",
    lastUpdate: "2026-04-07",
    changes: [
      {
        type: "funding",
        description: "Raised $12M Series B",
        date: "2026-03-10",
        impact: "high",
        recommendedAction: "Prepare competitive battle cards for sales team",
      },
    ],
  },
];

function analyzeCompetitor(competitor: Competitor): string {
  let output = `
🏢 ${competitor.name}
   Category: ${competitor.category}
   Website: ${competitor.website}
   Last Update: ${competitor.lastUpdate}
   
   Recent Changes:
`;

  competitor.changes.forEach((change) => {
    output += `
   📌 ${change.type.toUpperCase()} (${change.impact})
      ${change.description}
      Date: ${change.date}
      → Action: ${change.recommendedAction}
`;
  });

  return output;
}

function generateBattleCard(competitor: Competitor): string {
  const cards: Record<string, string> = {
    BlackLine: `
# BlackLine Competitive Battle Card

## Overview
Enterprise reconciliation, heavy implementation, high cost

## Their Strengths
- Brand recognition in enterprise
- Comprehensive feature set
- Deep ERP integrations

## Their Weaknesses
- Expensive ($50k+ implementation)
- 6-month implementation
- Poor UX
- Slow support

## Our Advantages
- 5-minute setup vs 6 months
- 10x cheaper
- Modern API-first architecture
- Real-time processing

## Objection Handling
"BlackLine is the industry standard"
→ "For Fortune 500s with 18-month procurement cycles. For modern teams, Settler delivers faster value."

"We need all those features"
→ "80% of BlackLine features go unused. We focused on the 20% that matter."
    `,
    FloQast: `
# FloQast Competitive Battle Card

## Overview
Close management + reconciliation, mid-market focus

## Their Strengths
- Strong close management features
- Good UX
- Growing fast

## Their Weaknesses
- Reconciliation is secondary feature
- Limited data source integrations
- Still requires manual work

## Our Advantages
- Reconciliation-first (not close management)
- 50+ integrations
- Fully automated matching

## Positioning
"FloQast helps you manage the close. Settler eliminates the reconciliation work before close even starts."
    `,
    AutoRek: `
# AutoRek Competitive Battle Card

## Overview
UK-based reconciliation, growing fast with fresh funding

## Their Strengths
- Modern tech stack
- Growing team
- Recent funding

## Their Weaknesses
- UK/EU focused (limited US presence)
- Smaller customer base
- Less mature product

## Our Advantages
- US market leader
- More integrations
- Proven at scale ($1B+ monthly)

## Positioning
"AutoRek is a good option for UK-only companies. For global businesses, Settler offers broader coverage."
    `,
  };

  return (
    cards[competitor.name] ||
    `# ${competitor.name} Battle Card\n\n[Add detailed competitive analysis]`
  );
}

function generateMarketIntel(): string {
  const allChanges = competitors.flatMap((c) => c.changes);
  const highImpactChanges = allChanges.filter((c) => c.impact === "high");

  return `
📊 MARKET INTELLIGENCE SUMMARY
==============================

Competitors Tracked: ${competitors.length}
Total Changes (30 days): ${allChanges.length}
High-Impact Changes: ${highImpactChanges.length}

Key Trends:
${highImpactChanges.map((c) => `- ${c.type}: ${c.description}`).join("\n")}

Recommended Actions This Week:
1. ${highImpactChanges[0]?.recommendedAction || "Monitor competitive landscape"}
2. Update sales battle cards
3. Brief customer success on competitive positioning

Next Week:
- Analyze pricing changes impact
- Monitor new funding announcements
- Track hiring trends (expansion indicators)
`;
}

// CLI
const args = process.argv.slice(2);
const competitorArg = args.find((a) => a.startsWith("--competitor="))?.split("=")[1];

console.log("🔍 Competitor Intelligence Report\n");

if (competitorArg) {
  const competitor = competitors.find((c) => c.name.toLowerCase() === competitorArg.toLowerCase());
  if (competitor) {
    console.log(analyzeCompetitor(competitor));
    console.log("\n--- BATTLE CARD ---\n");
    console.log(generateBattleCard(competitor));
  } else {
    console.log(`Competitor "${competitorArg}" not found.`);
  }
} else {
  console.log(generateMarketIntel());
  console.log("\n--- DETAILED COMPETITOR ANALYSIS ---\n");
  competitors.forEach((c) => console.log(analyzeCompetitor(c)));
}

// Save reports
const fs = require("fs");
const outputDir = "./intelligence";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now();
fs.writeFileSync(
  `${outputDir}/competitors-${timestamp}.json`,
  JSON.stringify(competitors, null, 2)
);

console.log(`\n✅ Saved intelligence to ${outputDir}/competitors-${timestamp}.json`);

export { analyzeCompetitor, generateBattleCard };
