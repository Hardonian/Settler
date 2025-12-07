"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getPersonalizedCTA, type TrafficSource } from "@/lib/personalization";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PersonalizedCTAProps {
  userId?: string | null;
  defaultText?: string;
  defaultHref?: string;
  className?: string;
}

export function PersonalizedCTA({
  userId,
  defaultText = "Get Started",
  defaultHref = "/signup",
  className,
}: PersonalizedCTAProps) {
  const [cta, setCta] = useState({ text: defaultText, href: defaultHref, variant: "primary" as const });
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineSource = (): TrafficSource => {
      const utmSource = searchParams?.get("utm_source");
      const ref = searchParams?.get("ref");

      if (ref) return "referral";
      if (utmSource === "google" || utmSource === "bing") return "organic";
      if (utmSource === "facebook" || utmSource === "twitter" || utmSource === "linkedin")
        return "social";
      if (utmSource === "email") return "email";
      if (utmSource?.includes("ad") || utmSource?.includes("paid")) return "paid";

      // Check document.referrer
      if (typeof window !== "undefined") {
        const referrer = document.referrer.toLowerCase();
        if (referrer.includes("google") || referrer.includes("bing")) return "organic";
        if (referrer.includes("facebook") || referrer.includes("twitter")) return "social";
        if (referrer) return "referral";
      }

      return "direct";
    };

    const loadCTA = async () => {
      try {
        const source = determineSource();
        const personalized = await getPersonalizedCTA(userId || null, source, window.location.pathname);
        setCta(personalized);
      } catch (error) {
        console.error("Failed to load personalized CTA:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCTA();
  }, [userId, searchParams]);

  if (loading) {
    return (
      <Button asChild className={className} disabled>
        <Link href={defaultHref}>{defaultText}</Link>
      </Button>
    );
  }

  // Map "primary" variant to "default" for Button component
  const buttonVariant = cta.variant === "primary" ? "default" : cta.variant;
  
  return (
    <Button
      asChild
      variant={buttonVariant}
      className={className}
    >
      <Link href={cta.href}>{cta.text}</Link>
    </Button>
  );
}
