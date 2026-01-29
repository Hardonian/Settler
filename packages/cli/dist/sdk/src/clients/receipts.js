"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptsClient = void 0;
class ReceiptsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async parse(file, options) {
        const body = {};
        if (file.startsWith("http")) {
            body.url = file;
        }
        else {
            body.content = file;
        }
        if (options) {
            body.options = options;
        }
        return this.client.request("POST", "/v1/receipts/parse", { body });
    }
    async get(id) {
        return this.client.request("GET", `/v1/receipts/${id}`);
    }
}
exports.ReceiptsClient = ReceiptsClient;
//# sourceMappingURL=receipts.js.map