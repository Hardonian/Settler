"use client";

import { analytics } from "@/lib/analytics";

export type LaunchEventName =
  | "hero_cta_clicked"
  | "docs_cta_clicked"
  | "github_outbound_clicked"
  | "demo_cta_clicked"
  | "contact_cta_clicked"
  | "onboarding_started"
  | "onboarding_completed"
  | "first_meaningful_action_completed"
  | "docs_section_opened"
  | "pricing_or_enterprise_intent";

export type LaunchEventPayload = {
  location: "home" | "docs" | "footer" | "nav" | "use_case";
  ctaLabel: string;
  destination?: string;
  section?: string;
};

const isBrowser = typeof window !== "undefined";

export function trackLaunchEvent(name: LaunchEventName, payload: LaunchEventPayload): void {
  if (!isBrowser) return;

  analytics.trackEvent(name, {
    ...payload,
    capturedAt: new Date().toISOString(),
  });
}
