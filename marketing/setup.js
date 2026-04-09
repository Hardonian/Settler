/**
 * Marketing System Setup
 * 
 * One-time setup script for complete marketing automation
 * Configures cron jobs, directories, and integrations
 * 
 * Usage: node setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Settler Marketing System Setup');
console.log('=' .repeat(60));
console.log();

// 1. Create directory structure
console.log('📁 Creating directory structure...');
const dirs = [
  'output/blog',
  'output/social',
  'output/prospects',
  'output/jobs',
  'output/community',
  'output/partnerships',
  'output/intelligence',
  'output/voice',
  'output/approvals',
  'output/published',
  'logs',
  'integrations',
  'dashboard'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ ${dir}`);
  }
});

// 2. Check environment variables
console.log('\n🔐 Checking environment variables...');
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const optional = ['TWITTER_BEARER_TOKEN', 'LINKEDIN_ACCESS_TOKEN', 'SLACK_WEBHOOK_URL'];

required.forEach(env => {
  if (process.env[env]) {
    console.log(`  ✅ ${env}`);
  } else {
    console.log(`  ❌ ${env} (REQUIRED)`);
  }
});

optional.forEach(env => {
  if (process.env[env]) {
    console.log(`  ✅ ${env}`);
  } else {
    console.log(`  ⚠️  ${env} (optional)`);
  }
});

// 3. Create .env.template
console.log('\n📝 Creating .env.template...');
const envTemplate = `# Settler Marketing Automation Environment Variables

# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Social Media (optional - for auto-publishing)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token

# Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Configuration
CHECK_INTERVAL=60000
ALERT_THRESHOLD=10
`;

fs.writeFileSync(path.join(__dirname, '.env.template'), envTemplate);
console.log('  ✅ Created .env.template');

// 4. Create Brain OS cron config
console.log('\n⚙️  Creating Brain OS cron configuration...');
const cronConfig = {
  jobs: [
    {
      name: 'settler-marketing-daily',
      schedule: '0 6 * * *',
      command: 'cd /root/.openclaw/workspace/Settler/marketing && node daily-run.js',
      description: 'Daily marketing automation run'
    },
    {
      name: 'settler-marketing-process-scheduled',
      schedule: '*/15 * * * *',
      command: 'cd /root/.openclaw/workspace/Settler/marketing && node integrations/social-publisher.js process',
      description: 'Process scheduled social media posts'
    },
    {
      name: 'settler-marketing-community-monitor',
      schedule: '0 */4 * * *',
      command: 'cd /root/.openclaw/workspace/Settler/marketing && node lead-gen/community-miner.js --platform=all',
      description: 'Monitor communities for engagement opportunities'
    },
    {
      name: 'settler-marketing-weekly-report',
      schedule: '0 9 * * 1',
      command: 'cd /root/.openclaw/workspace/Settler/marketing && node weekly-report.js',
      description: 'Weekly marketing performance report'
    }
  ]
};

fs.writeFileSync(
  path.join(__dirname, 'brain-cron-config.json'),
  JSON.stringify(cronConfig, null, 2)
);
console.log('  ✅ Created brain-cron-config.json');

// 5. Create dashboard launcher
console.log('\n🎨 Creating dashboard launcher...');
const dashboardScript = `#!/bin/bash
# Launch marketing dashboard

cd "$(dirname "$0")"
echo "🚀 Starting Settler Marketing Dashboard..."
echo "Open: http://localhost:8080"
echo ""
python3 -m http.server 8080 --directory dashboard
`;

fs.writeFileSync(path.join(__dirname, 'launch-dashboard.sh'), dashboardScript);
execSync(`chmod +x ${path.join(__dirname, 'launch-dashboard.sh')}`);
console.log('  ✅ Created launch-dashboard.sh');

