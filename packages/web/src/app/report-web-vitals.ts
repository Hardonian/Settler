/**
 * Web Vitals Reporting (Next.js)
 * 
 * Reports Web Vitals to analytics providers.
 */

export function onPerfEntry(metric: {
  name: string;
  value: number;
  id: string;
  delta: number;
  navigationType?: string;
}): void {
  void metric;
}
