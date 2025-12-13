"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UrgencyIndicator } from "./UrgencyIndicator";
import { Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedConversionCTAProps {
  title?: string;
  description?: string;
  primaryAction?: string;
  primaryLink?: string;
  secondaryAction?: string;
  secondaryLink?: string;
  showUrgency?: boolean;
  showTrustBadges?: boolean;
  variant?: "hero" | "section" | "minimal";
}

export function EnhancedConversionCTA({
  title = "Ready to Automate Your Reconciliation?",
  description = "Start automating reconciliation in minutes. Free trial—full access, no credit card required.",
  primaryAction = "Start Free Trial — No Credit Card",
  primaryLink = "/signup",
  secondaryAction = "View Pricing",
  secondaryLink = "/pricing",
  showUrgency = true,
  showTrustBadges = true,
  variant = "section",
}: EnhancedConversionCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const trustPoints = [
    "No credit card required",
    "14-day free trial",
    "Cancel anytime, no fees",
    "30-day money-back guarantee",
  ];

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600",
          "shadow-2xl",
          "transition-all duration-1000",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        role="region"
        aria-labelledby="hero-cta-title"
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative px-8 py-12 md:px-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="hero-cta-title" className="text-3xl md:text-5xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {description}
            </p>

            {showUrgency && (
              <div className="mb-6 flex justify-center">
                <UrgencyIndicator variant="prominent" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                asChild
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Link href={primaryLink}>
                  {primaryAction}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              {secondaryAction && secondaryLink && (
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  <Link href={secondaryLink}>{secondaryAction}</Link>
                </Button>
              )}
            </div>

            {showTrustBadges && (
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
                {trustPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="text-center py-8">
        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href={primaryLink}>{primaryAction}</Link>
          </Button>
          {secondaryAction && secondaryLink && (
            <Button size="lg" variant="outline" asChild>
              <Link href={secondaryLink}>{secondaryAction}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-2xl",
        "transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      role="region"
      aria-labelledby="cta-title"
    >
      <CardHeader className="text-center pb-4">
        <CardTitle id="cta-title" className="text-3xl md:text-4xl text-white mb-4">
          {title}
        </CardTitle>
        <CardDescription className="text-blue-100 text-lg mb-4">
          {description}
        </CardDescription>

        {showUrgency && (
          <div className="flex justify-center mb-4">
            <UrgencyIndicator variant="subtle" className="text-blue-100" />
          </div>
        )}

        {showTrustBadges && (
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-blue-100">
            {trustPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Link href={primaryLink}>
              {primaryAction}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          {secondaryAction && secondaryLink && (
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
            >
              <Link href={secondaryLink}>{secondaryAction}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
