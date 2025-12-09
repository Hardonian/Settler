/**
 * Plugin System Foundation
 * Enables autonomous growth through extensible plugin architecture
 */
export interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    dependencies?: string[];
}
import type { Router } from 'express';
import type { Express } from 'express';
export interface Plugin {
    metadata: PluginMetadata;
    initialize?: () => Promise<void>;
    shutdown?: () => Promise<void>;
    registerRoutes?: (router: Router) => void;
    registerMiddleware?: (app: Express) => void;
    registerServices?: (container: Record<string, unknown>) => void;
}
export declare class PluginManager {
    private plugins;
    private initialized;
    /**
     * Register a plugin
     */
    registerPlugin(plugin: Plugin): Promise<void>;
    /**
     * Initialize a plugin
     */
    initializePlugin(pluginId: string): Promise<void>;
    /**
     * Initialize all plugins
     */
    initializeAll(): Promise<void>;
    /**
     * Shutdown a plugin
     */
    shutdownPlugin(pluginId: string): Promise<void>;
    /**
     * Shutdown all plugins
     */
    shutdownAll(): Promise<void>;
    /**
     * Get plugin by ID
     */
    getPlugin(pluginId: string): Plugin | undefined;
    /**
     * List all registered plugins
     */
    listPlugins(): PluginMetadata[];
    /**
     * Check if plugin is initialized
     */
    isInitialized(pluginId: string): boolean;
}
export declare function getPluginManager(): PluginManager;
//# sourceMappingURL=plugin-system.d.ts.map