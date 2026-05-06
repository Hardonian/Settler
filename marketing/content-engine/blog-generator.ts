/**
 * Blog Post Generator for Settler
 *
 * Generates SEO-optimized blog posts targeting reconciliation keywords
 * Usage: ts-node blog-generator.ts --topic="stripe reconciliation" --count=5
 */

import * as fs from "fs";
import * as path from "path";

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  keywords: string[];
  readingTime: number;
  metaDescription: string;
}

interface ContentTemplate {
  intro: string[];
  body: string[];
  conclusion: string[];
  cta: string[];
}

const templates: Record<string, ContentTemplate> = {
  "how-to": {
    intro: [
      "If you're struggling with {topic}, you're not alone. Here's a complete guide to solving it.",
      "{topic} doesn't have to be complicated. Here's the proven framework we use.",
      "After reconciling $100M+ in transactions, here's what we learned about {topic}.",
    ],
    body: [
      "## The Problem with Manual {topic}",
      "## Understanding {topic} Fundamentals",
      "## Step 1: Set Up Your Data Sources",
      "## Step 2: Define Your Matching Rules",
      "## Step 3: Automate the Reconciliation",
      "## Common {topic} Pitfalls to Avoid",
    ],
    conclusion: [
      "{topic} is essential for accurate financial reporting. With the right approach, you can save hours every month.",
      "Implementing {topic} correctly will transform your finance operations.",
    ],
    cta: [
      "Ready to automate {topic}? [Try Settler free for 14 days](https://settler.dev/demo).",
      "Want to see {topic} in action? [Schedule a demo](https://settler.dev/demo).",
    ],
  },
  vs: {
    intro: [
      "Choosing between {option1} and {option2} for {topic}? Here's the breakdown.",
      "We compared {option1} and {option2} across 10 key dimensions. Here's what we found.",
    ],
    body: [
      "## Quick Comparison",
      "## Feature-by-Feature Breakdown",
      "## Pricing Comparison",
      "## When to Choose {option1}",
      "## When to Choose {option2}",
      "## The Hidden Costs",
    ],
    conclusion: [
      "The best choice depends on your specific needs. Consider your transaction volume, integrations, and team size.",
      "Both options work, but for most teams, {winner} wins on {reason}.",
    ],
    cta: [
      "Want the best of both worlds? Settler integrates with both. [See how](https://settler.dev/integrations).",
      "Not sure which is right? [Talk to our team](https://settler.dev/demo).",
    ],
  },
  guide: {
    intro: [
      "This is the definitive guide to {topic} in 2026.",
      "Everything you need to know about {topic}, based on 1000+ implementations.",
    ],
    body: [
      "## What is {topic}?",
      "## Why {topic} Matters",
      "## {topic} Best Practices",
      "## Tools for {topic}",
      "## Implementation Roadmap",
      "## Measuring {topic} Success",
    ],
    conclusion: [
      "Mastering {topic} is a competitive advantage. Start with the fundamentals and iterate.",
      "The teams that nail {topic} are the ones that scale smoothly.",
    ],
    cta: [
      "Build your {topic} system with Settler. [Start free](https://settler.dev/demo).",
      "See how top teams handle {topic}. [Read case studies](https://settler.dev/case-studies).",
    ],
  },
};

const keywords = [
  "reconciliation automation",
  "financial data matching",
  "transaction reconciliation",
  "stripe reconciliation",
  "accounting automation",
  "payment reconciliation",
  "data validation tools",
  "financial operations",
  "reconciliation software",
  "automated bookkeeping",
];

const topics = [
  { keyword: "stripe reconciliation", template: "how-to" },
  { keyword: "automated reconciliation", template: "guide" },
  { keyword: "reconciliation vs manual", template: "vs" },
  { keyword: "payment reconciliation tools", template: "guide" },
  { keyword: "financial data matching", template: "how-to" },
  { keyword: "settlement reconciliation", template: "guide" },
  { keyword: "multi-currency reconciliation", template: "how-to" },
  { keyword: "reconciliation best practices", template: "guide" },
  { keyword: "api reconciliation", template: "how-to" },
  { keyword: "real-time reconciliation", template: "guide" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
}

function generatePost(topic: string, templateName: string): BlogPost {
  const template = templates[templateName] || templates["how-to"];

  const title =
    templateName === "vs"
      ? `${topic.split(" vs ")[0]} vs ${topic.split(" vs ")[1]}: Complete Comparison (2026)`
      : `How to Master ${topic}: The Complete Guide`;

  const variables: Record<string, string> = {
    topic: topic,
    option1: topic.includes(" vs ") ? topic.split(" vs ")[0] : "Option A",
    option2: topic.includes(" vs ") ? topic.split(" vs ")[1] : "Option B",
    winner: "Settler",
    reason: "automation and ease of use",
  };

  const sections = [
    fillTemplate(template.intro[Math.floor(Math.random() * template.intro.length)], variables),
    "",
    ...template.body.map((s) => fillTemplate(s, variables)),
    "",
    fillTemplate(
      template.conclusion[Math.floor(Math.random() * template.conclusion.length)],
      variables
    ),
    "",
    fillTemplate(template.cta[Math.floor(Math.random() * template.cta.length)], variables),
  ];

  const content = sections.join("\n\n");
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    title,
    slug: generateSlug(title),
    excerpt: `Learn how to ${topic.toLowerCase()} with this comprehensive guide. Save time and reduce errors with proven strategies.`,
    content,
    keywords: keywords.slice(0, 5),
    readingTime,
    metaDescription: `Master ${topic} with our comprehensive guide. Learn best practices, tools, and strategies for 2026.`,
  };
}

function generatePosts(count: number = 5): BlogPost[] {
  const posts: BlogPost[] = [];

  for (let i = 0; i < count; i++) {
    const topicConfig = topics[i % topics.length];
    posts.push(generatePost(topicConfig.keyword, topicConfig.template));
  }

  return posts;
}

function savePost(post: BlogPost, outputDir: string = "./output"): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const frontmatter = `---
title: "${post.title}"
slug: "${post.slug}"
excerpt: "${post.excerpt}"
keywords: [${post.keywords.map((k) => `"${k}"`).join(", ")}]
readingTime: ${post.readingTime}
metaDescription: "${post.metaDescription}"
date: "${new Date().toISOString()}"
---

`;

  const filePath = path.join(outputDir, `${post.slug}.md`);
  fs.writeFileSync(filePath, frontmatter + post.content);
  console.log(`✅ Generated: ${filePath}`);
}

// CLI
const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="))?.split("=")[1] || "5";
const topicArg = args.find((a) => a.startsWith("--topic="))?.split("=")[1];

if (topicArg) {
  const post = generatePost(topicArg, "how-to");
  savePost(post);
} else {
  const posts = generatePosts(parseInt(countArg));
  posts.forEach((post) => savePost(post));
  console.log(`\n✅ Generated ${posts.length} blog posts`);
}

export { generatePost, generatePosts, savePost };
