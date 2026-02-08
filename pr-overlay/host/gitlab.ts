import React from "react";
import { createRoot } from "react-dom/client";

import { ReconRun } from "../../contracts/recon";
import { detectReconChange, ReconChangeDetectorOptions } from "../ReconChangeDetector";
import { SampleBeforeAfterPanel } from "../SampleBeforeAfterPanel";

type GitlabOverlayOptions = ReconChangeDetectorOptions & {
  changedFiles: string[];
  before: ReconRun;
  after: ReconRun;
  mountId?: string;
};

export const mountGitlabOverlay = ({
  changedFiles,
  before,
  after,
  mountId = "settler-recon-overlay",
  ...detectorOptions
}: GitlabOverlayOptions) => {
  if (typeof document === "undefined") {
    return { mounted: false, ...detectReconChange(changedFiles, detectorOptions) };
  }

  const detection = detectReconChange(changedFiles, detectorOptions);
  if (!detection.changed) {
    return { mounted: false, ...detection };
  }

  const container = document.getElementById(mountId) ?? document.createElement("div");
  container.id = mountId;
  container.style.margin = "16px 0";

  if (!container.parentElement) {
    const target =
      document.querySelector("#merge-requests, .merge-request-details") ?? document.body;
    target.prepend(container);
  }

  const root = createRoot(container);
  root.render(React.createElement(SampleBeforeAfterPanel, { before, after }));

  return { mounted: true, ...detection };
};
