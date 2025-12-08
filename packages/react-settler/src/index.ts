/**
 * @settler/react-settler
 * 
 * React components for building reconciliation workflows.
 * 
 * @license MIT
 */

// Components
export { ReconciliationDashboard } from './components/ReconciliationDashboard';
export { TransactionTable } from './components/TransactionTable';
export { ExceptionTable } from './components/ExceptionTable';
export { MetricCard } from './components/MetricCard';
export { RuleSet } from './components/RuleSet';
export { MatchRule } from './components/MatchRule';
export { ErrorBoundary } from './components/ErrorBoundary';
export { FilterBar } from './components/FilterBar';
export { SearchBar } from './components/SearchBar';
export { ExportButton } from './components/ExportButton';
export { VirtualizedTable } from './components/VirtualizedTable';

// Hooks
export { useValidation } from './hooks/useValidation';
export { useTelemetry, setTelemetryProvider, setTelemetryConfig } from './hooks/useTelemetry';
export { useSecurity, setAuditLogHandler } from './hooks/useSecurity';

// Context
export { CompilationProvider, useCompilationContext } from './context';

// Utilities
export { useFilteredTransactions, useSortedTransactions, useDebounce } from './utils/performance';
export {
  createMockTransaction,
  createMockSettlement,
  createMockException,
  createMockTransactions,
  TestWrapper,
  createMockTelemetryProvider
} from './utils/testing';
export {
  useBreakpoint,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  getResponsiveColumns
} from './utils/responsive';
export {
  WebhookManager,
  createWebhookManager,
  createShopifyWebhookAdapter,
  createStripeWebhookAdapter
} from './utils/webhooks';

// Adapters
export {
  ReactSettlerMCPServer,
  createMCPServer
} from './adapters/mcp';
export {
  ShopifyApp,
  useShopifyAppBridge
} from './adapters/shopify';
export {
  StripeApp
} from './adapters/stripe';

// Mobile Components
export { MobileDashboard } from './components/MobileDashboard';

// Licensing & Feature Flags
export {
  setLicense,
  getLicense,
  hasFeature,
  hasTier,
  requireFeature,
  requireTier,
  useFeature,
  useFeatureGate,
  FEATURE_FLAGS
} from './utils/licensing';
export { UpgradePrompt } from './components/UpgradePrompt';

// Types
export type { ReconciliationDashboardProps } from './components/ReconciliationDashboard';
export type { TransactionTableProps } from './components/TransactionTable';
export type { ExceptionTableProps } from './components/ExceptionTable';
export type { MetricCardProps } from './components/MetricCard';
export type { RuleSetProps } from './components/RuleSet';
export type { MatchRuleProps } from './components/MatchRule';
export type { ErrorBoundaryProps } from './components/ErrorBoundary';
export type { FilterBarProps, FilterState } from './components/FilterBar';
export type { SearchBarProps } from './components/SearchBar';
export type { ExportButtonProps } from './components/ExportButton';
export type { VirtualizedTableProps } from './components/VirtualizedTable';
export type { MobileDashboardProps } from './components/MobileDashboard';
export type { CompilationProviderProps } from './context';
export type { ShopifyAppProps } from './adapters/shopify';
export type { StripeAppProps } from './adapters/stripe';
export type { MCPServerConfig, MCPResource, MCPTool } from './adapters/mcp';
export type { WebhookPayload, ReconciliationWebhookEvent } from './utils/webhooks';
export type { Breakpoint, BreakpointConfig } from './utils/responsive';
export type { LicenseTier, LicenseConfig } from './utils/licensing';
export type { UpgradePromptProps } from './components/UpgradePrompt';

// Compiler
export { compileToConfig, compileToJSON } from './compiler';

// Re-export protocol types for convenience
export type {
  ReconciliationTransaction,
  ReconciliationSettlement,
  ReconciliationException,
  ReconciliationMatch,
  ReconciliationRule,
  ReconciliationRuleSet,
  ReconciliationConfig,
  ReconciliationViewConfig,
  Money,
  TransactionStatus,
  SettlementStatus,
  MatchType,
  ExceptionCategory,
  ExceptionSeverity,
  ExceptionResolutionStatus,
  RuleField,
  RuleType,
  RuleTolerance,
  WidgetType,
  WidgetConfig,
  CompilationMode
} from '@settler/protocol';
