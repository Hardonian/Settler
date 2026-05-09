"""Plugin exceptions."""


class PluginError(Exception):
    """Base exception for plugin errors."""

    pass


class PluginLoadError(PluginError):
    """Error loading a plugin."""

    pass


class HookError(PluginError):
    """Error in hook execution."""

    pass
