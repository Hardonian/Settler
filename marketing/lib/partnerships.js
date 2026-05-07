function generatePartnerships() {
  return [
    { name: "QuickBooks", category: "integration", fit: "strategic", relevanceScore: 95 },
    { name: "Xero", category: "integration", fit: "strategic", relevanceScore: 90 },
    { name: "Stripe Atlas", category: "co-marketing", fit: "strategic", relevanceScore: 90 },
    { name: "Mercury", category: "co-marketing", fit: "strategic", relevanceScore: 88 },
    { name: "Pilot", category: "co-marketing", fit: "strategic", relevanceScore: 85 },
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

P.S. - We're already integrated with ${partner.name === "QuickBooks" ? "Xero and Stripe" : "QuickBooks and Stripe"}. ${partner.name} would complete the picture.`;
}

module.exports = {
  generatePartnerships,
  generatePartnerEmail,
};
