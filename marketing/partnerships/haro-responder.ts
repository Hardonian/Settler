/**
 * HARO (Help A Reporter Out) Response Generator
 *
 * Generates responses to journalist queries
 * Usage: ts-node haro-responder.ts --query="Looking for fintech founders"
 */

interface HaroQuery {
  publication: string;
  query: string;
  deadline: string;
  category: string;
}

const expertiseAreas = {
  fintech: [
    'Building reconciliation infrastructure',
    'Payment operations at scale',
    'Financial data automation',
    'Startup finance operations',
    'Transaction matching algorithms'
  ],
  saas: [
    'SaaS billing and revenue recognition',
    'Subscription reconciliation',
    'Multi-entity financial operations',
    'Scaling finance teams'
  ],
  entrepreneurship: [
    'Pivoting from services to product',
    'Building technical infrastructure',
    'B2B sales for technical products',
    'Navigating enterprise procurement'
  ]
};

function generateResponse(query: HaroQuery): string {
  const expertise = query.category === 'Fintech' ? expertiseAreas.fintech :
                    query.category === 'Business' ? expertiseAreas.saas :
                    expertiseAreas.entrepreneurship;

  const selectedExpertise = expertise.slice(0, 3);

  return `
Subject: RE: ${query.publication} - ${query.query.slice(0, 50)}...

Hi [Reporter Name],

Saw your query about ${query.query.slice(0, 80)}... 

I'm the founder of Settler (settler.dev), a reconciliation automation platform processing $1B+ in transactions monthly for 500+ companies.

I can speak to:
${selectedExpertise.map(e => `- ${e}`).join('\n')}

Recent relevant experience:
- Built reconciliation engine handling 10M+ transactions/month
- Worked with companies from seed to Series C on finance ops
- Speaking at SaaStr and Fintech DevCon this year

Here's a recent quote/example:
"Most companies don't realize they're losing 20-30 hours per week to manual reconciliation. The real cost isn't the time - it's the errors that slip through and the delayed financial close."

Happy to provide:
- Written commentary
- Phone interview
- Data/statistics from our platform
- Introductions to customers (with permission)

Deadline: ${query.deadline}

Let me know what works best!

Scott
Founder, Settler
scott@settler.dev
(555) 123-4567

P.S. - Recent press: Featured in TechCrunch, cited in Stripe's partner ecosystem report
`;
}

function analyzeQuery(query: string): { category: string; urgency: string; fit: string } {
  const lower = query.toLowerCase();

  let category = 'General';
  if (lower.includes('fintech') || lower.includes('payment') || lower.includes('banking')) category = 'Fintech';
  if (lower.includes('saas') || lower.includes('startup')) category = 'Business';
  if (lower.includes('founder') || lower.includes('entrepreneur')) category = 'Entrepreneurship';

  let urgency = 'normal';
  if (lower.includes('today') || lower.includes('asap')) urgency = 'high';
  if (lower.includes('this week')) urgency = 'medium';

  let fit = 'good';
  if (lower.includes('reconcil') || lower.includes('finance') || lower.includes('payment')) fit = 'perfect';
  if (lower.includes('fintech') || lower.includes('saas')) fit = 'excellent';

  return { category, urgency, fit };
}

// CLI
const args = process.argv.slice(2);
const queryArg = args.find(a => a.startsWith('--query='))?.split('=')[1];

if (queryArg) {
  const analysis = analyzeQuery(queryArg);

  const sampleQuery: HaroQuery = {
    publication: 'Forbes',
    query: queryArg,
    deadline: 'End of day',
    category: analysis.category
  };

  console.log('Query Analysis:');
  console.log(`  Category: ${analysis.category}`);
  console.log(`  Urgency: ${analysis.urgency}`);
  console.log(`  Fit: ${analysis.fit}`);

  console.log('\n' + '='.repeat(60));
  console.log('GENERATED RESPONSE:\n');
  console.log(generateResponse(sampleQuery));

} else {
  console.log('Usage: ts-node haro-responder.ts --query="Looking for fintech founders"');
}

export { generateResponse, analyzeQuery };
