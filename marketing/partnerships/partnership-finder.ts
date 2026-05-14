/**
 * Partnership Opportunity Finder
 *
 * Identifies integration partners, co-marketing opportunities
 * Usage: ts-node partnership-finder.ts --type=integration
 */

interface Partner {
  name: string;
  category: 'integration' | 'co-marketing' | 'integration';
  website: string;
  description: string;
  relevanceScore: number;
  contactPerson?: string;
  fit: 'strategic' | 'tactical' | 'exploratory';
  pitch: string;
}

const integrationTargets = [
  {
    name: 'QuickBooks',
    category: 'integration' as const,
    website: 'quickbooks.intuit.com',
    description: 'Accounting software for small businesses',
    relevanceScore: 95,
    fit: 'strategic' as const,
    pitch: 'Seamless reconciliation from Settler → QuickBooks. Thousands of shared customers.'
  },
  {
    name: 'Xero',
    category: 'integration' as const,
    website: 'xero.com',
    description: 'Cloud accounting software',
    relevanceScore: 90,
    fit: 'strategic' as const,
    pitch: 'Real-time reconciliation sync to Xero. Fast-growing SaaS customer base.'
  },
  {
    name: 'NetSuite',
    category: 'integration' as const,
    website: 'netsuite.com',
    description: 'ERP for mid-market',
    relevanceScore: 85,
    fit: 'tactical' as const,
    pitch: 'Enterprise reconciliation automation for NetSuite customers.'
  },
  {
    name: 'Sage',
    category: 'integration' as const,
    website: 'sage.com',
    description: 'Accounting and ERP software',
    relevanceScore: 80,
    fit: 'tactical' as const,
    pitch: 'UK/EU market expansion through Sage partnership.'
  }
];

const coMarketingTargets = [
  {
    name: 'Stripe Atlas',
    category: 'co-marketing' as const,
    website: 'stripe.com/atlas',
    description: 'Startup incorporation platform',
    relevanceScore: 90,
    fit: 'strategic' as const,
    pitch: 'Offer reconciliation as part of Atlas startup package. Shared customer journey.'
  },
  {
    name: 'Mercury',
    category: 'co-marketing' as const,
    website: 'mercury.com',
    description: 'Banking for startups',
    relevanceScore: 88,
    fit: 'strategic' as const,
    pitch: 'Banking + reconciliation bundle for startup finance stack.'
  },
  {
    name: 'Pilot',
    category: 'co-marketing' as const,
    website: 'pilot.com',
    description: 'Bookkeeping for startups',
    relevanceScore: 85,
    fit: 'strategic' as const,
    pitch: 'Bookkeeping + automation partnership. Non-competing, complementary.'
  },
  {
    name: 'Brex',
    category: 'co-marketing' as const,
    website: 'brex.com',
    description: 'Corporate card for startups',
    relevanceScore: 82,
    fit: 'tactical' as const,
    pitch: 'Complete finance stack: Brex cards + Settler reconciliation.'
  }
];

const podcastTargets = [
  {
    name: 'The SaaS Podcast',
    category: 'media' as const,
    website: 'thesaaspodcast.com',
    description: 'Interviews with SaaS founders',
    relevanceScore: 80,
    fit: 'tactical' as const,
    pitch: 'Topic: "Building a reconciliation engine that processes $1B+ transactions"'
  },
  {
    name: 'Fintech Insider',
    category: 'media' as const,
    website: 'fintechinsider.com',
    description: 'Fintech industry podcast',
    relevanceScore: 85,
    fit: 'strategic' as const,
    pitch: 'Topic: "The invisible infrastructure of payments: reconciliation"'
  },
  {
    name: 'How I Built This',
    category: 'media' as const,
    website: 'npr.org/howibuiltthis',
    description: 'NPR founder stories',
    relevanceScore: 75,
    fit: 'exploratory' as const,
    pitch: 'Longer-term target. Story: From zero to reconciliation platform.'
  }
];

