import { Metadata } from "next";
import { generatePricingMetadata } from "@/lib/metadata";

export const metadata: Metadata = generatePricingMetadata();

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
