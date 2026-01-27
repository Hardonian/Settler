"use strict";
/**
 * AIAS Edge AI Accelerator Studio Integration Routes
 *
 * NOTE: This is an API-based integration. Settler.dev uses AIAS via HTTP API,
 * not direct code coupling. This ensures product independence.
 *
 * Handles model optimization, benchmarking, and export workflows via AIAS API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiasRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const error_handler_1 = require("../utils/error-handler");
const api_response_1 = require("../utils/api-response");
const client_1 = require("../services/aias/client");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const event_tracker_1 = require("../utils/event-tracker");
const router = (0, express_1.Router)();
exports.aiasRouter = router;
// ============================================================================
// Validation Schemas
// ============================================================================
const uploadModelSchema = zod_1.z.object({
    body: zod_1.z.object({
        modelName: zod_1.z.string().min(1).max(255),
        modelType: zod_1.z.enum(["matching", "anomaly_detection", "schema_inference", "pii_detection"]),
        modelFile: zod_1.z.string().min(1), // Base64 encoded
        format: zod_1.z.enum(["onnx", "tensorrt", "executorch", "tflite", "pytorch"]),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
const optimizeModelSchema = zod_1.z.object({
    params: zod_1.z.object({
        modelId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        targetDevices: zod_1.z.array(zod_1.z.string()),
        quantization: zod_1.z.enum(["int4", "int8", "fp16", "fp32"]),
        optimizationLevel: zod_1.z.enum(["speed", "balanced", "accuracy"]),
    }),
});
const benchmarkModelSchema = zod_1.z.object({
    params: zod_1.z.object({
        modelId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        deviceProfile: zod_1.z.object({
            deviceType: zod_1.z.string(),
            os: zod_1.z.string(),
            arch: zod_1.z.string(),
            capabilities: zod_1.z.record(zod_1.z.boolean()),
        }),
        testData: zod_1.z.array(zod_1.z.unknown()).optional(),
    }),
});
const exportModelSchema = zod_1.z.object({
    params: zod_1.z.object({
        modelId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        format: zod_1.z.enum(["docker", "wasm", "apk", "onnx", "tensorrt"]),
        targetDevice: zod_1.z.string().optional(),
    }),
});
// ============================================================================
// Routes
// ============================================================================
/**
 * POST /api/v1/aias/models/upload
 * Upload a model to AIAS
 */
router.post("/models/upload", (0, validation_1.validateRequest)(uploadModelSchema), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_AIAS_ACCESS), async (req, res) => {
    try {
        const { modelName, modelType, modelFile, format, metadata } = req.body;
        const tenantId = req.tenantId;
        const aiasClient = (0, client_1.getAIASClient)();
        const uploadResult = await aiasClient.uploadModel({
            modelName,
            modelType,
            modelFile,
            format,
            metadata,
        });
        // Store model version in database
        const modelResult = await (0, db_1.query)(`INSERT INTO model_versions (
        tenant_id, model_name, version, model_type, format,
        aias_job_id, metadata, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`, [
            tenantId,
            modelName,
            "1.0.0", // Initial version
            modelType,
            format,
            uploadResult.jobId,
            JSON.stringify(metadata || {}),
            false, // Not active until optimized
        ]);
        await (0, event_tracker_1.trackEventAsync)(tenantId, "aias_model_uploaded", {
            model_id: modelResult[0]?.id || "",
            aias_job_id: uploadResult.jobId,
        });
        (0, logger_1.logInfo)(`Model uploaded to AIAS: ${modelResult[0]?.id || ""}`);
        (0, api_response_1.sendSuccess)(res, {
            modelId: modelResult[0]?.id || "",
            aiasJobId: uploadResult.jobId,
            aiasModelId: uploadResult.modelId,
            status: "uploaded",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to upload model", 500);
    }
});
/**
 * POST /api/v1/aias/models/:modelId/optimize
 * Request model optimization
 */
router.post("/models/:modelId/optimize", (0, validation_1.validateRequest)(optimizeModelSchema), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_AIAS_ACCESS), async (req, res) => {
    try {
        const { modelId } = req.params;
        if (!modelId) {
            (0, api_response_1.sendError)(res, 400, "MODEL_ID_REQUIRED", "Model ID is required");
            return;
        }
        const { targetDevices, quantization, optimizationLevel } = req.body;
        const tenantId = req.tenantId;
        // Verify model belongs to tenant
        const modelCheck = await (0, db_1.query)(`SELECT id FROM model_versions 
       WHERE id = $1 AND tenant_id = $2`, [modelId, tenantId || ""]);
        if (modelCheck.length === 0) {
            (0, api_response_1.sendError)(res, 404, "MODEL_NOT_FOUND", "Model not found");
            return;
        }
        const aiasClient = (0, client_1.getAIASClient)();
        const aiasModelId = await getAIASModelId(modelId);
        const optimizeResult = await aiasClient.optimizeModel({
            modelId: aiasModelId,
            targetDevices,
            quantization,
            optimizationLevel,
        });
        // Update model version with optimization job
        await (0, db_1.query)(`UPDATE model_versions 
       SET aias_job_id = $1, updated_at = NOW()
       WHERE id = $2`, [optimizeResult.jobId || "", modelId || ""]);
        await (0, event_tracker_1.trackEventAsync)(tenantId, "aias_model_optimization_requested", {
            model_id: modelId,
            aias_job_id: optimizeResult.jobId,
            quantization,
        });
        (0, api_response_1.sendSuccess)(res, {
            jobId: optimizeResult.jobId,
            status: "pending",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to optimize model", 500);
    }
});
/**
 * GET /api/v1/aias/jobs/:jobId/status
 * Get optimization/benchmark job status
 */
router.get("/jobs/:jobId/status", (0, validation_1.validateRequest)(zod_1.z.object({
    params: zod_1.z.object({ jobId: zod_1.z.string() }),
})), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_AIAS_ACCESS), async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            (0, api_response_1.sendError)(res, 400, "JOB_ID_REQUIRED", "Job ID is required");
            return;
        }
        const tenantId = req.tenantId;
        // Verify job belongs to tenant's model
        const modelCheck = await (0, db_1.query)(`SELECT id FROM model_versions 
       WHERE aias_job_id = $1 AND tenant_id = $2`, [jobId, tenantId || ""]);
        if (modelCheck.length === 0) {
            (0, api_response_1.sendError)(res, 404, "JOB_NOT_FOUND", "Job not found");
            return;
        }
        const aiasClient = (0, client_1.getAIASClient)();
        const status = await aiasClient.getOptimizationStatus(jobId);
        // If completed, update model version
        if (status.status === "completed" && status.result) {
            await (0, db_1.query)(`UPDATE model_versions 
         SET benchmark_results = $1, updated_at = NOW()
         WHERE id = $2`, [JSON.stringify(status.result.benchmarkResults), (modelCheck[0]?.id || "")]);
        }
        (0, api_response_1.sendSuccess)(res, status);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get job status", 500);
    }
});
/**
 * POST /api/v1/aias/models/:modelId/benchmark
 * Run benchmark on a model
 */
