"""Plugin architecture for the Settler workhorse.

Provides plugin discovery, loading, hook system, and extensibility
for custom handlers and integrations.
"""

import importlib
import importlib.util
import inspect
import pkgutil
import sys
from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import (
    Any,
    TypeVar,
)

# Type variables for generic hooks
T = TypeVar("T")
R = TypeVar("R")


class PluginError(Exception):
    """Base exception for plugin errors."""

    pass


class PluginLoadError(PluginError):
    """Error loading a plugin."""

    pass


class HookError(PluginError):
    """Error in hook execution."""

    pass


@dataclass
class PluginInfo:
    """Metadata about a plugin."""

    name: str
    version: str
    description: str
    author: str
    entry_point: str
    dependencies: list[str] = field(default_factory=list)
    config_schema: dict[str, Any] | None = None
    enabled: bool = True


@dataclass
class Plugin:
    """A loaded plugin instance."""

    info: PluginInfo
    module: Any
    instance: Any
    hooks: dict[str, list[Callable]] = field(default_factory=dict)


class PluginInterface(ABC):
    """Base class for plugins.

    Plugins must inherit from this class and implement the required methods.

    Example:
        class MyPlugin(PluginInterface):
            def initialize(self, config):
                # Setup code
                pass

            def shutdown(self):
                # Cleanup code
                pass

            @hook("job.before_execute")
            def on_before_execute(self, job):
                # Hook implementation
                return job
    """

    @abstractmethod
    def initialize(self, config: dict[str, Any]) -> bool:
        """Initialize the plugin with configuration.

        Args:
            config: Plugin configuration from settings

        Returns:
            True if initialization successful
        """
        pass

    @abstractmethod
    def shutdown(self):
        """Shutdown the plugin and cleanup resources."""
        pass

    def get_info(self) -> PluginInfo:
        """Get plugin metadata. Override to provide custom info."""
        return PluginInfo(
            name=self.__class__.__name__,
            version="1.0.0",
            description="",
            author="",
            entry_point=f"{self.__class__.__module__}.{self.__class__.__name__}",
        )


def hook(hook_name: str, priority: int = 5):
    """Decorator to mark a method as a hook handler.

    Args:
        hook_name: Name of the hook to subscribe to
        priority: Hook priority (lower = higher priority, 1-10)

    Example:
        class MyPlugin(PluginInterface):
            @hook("job.before_execute", priority=1)
            def log_job_start(self, job):
                print(f"Starting job {job.id}")
                return job
    """

    def decorator(func: Callable) -> Callable:
        func._is_hook = True  # type: ignore
        func._hook_name = hook_name  # type: ignore
        func._hook_priority = priority  # type: ignore
        return func

    return decorator


class HookManager:
    """Manager for plugin hooks.

    Provides publish-subscribe pattern for plugin communication.

    Example:
        hooks = HookManager()

        # Subscribe to hook
        hooks.subscribe("job.before_execute", my_callback)

        # Execute hook
        result = hooks.execute("job.before_execute", job)
    """

    def __init__(self):
        self._subscribers: dict[str, list[tuple]] = {}  # hook_name -> [(priority, callback)]

    def subscribe(self, hook_name: str, callback: Callable, priority: int = 5):
        """Subscribe a callback to a hook."""
        if hook_name not in self._subscribers:
            self._subscribers[hook_name] = []

        self._subscribers[hook_name].append((priority, callback))
        # Sort by priority (lower first)
        self._subscribers[hook_name].sort(key=lambda x: x[0])

    def unsubscribe(self, hook_name: str, callback: Callable):
        """Unsubscribe a callback from a hook."""
        if hook_name in self._subscribers:
            self._subscribers[hook_name] = [
                (p, cb) for p, cb in self._subscribers[hook_name] if cb != callback
            ]

    def execute(self, hook_name: str, *args, **kwargs) -> Any:
        """Execute all subscribers for a hook.

        Returns the result of the last subscriber.
        """
        if hook_name not in self._subscribers:
            return args[0] if args else None

        result = args[0] if args else None

        for _priority, callback in self._subscribers[hook_name]:
            try:
                # Pass result as first argument (chaining)
                if result is not None:
                    hook_result = callback(result, *args[1:], **kwargs)
                else:
                    hook_result = callback(*args, **kwargs)

                # If hook returns a value, use it as the new result
                if hook_result is not None:
                    result = hook_result

            except Exception as e:
                raise HookError(f"Hook '{hook_name}' failed: {e}") from e

        return result

    async def execute_async(self, hook_name: str, *args, **kwargs) -> Any:
        """Execute all subscribers for a hook (async version)."""
        import asyncio

        if hook_name not in self._subscribers:
            return args[0] if args else None

        result = args[0] if args else None

        for _priority, callback in self._subscribers[hook_name]:
            try:
                if asyncio.iscoroutinefunction(callback):
                    if result is not None:
                        hook_result = await callback(result, *args[1:], **kwargs)
                    else:
                        hook_result = await callback(*args, **kwargs)
                else:
                    if result is not None:
                        hook_result = callback(result, *args[1:], **kwargs)
                    else:
                        hook_result = callback(*args, **kwargs)

                if hook_result is not None:
                    result = hook_result

            except Exception as e:
                raise HookError(f"Hook '{hook_name}' failed: {e}") from e

        return result

    def get_subscribers(self, hook_name: str) -> list[Callable]:
        """Get all subscribers for a hook."""
        return [cb for _, cb in self._subscribers.get(hook_name, [])]

    def list_hooks(self) -> list[str]:
        """List all registered hook names."""
        return list(self._subscribers.keys())


