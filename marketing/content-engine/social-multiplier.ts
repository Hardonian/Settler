/**
 * Social Media Content Multiplier
 * 
 * Takes 1 core idea and turns it into 10+ pieces of content
 * Usage: ts-node social-multiplier.ts --idea="Automated reconciliation saves 20 hours/week"
 */

interface ContentPiece {
  platform: 'twitter' | 'linkedin' | 'reddit' | 'hn';
  format: 'thread' | 'post' | 'comment';
  content: string;
  hashtags?: string[];
  bestTime?: string;
}

interface ContentMultiplier {
  originalIdea: string;
  pieces: ContentPiece[];
}

const twitterTemplates = {
  single: [
    "Hot take: {idea}\n\nMost teams are doing this wrong. Here's why:",
    "I spent 6 months analyzing {topic}.\n\nHere's what nobody tells you about {idea}:",
    "The {topic} landscape is changing fast.\n\n{idea} is the #1 trend I'm watching.",
    "Unpopular opinion:\n\n{idea}\n\nChange my mind."
  ],
  thread: [
    "I analyzed 100 companies' {topic} workflows.\n\nHere's what the top 10% do differently:\n\n🧵",
    "Most people get {topic} completely wrong.\n\nAfter helping 50+ teams, here's the real playbook:\n\n👇",
    "Stop doing {topic} manually.\n\nHere's the automated approach that saves 20+ hours/week:\n\n🧵",
    "The {topic} framework that changed everything for us:\n\n(I wish I knew this sooner)\n\n🧵"
  ]
};

const linkedinTemplates = {
  story: [
    "I used to spend every Monday morning reconciling transactions.\n\nIt took 4-6 hours of mind-numbing work.\n\nThen I discovered {idea}.\n\nNow it takes 15 minutes.\n\nHere's what changed:",
    `Our finance team was drowning in {topic}.\n\nLate nights.\nMissed deadlines.\nErrors everywhere.\n\nThen we implemented {idea}.\n\n6 months later, we've:
✅ Saved 500+ hours
✅ Eliminated errors
✅ Scaled 3x without adding headcount\n\nHere's the playbook:`
  ],
  educational: [
    "{idea}\n\nSounds simple, right?\n\nBut 90% of companies are still doing this manually.\n\nHere's why that needs to change:",
    "The 3 pillars of effective {topic}:\n\n1. {pillar1}\n2. {pillar2}\n3. {pillar3}\n\nGet these right, and {idea} becomes effortless.\n\nWhich pillar are you missing?"
  ]
};

function createTwitterThread(idea: string, topic: string): ContentPiece[] {
  const hook = twitterTemplates.thread[Math.floor(Math.random() * twitterTemplates.thread.length)]
    .replace('{topic}', topic);
  
  const tweets: ContentPiece[] = [
    {
      platform: 'twitter',
      format: 'thread',
      content: hook,
      bestTime: '9:00 AM EST'
    }
  ];

  // Add 5-7 tweets to the thread
  const points = [
    `Most teams approach ${topic} reactively. They wait for discrepancies to surface. Proactive monitoring changes everything.`,
    `The #1 mistake? Trying to reconcile at the transaction level. Aggregate first, then drill down. 10x faster.`,
    `APIs changed the game. Real-time data means real-time reconciliation. No more waiting for CSV exports.`,
    `Automation isn't just about speed. It's about accuracy. Humans make mistakes when bored. Computers don't.`,
    `The best teams have one person overseeing 10+ integrations. How? Standardized workflows and smart tooling.`,
    `${idea} isn't a nice-to-have anymore. It's table stakes for scaling finance operations.`
  ];

  points.forEach((point, i) => {
    tweets.push({
      platform: 'twitter',
      format: 'thread',
      content: `${i + 1}/ ${point}`,
      bestTime: '9:00 AM EST'
    });
  });

  // Add CTA tweet
  tweets.push({
    platform: 'twitter',
    format: 'thread',
    content: `Want to implement this yourself?\n\nI built a free guide: [link]\n\nOr just use Settler and be done in 5 minutes: settler.dev/demo`,
    bestTime: '9:00 AM EST'
  });

  return tweets;
}

