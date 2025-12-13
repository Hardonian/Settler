import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Comparison - Settler vs. Building In-House vs. Alternatives",
  description:
    "Compare Settler with building your own reconciliation system or using alternative solutions. See why companies choose Settler for faster time to value, lower costs, and high accuracy.",
  keywords: [
    "reconciliation comparison",
    "build vs buy",
    "reconciliation alternatives",
    "reconciliation cost comparison",
    "in-house vs API",
  ],
  canonical: "https://settler.dev/comparison",
});

export default function ComparisonLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
