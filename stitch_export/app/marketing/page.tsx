import React from "react";
import { HeroSection } from "@/stitch_export/components/marketing/hero";
import { TrustRow } from "@/stitch_export/components/marketing/trust-row";
import { FeatureGrid } from "@/stitch_export/components/marketing/feature-grid";

export default function MarketingHome() {
  return (
    <section className="py-16 px-6 text-center max-w-6xl mx-auto">
      <HeroSection />
      <TrustRow />
      <FeatureGrid />
    </section>
  );
}
