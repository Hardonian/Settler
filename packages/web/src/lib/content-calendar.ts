/**
 * Content Calendar Generator
 * Generates SEO and social media content calendar
 */

export interface ContentItem {
  date: string;
  type: "blog" | "social" | "seo" | "email";
  platform?: "twitter" | "linkedin" | "blog" | "newsletter";
  title: string;
  description: string;
  keywords?: string[];
  status: "draft" | "scheduled" | "published";
}

/**
 * Generate 3-month content calendar
 */
export function generateContentCalendar(startDate: Date = new Date()): ContentItem[] {
  const calendar: ContentItem[] = [];
  const months = 3;
  const daysPerMonth = 30;

  const topics = [
    "Payment Reconciliation Best Practices",
    "Shopify-Stripe Integration Guide",
    "Financial Data Automation",
    "E-commerce Reconciliation",
    "API Integration Tutorials",
    "Reconciliation Accuracy Tips",
    "Multi-platform Payment Matching",
    "Financial Compliance & Reconciliation",
  ];

  const socialTopics = [
    "Quick tip: Save 10+ hours/week with automated reconciliation",
    "Case study: How [Company] reduced reconciliation errors by 99%",
    "New feature: Edge AI for local processing",
    "Integration spotlight: Shopify + Stripe",
    "Developer tip: Best practices for reconciliation APIs",
  ];

  let currentDate = new Date(startDate);

  for (let month = 0; month < months; month++) {
    // Blog posts (2 per month)
    for (let i = 0; i < 2; i++) {
      const blogDate = new Date(currentDate);
      blogDate.setDate(blogDate.getDate() + i * 15);
      calendar.push({
        date: blogDate.toISOString().split("T")[0],
        type: "blog",
        platform: "blog",
        title: topics[(month * 2 + i) % topics.length],
        description: `Comprehensive guide on ${topics[(month * 2 + i) % topics.length].toLowerCase()}`,
        keywords: ["reconciliation", "API", "financial automation"],
        status: "draft",
      });
    }

    // Social posts (3 per week = ~12 per month)
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 3; day++) {
        const socialDate = new Date(currentDate);
        socialDate.setDate(socialDate.getDate() + week * 7 + day * 2);
        const platform = day % 2 === 0 ? "twitter" : "linkedin";
        calendar.push({
          date: socialDate.toISOString().split("T")[0],
          type: "social",
          platform,
          title: socialTopics[(month * 12 + week * 3 + day) % socialTopics.length],
          description: "Social media post",
          status: "draft",
        });
      }
    }

    // SEO landing pages (1 per month)
    const seoDate = new Date(currentDate);
    seoDate.setDate(seoDate.getDate() + 10);
    calendar.push({
      date: seoDate.toISOString().split("T")[0],
      type: "seo",
      platform: "blog",
      title: `Reconciliation Guide: ${topics[month % topics.length]}`,
      description: `SEO-optimized landing page for ${topics[month % topics.length].toLowerCase()}`,
      keywords: ["reconciliation", "guide", "tutorial"],
      status: "draft",
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return calendar.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Export calendar as CSV
 */
export function exportCalendarAsCSV(calendar: ContentItem[]): string {
  const headers = ["Date", "Type", "Platform", "Title", "Description", "Keywords", "Status"];
  const rows = calendar.map((item) => [
    item.date,
    item.type,
    item.platform || "",
    item.title,
    item.description,
    item.keywords?.join(", ") || "",
    item.status,
  ]);

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}