router.post("/models/:modelId/benchmark", (0, validation_1.validateRequest)(benchmarkModelSchema), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_AIAS_ACCESS), async (req, res) => {
    try {
        const { modelId } = req.params;
        if (!modelId) {
            (0, api_response_1.sendError)(res, 400, "MODEL_ID_REQUIRED", "Model ID is required");
            return;
        }
        const { deviceProfile, testData } = req.body;
        const tenantId = req.tenantId;
        // Verify model belongs to tenant
        const modelCheck = await (0, db_1.query)(`SELECT id FROM model_versions 
       WHERE id = $1 AND tenant_id = $2`, [modelId, tenantId || ""]);
        if (modelCheck.length === 0) {
            (0, api_response_1.sendError)(res, 404, "MODEL_NOT_FOUND", "Model not found");
            return;
        }
        const aiasClient = (0, client_1.getAIASClient)();
        const aiasModelId = await getAIASModelId(modelId);
        const benchmarkResult = await aiasClient.benchmarkModel({
            modelId: aiasModelId,
            deviceProfile,
            testData,
        });
        await (0, event_tracker_1.trackEventAsync)(tenantId, "aias_model_benchmark_requested", {
            model_id: modelId,
            aias_job_id: benchmarkResult.jobId,
        });
        (0, api_response_1.sendSuccess)(res, {
            jobId: benchmarkResult.jobId,
            status: "pending",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to benchmark model", 500);
    }
});
/**
 * GET /api/v1/aias/jobs/:jobId/benchmark-results
 * Get benchmark results
 */
router.get("/jobs/:jobId/benchmark-results", (0, validation_1.validateRequest)(zod_1.z.object({
    params: zod_1.z.object({ jobId: zod_1.z.string() }),
})), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_AIAS_ACCESS), async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            (0, api_response_1.sendError)(res, 400, "JOB_ID_REQUIRED", "Job ID is required");
            return;
        }
        const tenantId = req.tenantId;
        // Verify job belongs to tenant's model
        const modelCheck = await (0, db_1.query)(`SELECT id FROM model_versions 
       WHERE aias_job_id = $1 AND tenant_id = $2`, [jobId, tenantId || ""]);
        if (modelCheck.length === 0) {
            (0, api_response_1.sendError)(res, 404, "JOB_NOT_FOUND", "Job not found");
            return;
        }
        const aiasClient = (0, client_1.getAIASClient)();
        const results = await aiasClient.getBenchmarkResults(jobId);
        // Update model version with benchmark results
        await (0, db_1.query)(`UPDATE model_versions 
       SET benchmark_results = $1, updated_at = NOW()
       WHERE id = $2`, [JSON.stringify(results), (modelCheck[0]?.id || "")]);
        (0, api_response_1.sendSuccess)(res, results);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get benchmark results", 500);
    }
});
/**
 * POST /api/v1/aias/models/:modelId/export
 * Export optimized model
 */
