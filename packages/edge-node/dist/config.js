"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    cloudApiUrl: process.env.SETTLER_CLOUD_API_URL || "https://api.settler.dev",
    dataDir: process.env.SETTLER_DATA_DIR || "./data",
    nodeKey: process.env.SETTLER_NODE_KEY || "",
    heartbeatInterval: Number(process.env.SETTLER_HEARTBEAT_INTERVAL) || 30000, // 30 seconds
    syncInterval: Number(process.env.SETTLER_SYNC_INTERVAL) || 60000, // 1 minute
    batchSize: Number(process.env.SETTLER_BATCH_SIZE) || 100,
    enableOfflineMode: process.env.SETTLER_OFFLINE_MODE === "true",
    logLevel: process.env.LOG_LEVEL || "info",
};
//# sourceMappingURL=config.js.map