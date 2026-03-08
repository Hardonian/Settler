import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Settler",
  description:
    "Product updates, reconciliation engineering deep dives, integration guides, and best practices for finance and fintech infrastructure teams.",
};

const posts = [
  {
    slug: "deterministic-reconciliation-why-it-matters",
    title: "Why Reconciliation Must Be Deterministic",
    description:
      "Same inputs, same rules, same outputs—every time. This is the core guarantee that separates a real reconciliation engine from a financial spreadsheet with an API. We break down what determinism means in practice, how we enforce it, and why it matters for audit, compliance, and debugging.",
    date: "2025-10-14",
    readTime: "8 min",
    category: "Engineering",
    tags: ["Determinism", "Audit", "Engine"],
  },
  {
    slug: "sha256-hash-chains-for-financial-evidence",
    title: "Hash Chains as Financial Evidence",
    description:
      "Every reconciliation run in Settler produces a SHA-256 hash chain over the evidence payload. Any post-run modification is immediately detectable. This post explains the evidence model, how the chain is constructed, and what it means for compliance workflows that need tamper-evident records.",
    date: "2025-09-22",
    readTime: "6 min",
    category: "Engineering",
    tags: ["Evidence", "SHA-256", "Compliance"],
  },
  {
    slug: "stripe-quickbooks-reconciliation-guide",
    title: "Reconciling Stripe with QuickBooks: A Practical Guide",
    description:
      "Stripe processes payments. QuickBooks holds the books. The gap between them is where errors live. This guide walks through configuring a Settler job to reconcile Stripe payouts against QuickBooks journal entries, handling currency precision, partial matches, and refund timing differences.",
    date: "2025-09-05",
    readTime: "12 min",
    category: "Integration Guide",
    tags: ["Stripe", "QuickBooks", "Integrations"],
  },
  {
    slug: "human-in-the-loop-review-design",
    title: "Designing for Human-in-the-Loop Review",
    description:
      "Settler does not make autonomous financial decisions. Every flagged mismatch requires a human to inspect and resolve it. This post covers how we designed the review workflow—exception triage, AI-assisted context, documented resolution reasons, and audit-ready records of every human decision.",
    date: "2025-08-18",
    readTime: "7 min",
    category: "Product",
    tags: ["Review", "AI", "Governance"],
  },
  {
    slug: "tenant-isolation-architecture",
    title: "Multi-Tenant Isolation in a Reconciliation Engine",
    description:
      "Financial data cannot leak between customers. This post details Settler's tenant isolation model: PostgreSQL row-level security, API key scoping, runtime isolation boundaries, and how we test for cross-tenant data leakage in CI. Built for the paranoid, by the paranoid.",
    date: "2025-08-01",
    readTime: "10 min",
    category: "Engineering",
    tags: ["Multi-Tenant", "Security", "Architecture"],
  },
  {
    slug: "replay-any-reconciliation-run",
    title: "Replay: Re-running Any Reconciliation with Identical Output",
    description:
      "Given stored inputs and the same ruleset, Settler can replay any historical reconciliation run and produce byte-identical output. This post explains how replay works, why it matters for debugging and audit, and how we verify replay integrity with hash comparison against the original evidence.",
    date: "2025-07-14",
    readTime: "9 min",
    category: "Engineering",
    tags: ["Replay", "Determinism", "Debugging"],
  },
];

const categoryColors: Record<string, string> = {
  Engineering: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Integration Guide": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Product: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
            Settler Blog
          </p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Engineering &amp; Product
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Deep dives into reconciliation infrastructure, integration patterns, audit evidence, and
            how Settler is built.
          </p>
        </div>

        {/* Featured post */}
        {featured && (
          <article className="mb-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[featured.category] ?? ""}`}
                >
                  <Tag className="w-3 h-3" />
                  {featured.category}
                </span>
                <Badge variant="outline" className="text-xs">
                  Latest
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {featured.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {featured.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(featured.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.readTime} read
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
                  Read article
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Post grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[post.category] ?? ""}`}
                  >
                    <Tag className="w-3 h-3" />
                    {post.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    Read
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Tags cloud */}
        <div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-4">Topics</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(posts.flatMap((p) => p.tags))).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Want to talk reconciliation infrastructure?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            We publish technical deep dives for engineering and finance operations teams.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Get in touch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
