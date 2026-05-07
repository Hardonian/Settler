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
  generateCommunityPosts,
  generateCommunityResponse,
};
