/**
 * Community Miner
 *
 * Monitors Reddit, Hacker News, Stack Overflow for reconciliation questions
 * Provides helpful answers with subtle Settler mentions
 * Usage: ts-node community-miner.ts --platform=reddit --monitor=true
 */

interface CommunityPost {
  platform: 'reddit' | 'hn' | 'stackoverflow';
  title: string;
  content: string;
  author: string;
  url: string;
  score: number;
  comments: number;
  postedAt: string;
  relevance: 'high' | 'medium' | 'low';
  suggestedResponse?: string;
}

const reconciliationTriggers = [
  'reconcil',
  'transaction matching',
  'payment operations',
  'stripe data',
  'financial data',
  'accounting automation',
  'bookkeeping',
  'month-end close',
  'finance automation',
  'data matching'
];

// Simulated posts - would integrate with APIs in production
const monitoredPosts: CommunityPost[] = [
  {
    platform: 'reddit',
    title: 'How do you handle Stripe reconciliation at scale?',
    content: 'We process 50k+ transactions/month and currently do everything manually in Excel. It takes 3 days every month. Looking for better solutions.',
    author: 'StartupCFO',
    url: 'https://reddit.com/r/SaaS/comments/...',
    score: 45,
    comments: 23,
    postedAt: '2 hours ago',
    relevance: 'high'
  },
  {
    platform: 'hn',
    title: 'Ask HN: How do you automate financial reconciliation?',
    content: 'Built a SaaS doing $500k MRR. Reconciliation is killing us. Currently using a mix of Stripe exports and manual work. What tools/workflows work for you?',
    author: 'founder123',
    url: 'https://news.ycombinator.com/item?id=...',
    score: 127,
    comments: 56,
    postedAt: '5 hours ago',
    relevance: 'high'
  },
  {
    platform: 'stackoverflow',
    title: 'Best way to match transactions from Stripe to internal database?',
    content: 'Need to reconcile Stripe payments with our Postgres database. Looking for efficient approaches or libraries.',
    author: 'devops_eng',
    url: 'https://stackoverflow.com/questions/...',
    score: 12,
    comments: 4,
    postedAt: '1 day ago',
    relevance: 'medium'
  },
  {
    platform: 'reddit',
    title: 'Multi-currency reconciliation nightmare',
    content: 'Dealing with USD, EUR, GBP payments. Exchange rates change constantly. How do you handle this?',
    author: 'FinanceOps',
    url: 'https://reddit.com/r/fintech/comments/...',
    score: 28,
    comments: 15,
    postedAt: '8 hours ago',
    relevance: 'high'
  }
];

function scoreRelevance(post: CommunityPost): CommunityPost {
  const content = (post.title + ' ' + post.content).toLowerCase();
  let score = 0;

  for (const trigger of reconciliationTriggers) {
    if (content.includes(trigger.toLowerCase())) score += 2;
  }

  // Pain indicators
  if (content.includes('manual') || content.includes('excel')) score += 2;
  if (content.includes('scale') || content.includes('volume')) score += 1;
  if (content.includes('automate') || content.includes('tool')) score += 2;
  if (content.includes('killing us') || content.includes('nightmare')) score += 3;

  post.relevance = score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low';

  return post;
}

