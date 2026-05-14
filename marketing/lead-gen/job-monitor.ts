/**
 * Job Posting Monitor
 *
 * Monitors job boards for reconciliation/finance automation mentions
 * High intent signal: companies hiring for reconciliation roles
 * Usage: ts-node job-monitor.ts --keywords="reconciliation,finance automation"
 */

interface JobPosting {
  company: string;
  title: string;
  description: string;
  location: string;
  postedAt: string;
  source: string;
  url: string;
  signal: 'high' | 'medium' | 'low';
  keywords: string[];
}

const highIntentKeywords = [
  'reconciliation',
  'finance automation',
  'payment operations',
  'transaction matching',
  'financial data',
  'stripe',
  'accounting automation',
  'finance systems'
];

const mediumIntentKeywords = [
  'financial analyst',
  'finance operations',
  'accounting manager',
  'controller',
  'finance systems analyst'
];

// Simulated job postings - would integrate with APIs in production
const jobPostings: JobPosting[] = [
  {
    company: 'FastPay',
    title: 'Senior Finance Operations Manager',
    description: 'Looking for someone to build our reconciliation processes from scratch. Experience with high-volume transaction matching required.',
    location: 'San Francisco, CA',
    postedAt: '2 days ago',
    source: 'LinkedIn',
    url: 'https://linkedin.com/jobs/...',
    signal: 'high',
    keywords: ['reconciliation', 'transaction matching']
  },
  {
    company: 'CloudBilling',
    title: 'Payment Operations Specialist',
    description: 'Manage payment reconciliation across multiple processors including Stripe and PayPal.',
    location: 'Remote',
    postedAt: '1 day ago',
    source: 'AngelList',
    url: 'https://angel.co/...',
    signal: 'high',
    keywords: ['reconciliation', 'stripe', 'paypal']
  },
  {
    company: 'SaaSPlatform',
    title: 'Financial Analyst',
    description: 'Month-end close, reconciliation, and financial reporting.',
    location: 'New York, NY',
    postedAt: '3 days ago',
    source: 'LinkedIn',
    url: 'https://linkedin.com/jobs/...',
    signal: 'medium',
    keywords: ['reconciliation']
  },
  {
    company: 'MarketplaceX',
    title: 'Director of Finance',
    description: 'Build finance function including automated reconciliation for marketplace transactions.',
    location: 'Austin, TX',
    postedAt: '5 hours ago',
    source: 'LinkedIn',
    url: 'https://linkedin.com/jobs/...',
    signal: 'high',
    keywords: ['automated reconciliation', 'marketplace', 'transactions']
  }
];

function scoreJobPosting(posting: JobPosting): JobPosting {
  let score = 0;

  const description = posting.description.toLowerCase();

  // High intent keywords
  for (const keyword of highIntentKeywords) {
    if (description.includes(keyword)) score += 3;
  }

  // Medium intent keywords
  for (const keyword of mediumIntentKeywords) {
    if (description.includes(keyword)) score += 1;
  }

  // Seniority bonus
  if (posting.title.toLowerCase().includes('director') ||
      posting.title.toLowerCase().includes('vp') ||
      posting.title.toLowerCase().includes('head')) {
    score += 2;
  }

  // Recency bonus
  if (posting.postedAt.includes('hour')) score += 2;
  if (posting.postedAt.includes('day')) score += 1;

  posting.signal = score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low';

  return posting;
}

function generateOutreachMessage(posting: JobPosting): string {
  const messages = {
    high: `
Subject: Saw ${posting.company}'s ${posting.title} posting

Hi there,

I saw ${posting.company} is hiring a ${posting.title} and specifically mentioned ${posting.keywords.join(', ')}.

Instead of building this in-house over 6+ months, what if you could have it running in 5 minutes?

Settler automates reconciliation for companies like ${posting.company}. We've helped teams save 15-20 hours/week.

Happy to show you how it works - no sales pitch, just a quick demo.

Best,
Scott
settler.dev/demo
    `,
    medium: `
Subject: Quick thought on ${posting.company}'s finance hiring

Hi,

Noticed ${posting.company} is expanding the finance team. Congrats on the growth!

Quick question: Are you planning to build reconciliation automation in-house, or are you evaluating vendors?

We work with fast-growing companies to automate reconciliation - might be worth a conversation.

 settler.dev/demo

Scott
    `
  };

  return messages[posting.signal] || messages.medium;
}

function formatPosting(posting: JobPosting): string {
  return `
🏢 ${posting.company}
💼 ${posting.title}
📍 ${posting.location}
⏰ Posted: ${posting.postedAt}
🔥 Signal: ${posting.signal.toUpperCase()}
🏷️ Keywords: ${posting.keywords.join(', ')}
🔗 ${posting.url}
`;
}

// CLI
const args = process.argv.slice(2);
const keywordsArg = args.find(a => a.startsWith('--keywords='))?.split('=')[1];
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1] || './jobs';

console.log('🔍 Scanning job postings for intent signals...\n');

// Score all postings
const scoredPostings = jobPostings.map(scoreJobPosting);

// Filter by keywords if provided
let filteredPostings = scoredPostings;
if (keywordsArg) {
  const keywords = keywordsArg.split(',').map(k => k.trim().toLowerCase());
  filteredPostings = scoredPostings.filter(p =>
    keywords.some(k => p.keywords.some(pk => pk.toLowerCase().includes(k)))
  );
}

// Sort by signal strength
filteredPostings.sort((a, b) => {
  const order = { high: 3, medium: 2, low: 1 };
  return order[b.signal] - order[a.signal];
});

console.log(`Found ${filteredPostings.length} relevant job postings:\n`);

filteredPostings.forEach(p => {
  console.log(formatPosting(p));
  console.log('\n--- Outreach Message ---');
  console.log(generateOutreachMessage(p));
  console.log('\n' + '='.repeat(60) + '\n');
});

// Save to file
const fs = require('fs');
if (!fs.existsSync(outputArg)) {
  fs.mkdirSync(outputArg, { recursive: true });
}

const timestamp = Date.now();
fs.writeFileSync(
  `${outputArg}/jobs-${timestamp}.json`,
  JSON.stringify(filteredPostings, null, 2)
);

console.log(`✅ Saved ${filteredPostings.length} job postings to ${outputArg}/jobs-${timestamp}.json`);

export { scoreJobPosting, generateOutreachMessage, JobPosting };
