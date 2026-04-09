/**
 * AnnouncementBanner
 *
 * Renders a runtime-configured banner (public config only).
 * Safe to include globally in layout; fails closed (renders nothing) if disabled.
 */

"use client";

import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { useRuntimeUiConfig } from "@/lib/runtime-ui-config/client";

export function AnnouncementBanner() {
  const { config } = useRuntimeUiConfig();
  const a = config.copy.announcement;

  if (!a.enabled || !a.message) return null;

  const variant = a.tone === "warning" ? "warning" : a.tone === "success" ? "success" : "info";

  return (
    <Banner variant={variant} dismissible>
      <div className="space-y-1">
        <div className="text-sm leading-relaxed">{a.message}</div>
        {a.linkHref && a.linkLabel && (
          <Link href={a.linkHref} className="text-sm underline underline-offset-4">
            {a.linkLabel}
          </Link>
        )}
      </div>
    </Banner>
  );
}
