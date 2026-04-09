/**
 * Client wrapper for Guided Tour
 *
 * Handles client-side logic and state management.
 */

"use client";

import { Suspense } from "react";
import { GuidedTour } from "./GuidedTour";

export function GuidedTourClient() {
  return (
    <Suspense fallback={null}>
      <GuidedTour />
    </Suspense>
  );
}
