/**
 * Platform Provider Component
 *
 * Provides platform-specific theming and context for ReadyLayer components.
 */

"use client";

import React, { createContext, useContext, useMemo } from "react";
import { GitProvider, PlatformTheme } from "@/lib/readylayer/types";
import { getThemeForProvider } from "@/lib/readylayer/themes";

interface PlatformContextValue {
  provider: GitProvider;
  theme: PlatformTheme;
  installationId?: string;
  repositoryId?: string;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within PlatformProvider");
  }
  return context;
}

interface PlatformProviderProps {
  provider: GitProvider;
  installationId?: string;
  repositoryId?: string;
  children: React.ReactNode;
}

export function PlatformProvider({
  provider,
  installationId,
  repositoryId,
  children,
}: PlatformProviderProps) {
  const theme = useMemo(() => getThemeForProvider(provider), [provider]);

  const value = useMemo(
    () => ({
      provider,
      theme,
      installationId,
      repositoryId,
    }),
    [provider, theme, installationId, repositoryId]
  );

  return (
    <PlatformContext.Provider value={value}>
      <div
        style={
          {
            "--rl-primary": theme.colors.primary,
            "--rl-secondary": theme.colors.secondary,
            "--rl-accent": theme.colors.accent,
            "--rl-background": theme.colors.background,
            "--rl-surface": theme.colors.surface,
            "--rl-text": theme.colors.text,
            "--rl-border": theme.colors.border,
            fontFamily: theme.fonts.body,
          } as React.CSSProperties
        }
        className="readylayer-platform"
      >
        {children}
      </div>
    </PlatformContext.Provider>
  );
}
