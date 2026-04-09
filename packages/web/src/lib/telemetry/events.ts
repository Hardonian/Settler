/**
 * UX Telemetry Events
 *
 * Unified event catalog and tracking system for user interactions.
 *
 * Note: For product analytics events (onboarding, conversions, experiments),
 * use the ProductEvents from './product-events.ts'
 */

import { analytics } from "../analytics";
import { logger } from "../logging/logger";

export type TelemetryEventType =
  | "button_click"
  | "cta_click"
  | "scroll_depth"
  | "form_start"
  | "form_abandon"
  | "form_submit"
  | "funnel_step"
  | "conversion"
  | "dead_click"
  | "rage_click"
  | "link_click"
  | "search"
  | "video_play"
  | "video_complete"
  | "download"
  | "share";

export interface TelemetryEvent {
  type: TelemetryEventType;
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

class Telemetry {
  private scrollDepthTracked: Set<number> = new Set();
  private formStartTimes: Map<string, number> = new Map();

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, properties?: Record<string, any>) {
    this.track("button_click", buttonName, properties);
  }

  /**
   * Track CTA click
   */
  trackCTAClick(ctaName: string, properties?: Record<string, any>) {
    this.track("cta_click", ctaName, {
      ...properties,
      cta_name: ctaName,
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth: number) {
    // Track milestones: 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find((m) => depth >= m && !this.scrollDepthTracked.has(m));

    if (milestone) {
      this.scrollDepthTracked.add(milestone);
      this.track("scroll_depth", `scroll_${milestone}`, {
        depth: milestone,
        percentage: milestone,
      });
    }
  }

  /**
   * Track form start
   */
  trackFormStart(formName: string) {
    this.formStartTimes.set(formName, Date.now());
    this.track("form_start", formName);
  }

  /**
   * Track form abandon
   */
  trackFormAbandon(formName: string, fieldsCompleted?: number, totalFields?: number) {
    const startTime = this.formStartTimes.get(formName);
    const duration = startTime ? Date.now() - startTime : undefined;

    this.track("form_abandon", formName, {
      duration,
      fields_completed: fieldsCompleted,
      total_fields: totalFields,
      completion_rate: fieldsCompleted && totalFields ? fieldsCompleted / totalFields : undefined,
    });

    this.formStartTimes.delete(formName);
  }

  /**
   * Track form submit
   */
  trackFormSubmit(formName: string, success: boolean, properties?: Record<string, any>) {
    const startTime = this.formStartTimes.get(formName);
    const duration = startTime ? Date.now() - startTime : undefined;

    this.track("form_submit", formName, {
      success,
      duration,
      ...properties,
    });

    this.formStartTimes.delete(formName);
  }

  /**
   * Track funnel step
   */
  trackFunnelStep(
    funnelName: string,
    step: string,
    stepNumber: number,
    properties?: Record<string, any>
  ) {
    this.track("funnel_step", `${funnelName}_${step}`, {
      funnel: funnelName,
      step,
      step_number: stepNumber,
      ...properties,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(conversionName: string, value?: number, properties?: Record<string, any>) {
    this.track("conversion", conversionName, {
      value,
      ...properties,
    });
  }

  /**
   * Track link click
   */
  trackLinkClick(url: string, text?: string, properties?: Record<string, any>) {
    this.track("link_click", url, {
      url,
      link_text: text,
      ...properties,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount?: number, properties?: Record<string, any>) {
    this.track("search", query, {
      query,
      results_count: resultsCount,
      ...properties,
    });
  }

  /**
   * Detect and track dead clicks (clicks that don't trigger any action)
   */
  trackDeadClick(element: HTMLElement, x: number, y: number) {
    this.track("dead_click", "dead_click", {
      element: element.tagName,
      x,
      y,
      url: window.location.href,
    });
  }

  /**
   * Detect and track rage clicks (multiple rapid clicks)
   */
  trackRageClick(element: HTMLElement, clickCount: number) {
    this.track("rage_click", "rage_click", {
      element: element.tagName,
      click_count: clickCount,
      url: window.location.href,
    });
  }

  /**
   * Track video play
   */
  trackVideoPlay(videoId: string, properties?: Record<string, any>) {
    this.track("video_play", videoId, properties);
  }

  /**
   * Track video completion
   */
  trackVideoComplete(videoId: string, duration?: number, properties?: Record<string, any>) {
    this.track("video_complete", videoId, {
      duration,
      ...properties,
    });
  }

  /**
   * Track download
   */
  trackDownload(fileName: string, fileType?: string, properties?: Record<string, any>) {
    this.track("download", fileName, {
      file_name: fileName,
      file_type: fileType,
      ...properties,
    });
  }

  /**
   * Track share
   */
  trackShare(platform: string, content?: string, properties?: Record<string, any>) {
    this.track("share", platform, {
      platform,
      content,
      ...properties,
    });
  }

  /**
   * Internal track method
   */
  private track(type: TelemetryEventType, name: string, properties?: Record<string, any>) {
    const event: TelemetryEvent = {
      type,
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    };

    // Track in analytics
    analytics.trackEvent(name, {
      event_type: type,
      ...event.properties,
    });

    // Log in development
    if (process.env.NODE_ENV === "development") {
      logger.debug(`Telemetry: ${type} - ${name}`, event.properties);
    }
  }

  /**
   * Reset scroll depth tracking (useful for SPA navigation)
   */
  resetScrollDepth() {
    this.scrollDepthTracked.clear();
  }
}

export const telemetry = new Telemetry();

// Initialize scroll depth tracking
if (typeof window !== "undefined") {
  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = documentHeight > 0 ? (scrollY / documentHeight) * 100 : 0;

        telemetry.trackScrollDepth(scrollPercentage);
        ticking = false;
      });

      ticking = true;
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
}

// Initialize dead click detection
if (typeof window !== "undefined") {
  let clickTimeout: NodeJS.Timeout | null = null;

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;

      // Check if click is on an interactive element
      const isInteractive = target.closest('a, button, [role="button"], input, select, textarea');

      if (!isInteractive) {
        // Potential dead click - wait a bit to see if anything happens
        clickTimeout = setTimeout(() => {
          telemetry.trackDeadClick(target, e.clientX, e.clientY);
        }, 500);
      } else {
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
        }
      }
    },
    true
  );
}

// Initialize rage click detection
if (typeof window !== "undefined") {
  const clickTimestamps = new Map<string, number[]>();

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const elementId = target.id || target.className || target.tagName;
    const now = Date.now();

    if (!clickTimestamps.has(elementId)) {
      clickTimestamps.set(elementId, []);
    }

    const timestamps = clickTimestamps.get(elementId)!;
    timestamps.push(now);

    // Keep only clicks within last 2 seconds
    const recentClicks = timestamps.filter((ts) => now - ts < 2000);

    if (recentClicks.length >= 5) {
      telemetry.trackRageClick(target, recentClicks.length);
      clickTimestamps.set(elementId, []); // Reset after detection
    } else {
      clickTimestamps.set(elementId, recentClicks);
    }
  });
}
