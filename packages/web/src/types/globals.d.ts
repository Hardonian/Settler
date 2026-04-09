/**
 * Global Type Declarations
 *
 * Type definitions for third-party libraries that inject globals
 */

declare global {
  interface Window {
    // Hotjar
    hj?: (command: string, ...args: unknown[]) => void;

    // FullStory
    _fs_namespace?: string;
    _fs_debug?: boolean;
    _fs_script?: string;
    [key: string]: unknown; // For dynamic FullStory namespace access

    // Sentry
    Sentry?: {
      captureException: (
        error: Error,
        options?: { contexts?: { custom?: Record<string, unknown> } }
      ) => void;
      setUser: (user: { id: string; [key: string]: unknown }) => void;
      addBreadcrumb: (breadcrumb: {
        message: string;
        category?: string;
        level?: "info" | "warning" | "error";
      }) => void;
      init: (config: unknown) => void;
    };

    // Vercel Analytics
    va?: (
      command: "track",
      payload: { name: string; properties?: Record<string, unknown> }
    ) => void;

    // PostHog
    posthog?: {
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      capture: (event: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

export {};
