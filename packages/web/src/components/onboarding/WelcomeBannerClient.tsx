/**
 * Client wrapper for Welcome Banner
 *
 * Handles URL param checking and localStorage state
 */

"use client";

import { Suspense } from "react";
import { WelcomeBanner } from "./WelcomeBanner";

export function WelcomeBannerClient({ userName }: { userName?: string }) {
  return (
    <Suspense fallback={null}>
      <WelcomeBanner userName={userName} />
    </Suspense>
  );
}
