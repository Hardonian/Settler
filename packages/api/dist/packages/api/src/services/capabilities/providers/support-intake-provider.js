"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OssSupportIntakeProvider = void 0;
class OssSupportIntakeProvider {
    status() {
        return {
            key: "support_intake",
            state: "available",
            available: true,
            source: "oss",
            reason: "Using OSS support intake implementation",
        };
    }
}
exports.OssSupportIntakeProvider = OssSupportIntakeProvider;
//# sourceMappingURL=support-intake-provider.js.map