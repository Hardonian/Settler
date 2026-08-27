"use client";

import dynamic from "next/dynamic";

const ReconciliationFlow = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.ReconciliationFlow),
  { ssr: false, loading: () => <div className="min-h-80" aria-hidden="true" /> },
);
const VisualGrid = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.VisualGrid),
  { ssr: false, loading: () => <div className="min-h-72" aria-hidden="true" /> },
);
const AdapterConnectionMap = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.AdapterConnectionMap),
  { ssr: false, loading: () => <div className="min-h-80" aria-hidden="true" /> },
);
const ExceptionTriageVisual = dynamic(
  () => import("@/components/site/infographics").then((mod) => mod.ExceptionTriageVisual),
  { ssr: false, loading: () => <div className="min-h-80" aria-hidden="true" /> },
);

export { AdapterConnectionMap, ExceptionTriageVisual, ReconciliationFlow, VisualGrid };
