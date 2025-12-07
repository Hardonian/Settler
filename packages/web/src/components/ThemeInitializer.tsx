"use client";

import { useEffect } from "react";

/**
 * Theme Initializer Component
 *
 * Safely initializes theme from localStorage before React hydration
 * to prevent flash of incorrect theme.
 */
export function ThemeInitializer() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return null;
}
