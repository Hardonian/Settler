"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBanner } from "@/components/polish/AnnouncementBanner";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { useReferralTracking } from "@/hooks/use-referral-tracking";
import { useGlobalAnalyticsTracker } from "@/hooks/use-analytics";

// These widgets are conditional and fixed-position. Keep them out of the
// critical route chunk; they load only after hydration when their feature flag
// or browser event makes them relevant.
const PwaInstallPrompt = dynamic(
  () => import("@/components/PwaInstallPrompt").then((mod) => mod.PwaInstallPrompt),
  { ssr: false }
);
const RuntimeUiOptionalFeatures = dynamic(
  () =>
    import("@/components/polish/RuntimeUiOptionalFeatures").then(
      (mod) => mod.RuntimeUiOptionalFeatures
    ),
  { ssr: false }
);

function ClientTrackers() {
  useReferralTracking();
  useGlobalAnalyticsTracker();
  return null;
}

function ThemeWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    const applyTheme = () => {
      try {
        let preferredTheme: "dark" | "light" = "light";
        const stored = localStorage.getItem("theme");
        if (stored === "dark" || stored === "light") {
          preferredTheme = stored;
        } else {
          const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
          if (match && (match[1] === "dark" || match[1] === "light")) {
            preferredTheme = match[1] as "dark" | "light";
          } else if (
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
          ) {
            preferredTheme = "dark";
          }
        }

        const root = document.documentElement;
        if (preferredTheme === "dark") {
          if (!root.classList.contains("dark")) {
            root.classList.add("dark");
          }
          root.style.colorScheme = "dark";
        } else {
          if (root.classList.contains("dark")) {
            root.classList.remove("dark");
          }
          root.style.colorScheme = "light";
        }
      } catch {}
    };

    applyTheme();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") applyTheme();
    };
    const handleThemeChange = () => applyTheme();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("settler-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("settler-theme-change", handleThemeChange);
    };
  }, [pathname]);

  return null;
}

export function GlobalClientShell() {
  return (
    <>
      <ThemeWatcher />
      <Suspense fallback={null}>
        <ClientTrackers />
      </Suspense>
      <AnnouncementBanner />
      <PwaInstallPrompt />
      <ToastContainer />
      <RuntimeUiOptionalFeatures />
    </>
  );
}
