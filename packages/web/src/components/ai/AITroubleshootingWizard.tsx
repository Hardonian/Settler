"use client";

import { useState } from "react";
import { Wand2, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TroubleshootingStep {
  question: string;
  options: Array<{ value: string; label: string; nextStep?: number }>;
}

const TROUBLESHOOTING_FLOW: TroubleshootingStep[] = [
  {
    question: "What issue are you experiencing?",
    options: [
      { value: "integration_error", label: "Integration connection error", nextStep: 1 },
      { value: "job_failed", label: "Reconciliation job failed", nextStep: 2 },
      { value: "slow_performance", label: "Slow performance", nextStep: 3 },
      { value: "billing_issue", label: "Billing or payment issue", nextStep: 4 },
      { value: "other", label: "Something else", nextStep: 5 },
    ],
  },
  {
    question: "Which integration is having issues?",
    options: [
      { value: "stripe", label: "Stripe" },
      { value: "shopify", label: "Shopify" },
      { value: "paypal", label: "PayPal" },
      { value: "other", label: "Other integration" },
    ],
  },
  {
    question: "What error message do you see?",
    options: [
      { value: "api_key_invalid", label: "Invalid API key" },
      { value: "rate_limit", label: "Rate limit exceeded" },
      { value: "permission_denied", label: "Permission denied" },
      { value: "unknown", label: "Unknown error" },
    ],
  },
];

export function AITroubleshootingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [solution, setSolution] = useState<string | null>(null);

  const handleAnswer = (value: string, nextStep?: number) => {
    setAnswers({ ...answers, [currentStep]: value });

    if (nextStep !== undefined) {
      setCurrentStep(nextStep);
    } else if (currentStep < TROUBLESHOOTING_FLOW.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      void generateSolution();
    }
  };

  const generateSolution = async () => {
    try {
      const response = await fetch("/api/ai/troubleshooting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      setSolution(data.solution);
    } catch (error: unknown) {
      console.error("Failed to generate solution:", error);
      setSolution(
        "I'm having trouble generating a solution. Please contact support for assistance."
      );
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setSolution(null);
  };

  if (solution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Solution</CardTitle>
          <CardDescription>Based on your answers, here&apos;s what we recommend:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Solution</h4>
                <p className="text-sm text-green-800 dark:text-green-400 whitespace-pre-line">
                  {solution}
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  const step = TROUBLESHOOTING_FLOW[currentStep];

  if (!step) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Troubleshooting Wizard
        </CardTitle>
        <CardDescription>Answer a few questions and I&apos;ll help you solve the issue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Step {currentStep + 1} of {TROUBLESHOOTING_FLOW.length}
            </span>
            <div className="flex gap-1">
              {TROUBLESHOOTING_FLOW.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    index === currentStep
                      ? "bg-blue-600"
                      : index < currentStep
                        ? "bg-green-600"
                        : "bg-slate-300 dark:bg-slate-600"
                  )}
                />
              ))}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {step.question}
          </h3>

          <RadioGroup value={answers[currentStep]} onValueChange={(value) => handleAnswer(value)}>
            <div className="space-y-3">
              {step.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => handleAnswer(option.value, option.nextStep)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                  {option.nextStep !== undefined && (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {currentStep > 0 && (
          <Button
            onClick={() => setCurrentStep(currentStep - 1)}
            variant="outline"
            className="w-full"
          >
            Previous
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
