"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Skip to Main Content Link
 *
 * Provides keyboard users with a way to skip navigation and go directly to main content.
 * Hidden visually but accessible to screen readers and keyboard navigation.
 */
export function SkipToMainContent() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Focus the link when it becomes visible (on keyboard navigation)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !e.shiftKey && document.activeElement === document.body) {
        linkRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.querySelector("main, [role='main'], #main-content");
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      (mainContent as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      ref={linkRef}
      href="#main-content"
      onClick={handleClick}
      className={cn(
        "absolute left-4 top-4 z-[100]",
        "px-4 py-2",
        "bg-primary-600 text-white",
        "rounded-md shadow-lg",
        "font-medium",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "-translate-y-full focus:translate-y-0",
        "opacity-0 focus:opacity-100",
        "motion-reduce:transition-none"
      )}
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}
