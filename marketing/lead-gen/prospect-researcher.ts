/**
 * Prospect Researcher
 * 
 * Identifies ideal customers from multiple sources
 * Usage: ts-node prospect-researcher.ts --source=linkedin --criteria="fintech,series-b,50-200 employees"
 */

interface Prospect {
  company: string;
  website: string;
  employees: number;
  funding?: string;
  techStack: string[];
  painPoints: string[];
  decisionMakers: Contact[];
  signal: 'high' | 'medium' | 'low';
  source: string;
}

interface Contact {
  name: string;
  title: string;
  linkedin?: string;
  email?: string;
  isDecisionMaker: boolean;
}

const idealCustomerProfile = {
  industries: ['SaaS', 'Fintech', 'Marketplace', 'E-commerce', 'Payments'],
  employeeRange: [20, 500],
  fundingStages: ['Series A', 'Series B', 'Series C', 'Growth'],
  painIndicators: [
    'hiring finance team',
    'payment processor mentions',
    'multi-currency',
    'high transaction volume',
    'accounting system migration'
  ]
};

// Simulated data sources - would integrate with APIs in production
const dataSources = {
  linkedin: [
    { company: 'PaymentFlow', employees: 120, funding: 'Series B', techStack: ['Stripe', 'Salesforce'], signals: ['hiring finance director'] },
    { company: 'MarketHub', employees: 250, funding: 'Series C', techStack: ['Adyen', 'NetSuite'], signals: ['multi-currency expansion'] },
    { company: 'SaaSBilling', employees: 80, funding: 'Series A', techStack: ['Stripe', 'QuickBooks'], signals: ['transaction volume 10x'] },
  ],
  angellist: [
    { company: 'FinTechFlow', employees: 45, funding: 'Seed', techStack: ['Stripe'], signals: ['accounting automation'] },
    { company: 'PayStream', employees: 180, funding: 'Series B', techStack: ['PayPal', 'Xero'], signals: ['reconciliation challenges'] },
  ],
  g2: [
    { company: 'DataRecon', employees: 65, funding: 'Series A', techStack: ['Stripe', 'SAP'], signals: ['negative reconciliation reviews'] },
    { company: 'BillSync', employees: 200, funding: 'Series C', techStack: ['Square', 'Oracle'], signals: ['seeking automation'] },
  ]
};

function scoreProspect(company: any): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Employee range
  if (company.employees >= 20 && company.employees <= 500) score += 2;
  
  // Funding stage
  if (['Series B', 'Series C'].includes(company.funding)) score += 2;
  
  // Tech stack compatibility
  if (company.techStack.some((t: string) => ['Stripe', 'Adyen', 'PayPal'].includes(t))) score += 2;
  
  // Pain signals
  if (company.signals.some((s: string) => s.includes('reconcil') || s.includes('finance'))) score += 3;
  
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function generateContacts(company: string, employees: number): Contact[] {
  const contacts: Contact[] = [];
  
  // CFO
  if (employees > 100) {
    contacts.push({
      name: `${company} CFO`,
      title: 'Chief Financial Officer',
      isDecisionMaker: true
    });
  }
  
  // VP Finance
  contacts.push({
    name: `${company} VP Finance`,
    title: 'VP of Finance',
    isDecisionMaker: true
  });
  
  // Controller
  contacts.push({
    name: `${company} Controller`,
    title: 'Controller',
    isDecisionMaker: false
  });
  
  // Finance Ops
  contacts.push({
    name: `${company} Finance Ops`,
    title: 'Finance Operations Manager',
    isDecisionMaker: false
  });
  
  return contacts;
}

function researchProspects(source: string, criteria: string): Prospect[] {
  const prospects: Prospect[] = [];
  const sourceData = (dataSources as any)[source] || [];
  
  for (const company of sourceData) {
    const signal = scoreProspect(company);
    
    if (signal !== 'low') {
      prospects.push({
        company: company.company,
        website: `https://${company.company.toLowerCase()}.com`,
        employees: company.employees,
        funding: company.funding,
        techStack: company.techStack,
        painPoints: company.signals,
        decisionMakers: generateContacts(company.company, company.employees),
        signal,
        source
      });
    }
  }
  
  return prospects.sort((a, b) => {
    const signalOrder = { high: 3, medium: 2, low: 1 };
    return signalOrder[b.signal] - signalOrder[a.signal];
  });
}