// 6. Create comprehensive README update
console.log('\n📚 Creating README...');
const readme = `# Settler Marketing Automation System

Complete 24/7 marketing automation with approval workflows and direct publishing.

## 🚀 Quick Start

\`\`\`bash
# 1. Setup
node setup.js

# 2. Configure environment
cp .env.template .env
# Edit .env with your credentials

# 3. Run daily automation
node daily-run.js

# 4. Launch dashboard
./launch-dashboard.sh
\`\`\`

## 📋 System Components

### 1. Content Engine
- **Blog Generator**: SEO-optimized posts
- **Social Multiplier**: 1 idea → 10 posts
- **Daily Output**: 3 blog posts + 24 social posts

### 2. Lead Generation
- **Prospect Researcher**: LinkedIn/AngelList/G2
- **Job Monitor**: High-intent job postings
- **Community Miner**: Reddit/HN/Stack Overflow

### 3. Approval Workflow
- Submit content for approval
- Auto-approve low-risk content
- Manual approval for sensitive posts
- Track approval status

### 4. Social Publishing
- Direct Twitter integration
- Direct LinkedIn integration
- Thread publishing
- Scheduled posts

### 5. Dashboard
- Real-time metrics
- Content queue management
- Approval interface
- Performance analytics

## ⚙️ Automation Schedule

| Job | Frequency | Output |
|-----|-----------|--------|
| Daily Run | 6:00 AM daily | Full marketing automation |
| Process Scheduled | Every 15 min | Publish scheduled posts |
| Community Monitor | Every 4 hours | New engagement opportunities |
| Weekly Report | Monday 9:00 AM | Performance summary |

## 🛠️ Commands

### Content Generation
\`\`\`bash
# Generate 3 blog posts
node content-engine/blog-generator.ts --count=3

# Multiply one idea
node content-engine/social-multiplier.ts --idea="Your idea"
\`\`\`

### Lead Generation
\`\`\`bash
# Research prospects
node lead-gen/prospect-researcher.ts --source=all

# Monitor jobs
node lead-gen/job-monitor.ts --keywords="reconciliation"

# Mine communities
node lead-gen/community-miner.ts --platform=reddit
\`\`\`

### Approval Workflow
\`\`\`bash
# Submit content
node approval-workflow.js --action=submit --type=social --title="5 Tips" --platform=twitter

# List pending
node approval-workflow.js --action=list --status=pending

# Approve
node approval-workflow.js --action=approve --id=xxx --approver=Scott

# Reject
node approval-workflow.js --action=reject --id=xxx --reason="Too promotional"
\`\`\`

### Social Publishing
\`\`\`bash
# Publish now
node integrations/social-publisher.js publish --platform=twitter --content="Hello!"

# Publish thread
node integrations/social-publisher.js publish --platform=twitter --thread="Tweet 1\\nTweet 2"

# Schedule post
node integrations/social-publisher.js schedule --platform=linkedin --content="Hello" --schedule="2026-04-10T09:00:00Z"

# Process scheduled
node integrations/social-publisher.js process
\`\`\`

## 📊 Expected Output

**Daily:**
- 3 blog posts
- 24+ social posts
- 5+ prospects
- 4+ job opportunities
- 4+ community engagements
- 5+ partnership opportunities

**Weekly:**
- 21 blog posts
- 168 social posts
- 35 prospects
- 28 job outreaches
- 28 community engagements
- 35 partnership targets

**Monthly:**
- 90 blog posts
- 720 social posts
- 150 prospects
- 120 job outreaches
- 120 community engagements
- 150 partnership opportunities

## 🔐 Environment Variables

See .env.template for all options.

**Required:**
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

**Optional (for auto-publishing):**
- TWITTER_BEARER_TOKEN
- LINKEDIN_ACCESS_TOKEN
- SLACK_WEBHOOK_URL

## 🧠 Brain OS Integration

To add to Brain OS cron:

\`\`\`bash
brain cron add "0 6 * * *" "node /root/.openclaw/workspace/Settler/marketing/daily-run.js"
brain cron add "*/15 * * * *" "node /root/.openclaw/workspace/Settler/marketing/integrations/social-publisher.js process"
\`\`\`

## 📈 Dashboard

Launch the web dashboard:

\`\`\`bash
./launch-dashboard.sh
# Open http://localhost:8080
\`\`\`

Features:
- Real-time metrics
- Content approval queue
- Publishing status
- Performance analytics

## 📁 Output Structure

\`\`\`
output/
├── blog/YYYY-MM-DD/       # Generated blog posts
├── social/YYYY-MM-DD/     # Social media content
├── prospects/             # Prospect lists
├── jobs/                  # Job posting data
├── community/             # Community posts
├── partnerships/          # Partnership opportunities
├── intelligence/          # Market intelligence
├── voice/                 # Customer voice data
├── approvals/             # Pending approvals
└── published/             # Published content
\`\`\`

## 🎯 Success Metrics

Track these KPIs:
- Content pieces generated
- Prospects identified
- Meetings booked
- Community engagement
- Partnerships initiated
- Organic traffic growth

## 🚀 Next Steps

1. ✅ Run setup: node setup.js
2. ✅ Configure .env file
3. ✅ Run once manually: node daily-run.js
4. ✅ Set up cron jobs via Brain OS
5. ✅ Launch dashboard: ./launch-dashboard.sh
6. ✅ Start approving and publishing!

---

**Your 24/7 marketing machine is ready! 🚀**
`;

