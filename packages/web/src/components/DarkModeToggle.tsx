"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
    setMounted(true);
  }, []);

  const persistTheme = (theme: "dark" | "light") => {
    localStorage.setItem("theme", theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      persistTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      persistTheme("light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="rounded-full"
      aria-label="Toggle dark mode"
      // Suppress hydration mismatch — icon is determined client-side only
      suppressHydrationWarning
    >
      {mounted ? (
        darkMode ? (
          <Sun className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" aria-hidden="true" />
        )
      ) : (
        // Pre-hydration: render a stable placeholder that matches the server HTML
        // The root layout applies the correct theme class before React hydrates,
        // so we render an invisible placeholder to avoid layout shift.
        <span className="h-4 w-4 block" aria-hidden="true" />
      )}
    </Button>
  );
}
