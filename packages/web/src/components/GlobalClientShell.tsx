"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { AnnouncementBanner } from "@/components/polish/AnnouncementBanner";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { useReferralTracking } from "@/hooks/use-referral-tracking";

// These widgets are conditional and fixed-position. Keep them out of the
// critical route chunk; they load only after hydration when their feature flag
// or browser event makes them relevant.
const PwaInstallPrompt = dynamic(
  () => import("@/components/PwaInstallPrompt").then((mod) => mod.PwaInstallPrompt),
  { ssr: false },
);
const RuntimeUiOptionalFeatures = dynamic(
  () => import("@/components/polish/RuntimeUiOptionalFeatures").then((mod) => mod.RuntimeUiOptionalFeatures),
  { ssr: false },
);

function ReferralTracker() {
  useReferralTracking();
  return null;
}

export function GlobalClientShell() {
  return (
    <>
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>
      <AnnouncementBanner />
      <PwaInstallPrompt />
      <ToastContainer />
      <RuntimeUiOptionalFeatures />
    </>
  );
}
