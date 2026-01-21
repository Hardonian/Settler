/**
 * Tenant-Aware Navigation Component
 * 
 * Replaces hard-coded Navigation.tsx with tenant-aware version.
 * Reads from TenantNavigation.navItems and .footerItems.
 * Falls back to default if not configured.
 */

'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useTenantTheme } from "./TenantThemeProvider";
import { TenantNavigationItem } from "@/shared/tenant/types";

// Default navigation items (fallback)
const defaultNavigationItems: TenantNavigationItem[] = [
  { href: '/docs', label: 'Docs', type: 'internal' },
  { href: '/cookbooks', label: 'Cookbooks', type: 'internal' },
  { href: '/receipts', label: 'Receipts API', type: 'internal' },
  { href: '/feature-flags', label: 'Feature Flags', type: 'internal' },
  { href: '/console', label: 'Console', type: 'internal' },
  { href: '/pricing', label: 'Pricing', type: 'internal' },
  { href: '/enterprise', label: 'Enterprise', type: 'internal' },
  { href: '/community', label: 'Community', type: 'internal' },
  { href: '/support', label: 'Support', type: 'internal' },
  { href: '/playground', label: 'Playground', type: 'internal' },
];

interface TenantNavigationProps {
  navItems?: TenantNavigationItem[];
  logoUrl?: string;
  tenantName?: string;
}

export function TenantNavigation({
  navItems = defaultNavigationItems,
  logoUrl,
  tenantName = 'Settler',
}: TenantNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTenantTheme();

  const primaryColor = theme?.colors.primary || '#2563eb';

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50',
        'bg-background/80 backdrop-blur-lg',
        'border-b border-border'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className={cn(
              'flex items-center space-x-2',
              'transition-transform hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'rounded'
            )}
            aria-label={`${tenantName} homepage`}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${tenantName} logo`}
                width={128}
                height={32}
                className="h-8 w-auto"
                priority
              />
            ) : (
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  'bg-gradient-to-br'
                )}
                style={{
                  background: `linear-gradient(to bottom right, ${primaryColor}, ${theme?.colors.secondary || '#7c3aed'})`,
                }}
                aria-hidden="true"
              >
                <span className="text-white font-bold text-lg">
                  {tenantName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span
              className={cn('text-xl font-bold')}
              style={{
                background: `linear-gradient(to right, ${primaryColor}, ${theme?.colors.secondary || '#7c3aed'})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {tenantName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Desktop navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400',
                  'transition-colors duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'focus-visible:ring-offset-background',
                  'rounded px-2 py-1',
                  'motion-reduce:transition-none'
                )}
                style={{ ["--hover-color" as any]: primaryColor } as CSSProperties}
              >
                {item.label}
              </Link>
            ))}
            <DarkModeToggle />
            <Button
              asChild
              variant="default"
              size="default"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <Link href="/console/playground" aria-label={`Get started with ${tenantName}`}>
                Get Started
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'p-2 rounded-md',
                'text-muted-foreground hover:bg-muted',
                'transition-colors duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'focus-visible:ring-offset-background',
                'motion-reduce:transition-none'
              )}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              type="button"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className={cn(
              'md:hidden py-4 border-t border-border',
              'motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:fade-in-0',
              'motion-reduce:animate-none'
            )}
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <nav className="flex flex-col space-y-4" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400',
                    'transition-colors duration-200 ease-out',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-background',
                    'rounded px-2 py-1',
                    'motion-reduce:transition-none'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                asChild
                variant="default"
                size="default"
                className="w-full"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                <Link href="/console/playground" aria-label={`Get started with ${tenantName}`}>
                  Get Started
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </nav>
  );
}