class PluginLoader:
    """Loader for discovering and loading plugins.

    Supports loading from:
    - Python packages (entry points)
    - File system directories
    - Built-in plugins

    Example:
        loader = PluginLoader()

        # Load from directory
        plugins = loader.load_from_directory("./plugins")

        # Load from package
        plugins = loader.load_from_package("settler.plugins")
    """

    def __init__(self):
        self._loaded: dict[str, Plugin] = {}

    def load_from_directory(self, directory: str | Path) -> list[Plugin]:
        """Load plugins from a directory.

        Directory structure:
            plugins/
                my_plugin/
                    __init__.py
                    plugin.py
        """
        directory = Path(directory)
        plugins = []

        if not directory.exists():
            return plugins

        # Add directory to path if not already there
        str_path = str(directory.parent) if directory.name == "plugins" else str(directory)
        if str_path not in sys.path:
            sys.path.insert(0, str_path)

        # Find all subdirectories with __init__.py
        for subdir in directory.iterdir():
            if subdir.is_dir() and (subdir / "__init__.py").exists():
                try:
                    plugin = self._load_module(subdir.name, subdir / "__init__.py")
                    if plugin:
                        plugins.append(plugin)
                except Exception as e:
                    raise PluginLoadError(f"Failed to load plugin from {subdir}: {e}") from e

        return plugins

    def load_from_package(self, package_name: str) -> list[Plugin]:
        """Load plugins from an installed Python package."""
        plugins = []

        try:
            package = importlib.import_module(package_name)
            package_path = Path(package.__file__).parent

            # Find all submodules
            for _importer, modname, ispkg in pkgutil.iter_modules([str(package_path)]):
                if ispkg:
                    try:
                        full_name = f"{package_name}.{modname}"
                        module = importlib.import_module(full_name)
                        plugin = self._create_plugin_from_module(module)
                        if plugin:
                            plugins.append(plugin)
                    except Exception as e:
                        raise PluginLoadError(f"Failed to load plugin {modname}: {e}") from e

        except ImportError as e:
            raise PluginLoadError(f"Could not import package {package_name}: {e}") from e

        return plugins

    def load_from_entry_point(self, entry_point: str) -> Plugin | None:
        """Load a plugin from an entry point string (module.path:ClassName)."""
        try:
            if ":" in entry_point:
                module_path, class_name = entry_point.split(":")
            else:
                module_path = entry_point
                class_name = None

            module = importlib.import_module(module_path)

            if class_name:
                plugin_class = getattr(module, class_name)
                instance = plugin_class()

                plugin = Plugin(
                    info=instance.get_info(),
                    module=module,
                    instance=instance,
                )

                # Auto-register hooks
                self._register_hooks_from_instance(plugin)

                self._loaded[plugin.info.name] = plugin
                return plugin
            else:
                return self._create_plugin_from_module(module)

        except Exception as e:
            raise PluginLoadError(f"Failed to load entry point {entry_point}: {e}") from e

    def _load_module(self, name: str, path: Path) -> Plugin | None:
        """Load a plugin module from a file path."""
        spec = importlib.util.spec_from_file_location(name, path)
        if not spec or not spec.loader:
            return None

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        return self._create_plugin_from_module(module)

    def _create_plugin_from_module(self, module: Any) -> Plugin | None:
        """Create a Plugin from a loaded module."""
        # Look for PluginInterface subclass
        plugin_class = None

        for name in dir(module):
            obj = getattr(module, name)
            if (
                inspect.isclass(obj)
                and issubclass(obj, PluginInterface)
                and obj is not PluginInterface
            ):
                plugin_class = obj
                break

        if not plugin_class:
            return None

        # Create instance
        instance = plugin_class()

        plugin = Plugin(
            info=instance.get_info(),
            module=module,
            instance=instance,
        )

        # Auto-register hooks
        self._register_hooks_from_instance(plugin)

        self._loaded[plugin.info.name] = plugin
        return plugin

    def _register_hooks_from_instance(self, plugin: Plugin):
        """Register hooks from plugin instance methods."""
        for name in dir(plugin.instance):
            method = getattr(plugin.instance, name)
            if callable(method) and hasattr(method, "_is_hook"):
                hook_name = method._hook_name
                priority = getattr(method, "_hook_priority", 5)

                if hook_name not in plugin.hooks:
                    plugin.hooks[hook_name] = []

                plugin.hooks[hook_name].append((priority, method))

    def get_loaded(self) -> dict[str, Plugin]:
        """Get all loaded plugins."""
        return self._loaded.copy()


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


# Built-in hooks documentation
BUILTIN_HOOKS = {
    "job.before_execute": "Called before a job is executed. Can modify job.",
    "job.after_execute": "Called after a job executes successfully.",
    "job.on_error": "Called when a job execution fails.",
    "job.on_retry": "Called when a job is being retried.",
    "handler.before_invoke": "Called before a handler is invoked.",
    "handler.after_invoke": "Called after a handler completes.",
    "system.startup": "Called when the system starts up.",
    "system.shutdown": "Called when the system shuts down.",
    "config.loaded": "Called when configuration is loaded.",
}


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


# Export public API
__all__ = [
    # Exceptions
    "PluginError",
    "PluginLoadError",
    "HookError",
    # Classes
    "PluginInfo",
    "Plugin",
    "PluginInterface",
    "HookManager",
    "PluginLoader",
    "PluginRegistry",
    "HandlerRegistry",
    # Functions
    "hook",
    "get_plugin_registry",
    "get_handler_registry",
    "set_plugin_registry",
    "set_handler_registry",
    # Documentation
    "BUILTIN_HOOKS",
    "create_builtin_hooks",
]
