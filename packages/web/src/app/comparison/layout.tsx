import { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Settler vs. Building In-House vs. Alternatives - Comparison",
  description:
    "Compare Settler with building your own reconciliation system or using alternative solutions. See why 500+ companies choose Settler for faster time to value, lower costs ($50K+ savings), and 99.7% accuracy.",
  keywords: [
    "reconciliation comparison",
    "build vs buy reconciliation",
    "reconciliation software comparison",
    "Settler vs alternatives",
    "reconciliation API comparison",
    "cost of building reconciliation",
  ],
  canonical: "https://settler.dev/comparison",
});

export default function ComparisonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
