/**
 * SDK Download and Playground Usage Tracking
 * Tracks SDK downloads, playground usage, and user behavior
 */

export interface SDKDownloadEvent {
  packageName: string;
  version: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'other';
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
}

export interface PlaygroundUsageEvent {
  feature: 'reconcile' | 'receipts' | 'flags' | 'convert' | 'cli';
  action: string;
  integration?: string;
  duration?: number;
  success?: boolean;
  userId?: string;
  sessionId?: string;
}

export interface SDKStatsEvent {
  type: 'download' | 'playground' | 'docs_view' | 'github_star';
  data: SDKDownloadEvent | PlaygroundUsageEvent | Record<string, any>;
}

/**
 * Track SDK download
 */
export async function trackSDKDownload(event: SDKDownloadEvent): Promise<void> {
  try {
    await fetch('/api/analytics/sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'download',
        data: {
          ...event,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
      }),
    }).catch((error) => {
      console.error('Failed to track SDK download:', error);
    });
  } catch (error) {
    console.error('SDK download tracking error:', error);
  }
}

/**
 * Track playground usage
 */
export async function trackPlaygroundUsage(event: PlaygroundUsageEvent): Promise<void> {
  try {
    await fetch('/api/analytics/sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'playground',
        data: {
          ...event,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
      }),
    }).catch((error) => {
      console.error('Failed to track playground usage:', error);
    });
  } catch (error) {
    console.error('Playground usage tracking error:', error);
  }
}

/**
 * Track SDK stats page view
 */
export async function trackSDKStatsView(): Promise<void> {
  try {
    await fetch('/api/analytics/sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'stats_view',
        data: {
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
      }),
    }).catch((error) => {
      console.error('Failed to track stats view:', error);
    });
  } catch (error) {
    console.error('Stats view tracking error:', error);
  }
}

/**
 * Track docs view
 */
export async function trackDocsView(page: string, section?: string): Promise<void> {
  try {
    await fetch('/api/analytics/sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'docs_view',
        data: {
          page,
          section,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch((error) => {
      console.error('Failed to track docs view:', error);
    });
  } catch (error) {
    console.error('Docs view tracking error:', error);
  }
}

/**
 * Track GitHub star
 */
export async function trackGitHubStar(): Promise<void> {
  try {
    await fetch('/api/analytics/sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'github_star',
        data: {
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch((error) => {
      console.error('Failed to track GitHub star:', error);
    });
  } catch (error) {
    console.error('GitHub star tracking error:', error);
  }
}
