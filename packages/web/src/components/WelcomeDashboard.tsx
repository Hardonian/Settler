"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PreTestQuestionnaire, PreTestAnswers } from "./PreTestQuestionnaire";

interface WelcomeDashboardProps {
  userName?: string;
  trialEndDate?: string;
  onComplete?: () => void;
}

export function WelcomeDashboard({ userName, trialEndDate, onComplete }: WelcomeDashboardProps) {
  const [showPreTest, setShowPreTest] = useState(false);

  const handlePreTestComplete = async (answers: PreTestAnswers) => {
    try {
      const response = await fetch("/api/user/pre-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (response.ok) {
        setShowPreTest(false);
        // Personalize experience based on answers
      } else {
        console.error("Failed to save pre-test answers");
      }
    } catch (err) {
      console.error("Error saving pre-test answers:", err);
    }
  };

  const quickStartSteps = [
    {
      title: "Complete your profile",
      description: "Help us personalize your experience",
      time: "2 min",
      link: "/dashboard?setup=profile",
      action: () => setShowPreTest(true),
    },
    {
      title: "Connect your first platform",
      description: "See how easy it is to match transactions",
      time: "3 min",
      link: "/playground",
    },
    {
      title: "Try a demo reconciliation",
      description: "See results in real-time",
      time: "5 min",
      link: "/playground?demo=true",
    },
  ];

  if (showPreTest) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <PreTestQuestionnaire
          onComplete={handlePreTestComplete}
          onSkip={() => setShowPreTest(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Welcome to Settler{userName ? `, ${userName}` : ""}! 🎉
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Your 30-day free trial starts now—no credit card required.
        </p>
        {trialEndDate && (
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Your trial ends on {new Date(trialEndDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Quick Start Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Get Started in 10 Minutes</CardTitle>
          <CardDescription>Here&apos;s how to get value quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {quickStartSteps.map((step, index) => (
              <Card key={index} className="border-2 hover:border-blue-500 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-xs text-slate-500">⏱️ {step.time}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {step.description}
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={step.action}
                  >
                    <Link href={step.link}>
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trial Benefits */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Your 30-Day Free Trial Includes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                Full access to all features (no limits)
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                Unlimited reconciliations
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                All cookbooks and workflows
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                Comprehensive onboarding guide and tutorials
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                Priority email support
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              After Your Trial - What You Keep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Upgrade to Commercial ($99/month) to keep:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Unlimited reconciliations (vs 1,000/month on free)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                All advanced features (real-time webhooks, multi-currency)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Enhanced onboarding guides and examples
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Priority support
              </li>
            </ul>
            <Button asChild className="mt-4 w-full" size="sm">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {onComplete && (
        <div className="text-center">
          <Button onClick={onComplete} size="lg">
            Continue to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
