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
export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P): React.ReactElement => {
    return React.createElement(
      ConsoleErrorBoundary,
      null,
      React.createElement(Component, props as P)
    );
  };
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
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
