"use strict";
/**
 * AIAS Edge AI Accelerator Studio API Client
 *
 * IMPORTANT: This is an API client for AIAS. Settler.dev integrates with AIAS
 * via HTTP API calls, NOT direct code dependencies. This ensures:
 * - Product independence
 * - Separate versioning
 * - Independent deployment
 * - Future exit strategy protection
 *
 * Handles model upload, optimization, benchmarking, and export workflows via AIAS API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIASClient = void 0;
exports.getAIASClient = getAIASClient;
const logger_1 = require("../../utils/logger");
class AIASClient {
    apiKey;
    baseUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || process.env.AIAS_BASE_URL || "https://api.aias.studio";
    }
    async request(method, endpoint, body, headers) {
        const url = `${this.baseUrl}${endpoint}`;
        const requestHeaders = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...headers,
        };
        try {
            const fetchOptions = {
                method,
                headers: requestHeaders,
            };
            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AIAS API error: ${response.status} ${errorText}`);
            }
            return (await response.json());
        }
        catch (error) {
            (0, logger_1.logError)("AIAS API request failed", error, {
                method,
                endpoint,
            });
            throw error;
        }
    }
    /**
     * Upload a model to AIAS for optimization
     */
    async uploadModel(request) {
        (0, logger_1.logInfo)("Uploading model to AIAS", { modelName: request.modelName });
        const modelData = typeof request.modelFile === "string"
            ? request.modelFile
            : request.modelFile.toString("base64");
        const response = await this.request("POST", "/v1/models/upload", {
            model_name: request.modelName,
            model_type: request.modelType,
            model_data: modelData,
            format: request.format,
            metadata: request.metadata || {},
        });
        return response;
    }
    /**
     * Request model optimization
     */
    async optimizeModel(request) {
        (0, logger_1.logInfo)("Requesting model optimization", { modelId: request.modelId });
        const response = await this.request("POST", `/v1/models/${request.modelId}/optimize`, {
            target_devices: request.targetDevices,
            quantization: request.quantization,
            optimization_level: request.optimizationLevel,
        });
        return response;
    }
    /**
     * Get optimization job status
     */
    async getOptimizationStatus(jobId) {
        const response = await this.request("GET", `/v1/jobs/${jobId}`);
        const status = {
            status: response.status,
        };
        if (response.progress !== undefined) {
            status.progress = response.progress;
        }
        if (response.result !== undefined) {
            status.result = response.result;
        }
        if (response.error !== undefined) {
            status.error = response.error;
        }
        return status;
    }
    /**
     * Run benchmark on a model
     */
    async benchmarkModel(request) {
        (0, logger_1.logInfo)("Requesting model benchmark", { modelId: request.modelId });
        const response = await this.request("POST", `/v1/models/${request.modelId}/benchmark`, {
            device_profile: request.deviceProfile,
            test_data: request.testData || [],
        });
        return response;
    }
    /**
     * Get benchmark results
     */
    async getBenchmarkResults(jobId) {
        const response = await this.request("GET", `/v1/jobs/${jobId}/results`);
        return response;
    }
    /**
     * Export optimized model
     */
    async exportModel(request) {
        (0, logger_1.logInfo)("Requesting model export", { modelId: request.modelId, format: request.format });
        const response = await this.request("POST", `/v1/models/${request.modelId}/export`, {
            format: request.format,
            target_device: request.targetDevice,
        });
        return response;
    }
    /**
     * List available models
     */
    async listModels() {
        const response = await this.request("GET", "/v1/models");
        return response.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            format: m.format,
            createdAt: m.created_at,
        }));
    }
    /**
     * Get model details
     */
    async getModel(modelId) {
        const response = await this.request("GET", `/v1/models/${modelId}`);
        return {
            id: response.id,
            name: response.name,
            type: response.type,
            format: response.format,
            metadata: response.metadata,
            createdAt: response.created_at,
        };
    }
    /**
     * Delete a model
     */
    async deleteModel(modelId) {
        await this.request("DELETE", `/v1/models/${modelId}`);
    }
}
exports.AIASClient = AIASClient;
// Singleton instance
let aiasClientInstance = null;
function getAIASClient() {
    if (!aiasClientInstance) {
        const apiKey = process.env.AIAS_API_KEY || "";
        if (!apiKey) {
            throw new Error("AIAS_API_KEY environment variable is required");
        }
        const config = { apiKey };
        if (process.env.AIAS_BASE_URL) {
            config.baseUrl = process.env.AIAS_BASE_URL;
        }
        aiasClientInstance = new AIASClient(config);
    }
    return aiasClientInstance;
}
//# sourceMappingURL=client.js.map