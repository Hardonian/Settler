/**
 * Web Vitals Reporting (Next.js)
 * 
 * Reports Web Vitals to analytics providers.
 */

import { reportWebVitals } from '@/lib/performance/web-vitals';

export function onPerfEntry(metric: any) {
  reportWebVitals(metric);
}
