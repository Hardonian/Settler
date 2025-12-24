/**
 * Onboarding Progress API Route
 * 
 * GET /api/onboarding/progress - Get current user's onboarding progress
 * POST /api/onboarding/progress/complete - Mark a step as complete
 * POST /api/onboarding/progress/skip - Skip a step
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOnboardingProgress,
  completeStep,
  getAllStepsWithStatus,
  type OnboardingStep,
} from '@/lib/onboarding/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/onboarding/progress
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const progress = await getOnboardingProgress(user.id);

    if (!progress) {
      return NextResponse.json({
        progress: 0,
        currentStep: 'welcome',
        completedSteps: [],
        skippedSteps: [],
        steps: [],
      });
    }

    const steps = getAllStepsWithStatus(
      progress.currentStep as OnboardingStep,
      progress.completedSteps as OnboardingStep[],
      progress.skippedSteps as OnboardingStep[]
    );

    return NextResponse.json({
      progress: progress.progress,
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
      skippedSteps: progress.skippedSteps,
      completedAt: progress.completedAt,
      steps,
    });
  } catch (error) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json(
      {
        progress: 0,
        currentStep: 'welcome',
        completedSteps: [],
        skippedSteps: [],
        steps: [],
      },
      { status: 200 }
    );
  }
}

/**
 * POST /api/onboarding/progress/complete
 */
export async function POST(request: NextRequest) {
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

    const updated = await completeStep(user.id, step as OnboardingStep);

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
      completedAt: updated.completedAt,
      steps,
    });
  } catch (error) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update progress',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}
