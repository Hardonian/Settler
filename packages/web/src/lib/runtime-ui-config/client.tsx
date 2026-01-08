/**
 * Runtime UI Config (Client)
 *
 * - Fetches public config at runtime (no rebuild required)
 * - Applies UI tokens as CSS variables
 * - Supports preview-only local overrides (for polish/review workflow)
 */

"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { safeParsePublicRuntimeUiConfig, type PublicRuntimeUiConfig } from "./schema";

type RuntimeUiConfigContextValue = {
  config: PublicRuntimeUiConfig;
  source: "default" | "remote" | "remote+override";
  setLocalOverride: (override: unknown) => void;
  clearLocalOverride: () => void;
};

const RuntimeUiConfigContext = createContext<RuntimeUiConfigContextValue | null>(null);

const LOCAL_OVERRIDE_KEY = "__settler_runtime_ui_config_override_v1";

function readLocalOverride(allowOverride: boolean): unknown | null {
  if (!allowOverride) return null;
  try {
    const raw = localStorage.getItem(LOCAL_OVERRIDE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocalOverride(value: unknown, allowOverride: boolean) {
  if (!allowOverride) return;
  localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(value));
}

function clearLocalOverrideStorage() {
  try {
    localStorage.removeItem(LOCAL_OVERRIDE_KEY);
  } catch {
    // ignore
  }
}

function applyCssVariables(config: PublicRuntimeUiConfig) {
  const root = document.documentElement;

  // Density-driven sizing tokens (high leverage, low risk)
  const density = config.tokens.density;
  const cardPadding = density === "compact" ? "1rem" : "1.5rem";
  const controlHeight = density === "compact" ? "2.25rem" : "2.5rem";

  // Radius scaling (maps to Tailwind rounded-md / rounded-lg defaults)
  const radiusScale = config.tokens.radiusScale;
  const radiusMd = `${0.375 * radiusScale}rem`;
  const radiusLg = `${0.5 * radiusScale}rem`;

  root.style.setProperty("--ui-card-padding", cardPadding);
  root.style.setProperty("--ui-control-height", controlHeight);
  root.style.setProperty("--ui-radius-md", radiusMd);
  root.style.setProperty("--ui-radius-lg", radiusLg);

  // Card shadow control via CSS variable (used by Card "default" elevation)
  const elevation = config.tokens.cardElevation;
  const shadow =
    elevation === "none"
      ? "0 0 #0000"
      : elevation === "sm"
        ? "0 1px 2px 0 rgb(0 0 0 / 0.06)"
        : elevation === "lg"
          ? "0 10px 15px -3px rgb(0 0 0 / 0.12), 0 4px 6px -4px rgb(0 0 0 / 0.12)"
          : "0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)";
  root.style.setProperty("--ui-card-shadow", shadow);
}

export function RuntimeUiConfigProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode;
  initialConfig?: PublicRuntimeUiConfig;
}) {
  const [config, setConfig] = useState<PublicRuntimeUiConfig>(
    safeParsePublicRuntimeUiConfig(initialConfig ?? {})
  );
  const [source, setSource] = useState<RuntimeUiConfigContextValue["source"]>(
    initialConfig ? "remote" : "default"
  );
  const [allowOverride, setAllowOverride] = useState<boolean>(process.env.NODE_ENV !== "production");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/public/ui-config", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { config?: unknown; environment?: string };
        const remote = safeParsePublicRuntimeUiConfig(data?.config ?? {});

        const env = (data?.environment || "").toLowerCase();
        const canOverride = env !== "production";
        setAllowOverride(canOverride);

        const override = readLocalOverride(canOverride);
        const merged = override ? safeParsePublicRuntimeUiConfig({ ...remote, ...override }) : remote;

        if (!cancelled) {
          setConfig(merged);
          setSource(override ? "remote+override" : "remote");
        }
      } catch {
        // Fail silently; keep safe defaults.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyCssVariables(config);
  }, [config]);

  const value = useMemo<RuntimeUiConfigContextValue>(
    () => ({
      config,
      source,
      setLocalOverride: (override: unknown) => {
        const sanitized = safeParsePublicRuntimeUiConfig(override);
        writeLocalOverride(sanitized, allowOverride);
        setConfig((prev) => safeParsePublicRuntimeUiConfig({ ...prev, ...sanitized }));
        setSource("remote+override");
      },
      clearLocalOverride: () => {
        clearLocalOverrideStorage();
        setSource("remote");
        // Re-fetch remote config to reset state
        window.location.reload();
      },
    }),
    [config, source, allowOverride]
  );

  return <RuntimeUiConfigContext.Provider value={value}>{children}</RuntimeUiConfigContext.Provider>;
}

export function useRuntimeUiConfig(): RuntimeUiConfigContextValue {
  const ctx = useContext(RuntimeUiConfigContext);
  if (!ctx) {
    return {
      config: safeParsePublicRuntimeUiConfig({}),
      source: "default",
      setLocalOverride: () => {},
      clearLocalOverride: () => {},
    };
  }
  return ctx;
}

