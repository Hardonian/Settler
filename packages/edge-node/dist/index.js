#!/usr/bin/env node
"use strict";
/**
 * Settler Edge Node
 * Local reconciliation engine with AI capabilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const EdgeNodeService_1 = require("./services/EdgeNodeService");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const program = new commander_1.Command();
program
    .name("settler-edge")
    .description("Settler Edge Node - Local reconciliation with AI")
    .version("1.0.0");
program
    .command("start")
    .description("Start the edge node service")
    .option("-c, --config <path>", "Path to config file")
    .option("-k, --node-key <key>", "Node authentication key")
    .action((options) => {
    try {
        logger_1.logger.info("Starting Settler Edge Node...");
        const nodeKey = options.nodeKey || process.env.SETTLER_NODE_KEY;
        if (!nodeKey) {
            logger_1.logger.error("Node key is required. Set SETTLER_NODE_KEY environment variable or use --node-key");
            process.exit(1);
        }
        const service = new EdgeNodeService_1.EdgeNodeService({
            nodeKey,
            cloudApiUrl: config_1.config.cloudApiUrl,
            dataDir: config_1.config.dataDir,
        });
        service.start();
        logger_1.logger.info(chalk_1.default.green("Edge node started successfully"));
        // Graceful shutdown
        process.on("SIGINT", () => {
            logger_1.logger.info("Shutting down edge node...");
            void service.stop().then(() => {
                process.exit(0);
            });
        });
        process.on("SIGTERM", () => {
            logger_1.logger.info("Shutting down edge node...");
            void service.stop().then(() => {
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to start edge node", error);
        process.exit(1);
    }
});
program
    .command("enroll")
    .description("Enroll this edge node with Settler Cloud")
    .requiredOption("-e, --enrollment-key <key>", "Enrollment key from Settler dashboard")
    .option("-n, --name <name>", "Node name")
    .option("-t, --type <type>", "Device type (server|embedded|mobile|edge_gateway)")
    .action(async (options) => {
    try {
        logger_1.logger.info("Enrolling edge node...");
        const service = new EdgeNodeService_1.EdgeNodeService({
            nodeKey: "", // Will be set after enrollment
            cloudApiUrl: config_1.config.cloudApiUrl,
            dataDir: config_1.config.dataDir,
        });
        const result = await service.enroll({
            enrollmentKey: options.enrollmentKey,
            name: options.name || `edge-node-${Date.now()}`,
            deviceType: options.type || "server",
        });
        logger_1.logger.info(chalk_1.default.green(`Node enrolled successfully!`));
        logger_1.logger.info(chalk_1.default.yellow(`Node ID: ${result.nodeId}`));
        logger_1.logger.info(chalk_1.default.yellow(`Node Key: ${result.nodeKey}`));
        logger_1.logger.info(chalk_1.default.yellow("Save this node key securely - it will not be shown again"));
        // Save node key to config
        service.saveNodeKey(result.nodeKey);
    }
    catch (error) {
        logger_1.logger.error("Enrollment failed", error);
        process.exit(1);
    }
});
program
    .command("status")
    .description("Show edge node status")
    .action(() => {
    try {
        const service = new EdgeNodeService_1.EdgeNodeService({
            nodeKey: process.env.SETTLER_NODE_KEY || "",
            cloudApiUrl: config_1.config.cloudApiUrl,
            dataDir: config_1.config.dataDir,
        });
        const status = service.getStatus();
        // Use logger instead of console.log for consistency
        logger_1.logger.info("Edge Node Status:");
        logger_1.logger.info(`  Node ID: ${status.nodeId || "Not enrolled"}`);
        logger_1.logger.info(`  Status: ${status.status || "Unknown"}`);
        logger_1.logger.info(`  Last Heartbeat: ${status.lastHeartbeat || "Never"}`);
        logger_1.logger.info(`  Jobs Processed: ${status.jobsProcessed || 0}`);
        logger_1.logger.info(`  Local Storage: ${status.localStorageUsed || 0} MB`);
    }
    catch (error) {
        logger_1.logger.error("Failed to get status", error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map