/**
 * React Hooks for Telemetry
 * 
 * Easy-to-use hooks for tracking user interactions in components.
 */

import { useCallback } from 'react';
import { telemetry } from './events';

/**
 * Hook to track button clicks
 */
export function useTrackButton() {
  return useCallback((buttonName: string, properties?: Record<string, any>) => {
    telemetry.trackButtonClick(buttonName, properties);
  }, []);
}

/**
 * Hook to track CTA clicks
 */
export function useTrackCTA() {
  return useCallback((ctaName: string, properties?: Record<string, any>) => {
    telemetry.trackCTAClick(ctaName, properties);
  }, []);
}

/**
 * Hook to track form interactions
 */
export function useTrackForm(formName: string) {
  const start = useCallback(() => {
    telemetry.trackFormStart(formName);
  }, [formName]);

  const abandon = useCallback((fieldsCompleted?: number, totalFields?: number) => {
    telemetry.trackFormAbandon(formName, fieldsCompleted, totalFields);
  }, [formName]);

  const submit = useCallback((success: boolean, properties?: Record<string, any>) => {
    telemetry.trackFormSubmit(formName, success, properties);
  }, [formName]);

  return { start, abandon, submit };
}

/**
 * Hook to track funnel steps
 */
export function useTrackFunnel(funnelName: string) {
  return useCallback((step: string, stepNumber: number, properties?: Record<string, any>) => {
    telemetry.trackFunnelStep(funnelName, step, stepNumber, properties);
  }, [funnelName]);
}

/**
 * Hook to track conversions
 */
export function useTrackConversion() {
  return useCallback((conversionName: string, value?: number, properties?: Record<string, any>) => {
    telemetry.trackConversion(conversionName, value, properties);
  }, []);
}

/**
 * Hook to track link clicks
 */
export function useTrackLink() {
  return useCallback((url: string, text?: string, properties?: Record<string, any>) => {
    telemetry.trackLinkClick(url, text, properties);
  }, []);
}
