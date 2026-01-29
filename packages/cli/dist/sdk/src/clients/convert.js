"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertClient = void 0;
class ConvertClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async unit(value, from, to) {
        return this.client.request("POST", "/v1/convert/unit", {
            body: { value, from, to }
        });
    }
    async currency(amount, from, to, date) {
        return this.client.request("POST", "/v1/convert/currency", {
            body: { amount, from, to, date }
        });
    }
    async financial(amount, fromFormat, toFormat) {
        return this.client.request("POST", "/v1/convert/financial", {
            body: { amount, fromFormat, toFormat }
        });
    }
}
exports.ConvertClient = ConvertClient;
//# sourceMappingURL=convert.js.map