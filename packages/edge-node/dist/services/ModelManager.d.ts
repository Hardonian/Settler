/**
 * Model Manager
 * Manages loading and execution of ML models for edge inference
 */
export declare class ModelManager {
    private models;
    private modelDir;
    constructor(dataDir: string);
    loadModels(): void;
    getModel(modelName: string): unknown;
    runInference(modelName: string, _input: unknown): unknown;
}
//# sourceMappingURL=ModelManager.d.ts.map