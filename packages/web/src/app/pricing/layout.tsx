import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generatePricingMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePricingMetadata();

export default function PricingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