function formatProspect(prospect: Prospect): string {
  return `
🏢 ${prospect.company}
   Signal: ${prospect.signal.toUpperCase()}
   Size: ${prospect.employees} employees | ${prospect.funding}
   Tech: ${prospect.techStack.join(', ')}
   Pain Points: ${prospect.painPoints.join(', ')}
   Source: ${prospect.source}
   
   👥 Key Contacts:
${prospect.decisionMakers.map(c => `      - ${c.title}${c.isDecisionMaker ? ' (DM)' : ''}`).join('\n')}
`;
}

function generateColdEmail(prospect: Prospect, contact: Contact): string {
  const subjectLines = [
    `Quick question about ${prospect.company}'s reconciliation process`,
    `${contact.title.split(' ')[0]}, are you still reconciling manually?`,
    `Saw ${prospect.company} on ${prospect.source} - congrats on the growth`,
    `${prospect.company} + Settler: automate your ${prospect.techStack[0]} reconciliation`
  ];
  
  const subject = subjectLines[Math.floor(Math.random() * subjectLines.length)];
  
  return `
Subject: ${subject}

Hi ${contact.name.split(' ')[0]},

${prospect.signal === 'high' 
  ? `I noticed ${prospect.company} has been growing fast (${prospect.employees} employees, ${prospect.funding}). With that growth comes reconciliation complexity.`
  : `I came across ${prospect.company} and noticed you're using ${prospect.techStack.join(' and ')}.`
}

Quick question: How many hours does your team spend on reconciliation each week?

We built Settler to automate exactly this - companies like ${prospect.company} save 15-20 hours/week with zero implementation time.

Worth a 10-minute conversation?

Best,
Scott
settler.dev/demo

P.S. - If you're not the right person for this, could you point me to whoever handles reconciliation automation?
`;
}

// CLI
const args = process.argv.slice(2);
const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1] || 'all';
const criteriaArg = args.find(a => a.startsWith('--criteria='))?.split('=')[1] || '';
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1] || './prospects';

console.log('🔍 Researching prospects...\n');

let allProspects: Prospect[] = [];

if (sourceArg === 'all') {
  for (const source of Object.keys(dataSources)) {
    allProspects.push(...researchProspects(source, criteriaArg));
  }
} else {
  allProspects = researchProspects(sourceArg, criteriaArg);
}

// Deduplicate by company
const uniqueProspects = Array.from(new Map(allProspects.map(p => [p.company, p])).values());

console.log(`Found ${uniqueProspects.length} high-signal prospects:\n`);

uniqueProspects.forEach(p => console.log(formatProspect(p)));

// Generate sample cold emails for top 3 prospects
console.log('\n' + '='.repeat(60));
console.log('SAMPLE COLD EMAILS (Top 3 Prospects)\n');

uniqueProspects.slice(0, 3).forEach((prospect, i) => {
  const dm = prospect.decisionMakers.find(c => c.isDecisionMaker) || prospect.decisionMakers[0];
  console.log(`\n--- Email ${i + 1}: ${prospect.company} ---`);
  console.log(generateColdEmail(prospect, dm));
});

// Save to file
const fs = require('fs');
if (!fs.existsSync(outputArg)) {
  fs.mkdirSync(outputArg, { recursive: true });
}

const timestamp = Date.now();
fs.writeFileSync(
  `${outputArg}/prospects-${timestamp}.json`,
  JSON.stringify(uniqueProspects, null, 2)
);

console.log(`\n✅ Saved ${uniqueProspects.length} prospects to ${outputArg}/prospects-${timestamp}.json`);

export { researchProspects, generateColdEmail, Prospect };
