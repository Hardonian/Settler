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
export function useTrackButton(): (buttonName: string, properties?: Record<string, any>) => void {
  return useCallback((buttonName: string, properties?: Record<string, any>) => {
    telemetry.trackButtonClick(buttonName, properties);
  }, []);
}

/**
 * Hook to track CTA clicks
 */
export function useTrackCTA(): (ctaName: string, properties?: Record<string, any>) => void {
  return useCallback((ctaName: string, properties?: Record<string, any>) => {
    telemetry.trackCTAClick(ctaName, properties);
  }, []);
}

/**
 * Hook to track form interactions
 */
export function useTrackForm(formName: string): {
  start: () => void;
  abandon: (fieldsCompleted?: number, totalFields?: number) => void;
  submit: (success: boolean, properties?: Record<string, any>) => void;
} {
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
export function useTrackFunnel(funnelName: string): (step: string, stepNumber: number, properties?: Record<string, any>) => void {
  return useCallback((step: string, stepNumber: number, properties?: Record<string, any>) => {
    telemetry.trackFunnelStep(funnelName, step, stepNumber, properties);
  }, [funnelName]);
}

/**
 * Hook to track conversions
 */
export function useTrackConversion(): (conversionName: string, value?: number, properties?: Record<string, any>) => void {
  return useCallback((conversionName: string, value?: number, properties?: Record<string, any>) => {
    telemetry.trackConversion(conversionName, value, properties);
  }, []);
}

/**
 * Hook to track link clicks
 */
export function useTrackLink(): (url: string, text?: string, properties?: Record<string, any>) => void {
  return useCallback((url: string, text?: string, properties?: Record<string, any>) => {
    telemetry.trackLinkClick(url, text, properties);
  }, []);
}
