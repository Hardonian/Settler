"""Plugin hook system."""

from collections.abc import Callable
from typing import Any

from .exceptions import HookError


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
