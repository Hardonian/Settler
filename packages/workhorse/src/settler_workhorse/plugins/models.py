"""Plugin models and interfaces."""

from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


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
