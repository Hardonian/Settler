/**
 * ReadyLayer Types
 *
 * Core types for ReadyLayer integration across GitHub, GitLab, and Bitbucket.
 */

export type GitProvider = "github" | "gitlab" | "bitbucket";

export interface ReadyLayerConfig {
  provider: GitProvider;
  installationId: string;
  tenantId: string;
  repositoryId: string;
  repositoryName: string;
  repositoryUrl: string;
  accessToken: string;
  webhookSecret?: string;
  enabled: boolean;
  features: ReadyLayerFeatures;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReadyLayerFeatures {
  reconciliation: boolean;
  auditTrail: boolean;
  devTools: boolean;
  aiSupport: boolean;
  analytics: boolean;
  customWorkflows: boolean;
}

export interface PlatformTheme {
  name: GitProvider;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface ReadyLayerInstallation {
  id: string;
  provider: GitProvider;
  accountId: string;
  accountName: string;
  accountType: "user" | "organization";
  repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    url: string;
    enabled: boolean;
  }>;
  subscriptionTier: "free" | "pro" | "enterprise";
  createdAt: string;
  updatedAt: string;
}

export interface UpsellOpportunity {
  id: string;
  type: "feature" | "limit" | "support" | "integration";
  title: string;
  description: string;
  currentValue: string | number;
  upgradeValue: string | number;
  ctaText: string;
  ctaUrl: string;
  priority: "low" | "medium" | "high";
  dismissed: boolean;
}

export interface CustomerJourneyStage {
  stage: "onboarding" | "active" | "growth" | "churn-risk" | "churned";
  progress: number; // 0-100
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  nextActions: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    priority: "low" | "medium" | "high";
  }>;
}
