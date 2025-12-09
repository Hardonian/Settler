/**
 * Web Vitals Reporting (Next.js)
 * 
 * Reports Web Vitals to analytics providers.
 */

import { reportWebVitals } from '@/lib/performance/web-vitals';

export function onPerfEntry(metric: {
  name: string;
  value: number;
  id: string;
  delta: number;
  navigationType?: string;
}): void {
  reportWebVitals(metric);
}
