"use strict";
/**
 * Plugin System Foundation
 * Enables autonomous growth through extensible plugin architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
exports.getPluginManager = getPluginManager;
const logger_1 = require("../../utils/logger");
class PluginManager {
    plugins = new Map();
    initialized = new Set();
    /**
     * Register a plugin
     */
    async registerPlugin(plugin) {
        try {
            // Check dependencies
            if (plugin.metadata.dependencies) {
                for (const dep of plugin.metadata.dependencies) {
                    if (!this.plugins.has(dep)) {
                        throw new Error(`Plugin ${plugin.metadata.id} requires dependency ${dep} which is not registered`);
                    }
                }
            }
            this.plugins.set(plugin.metadata.id, plugin);
            (0, logger_1.logInfo)("Plugin registered", {
                id: plugin.metadata.id,
                name: plugin.metadata.name,
                version: plugin.metadata.version,
            });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to register plugin", error, {
                pluginId: plugin.metadata.id,
            });
            throw error;
        }
    }
    /**
     * Initialize a plugin
     */
    async initializePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (this.initialized.has(pluginId)) {
            return;
        }
        try {
            // Initialize dependencies first
            if (plugin.metadata.dependencies) {
                for (const dep of plugin.metadata.dependencies) {
                    await this.initializePlugin(dep);
                }
            }
            if (plugin.initialize) {
                await plugin.initialize();
            }
            this.initialized.add(pluginId);
            (0, logger_1.logInfo)("Plugin initialized", { pluginId });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to initialize plugin", error, { pluginId });
            throw error;
        }
    }
    /**
     * Initialize all plugins
     */
    async initializeAll() {
        for (const pluginId of this.plugins.keys()) {
            try {
                await this.initializePlugin(pluginId);
            }
            catch (error) {
                (0, logger_1.logError)("Failed to initialize plugin during bulk init", error, { pluginId });
                // Continue with other plugins
            }
        }
    }
    /**
     * Shutdown a plugin
     */
    async shutdownPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin || !this.initialized.has(pluginId)) {
            return;
        }
        try {
            if (plugin.shutdown) {
                await plugin.shutdown();
            }
            this.initialized.delete(pluginId);
            (0, logger_1.logInfo)("Plugin shut down", { pluginId });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to shutdown plugin", error, { pluginId });
        }
    }
    /**
     * Shutdown all plugins
     */
    async shutdownAll() {
        for (const pluginId of Array.from(this.initialized).reverse()) {
            await this.shutdownPlugin(pluginId);
        }
    }
    /**
     * Get plugin by ID
     */
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    /**
     * List all registered plugins
     */
    listPlugins() {
        return Array.from(this.plugins.values()).map((p) => p.metadata);
    }
    /**
     * Check if plugin is initialized
     */
    isInitialized(pluginId) {
        return this.initialized.has(pluginId);
    }
}
exports.PluginManager = PluginManager;
// Singleton instance
let pluginManagerInstance = null;
function getPluginManager() {
    if (!pluginManagerInstance) {
        pluginManagerInstance = new PluginManager();
    }
    return pluginManagerInstance;
}
//# sourceMappingURL=plugin-system.js.map