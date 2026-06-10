"use client";

import { Suspense } from "react";
import { AnnouncementBanner } from "@/components/polish/AnnouncementBanner";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { RuntimeUiOptionalFeatures } from "@/components/polish/RuntimeUiOptionalFeatures";
import { useReferralTracking } from "@/hooks/use-referral-tracking";

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
