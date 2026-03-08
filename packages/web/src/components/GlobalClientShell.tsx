"use client";

import { AnnouncementBanner } from "@/components/polish/AnnouncementBanner";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { RuntimeUiOptionalFeatures } from "@/components/polish/RuntimeUiOptionalFeatures";

export function GlobalClientShell() {
  return (
    <>
      <AnnouncementBanner />
      <PwaInstallPrompt />
      <ToastContainer />
      <RuntimeUiOptionalFeatures />
    </>
  );
}
