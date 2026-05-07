#!/usr/bin/env node
/**
 * Daily Marketing Automation Runner
 *
 * Runs all marketing tools in sequence
 * Usage: node daily-run.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const { generateBlogPost, generateSocialContent } = require("./lib/content");
const {
  generateProspects,
  generateColdEmail,
  generateJobPostings,
  generateJobOutreach,
} = require("./lib/lead-gen");
const { generateCommunityPosts, generateCommunityResponse } = require("./lib/community");
const { generatePartnerships, generatePartnerEmail } = require("./lib/partnerships");
const {
  generateCompetitorIntel,
  generateCompetitorReport,
  generateCustomerVoice,
  generateContentIdeas,
} = require("./lib/intelligence");

const OUTPUT_DIR = "./output";
const TIMESTAMP = new Date().toISOString().split("T")[0];

// Ensure output directories exist
const dirs = [
  "blog",
  "social",
  "prospects",
  "jobs",
  "community",
  "partnerships",
  "intelligence",
  "voice",
];
dirs.forEach((dir) => {
  const fullPath = path.join(OUTPUT_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

console.log("🚀 STARTING DAILY MARKETING AUTOMATION");
console.log(`📅 Date: ${TIMESTAMP}`);
console.log("=".repeat(60));

let results = {
  blogPosts: 0,
  socialPosts: 0,
  prospects: 0,
  jobPostings: 0,
  communityPosts: 0,
  partnerships: 0,
  competitorChanges: 0,
  voiceEntries: 0,
};

// 1. CONTENT ENGINE - Blog Posts
console.log("\n📝 GENERATING BLOG POSTS...");
try {
  const blogOutput = path.join(OUTPUT_DIR, "blog", TIMESTAMP);
  fs.mkdirSync(blogOutput, { recursive: true });

  // Generate 3 blog posts
  const topics = [
    { keyword: "automated reconciliation", template: "guide" },
    { keyword: "stripe reconciliation", template: "how-to" },
    { keyword: "payment reconciliation tools", template: "guide" },
  ];

  topics.forEach((topic, i) => {
    const content = generateBlogPost(topic.keyword, topic.template);
    const filename = `${topic.keyword.replace(/\s+/g, "-")}-${i + 1}.md`;
    fs.writeFileSync(path.join(blogOutput, filename), content);
    results.blogPosts++;
    console.log(`  ✅ ${filename}`);
  });

  console.log(`  Generated ${results.blogPosts} blog posts`);
} catch (e) {
  console.error("  ❌ Blog generation failed:", e.message);
}

// 2. CONTENT ENGINE - Social Media
console.log("\n📱 GENERATING SOCIAL MEDIA CONTENT...");
try {
  const socialOutput = path.join(OUTPUT_DIR, "social", TIMESTAMP);
  fs.mkdirSync(socialOutput, { recursive: true });

  const ideas = [
    "Automated reconciliation saves 20 hours/week",
    "Real-time payment matching eliminates end-of-month panic",
    "API-first reconciliation scales better than CSV exports",
  ];

  ideas.forEach((idea, i) => {
    const content = generateSocialContent(idea);
    const filename = `social-${i + 1}.md`;
    fs.writeFileSync(path.join(socialOutput, filename), content);
    results.socialPosts += content.split("---").length - 1;
    console.log(`  ✅ ${filename} (${content.split("---").length - 1} posts)`);
  });

  console.log(`  Generated social content for ${ideas.length} ideas`);
} catch (e) {
  console.error("  ❌ Social generation failed:", e.message);
}

// 3. LEAD GEN - Prospects
console.log("\n🔍 RESEARCHING PROSPECTS...");
try {
  const prospects = generateProspects();
  const prospectsPath = path.join(OUTPUT_DIR, "prospects", `${TIMESTAMP}.json`);
  fs.writeFileSync(prospectsPath, JSON.stringify(prospects, null, 2));
  results.prospects = prospects.length;
  console.log(`  ✅ Found ${prospects.length} prospects`);

  // Generate cold emails for top 5
  const emailsPath = path.join(OUTPUT_DIR, "prospects", `${TIMESTAMP}-emails.md`);
  let emailsContent = "# Cold Emails for Top Prospects\n\n";
  prospects.slice(0, 5).forEach((p, i) => {
    emailsContent += `## ${i + 1}. ${p.company}\n\n${generateColdEmail(p)}\n\n---\n\n`;
  });
  fs.writeFileSync(emailsPath, emailsContent);
  console.log(`  ✅ Generated ${Math.min(5, prospects.length)} cold emails`);
} catch (e) {
  console.error("  ❌ Prospect research failed:", e.message);
}

// 4. LEAD GEN - Job Monitor
console.log("\n💼 MONITORING JOB POSTINGS...");
try {
  const jobs = generateJobPostings();
  const jobsPath = path.join(OUTPUT_DIR, "jobs", `${TIMESTAMP}.json`);
  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
  results.jobPostings = jobs.length;
  console.log(`  ✅ Found ${jobs.length} relevant job postings`);

  // Generate outreach messages
  const messagesPath = path.join(OUTPUT_DIR, "jobs", `${TIMESTAMP}-outreach.md`);
  let messagesContent = "# Job Posting Outreach\n\n";
  jobs.forEach((j, i) => {
    messagesContent += `## ${i + 1}. ${j.company} - ${j.title}\n\n${generateJobOutreach(j)}\n\n---\n\n`;
  });
  fs.writeFileSync(messagesPath, messagesContent);
  console.log(`  ✅ Generated ${jobs.length} outreach messages`);
} catch (e) {
  console.error("  ❌ Job monitoring failed:", e.message);
}

// 5. LEAD GEN - Community Mining
console.log("\n⛏️ MINING COMMUNITIES...");
try {
  const posts = generateCommunityPosts();
  const postsPath = path.join(OUTPUT_DIR, "community", `${TIMESTAMP}.json`);
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  results.communityPosts = posts.length;
  console.log(`  ✅ Found ${posts.length} relevant community posts`);

  // Generate responses
  const responsesPath = path.join(OUTPUT_DIR, "community", `${TIMESTAMP}-responses.md`);
  let responsesContent = "# Suggested Community Responses\n\n";
  posts.forEach((p, i) => {
    responsesContent += `## ${i + 1}. ${p.platform}: ${p.title.slice(0, 60)}...\n\n${generateCommunityResponse(p)}\n\n---\n\n`;
  });
  fs.writeFileSync(responsesPath, responsesContent);
  console.log(`  ✅ Generated ${posts.length} responses`);
} catch (e) {
  console.error("  ❌ Community mining failed:", e.message);
}

// 6. PARTNERSHIPS
console.log("\n🤝 IDENTIFYING PARTNERSHIP OPPORTUNITIES...");
try {
  const partners = generatePartnerships();
  const partnersPath = path.join(OUTPUT_DIR, "partnerships", `${TIMESTAMP}.json`);
  fs.writeFileSync(partnersPath, JSON.stringify(partners, null, 2));
  results.partnerships = partners.length;
  console.log(`  ✅ Found ${partners.length} partnership opportunities`);

  // Generate outreach emails
  const partnerEmailsPath = path.join(OUTPUT_DIR, "partnerships", `${TIMESTAMP}-emails.md`);
  let partnerEmailsContent = "# Partnership Outreach\n\n";
  partners.slice(0, 5).forEach((p, i) => {
    partnerEmailsContent += `## ${i + 1}. ${p.name}\n\n${generatePartnerEmail(p)}\n\n---\n\n`;
  });
  fs.writeFileSync(partnerEmailsPath, partnerEmailsContent);
  console.log(`  ✅ Generated ${Math.min(5, partners.length)} partner emails`);
} catch (e) {
  console.error("  ❌ Partnership finder failed:", e.message);
}

// 7. INTELLIGENCE - Competitors
console.log("\n🔍 MONITORING COMPETITORS...");
try {
  const intel = generateCompetitorIntel();
  const intelPath = path.join(OUTPUT_DIR, "intelligence", `${TIMESTAMP}.json`);
  fs.writeFileSync(intelPath, JSON.stringify(intel, null, 2));
  results.competitorChanges = intel.changes.length;
  console.log(`  ✅ Found ${intel.changes.length} competitor changes`);

  // Generate report
  const reportPath = path.join(OUTPUT_DIR, "intelligence", `${TIMESTAMP}-report.md`);
  fs.writeFileSync(reportPath, generateCompetitorReport(intel, TIMESTAMP));
  console.log(`  ✅ Generated competitor report`);
} catch (e) {
  console.error("  ❌ Competitor monitoring failed:", e.message);
}

// 8. INTELLIGENCE - Customer Voice
console.log("\n📣 MINING CUSTOMER VOICE...");
try {
  const voice = generateCustomerVoice();
  const voicePath = path.join(OUTPUT_DIR, "voice", `${TIMESTAMP}.json`);
  fs.writeFileSync(voicePath, JSON.stringify(voice, null, 2));
  results.voiceEntries = voice.length;
  console.log(`  ✅ Analyzed ${voice.length} voice entries`);

  // Generate content ideas
  const ideasPath = path.join(OUTPUT_DIR, "voice", `${TIMESTAMP}-ideas.md`);
  fs.writeFileSync(ideasPath, generateContentIdeas(voice, TIMESTAMP));
  console.log(`  ✅ Generated content ideas`);
} catch (e) {
  console.error("  ❌ Customer voice mining failed:", e.message);
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 DAILY AUTOMATION COMPLETE");
console.log("=".repeat(60));
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
