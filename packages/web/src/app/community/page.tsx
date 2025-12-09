/**
 * Community Page
 * 
 * Combines positioning feedback form with real-time posts
 * Demonstrates the full ecosystem in action
 */

import { PositioningFeedbackForm } from '@/app/components/PositioningFeedbackForm';
import { RealtimePosts } from '@/app/components/RealtimePosts';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConversionCTA } from '@/components/ConversionCTA';
import { AnimatedHero } from '@/components/AnimatedHero';

export default function CommunityPage() {
  return (
    <AnimatedPageWrapper aria-label="Community hub">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Community' }]} />
        </div>
      </section>

      {/* Hero Section */}
      <AnimatedHero
        badge="Join Our Community"
        title="Community Hub"
        description="Share feedback, engage with posts, and help shape the future of Settler"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Positioning Feedback Form */}
          <div>
            <PositioningFeedbackForm />
          </div>

          {/* Real-time Posts */}
          <div>
            <RealtimePosts />
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <ConversionCTA
              title="Ready to Get Started?"
              description="Join our community and start automating your reconciliation today."
              primaryAction="Start Free Trial"
              primaryLink="/signup"
              secondaryAction="View Documentation"
              secondaryLink="/docs"
              variant="gradient"
            />
          </div>
        </section>
      </div>

      <Footer />
    </AnimatedPageWrapper>
  );
}
