"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OssUsageMeteringProvider = void 0;
const cost_controls_1 = require("../../operator-mode/cost-controls");
class OssUsageMeteringProvider {
    status() {
        return {
            key: "usage_metering",
            state: "available",
            available: true,
            source: "oss",
            reason: "Using OSS usage metering implementation",
        };
    }
    setUsageCeiling(tenantId, billingAccountId, usageType, monthlyLimit) {
        return (0, cost_controls_1.setTenantUsageCeiling)(tenantId, billingAccountId, usageType, monthlyLimit);
    }
    getUsageCeilings() {
        return (0, cost_controls_1.getAllUsageCeilings)();
    }
    checkUsageCeiling(tenantId, usageType) {
        return (0, cost_controls_1.checkUsageCeiling)(tenantId, usageType);
    }
    setJobLimit(jobType, maxConcurrent, maxPerTenant) {
        return (0, cost_controls_1.setBackgroundJobLimit)(jobType, maxConcurrent, maxPerTenant);
    }
}
exports.OssUsageMeteringProvider = OssUsageMeteringProvider;
//# sourceMappingURL=usage-metering-provider.js.map