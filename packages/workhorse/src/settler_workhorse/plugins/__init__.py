"""Plugin architecture for the Settler workhorse.

Provides plugin discovery, loading, hook system, and extensibility
for custom handlers and integrations.
"""

from .exceptions import HookError, PluginError, PluginLoadError
from .hooks import BUILTIN_HOOKS, HookManager, hook
from .loader import PluginLoader
from .models import Plugin, PluginInfo, PluginInterface
from .registry import (
    HandlerRegistry,
    PluginRegistry,
    create_builtin_hooks,
    get_handler_registry,
    get_plugin_registry,
    set_handler_registry,
    set_plugin_registry,
)

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
