"use strict";
/**
 * @settler/react-settler
 *
 * React components for building reconciliation workflows.
 *
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTier = exports.requireFeature = exports.hasTier = exports.hasFeature = exports.getLicense = exports.setLicense = exports.MobileDashboard = exports.StripeApp = exports.useShopifyAppBridge = exports.ShopifyApp = exports.createMCPServer = exports.ReactSettlerMCPServer = exports.createStripeWebhookAdapter = exports.createShopifyWebhookAdapter = exports.createWebhookManager = exports.WebhookManager = exports.getResponsiveColumns = exports.useIsDesktop = exports.useIsTablet = exports.useIsMobile = exports.useMediaQuery = exports.useBreakpoint = exports.createMockTelemetryProvider = exports.TestWrapper = exports.createMockTransactions = exports.createMockException = exports.createMockSettlement = exports.createMockTransaction = exports.useDebounce = exports.useSortedTransactions = exports.useFilteredTransactions = exports.useCompilationContext = exports.CompilationProvider = exports.setAuditLogHandler = exports.useSecurity = exports.setTelemetryConfig = exports.setTelemetryProvider = exports.useTelemetry = exports.useValidation = exports.VirtualizedTable = exports.ExportButton = exports.SearchBar = exports.FilterBar = exports.ErrorBoundary = exports.MatchRule = exports.RuleSet = exports.MetricCard = exports.ExceptionTable = exports.TransactionTable = exports.ReconciliationDashboard = void 0;
exports.compileToJSON = exports.compileToConfig = exports.UpgradePrompt = exports.FEATURE_FLAGS = exports.useFeatureGate = exports.useFeature = void 0;
// Components
var ReconciliationDashboard_1 = require("./components/ReconciliationDashboard");
Object.defineProperty(exports, "ReconciliationDashboard", { enumerable: true, get: function () { return ReconciliationDashboard_1.ReconciliationDashboard; } });
var TransactionTable_1 = require("./components/TransactionTable");
Object.defineProperty(exports, "TransactionTable", { enumerable: true, get: function () { return TransactionTable_1.TransactionTable; } });
var ExceptionTable_1 = require("./components/ExceptionTable");
Object.defineProperty(exports, "ExceptionTable", { enumerable: true, get: function () { return ExceptionTable_1.ExceptionTable; } });
var MetricCard_1 = require("./components/MetricCard");
Object.defineProperty(exports, "MetricCard", { enumerable: true, get: function () { return MetricCard_1.MetricCard; } });
var RuleSet_1 = require("./components/RuleSet");
Object.defineProperty(exports, "RuleSet", { enumerable: true, get: function () { return RuleSet_1.RuleSet; } });
var MatchRule_1 = require("./components/MatchRule");
Object.defineProperty(exports, "MatchRule", { enumerable: true, get: function () { return MatchRule_1.MatchRule; } });
var ErrorBoundary_1 = require("./components/ErrorBoundary");
Object.defineProperty(exports, "ErrorBoundary", { enumerable: true, get: function () { return ErrorBoundary_1.ErrorBoundary; } });
var FilterBar_1 = require("./components/FilterBar");
Object.defineProperty(exports, "FilterBar", { enumerable: true, get: function () { return FilterBar_1.FilterBar; } });
var SearchBar_1 = require("./components/SearchBar");
Object.defineProperty(exports, "SearchBar", { enumerable: true, get: function () { return SearchBar_1.SearchBar; } });
var ExportButton_1 = require("./components/ExportButton");
Object.defineProperty(exports, "ExportButton", { enumerable: true, get: function () { return ExportButton_1.ExportButton; } });
var VirtualizedTable_1 = require("./components/VirtualizedTable");
Object.defineProperty(exports, "VirtualizedTable", { enumerable: true, get: function () { return VirtualizedTable_1.VirtualizedTable; } });
// Hooks
var useValidation_1 = require("./hooks/useValidation");
Object.defineProperty(exports, "useValidation", { enumerable: true, get: function () { return useValidation_1.useValidation; } });
var useTelemetry_1 = require("./hooks/useTelemetry");
Object.defineProperty(exports, "useTelemetry", { enumerable: true, get: function () { return useTelemetry_1.useTelemetry; } });
Object.defineProperty(exports, "setTelemetryProvider", { enumerable: true, get: function () { return useTelemetry_1.setTelemetryProvider; } });
Object.defineProperty(exports, "setTelemetryConfig", { enumerable: true, get: function () { return useTelemetry_1.setTelemetryConfig; } });
var useSecurity_1 = require("./hooks/useSecurity");
Object.defineProperty(exports, "useSecurity", { enumerable: true, get: function () { return useSecurity_1.useSecurity; } });
Object.defineProperty(exports, "setAuditLogHandler", { enumerable: true, get: function () { return useSecurity_1.setAuditLogHandler; } });
// Context
var context_1 = require("./context");
Object.defineProperty(exports, "CompilationProvider", { enumerable: true, get: function () { return context_1.CompilationProvider; } });
Object.defineProperty(exports, "useCompilationContext", { enumerable: true, get: function () { return context_1.useCompilationContext; } });
// Utilities
var performance_1 = require("./utils/performance");
Object.defineProperty(exports, "useFilteredTransactions", { enumerable: true, get: function () { return performance_1.useFilteredTransactions; } });
Object.defineProperty(exports, "useSortedTransactions", { enumerable: true, get: function () { return performance_1.useSortedTransactions; } });
Object.defineProperty(exports, "useDebounce", { enumerable: true, get: function () { return performance_1.useDebounce; } });
var testing_1 = require("./utils/testing");
Object.defineProperty(exports, "createMockTransaction", { enumerable: true, get: function () { return testing_1.createMockTransaction; } });
Object.defineProperty(exports, "createMockSettlement", { enumerable: true, get: function () { return testing_1.createMockSettlement; } });
Object.defineProperty(exports, "createMockException", { enumerable: true, get: function () { return testing_1.createMockException; } });
Object.defineProperty(exports, "createMockTransactions", { enumerable: true, get: function () { return testing_1.createMockTransactions; } });
Object.defineProperty(exports, "TestWrapper", { enumerable: true, get: function () { return testing_1.TestWrapper; } });
Object.defineProperty(exports, "createMockTelemetryProvider", { enumerable: true, get: function () { return testing_1.createMockTelemetryProvider; } });
var responsive_1 = require("./utils/responsive");
Object.defineProperty(exports, "useBreakpoint", { enumerable: true, get: function () { return responsive_1.useBreakpoint; } });
Object.defineProperty(exports, "useMediaQuery", { enumerable: true, get: function () { return responsive_1.useMediaQuery; } });
Object.defineProperty(exports, "useIsMobile", { enumerable: true, get: function () { return responsive_1.useIsMobile; } });
Object.defineProperty(exports, "useIsTablet", { enumerable: true, get: function () { return responsive_1.useIsTablet; } });
Object.defineProperty(exports, "useIsDesktop", { enumerable: true, get: function () { return responsive_1.useIsDesktop; } });
Object.defineProperty(exports, "getResponsiveColumns", { enumerable: true, get: function () { return responsive_1.getResponsiveColumns; } });
var webhooks_1 = require("./utils/webhooks");
Object.defineProperty(exports, "WebhookManager", { enumerable: true, get: function () { return webhooks_1.WebhookManager; } });
Object.defineProperty(exports, "createWebhookManager", { enumerable: true, get: function () { return webhooks_1.createWebhookManager; } });
Object.defineProperty(exports, "createShopifyWebhookAdapter", { enumerable: true, get: function () { return webhooks_1.createShopifyWebhookAdapter; } });
Object.defineProperty(exports, "createStripeWebhookAdapter", { enumerable: true, get: function () { return webhooks_1.createStripeWebhookAdapter; } });
// Adapters
var mcp_1 = require("./adapters/mcp");
Object.defineProperty(exports, "ReactSettlerMCPServer", { enumerable: true, get: function () { return mcp_1.ReactSettlerMCPServer; } });
Object.defineProperty(exports, "createMCPServer", { enumerable: true, get: function () { return mcp_1.createMCPServer; } });
var shopify_1 = require("./adapters/shopify");
Object.defineProperty(exports, "ShopifyApp", { enumerable: true, get: function () { return shopify_1.ShopifyApp; } });
Object.defineProperty(exports, "useShopifyAppBridge", { enumerable: true, get: function () { return shopify_1.useShopifyAppBridge; } });
var stripe_1 = require("./adapters/stripe");
Object.defineProperty(exports, "StripeApp", { enumerable: true, get: function () { return stripe_1.StripeApp; } });
// Mobile Components
var MobileDashboard_1 = require("./components/MobileDashboard");
Object.defineProperty(exports, "MobileDashboard", { enumerable: true, get: function () { return MobileDashboard_1.MobileDashboard; } });
// Licensing & Feature Flags
var licensing_1 = require("./utils/licensing");
Object.defineProperty(exports, "setLicense", { enumerable: true, get: function () { return licensing_1.setLicense; } });
Object.defineProperty(exports, "getLicense", { enumerable: true, get: function () { return licensing_1.getLicense; } });
Object.defineProperty(exports, "hasFeature", { enumerable: true, get: function () { return licensing_1.hasFeature; } });
Object.defineProperty(exports, "hasTier", { enumerable: true, get: function () { return licensing_1.hasTier; } });
Object.defineProperty(exports, "requireFeature", { enumerable: true, get: function () { return licensing_1.requireFeature; } });
Object.defineProperty(exports, "requireTier", { enumerable: true, get: function () { return licensing_1.requireTier; } });
Object.defineProperty(exports, "useFeature", { enumerable: true, get: function () { return licensing_1.useFeature; } });
Object.defineProperty(exports, "useFeatureGate", { enumerable: true, get: function () { return licensing_1.useFeatureGate; } });
Object.defineProperty(exports, "FEATURE_FLAGS", { enumerable: true, get: function () { return licensing_1.FEATURE_FLAGS; } });
var UpgradePrompt_1 = require("./components/UpgradePrompt");
Object.defineProperty(exports, "UpgradePrompt", { enumerable: true, get: function () { return UpgradePrompt_1.UpgradePrompt; } });
// Compiler
var compiler_1 = require("./compiler");
Object.defineProperty(exports, "compileToConfig", { enumerable: true, get: function () { return compiler_1.compileToConfig; } });
Object.defineProperty(exports, "compileToJSON", { enumerable: true, get: function () { return compiler_1.compileToJSON; } });
//# sourceMappingURL=index.js.map