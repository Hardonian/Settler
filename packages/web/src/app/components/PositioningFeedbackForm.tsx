/**
 * Positioning Feedback Form Component
 * 
 * Community Loop Feedback: Users submit positioning clarity input
 * which triggers Supabase Function to calculate impact score
 */

'use client';

import { useState } from 'react';
import { submitPositioningFeedback } from '@/app/actions/positioning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Sparkles, CheckCircle2 } from 'lucide-react';

export function PositioningFeedbackForm() {
  const [formData, setFormData] = useState({
    fiveWordVp: '',
    targetPersonaPain: '',
    clarityRating: 5,
    feedbackText: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    impactScore?: number;
    message?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitPositioningFeedback({
        fiveWordVp: formData.fiveWordVp,
        targetPersonaPain: formData.targetPersonaPain,
        clarityRating: formData.clarityRating,
        feedbackText: formData.feedbackText,
      });

      if (response.success) {
        setResult({
          success: true,
          ...(response.impactScore !== undefined && { impactScore: response.impactScore }),
          message: `Thank you! Your feedback earned ${response.impactScore ?? 0} impact points.`,
        });
        // Reset form
        setFormData({
          fiveWordVp: '',
          targetPersonaPain: '',
          clarityRating: 5,
          feedbackText: '',
        });
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to submit feedback',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-blue-600 dark:text-electric-cyan" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Help Us Improve Positioning Clarity
        </h2>
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Your feedback helps us communicate our value proposition more clearly.
        Earn impact points for detailed, thoughtful responses!
      </p>

      {result && (
        <div className={`mb-6 p-4 rounded-lg ${
          result.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${
                result.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {result.message}
              </p>
              {result.success && result.impactScore && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Your impact score has been updated. Check your profile to see your total!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="fiveWordVp" className="mb-2 block">
            5-Word Value Proposition
            <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
              (Optional - max 5 words)
            </span>
          </Label>
          <Input
            id="fiveWordVp"
            type="text"
            placeholder="e.g., 'Automate financial reconciliation instantly'"
            value={formData.fiveWordVp}
            onChange={(e) => setFormData({ ...formData, fiveWordVp: e.target.value })}
            maxLength={255}
            className="w-full"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formData.fiveWordVp.split(/\s+/).filter(Boolean).length} words
          </p>
        </div>

        <div>
          <Label htmlFor="targetPersonaPain" className="mb-2 block">
            Target Persona Pain Point
            <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
              (Optional)
            </span>
          </Label>
          <textarea
            id="targetPersonaPain"
            rows={3}
            placeholder="Describe the primary pain point our target persona faces..."
            value={formData.targetPersonaPain}
            onChange={(e) => setFormData({ ...formData, targetPersonaPain: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-electric-cyan"
          />
        </div>

        <div>
          <Label htmlFor="clarityRating" className="mb-2 block">
            Clarity Rating: {formData.clarityRating}/10
          </Label>
          <input
            id="clarityRating"
            type="range"
            min="1"
            max="10"
            value={formData.clarityRating}
            onChange={(e) => setFormData({ ...formData, clarityRating: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Unclear</span>
            <span>Perfect</span>
          </div>
        </div>

        <div>
          <Label htmlFor="feedbackText" className="mb-2 block">
            Additional Feedback
            <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
              (Optional)
            </span>
          </Label>
          <textarea
            id="feedbackText"
            rows={4}
            placeholder="Any additional thoughts on how we can improve our positioning..."
            value={formData.feedbackText}
            onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-electric-cyan"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || (!formData.fiveWordVp && !formData.targetPersonaPain && !formData.feedbackText)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-electric-cyan dark:to-electric-blue dark:hover:from-electric-cyan/90 dark:hover:to-electric-blue/90"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </form>
    </div>
  );
}
