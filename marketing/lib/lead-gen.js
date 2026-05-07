function generateProspects() {
  return [
    {
      company: "PaymentFlow",
      employees: 120,
      funding: "Series B",
      techStack: ["Stripe", "Salesforce"],
      signal: "high",
    },
    {
      company: "MarketHub",
      employees: 250,
      funding: "Series C",
      techStack: ["Adyen", "NetSuite"],
      signal: "high",
    },
    {
      company: "SaaSBilling",
      employees: 80,
      funding: "Series A",
      techStack: ["Stripe", "QuickBooks"],
      signal: "medium",
    },
    {
      company: "FinTechFlow",
      employees: 45,
      funding: "Seed",
      techStack: ["Stripe"],
      signal: "medium",
    },
    {
      company: "PayStream",
      employees: 180,
      funding: "Series B",
      techStack: ["PayPal", "Xero"],
      signal: "high",
    },
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
    {
      company: "FastPay",
      title: "Senior Finance Operations Manager",
      signal: "high",
      keywords: ["reconciliation", "transaction matching"],
    },
    {
      company: "CloudBilling",
      title: "Payment Operations Specialist",
      signal: "high",
      keywords: ["reconciliation", "stripe"],
    },
    {
      company: "SaaSPlatform",
      title: "Financial Analyst",
      signal: "medium",
      keywords: ["reconciliation"],
    },
    {
      company: "MarketplaceX",
      title: "Director of Finance",
      signal: "high",
      keywords: ["automated reconciliation"],
    },
  ];
}

function generateJobOutreach(posting) {
  return `Subject: Saw ${posting.company}'s ${posting.title} posting

Hi there,

I saw ${posting.company} is hiring a ${posting.title} and specifically mentioned ${posting.keywords.join(", ")}.

Instead of building this in-house over 6+ months, what if you could have it running in 5 minutes?

Settler automates reconciliation for companies like ${posting.company}. We've helped teams save 15-20 hours/week.

Happy to show you how it works - no sales pitch, just a quick demo.

Best,
Scott
settler.dev/demo`;
}

function generateCommunityPosts() {
  return [
    {
      platform: "reddit",
      title: "How do you handle Stripe reconciliation at scale?",
      relevance: "high",
    },
    {
      platform: "hn",
      title: "Ask HN: How do you automate financial reconciliation?",
      relevance: "high",
    },
    {
      platform: "stackoverflow",
      title: "Best way to match transactions from Stripe to internal database?",
      relevance: "medium",
    },
    { platform: "reddit", title: "Multi-currency reconciliation nightmare", relevance: "high" },
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

Happy to share more specifics if helpful.`,
  };

  return responses[post.relevance] || responses.medium;
}

module.exports = {
  generateProspects,
  generateColdEmail,
  generateJobPostings,
  generateJobOutreach,
  generateCommunityPosts,
  generateCommunityResponse,
};
