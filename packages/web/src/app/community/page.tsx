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

export default function CommunityPage() {
  return (
    <AnimatedPageWrapper aria-label="Community hub">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-electric-cyan dark:via-electric-purple dark:to-electric-blue bg-clip-text text-transparent">
            Community Hub
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300">
            Share feedback, engage with posts, and help shape our ecosystem
          </p>
        </div>

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
      </div>

      <Footer />
    </AnimatedPageWrapper>
  );
}