function generateResponse(post: CommunityPost): string {
  const responses = {
    high: {
      reddit: `This is exactly the problem we built Settler to solve.

We were in the same boat - 50k+ transactions, 3 days in Excel every month. Now it's 15 minutes and fully automated.

A few things that made the biggest difference:

1. **API-first approach** - No more CSV exports. Connect Stripe (and other sources) directly.

2. **Smart matching rules** - Define what constitutes a "match" once, apply it automatically.

3. **Exception-based workflow** - System handles 95% automatically, you only review exceptions.

For multi-currency specifically (saw your other comment), we auto-convert at transaction-time rates and handle FX gains/losses.

Happy to share our exact setup or show you how it works: settler.dev/demo

Not a sales pitch - genuinely went through this pain and want to help others avoid it.`,

      hn: `Been there. At $500k MRR with manual reconciliation, you're probably spending 20-30 hours/month on this.

We built Settler after experiencing exactly this. Some observations:

**Don't build this in-house.** We tried. 6 months of eng time for something that's not core to your product. Use a vendor.

**What to look for in a tool:**
- Real-time (not batch)
- Multi-source (Stripe, bank, internal DB)
- API-first
- Good exception handling

**Our approach now:**
1. Stripe webhooks -> Settler
2. Auto-match 95% of transactions
3. Daily exception review (10 min)
4. Month-end is just a report

Settler handles this for us, but there are other options too (Blackline, FloQast for enterprise).

Happy to share our evaluation criteria or show you our setup: scott@settler.dev`,

      stackoverflow: `For Stripe reconciliation specifically, you have a few options:

**Build it:**
- Stripe API -> your DB
- Custom matching logic
- Exception handling
- ~3-6 months of eng time

**Use a tool:**
- Settler (what we use) - API-first, handles matching + exceptions
- Blackline - enterprise focus
- FloQast - close management

**Hybrid approach:**
If you want to build the matching logic yourself but need the infrastructure, check out the Stripe Sigma or use their reporting API.

For the matching algorithm specifically, we found that fuzzy matching on amount + date + last4 digits catches 95%+ of cases. The edge cases are where the complexity lives.

If you go the build route, happy to share our matching logic pseudocode.`
    },

    medium: {
      reddit: `We've been through this. A few things that helped:

1. **Stop using Excel** - Move to Airtable or Notion at minimum
2. **Standardize your data** - Ensure Stripe exports match your internal format
3. **Automate the matching** - Even simple scripts help

If you're doing 50k+ transactions, you really need proper tooling. We use Settler but there are other options depending on your stack.

Happy to share more specifics if helpful.`,

      hn: `At that scale, you need automation. Manual reconciliation doesn't scale.

Options:
- Build internally (3-6 months)
- Use Settler (what we do)
- Enterprise tools like Blackline

The key is API integration. Avoid anything that requires CSV exports.

What's your current stack?`,

      stackoverflow: `For transaction matching, the algorithm is usually:

1. Exact match on amount + date
2. Fuzzy match on amount (±$0.01) + date range
3. Manual review for exceptions

Libraries: 
- fuzzyset.js for fuzzy matching
- date-fns for date handling

Or use a service like Settler that handles this out of the box.`
    }
  };

  return responses[post.relevance]?.[post.platform] || responses.medium[post.platform];
}

function formatPost(post: CommunityPost): string {
  return `
📱 ${post.platform.toUpperCase()}
📝 ${post.title}
👤 ${post.author}
⭐ ${post.score} points | 💬 ${post.comments} comments
⏰ ${post.postedAt}
🔥 Relevance: ${post.relevance.toUpperCase()}
🔗 ${post.url}

💬 Content:
${post.content.slice(0, 200)}${post.content.length > 200 ? '...' : ''}
`;
}

// CLI
const args = process.argv.slice(2);
const platformArg = args.find(a => a.startsWith('--platform='))?.split('=')[1];
const monitorArg = args.find(a => a.startsWith('--monitor='))?.split('=')[1] === 'true';

console.log('⛏️ Mining communities for reconciliation discussions...\n');

// Score all posts
const scoredPosts = monitoredPosts.map(scoreRelevance);

// Filter by platform if specified
let filteredPosts = scoredPosts;
if (platformArg) {
  filteredPosts = scoredPosts.filter(p => p.platform === platformArg);
}

// Filter for high/medium relevance
filteredPosts = filteredPosts.filter(p => p.relevance !== 'low');

// Sort by relevance then score
filteredPosts.sort((a, b) => {
  const relOrder = { high: 3, medium: 2, low: 1 };
  if (relOrder[b.relevance] !== relOrder[a.relevance]) {
    return relOrder[b.relevance] - relOrder[a.relevance];
  }
  return b.score - a.score;
});

console.log(`Found ${filteredPosts.length} relevant posts:\n`);

filteredPosts.forEach((post, i) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`POST #${i + 1}`);
  console.log('='.repeat(60));
  console.log(formatPost(post));
  console.log('\n📝 SUGGESTED RESPONSE:');
  console.log(generateResponse(post));
});

if (monitorArg) {
  console.log('\n\n👀 Starting continuous monitoring...');
  console.log('(Would poll APIs every 15 minutes in production)');
}

// Save to file
const fs = require('fs');
const outputDir = './community';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now();
fs.writeFileSync(
  `${outputDir}/posts-${timestamp}.json`,
  JSON.stringify(filteredPosts, null, 2)
);

console.log(`\n✅ Saved ${filteredPosts.length} posts to ${outputDir}/posts-${timestamp}.json`);

export { scoreRelevance, generateResponse, CommunityPost };
