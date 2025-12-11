import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function VisionPage() {
  return (
    <AnimatedPageWrapper aria-label="Vision page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Vision' }]} />
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate dark:prose-invert lg:prose-xl">
        <h1>The Financial Evidence Thesis</h1>
        <p className="lead">
          We believe that in the future, every software interaction that involves value transfer will require cryptographic, immutable proof.
        </p>

        <h2>The Problem: Fragility</h2>
        <p>
          Today's financial infrastructure is built on duct tape. CSV exports, fragile webhooks, and manual reconciliation processes are the norm. 
          This fragility costs businesses billions in lost revenue, operational overhead, and compliance fines.
        </p>

        <h2>The Solution: Deterministic Infrastructure</h2>
        <p>
          Settler is building the "Truth Layer" for the internet economy. By treating financial events as immutable facts and providing 
          deterministic primitives for matching, conversion, and validation, we enable developers to build systems that are correct by construction.
        </p>

        <h2>Our Mission</h2>
        <p>
          To enable any developer to build banking-grade financial applications without needing a team of 50 accountants and compliance officers.
        </p>

        <blockquote>
          "Financial correctness should be a library import, not a department."
        </blockquote>

        <h2>Join Us</h2>
        <p>
          We are building the rails for the next generation of fintech. If you care about correctness, performance, and developer experience, 
          Settler is for you.
        </p>
      </article>

      <Footer />
    </AnimatedPageWrapper>
  );
}
