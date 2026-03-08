"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, ChevronDown } from "lucide-react";
import { SETTLER_IMAGES } from "@/lib/images/image-config";

// Primary navigation items (always visible on desktop)
const siteMode = process.env.NEXT_PUBLIC_SITE_MODE || "oss";

const primaryNavigationItems = [
  { href: "/platform", label: "Platform" },
  ...(siteMode === "enterprise" ? [{ href: "/enterprise", label: "Enterprise" }] : []),
  { href: "/pricing", label: "Pricing" },
  { href: "/security-and-audit", label: "Security" },
  { href: "/docs", label: "Docs" },
];

// Feature pages exposed in a dropdown
const featureNavigationItems = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/replay-lab", label: "Replay Lab" },
  { href: "/proof-explorer", label: "Proof Explorer" },
];

// Secondary navigation items (in "More" dropdown on desktop, accordion on mobile)
const secondaryNavigationItems = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const hasSecondaryNavigationItems = secondaryNavigationItems.length > 0;
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const featuresMenuRef = useRef<HTMLDivElement>(null);

  // Close "More" menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreMenuOpen]);

  // Close Features menu when clicking outside
  useEffect(() => {
    if (!featuresMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (featuresMenuRef.current && !featuresMenuRef.current.contains(event.target as Node)) {
        setFeaturesMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [featuresMenuOpen]);

  // Close dropdowns on route change
  useEffect(() => {
    setMoreMenuOpen(false);
    setFeaturesMenuOpen(false);
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
      if (e.key !== "Tab") return;

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

    document.addEventListener("keydown", handleTabKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-[100]",
          "bg-background/80 backdrop-blur-lg",
          "border-b border-border",
          "supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16 w-full min-h-[4rem]">
            <Link
              href="/"
              className={cn(
                "flex items-center flex-shrink-0",
                "transition-transform hover:scale-105",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "rounded relative group"
              )}
              aria-label="Settler homepage"
            >
              <div className="relative overflow-hidden rounded">
                {/* Light mode logo */}
                <Image
                  src="/logo.svg"
                  alt="Settler Logo"
                  width={130}
                  height={34}
                  className="h-8 w-auto relative z-10 transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-lg dark:hidden"
                  priority
                />
                {/* Dark mode logo */}
                <Image
                  src="/logo-dark.svg"
                  alt="Settler Logo"
                  width={130}
                  height={34}
                  className="h-8 w-auto relative z-10 transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-lg hidden dark:block"
                  priority
                />
                {/* Shine effect overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shine" />
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-6 xl:gap-8 flex-shrink-0"
              aria-label="Desktop navigation"
            >
              <>
                {/* Primary navigation items */}
                {primaryNavigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-sm xl:text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap",
                        isActive && "text-primary-600 dark:text-primary-400 font-medium",
                        "transition-colors duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "focus-visible:ring-offset-background",
                        "rounded px-2 py-1",
                        "motion-reduce:transition-none"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {/* Features dropdown */}
                <div className="relative" ref={featuresMenuRef}>
                  <button
                    type="button"
                    onClick={() => setFeaturesMenuOpen(!featuresMenuOpen)}
                    className={cn(
                      "text-sm xl:text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap",
                      "transition-colors duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "focus-visible:ring-offset-background",
                      "rounded px-2 py-1 flex items-center gap-1",
                      "motion-reduce:transition-none",
                      featuresMenuOpen && "text-primary-600 dark:text-primary-400"
                    )}
                    aria-expanded={featuresMenuOpen}
                    aria-haspopup="true"
                    aria-label="Explore features navigation"
                  >
                    Explore
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        featuresMenuOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {featuresMenuOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-52 bg-background border border-border rounded-lg shadow-lg py-2 z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      {featureNavigationItems.map((item) => {
                        const isActive =
                          pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "block px-4 py-2 text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 hover:bg-accent",
                              isActive &&
                                "text-primary-600 dark:text-primary-400 font-medium bg-accent/50",
                              "transition-colors duration-150 ease-out",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            )}
                            role="menuitem"
                            onClick={() => setFeaturesMenuOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* More dropdown menu */}
                {hasSecondaryNavigationItems && (
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      className={cn(
                        "text-sm xl:text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap",
                        "transition-colors duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "focus-visible:ring-offset-background",
                        "rounded px-2 py-1 flex items-center gap-1",
                        "motion-reduce:transition-none",
                        moreMenuOpen && "text-primary-600 dark:text-primary-400"
                      )}
                      aria-expanded={moreMenuOpen}
                      aria-haspopup="true"
                      aria-label="More navigation options"
                    >
                      More
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          moreMenuOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Dropdown menu */}
                    {moreMenuOpen && (
                      <div
                        className="absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2 z-50"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        {secondaryNavigationItems.map((item) => {
                          const isActive =
                            pathname === item.href || pathname?.startsWith(item.href + "/");
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "block px-4 py-2 text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 hover:bg-accent",
                                isActive &&
                                  "text-primary-600 dark:text-primary-400 font-medium bg-accent/50",
                                "transition-colors duration-150 ease-out",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                              )}
                              role="menuitem"
                              onClick={() => setMoreMenuOpen(false)}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>

              {/* Right side actions */}
              <div className="flex items-center gap-3 ml-2">
                <DarkModeToggle />
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Login
                </Link>
                <Button asChild variant="default" size="default" className="whitespace-nowrap">
                  <Link href="/signup" aria-label="Get started with Settler">
                    Get Started
                  </Link>
                </Button>
              </div>
            </nav>

            {/* Tablet Navigation (md breakpoint) - Simplified */}
            <nav
              className="hidden md:flex lg:hidden items-center gap-4 flex-shrink-0"
              aria-label="Tablet navigation"
            >
              {primaryNavigationItems.slice(0, 3).map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 whitespace-nowrap",
                      isActive && "text-primary-600 dark:text-primary-400 font-medium",
                      "transition-colors duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "rounded px-2 py-1"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-2 ml-2">
                <DarkModeToggle />
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Login
                </Link>
                <Button asChild variant="default" size="sm" className="whitespace-nowrap">
                  <Link href="/signup">Get Started</Link>
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
                      "p-2 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center",
                      "text-muted-foreground hover:bg-muted",
                      "transition-colors duration-200 ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "focus-visible:ring-offset-background",
                      "motion-reduce:transition-none"
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
                      {primaryNavigationItems.map((item) => {
                        const isActive =
                          pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400",
                              isActive &&
                                "text-primary-600 dark:text-primary-400 font-medium bg-accent/50",
                              "transition-colors duration-200 ease-out",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              "focus-visible:ring-offset-background",
                              "rounded-lg px-4 py-3 min-h-[48px] flex items-center",
                              "hover:bg-accent/50",
                              "motion-reduce:transition-none"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Features Navigation */}
                    <nav
                      className="flex flex-col space-y-1 pt-6 border-t border-border"
                      aria-label="Mobile features navigation"
                    >
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                        Explore
                      </p>
                      {featureNavigationItems.map((item) => {
                        const isActive =
                          pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400",
                              isActive &&
                                "text-primary-600 dark:text-primary-400 font-medium bg-accent/50",
                              "transition-colors duration-200 ease-out",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              "focus-visible:ring-offset-background",
                              "rounded-lg px-4 py-3 min-h-[48px] flex items-center",
                              "hover:bg-accent/50",
                              "motion-reduce:transition-none"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Secondary Navigation */}
                    {hasSecondaryNavigationItems && (
                      <nav
                        className="flex flex-col space-y-1 pt-6 border-t border-border"
                        aria-label="Mobile secondary navigation"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                          More
                        </p>
                        {secondaryNavigationItems.map((item) => {
                          const isActive =
                            pathname === item.href || pathname?.startsWith(item.href + "/");
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "text-base text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400",
                                isActive &&
                                  "text-primary-600 dark:text-primary-400 font-medium bg-accent/50",
                                "transition-colors duration-200 ease-out",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                "focus-visible:ring-offset-background",
                                "rounded-lg px-4 py-3 min-h-[48px] flex items-center",
                                "hover:bg-accent/50",
                                "motion-reduce:transition-none"
                              )}
                              onClick={() => setMobileMenuOpen(false)}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </nav>
                    )}

                    <div className="pt-4 border-t border-border">
                      <Button
                        asChild
                        variant="default"
                        size="lg"
                        className="w-full min-h-[48px] text-base font-semibold"
                      >
                        <Link href="/signup" aria-label="Get started with Settler">
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
      <div
        className="h-16 supports-[padding:max(0px)]:h-[calc(4rem+env(safe-area-inset-top))]"
        aria-hidden="true"
      />
    </>
  );
}
