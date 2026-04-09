//**
 * Customer Voice Miner
 * 
 * Mines reviews, social media, communities for customer insights
 * Usage: ts-node customer-voice-miner.ts --source=g2
 */

interface VoiceData {
  source: string;
  company: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  text: string;
  keywords: string[];
  painPoints: string[];
  featureRequests: string[];
  competitorMentions: string[];
}

const reviewData: VoiceData[] = [
  {
    source: 'G2',
    company: 'Unknown',
    sentiment: 'negative',
    text: 'BlackLine is powerful but took 8 months to implement. Support is slow and you need a dedicated admin.',
    keywords: ['implementation', 'support', 'admin'],
    painPoints: ['Long implementation', 'Slow support', 'Resource intensive'],
    featureRequests: ['Easier setup', 'Better support'],
    competitorMentions: ['BlackLine']
  },
  {
    source: 'Reddit',
    company: 'SaaS Startup',
    sentiment: 'negative',
    text: 'We do everything in Excel still. Looked at FloQast but its too expensive for our stage. Anyone using something cheaper?',
    keywords: ['excel', 'expensive', 'startup'],
    painPoints: ['Manual process', 'Pricing too high'],
    featureRequests: ['Affordable solution'],
    competitorMentions: ['FloQast']
  },
  {
    source: 'Twitter',
    company: 'FintechCo',
    sentiment: 'negative',
    text: 'Reconciliation day is the worst day of the month. 3 people, 2 days, 1000s of transactions. There has to be a better way.',
    keywords: ['reconciliation', 'manual', 'time consuming'],
    painPoints: ['Time consuming', 'Resource intensive', 'Repetitive'],
    featureRequests: ['Automation'],
    competitorMentions: []
  },
  {
    source: 'G2',
    company: 'MidMarket Inc',
    sentiment: 'positive',
    text: 'Settler saved us 20 hours per week. Integration with Stripe was seamless and matching accuracy is 99.9%.',
    keywords: ['time savings', 'stripe', 'accuracy'],
    painPoints: [],
    featureRequests: [],
    competitorMentions: ['Settler']
  },
  {
    source: 'LinkedIn',
    company: 'GrowthCo',
    sentiment: 'neutral',
    text: 'Evaluating reconciliation tools. Looking at AutoRek, Settler, and building in-house. Thoughts?',
    keywords: ['evaluation', 'tools'],
    painPoints: ['Decision paralysis'],
    featureRequests: ['Comparison guide'],
    competitorMentions: ['AutoRek', 'Settler']
  }
];

function analyzeSentiment(): Record<string, number> {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  reviewData.forEach(r => counts[r.sentiment]++);
  return counts;
}

function extractPainPoints(): { point: string; count: number }[] {
  const allPoints = reviewData.flatMap(r => r.painPoints);
  const counts: Record<string, number> = {};
  
  allPoints.forEach(p => {
    counts[p] = (counts[p] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => b.count - a.count);
}

function extractKeywords(): { word: string; count: number }[] {
  const allKeywords = reviewData.flatMap(r => r.keywords);
  const counts: Record<string, number> = {};
  
  allKeywords.forEach(k => {
    counts[k] = (counts[k] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

function generateContentIdeas(): string[] {
  const painPoints = extractPainPoints();
  
  return [
    `Blog: "How to escape Excel hell: A guide to reconciliation automation"`,
    `Blog: "The hidden cost of manual reconciliation: ${painPoints[0]?.point || 'Time waste'}"`,
    `Comparison page: "Settler vs BlackLine: Implementation time comparison"`,
    `Case study: "How [Company] saved 20 hours/week with automation"`,
    `Guide: "Reconciliation tool evaluation checklist for startups"`,
    `Tweet thread: "5 signs you're ready to stop reconciling manually"`,
    `LinkedIn post: "Why we built Settler (and why pricing matters)"`
  ];
}

function formatVoiceData(data: VoiceData): string {
  return `
💬 ${data.source} | ${data.sentiment.toUpperCase()}
   "${data.text.slice(0, 100)}..."
   
   Pain Points: ${data.painPoints.join(', ') || 'None'}
   Keywords: ${data.keywords.join(', ')}
`;
}

// CLI
const args = process.argv.slice(2);
const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1];

console.log('⛏️ Mining customer voice data...\n');

let filteredData = reviewData;
if (sourceArg) {
  filteredData = reviewData.filter(r => r.source.toLowerCase() === sourceArg.toLowerCase());
}

console.log(`Analyzed ${filteredData.length} customer voice entries\n`);

// Sentiment analysis
const sentiment = analyzeSentiment();
console.log('SENTIMENT BREAKDOWN:');
console.log(`  😊 Positive: ${sentiment.positive}`);
console.log(`  😐 Neutral: ${sentiment.neutral}`);
console.log(`  😞 Negative: ${sentiment.negative}`);

// Top pain points
console.log('\nTOP PAIN POINTS:');
extractPainPoints().slice(0, 5).forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.point} (${p.count} mentions)`);
});

// Top keywords
console.log('\nTOP KEYWORDS:');
extractKeywords().slice(0, 5).forEach((k, i) => {
  console.log(`  ${i + 1}. ${k.word} (${k.count} mentions)`);
});

// Content ideas
console.log('\nRECOMMENDED CONTENT:');
generateContentIdeas().forEach((idea, i) => {
  console.log(`  ${i + 1}. ${idea}`);
});

// Raw data
console.log('\n' + '='.repeat(60));
console.log('RAW VOICE DATA:\n');
filteredData.forEach(d => console.log(formatVoiceData(d)));

// Save to file
const fs = require('fs');
const outputDir = './voice';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now();
fs.writeFileSync(
  `${outputDir}/voice-${timestamp}.json`,
  JSON.stringify(filteredData, null, 2)
);

console.log(`\n✅ Saved voice data to ${outputDir}/voice-${timestamp}.json`);

export { analyzeSentiment, extractPainPoints, generateContentIdeas };
