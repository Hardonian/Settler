'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

// Primary navigation items (always visible)
const primaryNavigationItems = [
  { href: '/console', label: 'Console' },
  { href: '/playground', label: 'Playground' },
  { href: '/docs', label: 'Docs' },
  { href: '/pricing', label: 'Pricing' },
];

// Secondary navigation items (in "More" menu on mobile)
const secondaryNavigationItems = [
  { href: '/cookbook', label: 'Cookbook' },
  { href: '/runbooks', label: 'Runbooks' },
  { href: '/schematics', label: 'Schematics' },
  { href: '/receipts', label: 'Receipts API' },
  { href: '/feature-flags', label: 'Feature Flags' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/community', label: 'Community' },
  { href: '/support', label: 'Support' },
];

// Combined for desktop (all items visible)
const navigationItems = [...primaryNavigationItems, ...secondaryNavigationItems];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const menu = menuRef.current;
    if (!menu) return;

    // Focus first focusable element when menu opens
    const timer = setTimeout(() => {
      const firstFocusable = menu.querySelector(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 100);

    // Trap focus within menu
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 w-full z-[100]',
          'bg-background/80 backdrop-blur-lg',
          'border-b border-border',
          'supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16 w-full min-h-[4rem]">
            <Link
              href="/"
              className={cn(
                'flex items-center space-x-2 flex-shrink-0',
                'transition-transform hover:scale-105',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'rounded'
              )}
              aria-label="Settler homepage"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  'bg-gradient-to-br from-primary-600 to-electric-indigo'
                )}
                aria-hidden="true"
              >
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className={cn(
                'text-xl font-bold whitespace-nowrap',
                'bg-gradient-to-r from-primary-600 to-electric-indigo bg-clip-text text-transparent'
              )}>
                Settler
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-shrink-0" aria-label="Desktop navigation">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-sm lg:text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap',
                      isActive && 'text-primary-600 dark:text-primary-400 font-medium',
                      'transition-colors duration-200 ease-out',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'focus-visible:ring-offset-background',
                      'rounded px-2 py-1',
                      'motion-reduce:transition-none'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="ml-2">
                <DarkModeToggle />
              </div>
              <Button
                asChild
                variant="default"
                size="default"
                className="ml-2"
              >
                <Link href="/console/playground" aria-label="Get started with Settler">
                  Get Started
                </Link>
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2 flex-shrink-0">
              <DarkModeToggle />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      'p-2 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center',
                      'text-muted-foreground hover:bg-muted',
                      'transition-colors duration-200 ease-out',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'focus-visible:ring-offset-background',
                      'motion-reduce:transition-none'
                    )}
                    aria-label="Open menu"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-menu"
                    type="button"
                  >
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-sm overflow-y-auto"
                  id="mobile-menu"
                >
                  <div ref={menuRef} className="flex flex-col space-y-6 pt-6">
                    {/* Primary Navigation */}
                    <nav className="flex flex-col space-y-2" aria-label="Mobile navigation">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Main
                      </p>
                      {primaryNavigationItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400',
                              isActive && 'text-primary-600 dark:text-primary-400 font-medium',
                              'transition-colors duration-200 ease-out',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              'focus-visible:ring-offset-background',
                              'rounded px-3 py-2 min-h-[44px] flex items-center',
                              'motion-reduce:transition-none'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                    
                    {/* Secondary Navigation */}
                    <nav className="flex flex-col space-y-2 pt-4 border-t border-border" aria-label="Mobile secondary navigation">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        More
                      </p>
                      {secondaryNavigationItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400',
                              isActive && 'text-primary-600 dark:text-primary-400 font-medium',
                              'transition-colors duration-200 ease-out',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              'focus-visible:ring-offset-background',
                              'rounded px-3 py-2 min-h-[44px] flex items-center',
                              'motion-reduce:transition-none'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                    
                    <Button
                      asChild
                      variant="default"
                      size="default"
                      className="w-full mt-4 min-h-[44px]"
                    >
                      <Link href="/console/playground" aria-label="Get started with Settler">
                        Get Started
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 supports-[padding:max(0px)]:h-[calc(4rem+env(safe-area-inset-top))]" aria-hidden="true" />
    </>
  );
}
