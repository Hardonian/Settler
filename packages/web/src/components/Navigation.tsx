"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navigationItems = [
  { href: "/docs", label: "Docs" },
  { href: "/cookbooks", label: "Cookbooks" },
  { href: "/pricing", label: "Pricing" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/community", label: "Community" },
  { href: "/support", label: "Support" },
  { href: "/playground", label: "Playground" },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Focus first menu item when menu opens
      setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  // Trap focus within mobile menu when open
  useEffect(() => {
    if (!mobileMenuOpen || !mobileMenuRef.current) return;

    const menu = mobileMenuRef.current;
    const focusableElements = menu.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

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

    menu.addEventListener("keydown", handleTab);
    return () => {
      menu.removeEventListener("keydown", handleTab);
    };
  }, [mobileMenuOpen]);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50",
        "bg-background/80 backdrop-blur-lg",
        "border-b border-border"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className={cn(
              "flex items-center space-x-2",
              "transition-transform hover:scale-105",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "rounded"
            )}
            aria-label="Settler homepage"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-primary-600 to-electric-indigo"
              )}
              aria-hidden="true"
            >
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span
              className={cn(
                "text-xl font-bold",
                "bg-gradient-to-r from-primary-600 to-electric-indigo bg-clip-text text-transparent"
              )}
            >
              Settler
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Desktop navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400",
                  "transition-colors duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-background",
                  "rounded px-2 py-1",
                  "motion-reduce:transition-none"
                )}
              >
                {item.label}
              </Link>
            ))}
            <DarkModeToggle />
            <Button asChild variant="default" size="default">
              <Link href="/signup" aria-label="Start free trial of Settler">
                Start Free Trial
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "p-2 rounded-md",
                "text-muted-foreground hover:bg-muted",
                "transition-colors duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "focus-visible:ring-offset-background",
                "motion-reduce:transition-none"
              )}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
            ref={mobileMenuRef}
            id="mobile-menu"
            className={cn(
              "md:hidden py-4 border-t border-border",
              "motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:fade-in-0",
              "motion-reduce:animate-none"
            )}
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <nav className="flex flex-col space-y-4" aria-label="Mobile navigation">
              {navigationItems.map((item, index) => (
                <Link
                  key={item.href}
                  ref={index === 0 ? firstMenuItemRef : undefined}
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400",
                    "transition-colors duration-200 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "focus-visible:ring-offset-background",
                    "rounded px-2 py-1",
                    "motion-reduce:transition-none"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  role="menuitem"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild variant="default" size="default" className="w-full" role="menuitem">
                <Link href="/signup" aria-label="Start free trial of Settler">
                  Start Free Trial
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </nav>
  );
}
