'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Primary navigation items (always visible on desktop)
const getPrimaryNavigationItems = (isAuthenticated: boolean) => {
  const items = [
    { href: '/playground', label: 'Playground' },
    { href: '/docs', label: 'Docs' },
    { href: '/pricing', label: 'Pricing' },
  ];
  
  // Only show Console if user is authenticated
  if (isAuthenticated) {
    items.unshift({ href: '/console', label: 'Console' });
  }
  
  return items;
};

// Secondary navigation items (in "More" dropdown on desktop, accordion on mobile)
const secondaryNavigationItems = [
  { href: '/cookbooks', label: 'Cookbooks' },
  { href: '/runbooks', label: 'Runbooks' },
  { href: '/schematics', label: 'Schematics' },
  { href: '/receipts', label: 'Receipts API' },
  { href: '/feature-flags', label: 'Feature Flags' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/community', label: 'Community' },
  { href: '/support', label: 'Support' },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, loading } = useAuth();
  
  // Get navigation items based on auth status
  const primaryNavigationItems = getPrimaryNavigationItems(isAuthenticated);
  
  // Close "More" menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);
  
  // Close "More" menu on route change
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

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
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 flex-shrink-0" aria-label="Desktop navigation">
              {loading ? (
                // Show placeholder while loading auth state
                <>
                  {['Playground', 'Docs', 'Pricing'].map((label) => (
                    <div
                      key={label}
                      className="text-sm xl:text-base text-muted-foreground whitespace-nowrap rounded px-2 py-1"
                      aria-hidden="true"
                    >
                      {label}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Primary navigation items */}
                  {primaryNavigationItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'text-sm xl:text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap',
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
                  
                  {/* More dropdown menu */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      className={cn(
                        'text-sm xl:text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap',
                        'transition-colors duration-200 ease-out',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'focus-visible:ring-offset-background',
                        'rounded px-2 py-1 flex items-center gap-1',
                        'motion-reduce:transition-none',
                        moreMenuOpen && 'text-primary-600 dark:text-primary-400'
                      )}
                      aria-expanded={moreMenuOpen}
                      aria-haspopup="true"
                      aria-label="More navigation options"
                    >
                      More
                      <ChevronDown className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        moreMenuOpen && 'rotate-180'
                      )} aria-hidden="true" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {moreMenuOpen && (
                      <div
                        className="absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-xl py-2 z-[200] backdrop-blur-sm"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        {secondaryNavigationItems.map((item) => {
                          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'block px-4 py-2.5 text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 hover:bg-accent',
                                isActive && 'text-primary-600 dark:text-primary-400 font-medium bg-accent/50',
                                'transition-colors duration-150 ease-out',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                              )}
                              role="menuitem"
                              onClick={() => setMoreMenuOpen(false)}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Right side actions */}
              <div className="flex items-center gap-3 ml-2">
                <DarkModeToggle />
                <Button
                  asChild
                  variant="default"
                  size="default"
                  className="whitespace-nowrap"
                >
                  <Link href="/console/playground" aria-label="Get started with Settler">
                    Get Started
                  </Link>
                </Button>
              </div>
            </nav>
            
            {/* Tablet Navigation (md breakpoint) - Simplified */}
            <nav className="hidden md:flex lg:hidden items-center gap-4 flex-shrink-0" aria-label="Tablet navigation">
              {loading ? (
                <>
                  {['Playground', 'Docs', 'Pricing'].map((label) => (
                    <div
                      key={label}
                      className="text-sm text-muted-foreground whitespace-nowrap rounded px-2 py-1"
                      aria-hidden="true"
                    >
                      {label}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {primaryNavigationItems.slice(0, 3).map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap',
                          isActive && 'text-primary-600 dark:text-primary-400 font-medium',
                          'transition-colors duration-200 ease-out',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          'rounded px-2 py-1'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}
              <div className="flex items-center gap-2 ml-2">
                <DarkModeToggle />
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Link href="/console/playground">Get Started</Link>
                </Button>
              </div>
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
                  <div ref={menuRef} className="flex flex-col space-y-8 pt-8 pb-6">
                    {/* Primary Navigation */}
                    <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                        Main
                      </p>
                      {loading ? (
                        // Show placeholder while loading
                        <>
                          {['Playground', 'Docs', 'Pricing'].map((label) => (
                            <div
                              key={label}
                              className="text-base text-muted-foreground rounded-lg px-4 py-3 min-h-[48px] flex items-center"
                              aria-hidden="true"
                            >
                              {label}
                            </div>
                          ))}
                        </>
                      ) : (
                        primaryNavigationItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400',
                              isActive && 'text-primary-600 dark:text-primary-400 font-medium bg-accent/50',
                              'transition-colors duration-200 ease-out',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              'focus-visible:ring-offset-background',
                              'rounded-lg px-4 py-3 min-h-[48px] flex items-center',
                              'hover:bg-accent/50',
                              'motion-reduce:transition-none'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {item.label}
                          </Link>
                        );
                      })
                      )}
                    </nav>
                    
                    {/* Secondary Navigation */}
                    <nav className="flex flex-col space-y-1 pt-6 border-t border-border" aria-label="Mobile secondary navigation">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
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
                              isActive && 'text-primary-600 dark:text-primary-400 font-medium bg-accent/50',
                              'transition-colors duration-200 ease-out',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              'focus-visible:ring-offset-background',
                              'rounded-lg px-4 py-3 min-h-[48px] flex items-center',
                              'hover:bg-accent/50',
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
                    
                    <div className="pt-4 border-t border-border">
                      <Button
                        asChild
                        variant="default"
                        size="lg"
                        className="w-full min-h-[48px] text-base font-semibold"
                      >
                        <Link href="/console/playground" aria-label="Get started with Settler">
                          Get Started
                        </Link>
                      </Button>
                    </div>
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
