/**
 * Example: Using Feature Flags and Experiments
 * 
 * This component demonstrates how to use feature flags and experiments
 * in a real-world scenario.
 */

'use client';

import { useFeatureFlag, useExperiment, useExperimentConversion } from '@/lib/flags';
import { ProductEvents } from '@/lib/telemetry/product-events';
import { useEffect } from 'react';

export function FeatureFlagExample() {
  // Example 1: Feature Flag
  const isNewDashboard = useFeatureFlag('new_dashboard');
  
  // Example 2: Experiment
  const { variant, trackExposure } = useExperiment('experiment_dashboard_layout');
  
  // Track experiment exposure
  useEffect(() => {
    trackExposure('page_view');
  }, [trackExposure]);

  // Example 3: Multiple flags
  const flags = {
    newDashboard: useFeatureFlag('new_dashboard'),
    betaSidebar: useFeatureFlag('beta_sidebar'),
  };

  return (
    <div className="p-4">
      <h2>Feature Flags & Experiments Example</h2>
      
      {/* Feature Flag Usage */}
      <section className="mt-4">
        <h3>Feature Flag: New Dashboard</h3>
        {isNewDashboard ? (
          <div>
            <p>✅ New Dashboard Enabled</p>
            <NewDashboard />
          </div>
        ) : (
          <div>
            <p>📊 Legacy Dashboard</p>
            <LegacyDashboard />
          </div>
        )}
      </section>

      {/* Experiment Usage */}
      <section className="mt-4">
        <h3>Experiment: Dashboard Layout</h3>
        <p>Variant: {variant}</p>
        {variant === 'compact' && <CompactLayout />}
        {variant === 'expanded' && <ExpandedLayout />}
        {variant === 'control' && <ControlLayout />}
      </section>

      {/* Multiple Flags */}
      <section className="mt-4">
        <h3>Multiple Flags</h3>
        <ul>
          <li>New Dashboard: {flags.newDashboard ? '✅' : '❌'}</li>
          <li>Beta Sidebar: {flags.betaSidebar ? '✅' : '❌'}</li>
        </ul>
      </section>
    </div>
  );
}

function NewDashboard() {
  return <div>New Dashboard UI</div>;
}

function LegacyDashboard() {
  return <div>Legacy Dashboard UI</div>;
}

function CompactLayout() {
  return <div>Compact Layout</div>;
}

function ExpandedLayout() {
  return <div>Expanded Layout</div>;
}

function ControlLayout() {
  return <div>Control Layout</div>;
}

/**
 * Example: Onboarding with Experiment Tracking
 */
export function OnboardingExample() {
  const { variant, trackExposure } = useExperiment('experiment_onboarding_v2');

  useEffect(() => {
    // Track onboarding start
    ProductEvents.onboarding.started({
      onboardingType: 'new_user',
      source: 'signup',
    });

    // Track experiment exposure
    trackExposure('page_view');
  }, [trackExposure]);

  const handleStepComplete = (stepNumber: number, stepName: string) => {
    ProductEvents.onboarding.stepCompleted({
      stepName,
      stepNumber,
      totalSteps: 5,
    });
  };

  const handleComplete = () => {
    ProductEvents.onboarding.completed({
      totalDuration: 300,
      stepsCompleted: 5,
      completionRate: 1.0,
    });
  };

  return (
    <div>
      {variant === 'variant_a' && (
        <OnboardingV2A
          onStepComplete={handleStepComplete}
          onComplete={handleComplete}
        />
      )}
      {variant === 'variant_b' && (
        <OnboardingV2B
          onStepComplete={handleStepComplete}
          onComplete={handleComplete}
        />
      )}
      {variant === 'control' && (
        <OnboardingControl
          onStepComplete={handleStepComplete}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

function OnboardingV2A(_props: { onStepComplete: (step: number, name: string) => void; onComplete: () => void }) {
  return <div>Onboarding Variant A</div>;
}

function OnboardingV2B(_props: { onStepComplete: (step: number, name: string) => void; onComplete: () => void }) {
  return <div>Onboarding Variant B</div>;
}

function OnboardingControl(_props: { onStepComplete: (step: number, name: string) => void; onComplete: () => void }) {
  return <div>Onboarding Control</div>;
}

/**
 * Example: Conversion Tracking with Experiments
 */
export function CheckoutExample() {
  const { trackConversion, variant } = useExperimentConversion('experiment_checkout_v2');

  const handleCheckout = () => {
    // Track conversion with experiment context
    trackConversion('checkout_completed', {
      value: 99.99,
    });

    // Also track subscription started
    ProductEvents.conversions.subscriptionStarted({
      planId: 'pro_monthly',
      planName: 'Pro Plan',
      billingCycle: 'monthly',
      amount: 9999,
    });
  };

  return (
    <div>
      <p>Checkout Variant: {variant}</p>
      <button onClick={handleCheckout}>Complete Checkout</button>
    </div>
  );
}
