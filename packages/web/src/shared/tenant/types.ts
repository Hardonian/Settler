/**
 * Tenant-related types
 */

export interface TenantBranding {
  id: string;
  tenantId: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  borderRadiusScale?: number | null;
  fontFamilyPrimary?: string | null;
  fontFamilySecondary?: string | null;
}

export interface TenantNavigationItem {
  label: string;
  href: string;
  type: "internal" | "external";
  iconKey?: string;
  children?: TenantNavigationItem[];
}

export interface TenantNavigation {
  id: string;
  tenantId: string;
  navItems: TenantNavigationItem[];
  footerItems: TenantNavigationItem[];
}

export interface TenantTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts: {
    primary?: string;
    secondary?: string;
  };
  borderRadius: number;
  logoUrl?: string;
  faviconUrl?: string;
}
