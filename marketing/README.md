# Settler Marketing Automation System

Complete marketing automation for exponential reach.

## Quick Start

```bash
# Install dependencies
cd marketing && npm install

# Generate 5 blog posts
ts-node content-engine/blog-generator.ts --count=5

# Multiply one idea into 10 social posts
ts-node content-engine/social-multiplier.ts --idea="Automated reconciliation saves 20 hours/week"

# Research prospects
ts-node lead-gen/prospect-researcher.ts --source=all

# Monitor job postings for intent signals
ts-node lead-gen/job-monitor.ts --keywords="reconciliation,finance automation"

# Mine communities
ts-node lead-gen/community-miner.ts --platform=all

# Find partnership opportunities
ts-node partnerships/partnership-finder.ts --type=integration

# Monitor competitors
ts-node intelligence/competitor-monitor.ts

# Mine customer voice
ts-node intelligence/customer-voice-miner.ts
```

## System Architecture

```
marketing/
├── content-engine/          # Content generation
│   ├── blog-generator.ts    # SEO blog posts
│   └── social-multiplier.ts # 1 idea → 10 posts
├── lead-gen/                # Lead generation
│   ├── prospect-researcher.ts  # Prospect research
│   ├── job-monitor.ts       # Job posting monitor
│   └── community-miner.ts   # Community mining
├── partnerships/            # Partnerships & PR
│   ├── partnership-finder.ts   # Partner identification
│   └── haro-responder.ts    # HARO response generator
└── intelligence/            # Market intelligence
    ├── competitor-monitor.ts   # Competitor tracking
    └── customer-voice-miner.ts # Customer insights
```

## Content Engine

### Blog Generator
Generates SEO-optimized blog posts targeting reconciliation keywords.

```bash
ts-node content-engine/blog-generator.ts --topic="stripe reconciliation"
```

**Outputs:**
- Markdown files with frontmatter
- Meta descriptions
- Keyword targeting
- Reading time estimates

### Social Multiplier
Takes 1 core idea and turns it into 10+ platform-specific posts.

```bash
ts-node content-engine/social-multiplier.ts --idea="Your core idea"
```

**Outputs:**
- Twitter threads
- LinkedIn posts
- Reddit posts
- Hacker News comments
- Scheduling recommendations

## Lead Generation

### Prospect Researcher
Identifies ideal customers from LinkedIn, AngelList, G2.

```bash
ts-node lead-gen/prospect-researcher.ts --source=linkedin --criteria="fintech,series-b"
```

**Outputs:**
- Scored prospect list
- Decision maker contacts
- Personalized cold emails
- Export to JSON

### Job Monitor
Monitors job boards for high-intent signals (hiring for reconciliation).

```bash
ts-node lead-gen/job-monitor.ts --keywords="reconciliation,finance automation"
```

**Outputs:**
- Scored job postings
- Outreach messages
- Intent analysis

### Community Miner
Mines Reddit, HN, Stack Overflow for reconciliation questions.

```bash
ts-node lead-gen/community-miner.ts --platform=reddit --monitor=true
```

**Outputs:**
- Relevant discussions
- Suggested responses
- Engagement opportunities

## Partnerships & PR

### Partnership Finder
Identifies integration partners and co-marketing opportunities.

```bash
ts-node partnerships/partnership-finder.ts --type=integration
```

**Types:**
- `integration` - Technical integrations (QuickBooks, Xero, etc.)
- `co-marketing` - Co-marketing partners (Mercury, Pilot, etc.)
- `media` - Podcasts and publications

### HARO Responder
Generates responses to journalist queries.

```bash
ts-node partnerships/haro-responder.ts --query="Looking for fintech founders"
```

## Market Intelligence

### Competitor Monitor
Tracks competitor pricing, features, announcements.

```bash
ts-node intelligence/competitor-monitor.ts --competitor=blackline
```

**Outputs:**
- Change alerts
- Battle cards
- Recommended actions

### Customer Voice Miner
Mines reviews and social for customer insights.

```bash
ts-node intelligence/customer-voice-miner.ts --source=g2
```

**Outputs:**
- Pain point analysis
- Content ideas
- Sentiment tracking

## Automation Workflows

### Daily
```bash
# Morning: Check for new prospects
npm run prospects

# Check communities for engagement
npm run communities

# Monitor job postings
npm run jobs
```

### Weekly
```bash
# Generate content
npm run content:blog -- --count=3
npm run content:social -- --idea="Weekly insight"

# Review competitive intelligence
npm run intel:competitors
npm run intel:voice
```

### Monthly
```bash
# Partnership outreach
npm run partnerships

# HARO responses
npm run haro

# Full market analysis
npm run intel:full
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Optional (for extended functionality)
LINKEDIN_API_KEY=
ANGELLIST_API_KEY=
GITHUB_TOKEN=
SLACK_WEBHOOK_URL=
```

## Output Structure

```
marketing/
├── output/
│   ├── blog/           # Generated blog posts
│   ├── social/         # Social media content
│   ├── prospects/      # Prospect lists
│   ├── jobs/           # Job posting data
│   ├── community/      # Community posts
│   ├── partnerships/   # Partner lists
│   └── intelligence/   # Market intel
```

## Success Metrics

Track these KPIs:
- **Content:** Blog posts/week, social engagement
- **Leads:** Prospects identified, meetings booked
- **Community:** Helpful answers, brand mentions
- **Partnerships:** Conversations started, deals closed
- **Intelligence:** Competitor changes tracked, insights generated

## Next Steps

1. Set up environment variables
2. Run initial content generation
3. Schedule daily/weekly automation
4. Track results and iterate
