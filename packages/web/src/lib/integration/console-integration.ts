/**
 * Console Integration Utilities
 * 
 * Ensures all console features are properly integrated:
 * - Component registration
 * - Route registration
 * - Navigation updates
 * - Error boundary wrapping
 */

import * as React from 'react';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

/**
 * Wrap component with error boundary
 */
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T
): T {
  return ((props: any) => (
    <ConsoleErrorBoundary>
      <Component {...props} />
    </ConsoleErrorBoundary>
  )) as T;
}

/**
 * Console route configuration
 */
export const ConsoleRoutes = {
  overview: '/console',
  apiKeys: '/console/api-keys',
  usage: '/console/usage',
  performance: '/console/performance',
  insights: '/console/insights',
  webhooks: '/console/webhooks',
  billing: '/console/billing',
  receipts: '/console/receipts',
  featureFlags: '/console/feature-flags',
  support: '/console/support',
  playground: '/console/playground',
  docs: '/console/docs',
} as const;

/**
 * Check if route is a console route
 */
export function isConsoleRoute(pathname: string): boolean {
  return pathname.startsWith('/console');
}
