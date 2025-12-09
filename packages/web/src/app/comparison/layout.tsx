import { Metadata } from "next";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Comparison - Settler vs. Building In-House vs. Alternatives",
  description:
    "Compare Settler with building your own reconciliation system or using alternative solutions. See why 500+ companies choose Settler for faster time to value, lower costs, and 99.7% accuracy.",
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
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
