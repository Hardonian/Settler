"""Plugin registry system."""

from collections.abc import Callable
from typing import Any

from .exceptions import PluginError
from .hooks import HookManager
from .models import Plugin


class PluginRegistry:
    """Registry for managing plugins.

    Coordinates plugin lifecycle, hooks, and configuration.

    Example:
        registry = PluginRegistry()

        # Load plugins
        loader = PluginLoader()
        plugins = loader.load_from_directory("./plugins")

        for plugin in plugins:
            registry.register(plugin)

        # Initialize all
        registry.initialize_all(config)

        # Use hooks
        result = registry.hooks.execute("job.before_execute", job)
    """

    def __init__(self):
        self._plugins: dict[str, Plugin] = {}
        self._hooks = HookManager()
        self._configs: dict[str, dict[str, Any]] = {}

    def register(self, plugin: Plugin):
        """Register a plugin."""
        self._plugins[plugin.info.name] = plugin

        # Register hooks with hook manager
        for hook_name, callbacks in plugin.hooks.items():
            for priority, callback in callbacks:
                self._hooks.subscribe(hook_name, callback, priority)

    def unregister(self, name: str):
        """Unregister a plugin."""
        plugin = self._plugins.pop(name, None)
        if plugin:
            # Unregister hooks
            for hook_name, callbacks in plugin.hooks.items():
                for _, callback in callbacks:
                    self._hooks.unsubscribe(hook_name, callback)

            # Shutdown
            plugin.instance.shutdown()

    def initialize_all(self, configs: dict[str, dict[str, Any]]) -> dict[str, bool]:
        """Initialize all registered plugins.

        Args:
            configs: Mapping of plugin name to config dict

        Returns:
            Mapping of plugin name to success status
        """
        results = {}

        for name, plugin in self._plugins.items():
            if not plugin.info.enabled:
                results[name] = False
                continue

            config = configs.get(name, {})

            try:
                success = plugin.instance.initialize(config)
                results[name] = success
            except Exception as e:
                results[name] = False
                # Log error but don't crash
                print(f"Failed to initialize plugin {name}: {e}")

        return results

    def shutdown_all(self):
        """Shutdown all registered plugins."""
        for name, plugin in list(self._plugins.items()):
            try:
                plugin.instance.shutdown()
            except Exception as e:
                print(f"Error shutting down plugin {name}: {e}")

        self._plugins.clear()

    def get_plugin(self, name: str) -> Plugin | None:
        """Get a registered plugin by name."""
        return self._plugins.get(name)

    def list_plugins(self) -> list[str]:
        """List names of all registered plugins."""
        return list(self._plugins.keys())

    def get_enabled_plugins(self) -> list[Plugin]:
        """Get all enabled plugins."""
        return [p for p in self._plugins.values() if p.info.enabled]

    @property
    def hooks(self) -> HookManager:
        """Get the hook manager."""
        return self._hooks


def create_builtin_hooks(registry: PluginRegistry):
    """Register documentation for built-in hooks."""
    # This is for documentation purposes
    pass


class HandlerRegistry:
    """Registry for custom job handlers.

    Allows plugins to register custom handlers for specific job types.

    Example:
        handlers = HandlerRegistry()

        # Register handler
        @handlers.register("custom.job")
        def handle_custom_job(params):
            pass

        # Execute handler
        result = handlers.execute("custom.job", params)
    """

    def __init__(self):
        self._handlers: dict[str, Callable] = {}

    def register(self, job_type: str, handler: Callable):
        """Register a handler for a job type."""
        self._handlers[job_type] = handler

    def unregister(self, job_type: str):
        """Unregister a handler."""
        self._handlers.pop(job_type, None)

    def execute(self, job_type: str, *args, **kwargs) -> Any:
        """Execute a handler for a job type."""
        handler = self._handlers.get(job_type)
        if not handler:
            raise PluginError(f"No handler registered for job type: {job_type}")

        return handler(*args, **kwargs)

    def has_handler(self, job_type: str) -> bool:
        """Check if a handler is registered."""
        return job_type in self._handlers

    def list_handlers(self) -> list[str]:
        """List all registered handler job types."""
        return list(self._handlers.keys())


# Global instances
_global_plugin_registry: PluginRegistry | None = None
_global_handler_registry: HandlerRegistry | None = None


def get_plugin_registry() -> PluginRegistry:
    """Get or create global plugin registry."""
    global _global_plugin_registry
    if _global_plugin_registry is None:
        _global_plugin_registry = PluginRegistry()
    return _global_plugin_registry


def get_handler_registry() -> HandlerRegistry:
    """Get or create global handler registry."""
    global _global_handler_registry
    if _global_handler_registry is None:
        _global_handler_registry = HandlerRegistry()
    return _global_handler_registry


def set_plugin_registry(registry: PluginRegistry):
    """Set global plugin registry."""
    global _global_plugin_registry
    _global_plugin_registry = registry


def set_handler_registry(registry: HandlerRegistry):
    """Set global handler registry."""
    global _global_handler_registry
    _global_handler_registry = registry
