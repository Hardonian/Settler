/**
 * Guided Tour Component
 * 
 * Provides step-by-step guidance for first-time console users,
 * helping them understand key features and next steps.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Key, RefreshCw, Receipt, ToggleLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type TourStep = 
  | 'welcome'
  | 'api_keys'
  | 'playground'
  | 'reconcile'
  | 'receipts'
  | 'feature_flags'
  | 'complete';

interface TourStepConfig {
  id: TourStep;
  title: string;
  description: string;
  icon: typeof Key;
  ctaLabel: string;
  ctaUrl: string;
  optional: boolean;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome to Settler Console',
    description: 'This is your command center for managing API keys, running reconciliations, and monitoring usage.',
    icon: CheckCircle2,
    ctaLabel: 'Get Started',
    ctaUrl: '#',
    optional: false,
  },
  {
    id: 'api_keys',
    title: 'API Keys',
    description: 'Create API keys to authenticate your applications. Each key can have different permissions and scopes.',
    icon: Key,
    ctaLabel: 'Create API Key',
    ctaUrl: '/console/api-keys',
    optional: false,
  },
  {
    id: 'playground',
    title: 'Playground',
    description: 'Test Settler APIs interactively without writing code. Perfect for exploring features and testing configurations.',
    icon: RefreshCw,
    ctaLabel: 'Open Playground',
    ctaUrl: '/console/playground',
    optional: false,
  },
  {
    id: 'reconcile',
    title: 'Reconciliation',
    description: 'Match transactions across platforms automatically. Set up reconciliation jobs to run on schedule or on-demand.',
    icon: RefreshCw,
    ctaLabel: 'Try Reconciliation',
    ctaUrl: '/console/playground/reconcile',
    optional: false,
  },
  {
    id: 'receipts',
    title: 'Receipt Parsing',
    description: 'Upload receipts and let Settler extract key information automatically. Perfect for expense management.',
    icon: Receipt,
    ctaLabel: 'Parse Receipt',
    ctaUrl: '/console/receipts',
    optional: true,
  },
  {
    id: 'feature_flags',
    title: 'Feature Flags',
    description: 'Control feature rollouts programmatically. Create flags, set targeting rules, and manage releases.',
    icon: ToggleLeft,
    ctaLabel: 'Create Flag',
    ctaUrl: '/console/feature-flags',
    optional: true,
  },
  {
    id: 'complete',
    title: 'Tour Complete!',
    description: 'You\'re all set to start using Settler. Explore the console and start automating your financial reconciliation.',
    icon: CheckCircle2,
    ctaLabel: 'Go to Dashboard',
    ctaUrl: '/console',
    optional: false,
  },
];

interface GuidedTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if tour was already completed or dismissed
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('settler_tour_completed') === 'true';
      const tourDismissed = localStorage.getItem('settler_tour_dismissed') === 'true';
      
      if (!tourCompleted && !tourDismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('settler_tour_dismissed', 'true');
    }
    onSkip?.();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('settler_tour_completed', 'true');
    }
    onComplete?.();
  };

  const handleCTAClick = () => {
    const step = TOUR_STEPS[currentStep];
    if (!step) return;
    if (step.ctaUrl !== '#') {
      router.push(step.ctaUrl);
    }
    if (currentStep === TOUR_STEPS.length - 1) {
      handleComplete();
    } else {
      handleNext();
    }
  };

  if (!isVisible) {
    return null;
  }

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;
  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute right-4 top-4"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>{step?.title || ''}</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {TOUR_STEPS.length}
                {step?.optional && ' (Optional)'}
              </CardDescription>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {step?.description || ''}
          </p>
          
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={isFirstStep ? handleSkip : handlePrevious}
              disabled={isFirstStep}
            >
              {isFirstStep ? (
                'Skip Tour'
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </>
              )}
            </Button>
            
            <Button
              onClick={isLastStep ? handleComplete : handleCTAClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLastStep ? (
                'Complete Tour'
              ) : (
                <>
                  {step?.ctaLabel || 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
