/**
 * Skip Onboarding Step API Route
 * 
 * POST /api/onboarding/progress/skip
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import {
  skipStep,
  getAllStepsWithStatus,
  type OnboardingStep,
} from '@/lib/onboarding/service';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { step } = body;

    if (!step || typeof step !== 'string') {
      return NextResponse.json(
        { error: 'Step is required' },
        { status: 400 }
      );
    }

    const updated = await skipStep(user.id, step as OnboardingStep);

    if (!updated) {
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to update progress',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    const steps = getAllStepsWithStatus(
      updated.currentStep as OnboardingStep,
      updated.completedSteps as OnboardingStep[],
      updated.skippedSteps as OnboardingStep[]
    );

    return NextResponse.json({
      progress: updated.progress,
      currentStep: updated.currentStep,
      completedSteps: updated.completedSteps,
      skippedSteps: updated.skippedSteps,
      steps,
    });
  } catch (_error) {
    appLogger.error('[Onboarding API] Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to skip step',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
