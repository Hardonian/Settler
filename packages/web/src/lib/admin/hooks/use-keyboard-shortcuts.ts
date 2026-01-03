/**
 * Keyboard Shortcuts Hook
 * 
 * Provides keyboard navigation for admin dashboard (j/k, enter, r, e).
 * FinTech-native keyboard-first workflow.
 */

'use client';

import React, { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcutConfig {
  onNext?: () => void;
  onPrevious?: () => void;
  onSelect?: () => void;
  onResolve?: () => void;
  onEscalate?: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for keyboard shortcuts in admin dashboard
 */
export function useKeyboardShortcuts(config: KeyboardShortcutConfig) {
  const {
    onNext,
    onPrevious,
    onSelect,
    onResolve,
    onEscalate,
    enabled = true,
    preventDefault = true,
  } = config;

  const handlersRef = useRef({
    onNext,
    onPrevious,
    onSelect,
    onResolve,
    onEscalate,
  });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = {
      onNext,
      onPrevious,
      onSelect,
      onResolve,
      onEscalate,
    };
  }, [onNext, onPrevious, onSelect, onResolve, onEscalate]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case 'j':
        case 'ArrowDown':
          if (handlersRef.current.onNext) {
            if (preventDefault) event.preventDefault();
            handlersRef.current.onNext();
          }
          break;

        case 'k':
        case 'ArrowUp':
          if (handlersRef.current.onPrevious) {
            if (preventDefault) event.preventDefault();
            handlersRef.current.onPrevious();
          }
          break;

        case 'Enter':
          if (handlersRef.current.onSelect) {
            if (preventDefault) event.preventDefault();
            handlersRef.current.onSelect();
          }
          break;

        case 'r':
          if (handlersRef.current.onResolve) {
            if (preventDefault) event.preventDefault();
            handlersRef.current.onResolve();
          }
          break;

        case 'e':
          if (handlersRef.current.onEscalate) {
            if (preventDefault) event.preventDefault();
            handlersRef.current.onEscalate();
          }
          break;
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Keyboard shortcut help component
 */
export function KeyboardShortcutsHelp() {
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-4 text-sm z-50 max-w-xs">
      <div className="font-semibold mb-2 text-slate-900 dark:text-white">
        Keyboard Shortcuts
      </div>
      <div className="space-y-1 text-slate-600 dark:text-slate-400">
        <div className="flex justify-between">
          <span>j / ↓</span>
          <span>Next item</span>
        </div>
        <div className="flex justify-between">
          <span>k / ↑</span>
          <span>Previous item</span>
        </div>
        <div className="flex justify-between">
          <span>Enter</span>
          <span>Select / View</span>
        </div>
        <div className="flex justify-between">
          <span>r</span>
          <span>Resolve</span>
        </div>
        <div className="flex justify-between">
          <span>e</span>
          <span>Escalate</span>
        </div>
      </div>
    </div>
  );
}
