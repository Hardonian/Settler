import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConversionCTA } from "@/components/ConversionCTA";
import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Founder Story - Settler",
  description:
    "The story behind Settler and why we're building the future of financial reconciliation.",
  canonical: "https://settler.dev/founder",
});

export default function FounderPage() {
  return (
    <AnimatedPageWrapper>
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Founder Story' }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 dark:text-white">
          Why I Built Settler
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead">
            After spending countless hours manually reconciling transactions across Shopify, Stripe,
            PayPal, and other platforms, I realized there had to be a better way.
          </p>

          <h2>The Problem</h2>
          <p>
            The reconciliation process was error-prone, time-consuming, and took valuable time away
            from building the actual product. Every growing e-commerce business faces the same
            challenge: transactions happen across multiple platforms, and manually matching them is
            a nightmare.
          </p>

          <h2>The Journey</h2>
          <p>
            I started Settler to solve my own problem—automating financial reconciliation so I could
            focus on what matters. What began as a personal tool quickly became something others
            needed too.
          </p>

          <h2>The Vision</h2>
          <p>
            Settler exists to eliminate the manual work that holds back growing businesses. We
            believe every company should have access to enterprise-grade reconciliation tools,
            regardless of size.
          </p>

          <h2>Why Now</h2>
          <p>
            The explosion of multi-platform commerce has created a reconciliation nightmare. Settler
            solves this with Edge AI, real-time processing, and 99.7% accuracy—all accessible
            through a simple API.
          </p>

          <h2>The Mission</h2>
          <p>
            To make financial reconciliation as simple as sending an email. No complex setup, no
            manual work, just accurate results in minutes instead of hours.
          </p>
        </div>

        {/* CTA Section */}
        <section className="py-20">
          <ConversionCTA
            title="Ready to Experience the Difference?"
            description="Join hundreds of companies using Settler to automate their reconciliation. Start your free trial today."
            primaryAction="Start Free Trial"
            primaryLink="/signup"
            secondaryAction="View Pricing"
            secondaryLink="/pricing"
            variant="gradient"
          />
        </section>
      </div>

      <Footer />
    </AnimatedPageWrapper>
  );
}
