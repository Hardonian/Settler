"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OssAlertRoutingProvider = void 0;
const alerting_1 = require("../../operator-mode/alerting");
class OssAlertRoutingProvider {
    status() {
        return {
            key: "alert_routing",
            state: "available",
            available: true,
            source: "oss",
            reason: "Using OSS alert routing implementation",
        };
    }
    checkThresholds(tenantId) {
        return (0, alerting_1.checkAlertThresholds)(tenantId);
    }
    upsertThreshold(userId, threshold, tenantId) {
        return (0, alerting_1.upsertAlertThreshold)(userId, threshold, tenantId);
    }
}
exports.OssAlertRoutingProvider = OssAlertRoutingProvider;
//# sourceMappingURL=alert-routing-provider.js.map