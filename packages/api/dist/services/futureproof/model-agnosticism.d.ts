/**
 * Model Agnosticism
 *
 * Core modules that can work with any LLM, multimodal recon, portable embeddings
 * Part 13: Long-Range Futureproofing
 */
export interface LLMProvider {
    name: string;
    models: string[];
    capabilities: string[];
    apiEndpoint: string;
}
export interface ModelAdapter {
    provider: string;
    model: string;
    adapt(input: Record<string, unknown>): Record<string, unknown>;
    parse(output: unknown): Record<string, unknown>;
}
export declare class ModelAgnosticism {
    private providers;
    private adapters;
    constructor();
    /**
     * Register LLM provider
     */
    registerProvider(provider: LLMProvider): void;
    /**
     * Register model adapter
     */
    registerAdapter(adapter: ModelAdapter): void;
    /**
     * Get provider
     */
    getProvider(name: string): LLMProvider | undefined;
    /**
     * Get adapter
     */
    getAdapter(provider: string, model: string): ModelAdapter | undefined;
    /**
     * Execute with any model
     */
    executeWithModel(provider: string, model: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Support multimodal recon
     */
    multimodalRecon(_data: {
        text?: string;
        image?: ArrayBuffer;
        audio?: ArrayBuffer;
        video?: ArrayBuffer;
    }): Promise<{
        success: boolean;
        provider: string;
    }>;
    /**
     * Portable embeddings architecture
     */
    generateEmbedding(_text: string, _provider?: string): Promise<number[]>;
}
//# sourceMappingURL=model-agnosticism.d.ts.map