function createLinkedInPost(idea: string, topic: string): ContentPiece {
  const template = linkedinTemplates.educational[0]
    .replace('{idea}', idea)
    .replace('{topic}', topic);

  return {
    platform: 'linkedin',
    format: 'post',
    content: template,
    hashtags: ['#FinTech', '#Automation', '#FinanceOps', '#SaaS', '#StartupLife'],
    bestTime: '8:00 AM EST'
  };
}

function createRedditPost(idea: string, topic: string): ContentPiece {
  const subreddits = ['r/SaaS', 'r/fintech', 'r/startups', 'r/accounting'];
  
  return {
    platform: 'reddit',
    format: 'post',
    content: `[Discussion] ${idea} - What's your experience?\n\nI've been working with teams on ${topic} automation, and this is the #1 thing that moves the needle.\n\nCurious: Are you doing this manually or have you automated? What's worked for you?`,
    bestTime: '2:00 PM EST'
  };
}

function createHNComment(idea: string, topic: string): ContentPiece {
  return {
    platform: 'hn',
    format: 'comment',
    content: `This resonates with our experience. We found that ${idea} was the turning point for our finance ops.\n\nThe key insight: most teams try to solve ${topic} with more people, when they should be solving it with better tooling.\n\nWe've seen companies cut reconciliation time by 90% with the right automation.`,
    bestTime: 'On relevant thread'
  };
}

function multiplyContent(idea: string): ContentMultiplier {
  const topic = idea.split(' ').slice(-3).join(' '); // Extract topic from idea
  
  const pieces: ContentPiece[] = [
    ...createTwitterThread(idea, topic),
    createLinkedInPost(idea, topic),
    createRedditPost(idea, topic),
    createHNComment(idea, topic),
    {
      platform: 'twitter',
      format: 'post',
      content: `💡 ${idea}\n\nWhat if I told you this could be automated in 5 minutes?\n\n→ settler.dev/demo`,
      bestTime: '12:00 PM EST'
    },
    {
      platform: 'linkedin',
      format: 'post',
      content: `Quick poll: How many hours per week does your team spend on ${topic}?\n\nA) 0-5 hours\nB) 5-10 hours\nC) 10-20 hours\nD) 20+ hours\n\nIf you answered C or D, we should talk. ${idea} is easier than you think.`,
      bestTime: '3:00 PM EST'
    }
  ];

  return {
    originalIdea: idea,
    pieces
  };
}

function formatContent(multiplier: ContentMultiplier): string {
  let output = `CONTENT MULTIPLIER RESULTS
=========================

Original Idea: ${multiplier.originalIdea}
Generated: ${multiplier.pieces.length} pieces

`;

  const byPlatform = multiplier.pieces.reduce((acc, piece) => {
    acc[piece.platform] = acc[piece.platform] || [];
    acc[piece.platform].push(piece);
    return acc;
  }, {} as Record<string, ContentPiece[]>);

  for (const [platform, pieces] of Object.entries(byPlatform)) {
    output += `\n${platform.toUpperCase()}
${'='.repeat(platform.length)}
\n`;
    
    pieces.forEach((piece, i) => {
      output += `[${piece.format.toUpperCase()} ${i + 1}]\n`;
      output += `Best time: ${piece.bestTime}\n`;
      if (piece.hashtags) {
        output += `Hashtags: ${piece.hashtags.join(' ')}\n`;
      }
      output += `\n${piece.content}\n\n---\n\n`;
    });
  }

  return output;
}

// CLI
const args = process.argv.slice(2);
const ideaArg = args.find(a => a.startsWith('--idea='))?.split('=')[1];

if (ideaArg) {
  const result = multiplyContent(ideaArg);
  console.log(formatContent(result));
  
  // Save to file
  const fs = require('fs');
  const filename = `./content-${Date.now()}.md`;
  fs.writeFileSync(filename, formatContent(result));
  console.log(`\n✅ Saved to ${filename}`);
} else {
  console.log('Usage: ts-node social-multiplier.ts --idea="Your core idea here"');
  console.log('\nExample ideas:');
  console.log('  --idea="Automated reconciliation saves 20 hours/week"');
  console.log('  --idea="Real-time payment matching eliminates end-of-month panic"');
  console.log('  --idea="API-first reconciliation scales better than CSV exports"');
}

export { multiplyContent, formatContent, ContentMultiplier };
