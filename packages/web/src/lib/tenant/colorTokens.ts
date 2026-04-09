/**
 * Color Token Utilities
 *
 * Maps tenant branding colors to the existing design token system.
 * Provides type-safe access to tenant colors via Tailwind classes.
 */

import { TenantTheme } from "@/shared/tenant/types";

/**
 * Default color tokens (Settler brand)
 */
export const DEFAULT_COLOR_TOKENS = {
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
  },
  electric: {
    cyan: "#06b6d4",
    purple: "#a855f7",
    neon: "#00ff88",
    blue: "#3b82f6",
    indigo: "#6366f1",
  },
  accent: {
    DEFAULT: "#06b6d4",
  },
} as const;

/**
 * Generate color scale from a base color
 */
export function generateColorScale(baseHex: string): Record<number, string> {
  // Simple scale generation - can be enhanced with proper color theory
  const scale: Record<number, string> = {};

  // Extract RGB
  const r = parseInt(baseHex.slice(1, 3), 16);
  const g = parseInt(baseHex.slice(3, 5), 16);
  const b = parseInt(baseHex.slice(5, 7), 16);

  // Generate lighter/darker variants
  scale[50] = `rgb(${Math.min(255, r + 200)}, ${Math.min(255, g + 200)}, ${Math.min(255, b + 200)})`;
  scale[100] = `rgb(${Math.min(255, r + 150)}, ${Math.min(255, g + 150)}, ${Math.min(255, b + 150)})`;
  scale[500] = baseHex;
  scale[600] = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;
  scale[700] = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;

  return scale;
}

/**
 * Get Tailwind-compatible color classes for tenant theme
 */
export function getTenantColorClasses(theme: TenantTheme | null): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
} {
  if (!theme) {
    return {
      primary: "text-primary-600",
      secondary: "text-electric-purple",
      accent: "text-electric-cyan",
      background: "bg-background",
    };
  }

  // Return inline styles for custom colors, or fallback to token classes
  return {
    primary:
      theme.colors.primary !== DEFAULT_COLOR_TOKENS.primary[600]
        ? "" // Will use inline style
        : "text-primary-600",
    secondary:
      theme.colors.secondary !== DEFAULT_COLOR_TOKENS.electric.purple ? "" : "text-electric-purple",
    accent: theme.colors.accent !== DEFAULT_COLOR_TOKENS.electric.cyan ? "" : "text-electric-cyan",
    background: theme.colors.background !== "#ffffff" ? "" : "bg-background",
  };
}

/**
 * Get inline style for tenant color
 */
export function getTenantColorStyle(
  theme: TenantTheme | null,
  colorType: "primary" | "secondary" | "accent" | "background"
): React.CSSProperties {
  if (!theme) return {};

  const colorMap = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    background: theme.colors.background,
  };

  return {
    [colorType === "background" ? "backgroundColor" : "color"]: colorMap[colorType],
  };
}

/**
 * Safe color presets for branding editor
 */
export const COLOR_PRESETS = [
  { name: "Settler Blue", value: "#2563eb", category: "primary" },
  { name: "Electric Cyan", value: "#06b6d4", category: "accent" },
  { name: "Electric Purple", value: "#a855f7", category: "secondary" },
  { name: "Electric Blue", value: "#3b82f6", category: "primary" },
  { name: "Electric Indigo", value: "#6366f1", category: "secondary" },
  { name: "Neon Green", value: "#00ff88", category: "accent" },
  { name: "Ocean Blue", value: "#0284c7", category: "primary" },
  { name: "Royal Purple", value: "#7c3aed", category: "secondary" },
] as const;

/**
 * Validate color format
 */
export function isValidColor(color: string): boolean {
  // Hex color validation
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  // RGB/RGBA validation
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
  // HSL validation
  const hslRegex = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/;

  return hexRegex.test(color) || rgbRegex.test(color) || hslRegex.test(color);
}

/**
 * Convert any color format to hex
 */
export function colorToHex(color: string): string {
  if (color.startsWith("#")) return color;

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  // Handle hsl - convert to rgb first (simplified)
  // For full implementation, use a color library
  return color; // Fallback
}
