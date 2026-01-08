/**
 * Tenant Theme Provider
 * 
 * Provides tenant-specific theme tokens (colors, fonts) via React Context.
 * Applies CSS variables or Tailwind classes dynamically.
 */

'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { TenantTheme } from '@/shared/tenant/types';

interface TenantThemeContextValue {
  theme: TenantTheme | null;
  tenantId: string | null;
  tenantSlug: string | null;
}

const TenantThemeContext = createContext<TenantThemeContextValue>({
  theme: null,
  tenantId: null,
  tenantSlug: null,
});

export function useTenantTheme() {
  return useContext(TenantThemeContext);
}

interface TenantThemeProviderProps {
  children: React.ReactNode;
  theme: TenantTheme | null;
  tenantId: string | null;
  tenantSlug: string | null;
}

export function TenantThemeProvider({
  children,
  theme,
  tenantId,
  tenantSlug,
}: TenantThemeProviderProps) {
  useEffect(() => {
    if (!theme) return;

    // Apply CSS variables for tenant theme
    // Integrate with existing token system by mapping to HSL format
    const root = document.documentElement;
    
    // Convert hex colors to HSL for compatibility with existing token system
    const hexToHsl = (hex: string): string => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    
    // Set tenant-specific variables
    root.style.setProperty('--tenant-primary-color', theme.colors.primary);
    root.style.setProperty('--tenant-secondary-color', theme.colors.secondary);
    root.style.setProperty('--tenant-accent-color', theme.colors.accent);
    root.style.setProperty('--tenant-background-color', theme.colors.background);
    root.style.setProperty('--tenant-border-radius', `${theme.borderRadius}rem`);
    
    // Map tenant colors to existing token system (override primary/accent if tenant has custom)
    // This allows existing components to automatically use tenant colors
    if (theme.colors.primary) {
      root.style.setProperty('--tenant-primary-hsl', hexToHsl(theme.colors.primary));
      // Override primary-600 for buttons, links, etc.
      root.style.setProperty('--primary-600', theme.colors.primary);
    }
    
    if (theme.colors.accent) {
      root.style.setProperty('--tenant-accent-hsl', hexToHsl(theme.colors.accent));
      // Map to electric-cyan for accent elements
      root.style.setProperty('--electric-cyan', theme.colors.accent);
    }
    
    if (theme.colors.secondary) {
      root.style.setProperty('--tenant-secondary-hsl', hexToHsl(theme.colors.secondary));
      // Map to electric-purple for secondary elements
      root.style.setProperty('--electric-purple', theme.colors.secondary);
    }
    
    if (theme.fonts.primary) {
      root.style.setProperty('--tenant-font-primary', theme.fonts.primary);
      root.style.setProperty('--font-primary', theme.fonts.primary);
    }
    if (theme.fonts.secondary) {
      root.style.setProperty('--tenant-font-secondary', theme.fonts.secondary);
      root.style.setProperty('--font-secondary', theme.fonts.secondary);
    }

    // Apply favicon if provided
    if (theme.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = theme.faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = theme.faviconUrl;
        document.head.appendChild(newLink);
      }
    }

    return () => {
      // Cleanup: reset to defaults
      root.style.removeProperty('--tenant-primary-color');
      root.style.removeProperty('--tenant-secondary-color');
      root.style.removeProperty('--tenant-accent-color');
      root.style.removeProperty('--tenant-background-color');
      root.style.removeProperty('--tenant-border-radius');
      root.style.removeProperty('--tenant-font-primary');
      root.style.removeProperty('--tenant-font-secondary');
      root.style.removeProperty('--tenant-primary-hsl');
      root.style.removeProperty('--tenant-secondary-hsl');
      root.style.removeProperty('--tenant-accent-hsl');
      root.style.removeProperty('--primary-600');
      root.style.removeProperty('--electric-cyan');
      root.style.removeProperty('--electric-purple');
      root.style.removeProperty('--font-primary');
      root.style.removeProperty('--font-secondary');
    };
  }, [theme]);

  return (
    <TenantThemeContext.Provider value={{ theme, tenantId, tenantSlug }}>
      {children}
    </TenantThemeContext.Provider>
  );
}

/**
 * Convert TenantBranding to TenantTheme
 */
export function brandingToTheme(branding: {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  borderRadiusScale?: number | null;
  fontFamilyPrimary?: string | null;
  fontFamilySecondary?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}): TenantTheme {
  return {
    colors: {
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      accent: branding.accentColor,
      background: branding.backgroundColor,
    },
    fonts: {
      primary: branding.fontFamilyPrimary || undefined,
      secondary: branding.fontFamilySecondary || undefined,
    },
    borderRadius: branding.borderRadiusScale ?? 1.0,
    logoUrl: branding.logoUrl || undefined,
    faviconUrl: branding.faviconUrl || undefined,
  };
}
