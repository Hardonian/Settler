"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperatorIntelligenceProvider = getOperatorIntelligenceProvider;
exports.getAlertRoutingProvider = getAlertRoutingProvider;
exports.getUsageMeteringProvider = getUsageMeteringProvider;
exports.getSupportIntakeProvider = getSupportIntakeProvider;
exports.getEnterpriseAnalyticsProvider = getEnterpriseAnalyticsProvider;
exports.getCapabilityRegistry = getCapabilityRegistry;
exports.getUnavailableOperatorIntelligenceProvider = getUnavailableOperatorIntelligenceProvider;
const logger_1 = require("../../utils/logger");
const distributed_guards_1 = require("../distributed-guards");
const operator_intelligence_provider_1 = require("./providers/operator-intelligence-provider");
const alert_routing_provider_1 = require("./providers/alert-routing-provider");
const usage_metering_provider_1 = require("./providers/usage-metering-provider");
const support_intake_provider_1 = require("./providers/support-intake-provider");
const enterprise_analytics_provider_1 = require("./providers/enterprise-analytics-provider");
class InMemoryCapabilityRegistry {
    statuses;
    constructor(statuses) {
        this.statuses = statuses;
    }
    list() {
        return this.statuses;
    }
    get(key) {
        return this.statuses.find((s) => s.key === key);
    }
}
let operatorIntelligenceProvider = null;
let alertRoutingProvider = null;
let usageMeteringProvider = null;
let supportIntakeProvider = null;
let enterpriseAnalyticsProvider = null;
async function loadPrivateOperatorIntelligenceProvider() {
    const modulePath = process.env.SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE;
    if (!modulePath) {
        return null;
    }
    try {
        const loadedModule = (await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s))));
        if (typeof loadedModule.createOperatorIntelligenceProvider !== "function") {
            (0, logger_1.logWarn)("Private operator intelligence module loaded without provider factory", {
                modulePath,
            });
            return null;
        }
        const provider = loadedModule.createOperatorIntelligenceProvider();
        return {
            ...provider,
            status: () => ({ ...provider.status(), source: "private" }),
        };
    }
    catch (error) {
        (0, logger_1.logWarn)("Unable to load private operator intelligence provider; falling back to OSS", {
            modulePath,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
async function getOperatorIntelligenceProvider() {
    if (operatorIntelligenceProvider) {
        return operatorIntelligenceProvider;
    }
    operatorIntelligenceProvider =
        (await loadPrivateOperatorIntelligenceProvider()) ?? new operator_intelligence_provider_1.OssOperatorIntelligenceProvider();
    return operatorIntelligenceProvider;
}
function getAlertRoutingProvider() {
    if (!alertRoutingProvider) {
        alertRoutingProvider = new alert_routing_provider_1.OssAlertRoutingProvider();
    }
    return alertRoutingProvider;
}
function getUsageMeteringProvider() {
    if (!usageMeteringProvider) {
        usageMeteringProvider = new usage_metering_provider_1.OssUsageMeteringProvider();
    }
    return usageMeteringProvider;
}
function getSupportIntakeProvider() {
    if (!supportIntakeProvider) {
        supportIntakeProvider = new support_intake_provider_1.OssSupportIntakeProvider();
    }
    return supportIntakeProvider;
}
function getEnterpriseAnalyticsProvider() {
    if (!enterpriseAnalyticsProvider) {
        enterpriseAnalyticsProvider = new enterprise_analytics_provider_1.OssEnterpriseAnalyticsProvider();
    }
    return enterpriseAnalyticsProvider;
}
async function getCapabilityRegistry() {
    const operatorIntelligence = await getOperatorIntelligenceProvider();
    const alertRouting = getAlertRoutingProvider();
    const usageMetering = getUsageMeteringProvider();
    const supportIntake = getSupportIntakeProvider();
    const enterpriseAnalytics = getEnterpriseAnalyticsProvider();
    const guarantees = await (0, distributed_guards_1.getDistributedGuarantees)();
    return new InMemoryCapabilityRegistry([
        operatorIntelligence.status(),
        alertRouting.status(),
        usageMetering.status(),
        supportIntake.status(),
        enterpriseAnalytics.status(),
        {
            key: "rate_limiting_guard",
            available: guarantees.rateLimiting !== "unavailable",
            state: guarantees.rateLimiting === "distributed_shared"
                ? "available"
                : guarantees.rateLimiting === "local_only"
                    ? "degraded"
                    : "degraded",
            source: "oss",
            reason: `Guarantee: ${guarantees.rateLimiting}`,
            guarantee: guarantees.rateLimiting,
        },
        {
            key: "webhook_replay_guard",
            available: guarantees.webhookReplayDedup !== "unavailable",
            state: guarantees.webhookReplayDedup === "distributed_shared"
                ? "available"
                : guarantees.webhookReplayDedup === "local_only"
                    ? "degraded"
                    : "degraded",
            source: "oss",
            reason: `Guarantee: ${guarantees.webhookReplayDedup}`,
            guarantee: guarantees.webhookReplayDedup,
        },
        {
            key: "enterprise_surface",
            available: false,
            state: "unavailable",
            source: "oss",
            reason: "Enterprise routes are disabled until private enterprise backends are configured",
        },
    ]);
}
function getUnavailableOperatorIntelligenceProvider(reason) {
    return new operator_intelligence_provider_1.UnavailableOperatorIntelligenceProvider(reason);
}
//# sourceMappingURL=registry.js.map