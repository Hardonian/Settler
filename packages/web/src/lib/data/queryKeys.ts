/**
 * Query Keys
 *
 * Centralized query key factory for TanStack Query.
 * Ensures consistent, type-safe query key generation across the app.
 *
 * Usage:
 *   queryKeys.user.detail(userId)
 *   queryKeys.projects.list()
 *   queryKeys.projects.detail(projectId)
 */

export const queryKeys = {
  /**
   * User/Profile related queries
   */
  user: {
    all: ["user"] as const,
    detail: (id: string) => ["user", id] as const,
    current: () => ["user", "current"] as const,
  },

  /**
   * Dashboard metrics
   */
  dashboard: {
    all: ["dashboard"] as const,
    metrics: () => ["dashboard", "metrics"] as const,
    kpiHealth: () => ["dashboard", "kpi-health"] as const,
    externalMetrics: () => ["dashboard", "external-metrics"] as const,
  },

  /**
   * Activity logs
   */
  activity: {
    all: ["activity"] as const,
    list: (filters?: { since?: string }) => ["activity", "list", filters] as const,
    recent: (hours?: number) => ["activity", "recent", hours] as const,
  },

  /**
   * Posts/Community
   */
  posts: {
    all: ["posts"] as const,
    list: (filters?: { status?: string; limit?: number }) => ["posts", "list", filters] as const,
    detail: (id: string) => ["posts", id] as const,
    topEngaged: (date?: string) => ["posts", "top-engaged", date] as const,
  },

  /**
   * Profiles
   */
  profiles: {
    all: ["profiles"] as const,
    list: (filters?: { since?: string }) => ["profiles", "list", filters] as const,
    count: (filters?: { since?: string }) => ["profiles", "count", filters] as const,
  },

  /**
   * Reconciliation jobs
   */
  jobs: {
    all: ["jobs"] as const,
    list: (filters?: { limit?: number; status?: string }) => ["jobs", "list", filters] as const,
    detail: (id: string) => ["jobs", id] as const,
    execution: (jobId: string) => ["jobs", jobId, "execution"] as const,
  },

  /**
   * Settings
   */
  settings: {
    all: ["settings"] as const,
    current: () => ["settings", "current"] as const,
  },
} as const;
