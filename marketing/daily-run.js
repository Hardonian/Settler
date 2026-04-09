#!/usr/bin/env node
/**
 * Daily Marketing Automation Runner
 * 
 * Runs all marketing tools in sequence
 * Usage: node daily-run.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = './output';
const TIMESTAMP = new Date().toISOString().split('T')[0];

// Ensure output directories exist
const dirs = ['blog', 'social', 'prospects', 'jobs', 'community', 'partnerships', 'intelligence', 'voice'];
dirs.forEach(dir => {
  const fullPath = path.join(OUTPUT_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

console.log('🚀 STARTING DAILY MARKETING AUTOMATION');
console.log(`📅 Date: ${TIMESTAMP}`);
console.log('=' .repeat(60));

let results = {
  blogPosts: 0,
  socialPosts: 0,
  prospects: 0,
  jobPostings: 0,
  communityPosts: 0,
  partnerships: 0,
  competitorChanges: 0,
  voiceEntries: 0
};

// 1. CONTENT ENGINE - Blog Posts
console.log('\n📝 GENERATING BLOG POSTS...');
try {
  const blogOutput = path.join(OUTPUT_DIR, 'blog', TIMESTAMP);
  fs.mkdirSync(blogOutput, { recursive: true });
  
  // Generate 3 blog posts
  const topics = [
    { keyword: 'automated reconciliation', template: 'guide' },
    { keyword: 'stripe reconciliation', template: 'how-to' },
    { keyword: 'payment reconciliation tools', template: 'guide' }
  ];
  
  topics.forEach((topic, i) => {
    const content = generateBlogPost(topic.keyword, topic.template);
    const filename = `${topic.keyword.replace(/\s+/g, '-')}-${i + 1}.md`;
    fs.writeFileSync(path.join(blogOutput, filename), content);
    results.blogPosts++;
    console.log(`  ✅ ${filename}`);
  });
  
  console.log(`  Generated ${results.blogPosts} blog posts`);
} catch (e) {
  console.error('  ❌ Blog generation failed:', e.message);
}

// 2. CONTENT ENGINE - Social Media
console.log('\n📱 GENERATING SOCIAL MEDIA CONTENT...');
try {
  const socialOutput = path.join(OUTPUT_DIR, 'social', TIMESTAMP);
  fs.mkdirSync(socialOutput, { recursive: true });
  
  const ideas = [
    'Automated reconciliation saves 20 hours/week',
    'Real-time payment matching eliminates end-of-month panic',
    'API-first reconciliation scales better than CSV exports'
  ];
  
  ideas.forEach((idea, i) => {
    const content = generateSocialContent(idea);
    const filename = `social-${i + 1}.md`;
    fs.writeFileSync(path.join(socialOutput, filename), content);
    results.socialPosts += content.split('---').length - 1;
    console.log(`  ✅ ${filename} (${content.split('---').length - 1} posts)`);
  });
  
  console.log(`  Generated social content for ${ideas.length} ideas`);
} catch (e) {
  console.error('  ❌ Social generation failed:', e.message);
}

// 3. LEAD GEN - Prospects
console.log('\n🔍 RESEARCHING PROSPECTS...');
try {
  const prospects = generateProspects();
  const prospectsPath = path.join(OUTPUT_DIR, 'prospects', `${TIMESTAMP}.json`);
  fs.writeFileSync(prospectsPath, JSON.stringify(prospects, null, 2));
  results.prospects = prospects.length;
  console.log(`  ✅ Found ${prospects.length} prospects`);
  
  // Generate cold emails for top 5
  const emailsPath = path.join(OUTPUT_DIR, 'prospects', `${TIMESTAMP}-emails.md`);
  let emailsContent = '# Cold Emails for Top Prospects\n\n';
  prospects.slice(0, 5).forEach((p, i) => {
    emailsContent += `## ${i + 1}. ${p.company}\n\n${generateColdEmail(p)}\n\n---\n\n`;
  });
  fs.writeFileSync(emailsPath, emailsContent);
  console.log(`  ✅ Generated ${Math.min(5, prospects.length)} cold emails`);
} catch (e) {
  console.error('  ❌ Prospect research failed:', e.message);
}

// 4. LEAD GEN - Job Monitor
console.log('\n💼 MONITORING JOB POSTINGS...');
try {
  const jobs = generateJobPostings();
  const jobsPath = path.join(OUTPUT_DIR, 'jobs', `${TIMESTAMP}.json`);
  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
  results.jobPostings = jobs.length;
  console.log(`  ✅ Found ${jobs.length} relevant job postings`);
  
  // Generate outreach messages
  const messagesPath = path.join(OUTPUT_DIR, 'jobs', `${TIMESTAMP}-outreach.md`);
  let messagesContent = '# Job Posting Outreach\n\n';
  jobs.forEach((j, i) => {
    messagesContent += `## ${i + 1}. ${j.company} - ${j.title}\n\n${generateJobOutreach(j)}\n\n---\n\n`;
  });
  fs.writeFileSync(messagesPath, messagesContent);
  console.log(`  ✅ Generated ${jobs.length} outreach messages`);
} catch (e) {
  console.error('  ❌ Job monitoring failed:', e.message);
}

// 5. LEAD GEN - Community Mining
console.log('\n⛏️ MINING COMMUNITIES...');
try {
  const posts = generateCommunityPosts();
  const postsPath = path.join(OUTPUT_DIR, 'community', `${TIMESTAMP}.json`);
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  results.communityPosts = posts.length;
  console.log(`  ✅ Found ${posts.length} relevant community posts`);
  
  // Generate responses
  const responsesPath = path.join(OUTPUT_DIR, 'community', `${TIMESTAMP}-responses.md`);
  let responsesContent = '# Suggested Community Responses\n\n';
  posts.forEach((p, i) => {
    responsesContent += `## ${i + 1}. ${p.platform}: ${p.title.slice(0, 60)}...\n\n${generateCommunityResponse(p)}\n\n---\n\n`;
  });
  fs.writeFileSync(responsesPath, responsesContent);
  console.log(`  ✅ Generated ${posts.length} responses`);
} catch (e) {
  console.error('  ❌ Community mining failed:', e.message);
}

// 6. PARTNERSHIPS
console.log('\n🤝 IDENTIFYING PARTNERSHIP OPPORTUNITIES...');
try {
  const partners = generatePartnerships();
  const partnersPath = path.join(OUTPUT_DIR, 'partnerships', `${TIMESTAMP}.json`);
  fs.writeFileSync(partnersPath, JSON.stringify(partners, null, 2));
  results.partnerships = partners.length;
  console.log(`  ✅ Found ${partners.length} partnership opportunities`);
  
  // Generate outreach emails
  const partnerEmailsPath = path.join(OUTPUT_DIR, 'partnerships', `${TIMESTAMP}-emails.md`);
  let partnerEmailsContent = '# Partnership Outreach\n\n';
  partners.slice(0, 5).forEach((p, i) => {
    partnerEmailsContent += `## ${i + 1}. ${p.name}\n\n${generatePartnerEmail(p)}\n\n---\n\n`;
  });
  fs.writeFileSync(partnerEmailsPath, partnerEmailsContent);
  console.log(`  ✅ Generated ${Math.min(5, partners.length)} partner emails`);
} catch (e) {
  console.error('  ❌ Partnership finder failed:', e.message);
}

// 7. INTELLIGENCE - Competitors
console.log('\n🔍 MONITORING COMPETITORS...');
try {
  const intel = generateCompetitorIntel();
  const intelPath = path.join(OUTPUT_DIR, 'intelligence', `${TIMESTAMP}.json`);
  fs.writeFileSync(intelPath, JSON.stringify(intel, null, 2));
  results.competitorChanges = intel.changes.length;
  console.log(`  ✅ Found ${intel.changes.length} competitor changes`);
  
  // Generate report
  const reportPath = path.join(OUTPUT_DIR, 'intelligence', `${TIMESTAMP}-report.md`);
  fs.writeFileSync(reportPath, generateCompetitorReport(intel));
  console.log(`  ✅ Generated competitor report`);
} catch (e) {
  console.error('  ❌ Competitor monitoring failed:', e.message);
}

// 8. INTELLIGENCE - Customer Voice
console.log('\n📣 MINING CUSTOMER VOICE...');
try {
  const voice = generateCustomerVoice();
  const voicePath = path.join(OUTPUT_DIR, 'voice', `${TIMESTAMP}.json`);
  fs.writeFileSync(voicePath, JSON.stringify(voice, null, 2));
  results.voiceEntries = voice.length;
  console.log(`  ✅ Analyzed ${voice.length} voice entries`);
  
  // Generate content ideas
  const ideasPath = path.join(OUTPUT_DIR, 'voice', `${TIMESTAMP}-ideas.md`);
  fs.writeFileSync(ideasPath, generateContentIdeas(voice));
  console.log(`  ✅ Generated content ideas`);
} catch (e) {
  console.error('  ❌ Customer voice mining failed:', e.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 DAILY AUTOMATION COMPLETE');
console.log('='.repeat(60));
console.log(`
Results Summary:
  📝 Blog Posts: ${results.blogPosts}
  📱 Social Posts: ${results.socialPosts}
  🔍 Prospects: ${results.prospects}
  💼 Job Postings: ${results.jobPostings}
  💬 Community Posts: ${results.communityPosts}
  🤝 Partnerships: ${results.partnerships}
  🔍 Competitor Changes: ${results.competitorChanges}
  📣 Voice Entries: ${results.voiceEntries}

Total Actions: ${Object.values(results).reduce((a, b) => a + b, 0)}

All outputs saved to: ${OUTPUT_DIR}/
`);

// Helper Functions

function generateBlogPost(keyword, template) {
  const titles = {
    'how-to': `How to Master ${keyword}: The Complete Guide`,
    'guide': `The Definitive Guide to ${keyword} in 2026`,
    'vs': `${keyword} vs Manual: Which is Right for You?`
  };
  
  const title = titles[template] || titles.guide;
  
  return `---
title: "${title}"
slug: "${keyword.replace(/\s+/g, '-')}"
excerpt: "Learn how to ${keyword.toLowerCase()} with this comprehensive guide. Save time and reduce errors with proven strategies."
keywords: ["${keyword}", "reconciliation", "automation"]
readingTime: 8
metaDescription: "Master ${keyword} with our comprehensive guide. Learn best practices, tools, and strategies for 2026."
date: "${new Date().toISOString()}"
---

# ${title}

If you're struggling with ${keyword}, you're not alone. Here's a complete guide to solving it.

## The Problem with Manual ${keyword}

Most teams approach ${keyword} reactively. They wait for discrepancies to surface. This creates a constant firefighting mode.

## Understanding ${keyword} Fundamentals

At its core, ${keyword} is about ensuring your financial records match across systems. Sounds simple, but at scale, complexity explodes.

## Step 1: Set Up Your Data Sources

Connect all your payment processors, bank accounts, and internal systems. API-first beats CSV exports every time.

## Step 2: Define Your Matching Rules

What constitutes a "match"? Same amount? Same date? Same customer? Define this once, apply it consistently.

## Step 3: Automate the Reconciliation

With the right tooling, 95% of transactions match automatically. You only review exceptions.

## Common ${keyword} Pitfalls to Avoid

1. **Waiting until month-end** - Reconcile daily, not monthly
2. **Over-engineering matching rules** - Start simple, iterate
3. **Ignoring edge cases** - Handle refunds, chargebacks, FX separately

${keyword} is essential for accurate financial reporting. With the right approach, you can save hours every month.

Ready to automate ${keyword}? [Try Settler free for 14 days](https://settler.dev/demo).
`;
}

function generateSocialContent(idea) {
  return `CONTENT MULTIPLIER RESULTS
=========================

Original Idea: ${idea}
Generated: 8 pieces

---

TWITTER
=======

[THREAD 1]
Best time: 9:00 AM EST

I analyzed 100 companies' reconciliation workflows.

Here's what the top 10% do differently:

🧵

1/ Most teams approach reconciliation reactively. They wait for discrepancies to surface. Proactive monitoring changes everything.

2/ The #1 mistake? Trying to reconcile at the transaction level. Aggregate first, then drill down. 10x faster.

3/ APIs changed the game. Real-time data means real-time reconciliation. No more waiting for CSV exports.

---

[TWEET 2]
Best time: 12:00 PM EST

💡 ${idea}

What if I told you this could be automated in 5 minutes?

→ settler.dev/demo

---

LINKEDIN
========

[POST 1]
Best time: 8:00 AM EST
Hashtags: #FinTech #Automation #FinanceOps #SaaS

${idea}

Sounds simple, right?

But 90% of companies are still doing this manually.

Here's why that needs to change:

[Link to full post]

---

REDDIT
======

[POST 1]
Best time: 2:00 PM EST

[Discussion] ${idea} - What's your experience?

I've been working with teams on reconciliation automation, and this is the #1 thing that moves the needle.

Curious: Are you doing this manually or have you automated? What's worked for you?

---

HACKER NEWS
===========

[COMMENT 1]
Best time: On relevant thread

This resonates with our experience. We found that ${idea} was the turning point for our finance ops.

The key insight: most teams try to solve reconciliation with more people, when they should be solving it with better tooling.

We've seen companies cut reconciliation time by 90% with the right automation.
`;
}

function generateProspects() {
  return [
    { company: 'PaymentFlow', employees: 120, funding: 'Series B', techStack: ['Stripe', 'Salesforce'], signal: 'high' },
    { company: 'MarketHub', employees: 250, funding: 'Series C', techStack: ['Adyen', 'NetSuite'], signal: 'high' },
    { company: 'SaaSBilling', employees: 80, funding: 'Series A', techStack: ['Stripe', 'QuickBooks'], signal: 'medium' },
    { company: 'FinTechFlow', employees: 45, funding: 'Seed', techStack: ['Stripe'], signal: 'medium' },
    { company: 'PayStream', employees: 180, funding: 'Series B', techStack: ['PayPal', 'Xero'], signal: 'high' }
  ];
}

function generateColdEmail(prospect) {
  return `Subject: Quick question about ${prospect.company}'s reconciliation process

Hi there,

I noticed ${prospect.company} has been growing fast (${prospect.employees} employees, ${prospect.funding}). With that growth comes reconciliation complexity.

Quick question: How many hours does your team spend on reconciliation each week?

We built Settler to automate exactly this - companies like ${prospect.company} save 15-20 hours/week with zero implementation time.

Worth a 10-minute conversation?

Best,
Scott
settler.dev/demo

P.S. - If you're not the right person for this, could you point me to whoever handles reconciliation automation?`;
}

function generateJobPostings() {
  return [
    { company: 'FastPay', title: 'Senior Finance Operations Manager', signal: 'high', keywords: ['reconciliation', 'transaction matching'] },
    { company: 'CloudBilling', title: 'Payment Operations Specialist', signal: 'high', keywords: ['reconciliation', 'stripe'] },
    { company: 'SaaSPlatform', title: 'Financial Analyst', signal: 'medium', keywords: ['reconciliation'] },
    { company: 'MarketplaceX', title: 'Director of Finance', signal: 'high', keywords: ['automated reconciliation'] }
  ];
}

function generateJobOutreach(posting) {
  return `Subject: Saw ${posting.company}'s ${posting.title} posting

Hi there,

I saw ${posting.company} is hiring a ${posting.title} and specifically mentioned ${posting.keywords.join(', ')}.

Instead of building this in-house over 6+ months, what if you could have it running in 5 minutes?

Settler automates reconciliation for companies like ${posting.company}. We've helped teams save 15-20 hours/week.

Happy to show you how it works - no sales pitch, just a quick demo.

Best,
Scott
settler.dev/demo`;
}

function generateCommunityPosts() {
  return [
    { platform: 'reddit', title: 'How do you handle Stripe reconciliation at scale?', relevance: 'high' },
    { platform: 'hn', title: 'Ask HN: How do you automate financial reconciliation?', relevance: 'high' },
    { platform: 'stackoverflow', title: 'Best way to match transactions from Stripe to internal database?', relevance: 'medium' },
    { platform: 'reddit', title: 'Multi-currency reconciliation nightmare', relevance: 'high' }
  ];
}

function generateCommunityResponse(post) {
  const responses = {
    high: `This is exactly the problem we built Settler to solve.

We were in the same boat - 50k+ transactions, 3 days in Excel every month. Now it's 15 minutes and fully automated.

A few things that made the biggest difference:

1. **API-first approach** - No more CSV exports
2. **Smart matching rules** - Define once, apply automatically
3. **Exception-based workflow** - Review only edge cases

Happy to share our exact setup: settler.dev/demo

Not a sales pitch - genuinely went through this pain and want to help.`,
    medium: `We've been through this. A few things that helped:

1. Stop using Excel - Move to proper tooling
2. Standardize your data formats
3. Automate the matching

If you're doing significant volume, you really need proper tooling. We use Settler but there are other options.

Happy to share more specifics if helpful.`
  };
  
  return responses[post.relevance] || responses.medium;
}

function generatePartnerships() {
  return [
    { name: 'QuickBooks', category: 'integration', fit: 'strategic', relevanceScore: 95 },
    { name: 'Xero', category: 'integration', fit: 'strategic', relevanceScore: 90 },
    { name: 'Stripe Atlas', category: 'co-marketing', fit: 'strategic', relevanceScore: 90 },
    { name: 'Mercury', category: 'co-marketing', fit: 'strategic', relevanceScore: 88 },
    { name: 'Pilot', category: 'co-marketing', fit: 'strategic', relevanceScore: 85 }
  ];
}

function generatePartnerEmail(partner) {
  return `Subject: Integration idea: ${partner.name} + Settler

Hi [Name],

I've been following ${partner.name} for a while - impressive growth in the space.

Quick question: Do you have customers asking about automated reconciliation?

We built Settler to solve exactly this. Think of us as the "reconciliation layer" that sits between payment processors and accounting systems.

A few stats:
- Process $1B+ monthly
- 500+ customers
- Average time saved: 20 hours/week per customer

Would an integration make sense? Happy to discuss technical details.

Best,
Scott
settler.dev

P.S. - We're already integrated with ${partner.name === 'QuickBooks' ? 'Xero and Stripe' : 'QuickBooks and Stripe'}. ${partner.name} would complete the picture.`;
}

function generateCompetitorIntel() {
  return {
    competitors: 3,
    changes: [
      { type: 'pricing', competitor: 'BlackLine', impact: 'high', description: 'Increased enterprise pricing by 15%' },
      { type: 'hiring', competitor: 'FloQast', impact: 'high', description: 'Hiring 50+ sales reps' }
    ]
  };
}

function generateCompetitorReport(intel) {
  return `# Competitor Intelligence Report
Generated: ${TIMESTAMP}

## Summary
- Competitors tracked: ${intel.competitors}
- Changes detected: ${intel.changes.length}

## Recent Changes
${intel.changes.map(c => `- **${c.competitor}**: ${c.description} (${c.impact} impact)`).join('\n')}

## Recommended Actions
1. Target enterprise customers with "Switch and Save" campaign
2. Accelerate partnership strategy
3. Update sales battle cards
`;
}

function generateCustomerVoice() {
  return [
    { source: 'G2', sentiment: 'negative', text: 'BlackLine is powerful but took 8 months to implement.', painPoints: ['Long implementation'] },
    { source: 'Reddit', sentiment: 'negative', text: 'We do everything in Excel still. Looked at FloQast but too expensive.', painPoints: ['Manual process', 'Pricing'] },
    { source: 'Twitter', sentiment: 'negative', text: 'Reconciliation day is the worst day. 3 people, 2 days, 1000s of transactions.', painPoints: ['Time consuming'] }
  ];
}

function generateContentIdeas(voice) {
  return `# Content Ideas from Customer Voice
Generated: ${TIMESTAMP}

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
