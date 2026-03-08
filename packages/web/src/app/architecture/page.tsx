import { Metadata } from "next";
import ArchitectureOverview from "@/components/stitch-import/ArchitectureOverview";

export const metadata: Metadata = {
  title: "Architecture - Settler",
  description:
    "Settler's open source architecture: deterministic reconciliation engine, evidence hash chain, tenant isolation model, and replay infrastructure.",
};

export default function ArchitecturePage() {
  return <ArchitectureOverview />;
}
