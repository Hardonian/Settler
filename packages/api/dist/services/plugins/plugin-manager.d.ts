/**
 * Plugin Manager
 *
 * Manages third-party plugins for extensibility
 * Part of Phase VIII: Future-Proof Architecture
 */
export interface Plugin {
    id: string;
    name: string;
    version: string;
    type: 'ingestion' | 'validator' | 'transformer' | 'workflow';
    entryPoint: string;
    config?: Record<string, unknown>;
}
export declare class PluginManager {
    private plugins;
    /**
     * Register plugin
     */
    registerPlugin(plugin: Plugin): Promise<void>;
    /**
     * Get plugin
     */
    getPlugin(pluginId: string): Plugin | undefined;
    /**
     * List plugins by type
     */
    listPlugins(type?: Plugin['type']): Plugin[];
    /**
     * Execute plugin
     */
    executePlugin(pluginId: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Unregister plugin
     */
    unregisterPlugin(pluginId: string): Promise<void>;
}
//# sourceMappingURL=plugin-manager.d.ts.map