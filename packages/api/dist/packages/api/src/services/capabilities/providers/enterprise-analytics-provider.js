"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OssEnterpriseAnalyticsProvider = void 0;
class OssEnterpriseAnalyticsProvider {
    status() {
        return {
            key: "enterprise_analytics",
            state: "degraded",
            available: true,
            source: "oss",
            reason: "OSS analytics is available; enterprise enrichment is optional",
        };
    }
}
exports.OssEnterpriseAnalyticsProvider = OssEnterpriseAnalyticsProvider;
//# sourceMappingURL=enterprise-analytics-provider.js.map