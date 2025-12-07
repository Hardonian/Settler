"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  tourId: string;
}

export function GuidedTour({ steps, onComplete, onSkip, tourId }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (steps.length === 0) return;

    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      const positions = {
        top: {
          top: rect.top + scrollY - 10,
          left: rect.left + scrollX + rect.width / 2,
        },
        bottom: {
          top: rect.bottom + scrollY + 10,
          left: rect.left + scrollX + rect.width / 2,
        },
        left: {
          top: rect.top + scrollY + rect.height / 2,
          left: rect.left + scrollX - 10,
        },
        right: {
          top: rect.top + scrollY + rect.height / 2,
          left: rect.right + scrollX + 10,
        },
      };

      setPosition(positions[step.position || "bottom"]);
      setIsVisible(true);

      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

      // Highlight element
      (element as HTMLElement).style.zIndex = "9998";
      (element as HTMLElement).style.position = "relative";
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  const handleComplete = () => {
    setIsVisible(false);
    // Mark tour as completed in localStorage
    localStorage.setItem(`tour_completed_${tourId}`, "true");
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(`tour_completed_${tourId}`, "true");
    onSkip();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[9997]"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999] w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6",
          "transform transition-all duration-300",
          step.position === "top" && "-translate-y-full -translate-x-1/2",
          step.position === "bottom" && "-translate-x-1/2",
          step.position === "left" && "-translate-x-full -translate-y-1/2",
          step.position === "right" && "-translate-y-1/2"
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{step.content}</p>
          </div>
          <button
            onClick={handleSkip}
            className="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    index === currentStep ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            {step.action ? (
              <Button
                size="sm"
                onClick={() => {
                  step.action?.onClick();
                  handleNext();
                }}
              >
                {step.action.label}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleNext}>
                {isLast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
