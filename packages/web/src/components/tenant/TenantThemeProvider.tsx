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
    const root = document.documentElement;
    
    root.style.setProperty('--tenant-primary-color', theme.colors.primary);
    root.style.setProperty('--tenant-secondary-color', theme.colors.secondary);
    root.style.setProperty('--tenant-accent-color', theme.colors.accent);
    root.style.setProperty('--tenant-background-color', theme.colors.background);
    root.style.setProperty('--tenant-border-radius', `${theme.borderRadius}rem`);
    
    if (theme.fonts.primary) {
      root.style.setProperty('--tenant-font-primary', theme.fonts.primary);
    }
    if (theme.fonts.secondary) {
      root.style.setProperty('--tenant-font-secondary', theme.fonts.secondary);
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