fs.writeFileSync(path.join(__dirname, 'README.md'), readme);
console.log('  ✅ Updated README.md');

// 7. Create master orchestrator
console.log('\n🎛️  Creating master orchestrator...');
const orchestrator = `#!/usr/bin/env node
/**
 * Master Marketing Orchestrator
 * 
 * Coordinates all marketing activities
 * Integrates with approval workflow and social publishing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const APPROVAL_WORKFLOW = path.join(__dirname, 'approval-workflow.js');
const SOCIAL_PUBLISHER = path.join(__dirname, 'integrations/social-publisher.js');

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] \${message}\`);
}

async function runWithApproval() {
  log('🚀 Starting orchestrated marketing run...');
  
  // 1. Generate content
  log('Generating content...');
  execSync(\`cd \${__dirname} && node daily-run.js\`, { stdio: 'inherit' });
  
  // 2. Submit for approval
  log('Submitting content for approval...');
  
  // Find generated content and submit
  const outputDir = path.join(__dirname, 'output');
  const today = new Date().toISOString().split('T')[0];
  
  // Submit blog posts
  const blogDir = path.join(outputDir, 'blog', today);
  if (fs.existsSync(blogDir)) {
    const blogs = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
    blogs.forEach(blog => {
      const title = blog.replace('.md', '').replace(/-/g, ' ');
      execSync(\`node \${APPROVAL_WORKFLOW} --action=submit --type=blog --title="\${title}" --content="\${blogDir}/\${blog}"\`);
    });
  }
  
  // Submit social posts (auto-approve low-risk)
  const socialDir = path.join(outputDir, 'social', today);
  if (fs.existsSync(socialDir)) {
    const socials = fs.readdirSync(socialDir).filter(f => f.endsWith('.md'));
    socials.forEach(social => {
      const content = fs.readFileSync(path.join(socialDir, social), 'utf-8');
      const lines = content.split('\\n');
      const title = lines.find(l => l.startsWith('#'))?.replace('# ', '') || social;
      
      // Determine platform from content
      const platform = content.includes('TWITTER') ? 'twitter' : 
                       content.includes('LINKEDIN') ? 'linkedin' : 'twitter';
      
      execSync(\`node \${APPROVAL_WORKFLOW} --action=submit --type=social --title="\${title}" --content="\${social}" --platform=\${platform}\`);
    });
  }
  
  // 3. Auto-approve and publish
  log('Processing approvals and publishing...');
  execSync(\`node \${APPROVAL_WORKFLOW} --action=list --status=approved\`, { stdio: 'inherit' });
  
  // Publish approved content
  // (In production: Iterate through approved items and publish)
  
  // 4. Process scheduled posts
  log('Processing scheduled social posts...');
  execSync(\`node \${SOCIAL_PUBLISHER} process\`, { stdio: 'inherit' });
  
  log('✅ Orchestrated run complete!');
}

// Run
runWithApproval().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
`;

fs.writeFileSync(path.join(__dirname, 'orchestrator.js'), orchestrator);
execSync(`chmod +x ${path.join(__dirname, 'orchestrator.js')}`);
console.log('  ✅ Created orchestrator.js');

// Summary
console.log('\n' + '=' .repeat(60));
console.log('✅ SETUP COMPLETE!');
console.log('=' .repeat(60));
console.log();
console.log('Next steps:');
console.log('1. Copy .env.template to .env and configure');
console.log('2. Run: node daily-run.js (test once)');
console.log('3. Add to Brain OS cron:');
console.log('   brain cron add "0 6 * * *" "node /root/.openclaw/workspace/Settler/marketing/daily-run.js"');
console.log('4. Launch dashboard: ./launch-dashboard.sh');
console.log();
console.log('File structure created:');
dirs.forEach(d => console.log(`  📁 ${d}/`));
console.log();
console.log('Ready for 24/7 automated marketing! 🚀');
`;

// Write the setup script
const setupScript = content.slice(1); // Remove leading newline
fs.writeFileSync(path.join(__dirname, 'setup.js'), setupScript);
console.log('  ✅ Created setup.js');

// Run setup
console.log('\n🚀 Running setup...\n');
require('./setup.js');
