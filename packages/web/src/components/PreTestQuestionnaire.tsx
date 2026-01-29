"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreTestQuestionnaireProps {
  onComplete: (answers: PreTestAnswers) => void;
  onSkip?: () => void;
  className?: string;
}

export interface PreTestAnswers {
  primaryGoal?: "save_time" | "reduce_errors" | "scale_operations" | "compliance";
  industry?: "ecommerce" | "saas" | "finance" | "healthcare" | "other";
  transactionVolume?: "<1k" | "1k-10k" | "10k-100k" | "100k+";
  platforms?: string[];
  reconciliationFrequency?: "daily" | "weekly" | "monthly" | "realtime";
  biggestPainPoint?: "manual_work" | "errors" | "time_consuming" | "lack_of_visibility";
}

const questions = [
  {
    id: "primaryGoal",
    question: "What's your main goal with Settler?",
    options: [
      { value: "save_time", label: "Save 10+ hours per week on manual transaction matching" },
      { value: "reduce_errors", label: "Reduce errors and achieve 99.7% accuracy" },
      { value: "scale_operations", label: "Scale reconciliation operations as we grow" },
      { value: "compliance", label: "Meet financial reconciliation requirements automatically" },
    ],
  },
  {
    id: "industry",
    question: "What industry are you in?",
    options: [
      { value: "ecommerce", label: "E-commerce (Shopify, WooCommerce, etc.)" },
      { value: "saas", label: "SaaS / Subscription (Recurring revenue)" },
      { value: "finance", label: "Finance / Banking" },
      { value: "healthcare", label: "Healthcare" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "transactionVolume",
    question: "How many transactions do you process monthly?",
    options: [
      { value: "<1k", label: "Less than 1,000 (small business)" },
      { value: "1k-10k", label: "1,000 - 10,000 (growing business)" },
      { value: "10k-100k", label: "10,000 - 100,000 (established business)" },
      { value: "100k+", label: "100,000+ (enterprise)" },
    ],
  },
  {
    id: "platforms",
    question: "Which platforms do you use? (Select all that apply)",
    options: [
      { value: "shopify", label: "Shopify" },
      { value: "stripe", label: "Stripe" },
      { value: "quickbooks", label: "QuickBooks" },
      { value: "paypal", label: "PayPal" },
      { value: "square", label: "Square" },
      { value: "other", label: "Other" },
    ],
    multiple: true,
  },
  {
    id: "reconciliationFrequency",
    question: "How often do you need reconciliation?",
    options: [
      { value: "daily", label: "Daily (Automated daily runs)" },
      { value: "weekly", label: "Weekly (Weekly batch processing)" },
      { value: "monthly", label: "Monthly (Monthly reconciliation)" },
      { value: "realtime", label: "Real-time (Instant webhook processing)" },
    ],
  },
  {
    id: "biggestPainPoint",
    question: "What's your biggest pain point?",
    options: [
      { value: "manual_work", label: "Too much manual work" },
      { value: "errors", label: "Frequent errors" },
      { value: "time_consuming", label: "Time-consuming process" },
      { value: "lack_of_visibility", label: "Lack of visibility" },
    ],
  },
];

export function PreTestQuestionnaire({ onComplete, onSkip, className }: PreTestQuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<PreTestAnswers>({});

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = async (questionId: string, value: string | string[]) => {
    const newAnswers = {
      ...answers,
      [questionId]: value,
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Save answers when complete
      try {
        const response = await fetch("/api/user/pre-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAnswers),
        });

        if (response.ok) {
          onComplete(newAnswers);
        } else {
          console.error("Failed to save pre-test answers");
          // Still call onComplete even if save fails
          onComplete(newAnswers);
        }
      } catch (error: unknown) {
        console.error("Error saving pre-test answers:", error);
        // Still call onComplete even if save fails
        onComplete(newAnswers);
      }
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Save answers when complete
      try {
        const response = await fetch("/api/user/pre-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });

        if (response.ok) {
          onComplete(answers);
        } else {
          console.error("Failed to save pre-test answers");
          onComplete(answers);
        }
      } catch (error: unknown) {
        console.error("Error saving pre-test answers:", error);
        onComplete(answers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentQ = questions[currentQuestion];
  if (!currentQ) {
    return null;
  }
  const currentAnswer = answers[currentQ.id as keyof PreTestAnswers];

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Help Us Personalize Your Experience</CardTitle>
            <CardDescription>
              Answer a few quick questions to get personalized content and recommendations
            </CardDescription>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-slate-500 mt-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">{currentQ.question}</h3>

          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = currentQ.multiple
                ? (currentAnswer as string[])?.includes(option.value)
                : currentAnswer === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (currentQ.multiple) {
                      const current = (currentAnswer as string[]) || [];
                      const newValue = isSelected
                        ? current.filter((v) => v !== option.value)
                        : [...current, option.value];
                      handleAnswer(currentQ.id, newValue);
                    } else {
                      handleAnswer(currentQ.id, option.value);
                    }
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1 && !currentAnswer}
            >
              {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
