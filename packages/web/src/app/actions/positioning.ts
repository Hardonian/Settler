/**
 * Server Actions for Positioning Feedback
 * 
 * Community Loop Feedback: Users submit positioning clarity input,
 * which triggers a Supabase Function to calculate impact score.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PositioningFeedbackInput {
  fiveWordVp?: string;
  targetPersonaPain?: string;
  clarityRating?: number;
  feedbackText?: string;
}

export interface PositioningFeedbackResult {
  success: boolean;
  error?: string;
  impactScore?: number;
  feedbackId?: string;
}

/**
 * Server Action: Submit Positioning Feedback
 * 
 * Flow: Form Submission → Server Action → Supabase positioning_feedback table
 * → Trigger calculates impact_score → Notification created → Profile updated
 */
export async function submitPositioningFeedback(
  input: PositioningFeedbackInput
): Promise<PositioningFeedbackResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Validate input
    if (!input.fiveWordVp && !input.targetPersonaPain && !input.feedbackText) {
      return {
        success: false,
        error: 'Please provide at least one piece of feedback',
      };
    }

    // Insert feedback (trigger will calculate impact_score automatically)
    const { data, error } = await supabase
      .from('positioning_feedback')
      .insert({
        user_id: user?.id || null, // Allow anonymous feedback
        five_word_vp: input.fiveWordVp,
        target_persona_pain: input.targetPersonaPain,
        clarity_rating: input.clarityRating,
        feedback_text: input.feedbackText,
      } as any)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate dashboard to show updated metrics
    revalidatePath('/dashboard');
    revalidatePath('/');

    return {
      success: true,
      impactScore: (data as any)?.impact_score,
      feedbackId: (data as any)?.id,
    };
  } catch (error) {
    console.error('Positioning feedback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback',
    };
  }
}
