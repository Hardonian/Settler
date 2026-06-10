"use client";

import { AnnouncementBanner } from "@/components/polish/AnnouncementBanner";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { RuntimeUiOptionalFeatures } from "@/components/polish/RuntimeUiOptionalFeatures";
import { useReferralTracking } from "@/hooks/use-referral-tracking";

export function GlobalClientShell() {
  useReferralTracking();

  return (
    <>
      <AnnouncementBanner />
      <PwaInstallPrompt />
      <ToastContainer />
      <RuntimeUiOptionalFeatures />
    </>
  );
}
