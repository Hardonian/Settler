"""Plugin loading system."""

import importlib
import importlib.util
import inspect
import pkgutil
import sys
from pathlib import Path
from typing import Any

from .exceptions import PluginLoadError
from .models import Plugin, PluginInterface


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
