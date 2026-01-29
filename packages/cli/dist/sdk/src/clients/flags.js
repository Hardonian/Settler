"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlagsClient = void 0;
class FlagsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async evaluate(flagKey, context = {}, defaultValue) {
        try {
            return await this.client.request("POST", "/v1/feature-flags/evaluate", {
                body: { flagKey, context, defaultValue },
            });
        }
        catch (e) {
            if (defaultValue !== undefined) {
                return {
                    flagKey,
                    value: defaultValue,
                    reason: "error_fallback",
                };
            }
            throw e;
        }
    }
}
exports.FlagsClient = FlagsClient;
//# sourceMappingURL=flags.js.map