router.post("/models/:modelId/export", (0, validation_1.validateRequest)(exportModelSchema), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_AIAS_ACCESS), async (req, res) => {
    try {
        const { modelId } = req.params;
        if (!modelId) {
            (0, api_response_1.sendError)(res, 400, "MODEL_ID_REQUIRED", "Model ID is required");
            return;
        }
        const { format, targetDevice } = req.body;
        const tenantId = req.tenantId;
        // Verify model belongs to tenant
        const modelCheck = await (0, db_1.query)(`SELECT id FROM model_versions 
       WHERE id = $1 AND tenant_id = $2`, [modelId, tenantId || ""]);
        if (modelCheck.length === 0) {
            (0, api_response_1.sendError)(res, 404, "MODEL_NOT_FOUND", "Model not found");
            return;
        }
        const aiasClient = (0, client_1.getAIASClient)();
        const aiasModelId = await getAIASModelId(modelId);
        const exportResult = await aiasClient.exportModel({
            modelId: aiasModelId,
            format,
            targetDevice,
        });
        // Update model version with export info
        await (0, db_1.query)(`UPDATE model_versions 
       SET file_path = $1, file_size_bytes = $2, updated_at = NOW()
       WHERE id = $3`, [exportResult.downloadUrl, exportResult.fileSize, modelId]);
        await (0, event_tracker_1.trackEventAsync)(tenantId, "aias_model_exported", {
            model_id: modelId,
            format,
        });
        (0, api_response_1.sendSuccess)(res, exportResult);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to export model", 500);
    }
});
/**
 * GET /api/v1/aias/models
 * List models for tenant
 */
router.get("/models", (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_MODELS_READ), async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { page = "1", limit = "100" } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const result = await (0, db_1.query)(`SELECT id, model_name, version, model_type, format, is_active, created_at
       FROM model_versions
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [tenantId, Number(limit), offset]);
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM model_versions WHERE tenant_id = $1`, [tenantId]);
        (0, api_response_1.sendSuccess)(res, {
            models: result,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(countResult[0]?.count || 0),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to list models", 500);
    }
});
/**
 * GET /api/v1/aias/models/:modelId
 * Get model details
 */
router.get("/models/:modelId", (0, validation_1.validateRequest)(zod_1.z.object({
    params: zod_1.z.object({ modelId: zod_1.z.string().uuid() }),
})), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_MODELS_READ), async (req, res) => {
    try {
        const { modelId } = req.params;
        if (!modelId) {
            (0, api_response_1.sendError)(res, 400, "MODEL_ID_REQUIRED", "Model ID is required");
            return;
        }
        const tenantId = req.tenantId;
        const result = await (0, db_1.query)(`SELECT id, model_name, version, model_type, format, quantization,
              file_path, file_size_bytes, benchmark_results, device_targets,
              metadata, is_active, created_at
       FROM model_versions
       WHERE id = $1 AND tenant_id = $2`, [modelId, tenantId || ""]);
        if (result.length === 0) {
            (0, api_response_1.sendError)(res, 404, "MODEL_NOT_FOUND", "Model not found");
            return;
        }
        const model = result[0];
        if (!model) {
            (0, api_response_1.sendError)(res, 404, "MODEL_NOT_FOUND", "Model not found");
            return;
        }
        (0, api_response_1.sendSuccess)(res, {
            ...model,
            benchmark_results: model.benchmark_results ? JSON.parse(model.benchmark_results) : null,
            device_targets: model.device_targets || [],
            metadata: JSON.parse(model.metadata || "{}"),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get model details", 500);
    }
});
// ============================================================================
// Helper Functions
// ============================================================================
async function getAIASModelId(modelVersionId) {
    // This would typically fetch from a mapping table or metadata
    // For now, we'll use a placeholder - in production, store AIAS model ID in model_versions.metadata
    const result = await (0, db_1.query)(`SELECT metadata FROM model_versions WHERE id = $1`, [modelVersionId]);
    if (result.length === 0) {
        throw new Error("Model not found");
    }
    const metadata = JSON.parse(result[0]?.metadata || "{}");
    return metadata.aiasModelId || modelVersionId; // Fallback to model version ID
}
//# sourceMappingURL=aias.js.map