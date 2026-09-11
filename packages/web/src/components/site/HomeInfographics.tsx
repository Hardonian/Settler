"use client";

import dynamic from "next/dynamic";

const ReconciliationFlow = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.ReconciliationFlow),
  { ssr: false, loading: () => <div className="min-h-80" aria-hidden="true" /> }
);
const VisualGrid = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.VisualGrid),
  { ssr: false, loading: () => <div className="min-h-72" aria-hidden="true" /> }
);
const AdapterConnectionMap = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.AdapterConnectionMap),
  { ssr: false, loading: () => <div className="min-h-80" aria-hidden="true" /> }
);
const ExceptionTriageVisual = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.ExceptionTriageVisual),
  { ssr: false, loading: () => <div className="min-h-80" aria-hidden="true" /> }
);
const InteractiveHeroEngine = dynamic(
  () => import("@/components/site/InteractiveHeroEngine").then((mod) => mod.InteractiveHeroEngine),
  {
    ssr: false,
    loading: () => (
      <div className="relative aspect-square w-full max-w-[540px] rounded-3xl border border-slate-200 dark:border-white/10 bg-card/60 animate-pulse" />
    ),
  }
);
const BilateralSettlementVisualizer = dynamic(
  () =>
    import("@/components/site/BilateralSettlementVisualizer").then(
      (mod) => mod.BilateralSettlementVisualizer
    ),
  {
    ssr: false,
    loading: () => <div className="min-h-96 w-full rounded-3xl bg-card/60 animate-pulse" />,
  }
);
const EnterpriseRoiCalculator = dynamic(
  () =>
    import("@/components/site/EnterpriseRoiCalculator").then((mod) => mod.EnterpriseRoiCalculator),
  {
    ssr: false,
    loading: () => <div className="min-h-96 w-full rounded-3xl bg-card/60 animate-pulse" />,
  }
);
const AmbientLightOrbs = dynamic(
  () => import("@/components/site/AmbientLightOrbs").then((mod) => mod.AmbientLightOrbs),
  { ssr: false }
);

export {
  AdapterConnectionMap,
  AmbientLightOrbs,
  BilateralSettlementVisualizer,
  EnterpriseRoiCalculator,
  ExceptionTriageVisual,
  InteractiveHeroEngine,
  ReconciliationFlow,
  VisualGrid,
};
