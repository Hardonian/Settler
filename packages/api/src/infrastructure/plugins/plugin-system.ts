/**
 * Plugin System Foundation
 * Enables autonomous growth through extensible plugin architecture
 */

import { logInfo, logError } from "../../utils/logger";

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

import type { Router } from "express";
import type { Express } from "express";

export interface Plugin {
  metadata: PluginMetadata;
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  registerRoutes?: (router: Router) => void;
  registerMiddleware?: (app: Express) => void;
  registerServices?: (container: Record<string, unknown>) => void;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private initialized: Set<string> = new Set();

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      // Check dependencies
      if (plugin.metadata.dependencies) {
        for (const dep of plugin.metadata.dependencies) {
          if (!this.plugins.has(dep)) {
            throw new Error(
              `Plugin ${plugin.metadata.id} requires dependency ${dep} which is not registered`
            );
          }
        }
      }

      this.plugins.set(plugin.metadata.id, plugin);
      logInfo("Plugin registered", {
        id: plugin.metadata.id,
        name: plugin.metadata.name,
        version: plugin.metadata.version,
      });
    } catch (error) {
      logError("Failed to register plugin", error, {
        pluginId: plugin.metadata.id,
      });
      throw error;
    }
  }

  /**
   * Initialize a plugin
   */
  async initializePlugin(pluginId: string): Promise<void> {
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
      logInfo("Plugin initialized", { pluginId });
    } catch (error) {
      logError("Failed to initialize plugin", error, { pluginId });
      throw error;
    }
  }

  /**
   * Initialize all plugins
   */
  async initializeAll(): Promise<void> {
    for (const pluginId of this.plugins.keys()) {
      try {
        await this.initializePlugin(pluginId);
      } catch (error) {
        logError("Failed to initialize plugin during bulk init", error, { pluginId });
        // Continue with other plugins
      }
    }
  }

  /**
   * Shutdown a plugin
   */
  async shutdownPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !this.initialized.has(pluginId)) {
      return;
    }

    try {
      if (plugin.shutdown) {
        await plugin.shutdown();
      }

      this.initialized.delete(pluginId);
      logInfo("Plugin shut down", { pluginId });
    } catch (error) {
      logError("Failed to shutdown plugin", error, { pluginId });
    }
  }

  /**
   * Shutdown all plugins
   */
  async shutdownAll(): Promise<void> {
    for (const pluginId of Array.from(this.initialized).reverse()) {
      await this.shutdownPlugin(pluginId);
    }
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * List all registered plugins
   */
  listPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((p) => p.metadata);
  }

  /**
   * Check if plugin is initialized
   */
  isInitialized(pluginId: string): boolean {
    return this.initialized.has(pluginId);
  }
}

// Singleton instance
let pluginManagerInstance: PluginManager | null = null;

export function getPluginManager(): PluginManager {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManager();
  }
  return pluginManagerInstance;
}