function generateOutreachEmail(partner: Partner): string {
  const templates = {
    integration: `
Subject: Integration idea: ${partner.name} + Settler

Hi [Name],

I've been following ${partner.name} for a while - impressive growth in the [accounting/payments] space.

Quick question: Do you have customers asking about automated reconciliation? We hear it constantly from ${partner.name} users.

We built Settler to solve exactly this. Think of us as the "reconciliation layer" that sits between payment processors and accounting systems.

A few stats:
- Process $1B+ monthly
- 500+ customers
- Average time saved: 20 hours/week per customer

Would an integration make sense? Happy to discuss technical details or jump on a quick call.

Best,
Scott
settler.dev

P.S. - We're already integrated with ${partner.name === 'QuickBooks' ? 'Xero and Stripe' : 'QuickBooks and Stripe'}. ${partner.name} would complete the picture.
    `,
    'co-marketing': `
Subject: Partnership idea: ${partner.name} + Settler

Hi [Name],

Love what you all are building at ${partner.name}. The ${partner.name === 'Mercury' ? 'banking for startups' : 'bookkeeping for startups'} positioning is spot-on.

We serve a similar customer base (SaaS companies, 20-500 employees) but solve a different problem: reconciliation automation.

Idea: Co-marketing campaign for "The Modern Finance Stack"
- ${partner.name} for [banking/bookkeeping]
- Settler for reconciliation
- Joint webinar + co-branded guide

We've done similar with Stripe and saw great engagement. Happy to share the playbook.

Worth a conversation?

Scott
settler.dev
    `,
    media: `
Subject: Guest pitch: ${partner.name}

Hi [Host Name],

Long-time listener of ${partner.name}. Your episode on [previous topic] really resonated - we face similar challenges at Settler.

I'd love to share our story:
- Building reconciliation infrastructure for $1B+ in monthly transactions
- Why most companies get reconciliation wrong
- The technical challenges of real-time financial data matching

Recent angles that might resonate:
- "The invisible infrastructure of fintech"
- "Why your books are probably wrong (and how to fix them)"
- "Scaling financial operations from 0 to 500 employees"

Happy to work with your format and prep however you need.

Scott
Founder, Settler
    `
  };

  return templates[partner.category] || templates.integration;
}

function formatPartner(partner: Partner): string {
  return `
🏢 ${partner.name}
   Category: ${partner.category}
   Fit: ${partner.fit.toUpperCase()}
   Score: ${partner.relevanceScore}/100
   Website: ${partner.website}
   
   Pitch: ${partner.pitch}
`;
}

// CLI
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith('--type='))?.split('=')[1];

console.log('🤝 Identifying partnership opportunities...\n');

let allPartners: Partner[] = [
  ...integrationTargets,
  ...coMarketingTargets,
  ...podcastTargets
];

if (typeArg) {
  allPartners = allPartners.filter(p => p.category === typeArg);
}

// Sort by relevance
allPartners.sort((a, b) => b.relevanceScore - a.relevanceScore);

console.log(`Found ${allPartners.length} partnership opportunities:\n`);

// Group by priority
const strategic = allPartners.filter(p => p.fit === 'strategic');
const tactical = allPartners.filter(p => p.fit === 'tactical');
const exploratory = allPartners.filter(p => p.fit === 'exploratory');

console.log('\n🎯 STRATEGIC (Prioritize first):\n');
strategic.forEach(p => console.log(formatPartner(p)));

console.log('\n📋 TACTICAL (Good to have):\n');
tactical.forEach(p => console.log(formatPartner(p)));

console.log('\n🔍 EXPLORATORY (Long-term):\n');
exploratory.forEach(p => console.log(formatPartner(p)));

// Generate outreach emails for top 3 strategic
console.log('\n' + '='.repeat(60));
console.log('SAMPLE OUTREACH EMAILS (Top 3 Strategic)\n');

strategic.slice(0, 3).forEach((partner, i) => {
  console.log(`\n--- Email ${i + 1}: ${partner.name} ---`);
  console.log(generateOutreachEmail(partner));
});

// Save to file
const fs = require('fs');
const outputDir = './partnerships';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now();
fs.writeFileSync(
  `${outputDir}/partners-${timestamp}.json`,
  JSON.stringify(allPartners, null, 2)
);

console.log(`\n✅ Saved ${allPartners.length} partners to ${outputDir}/partners-${timestamp}.json`);

export { generateOutreachEmail, Partner };
