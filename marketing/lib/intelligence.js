function generateCompetitorIntel() {
  return {
    competitors: 3,
    changes: [
      {
        type: "pricing",
        competitor: "BlackLine",
        impact: "high",
        description: "Increased enterprise pricing by 15%",
      },
      {
        type: "hiring",
        competitor: "FloQast",
        impact: "high",
        description: "Hiring 50+ sales reps",
      },
    ],
  };
}

function generateCompetitorReport(intel, timestamp) {
  return `# Competitor Intelligence Report
Generated: ${timestamp}

## Summary
- Competitors tracked: ${intel.competitors}
- Changes detected: ${intel.changes.length}

## Recent Changes
${intel.changes.map((c) => `- **${c.competitor}**: ${c.description} (${c.impact} impact)`).join("\n")}

## Recommended Actions
1. Target enterprise customers with "Switch and Save" campaign
2. Accelerate partnership strategy
3. Update sales battle cards
`;
}

function generateCustomerVoice() {
  return [
    {
      source: "G2",
      sentiment: "negative",
      text: "BlackLine is powerful but took 8 months to implement.",
      painPoints: ["Long implementation"],
    },
    {
      source: "Reddit",
      sentiment: "negative",
      text: "We do everything in Excel still. Looked at FloQast but too expensive.",
      painPoints: ["Manual process", "Pricing"],
    },
    {
      source: "Twitter",
      sentiment: "negative",
      text: "Reconciliation day is the worst day. 3 people, 2 days, 1000s of transactions.",
      painPoints: ["Time consuming"],
    },
  ];
}

function generateContentIdeas(voice, timestamp) {
  return `# Content Ideas from Customer Voice
Generated: ${timestamp}

## Top Pain Points
1. Long implementation times
2. High pricing
3. Manual Excel processes
4. Time-consuming reconciliation

## Recommended Content
1. Blog: "How to escape Excel hell: A guide to reconciliation automation"
2. Blog: "The hidden cost of manual reconciliation: Time waste"
3. Comparison: "Settler vs BlackLine: Implementation time"
4. Case study: "How [Company] saved 20 hours/week"
5. Guide: "Reconciliation tool evaluation checklist"
`;
}

module.exports = {
  generateCompetitorIntel,
  generateCompetitorReport,
  generateCustomerVoice,
  generateContentIdeas,
};
