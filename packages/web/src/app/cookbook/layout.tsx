import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Cookbooks - Pre-Built Reconciliation Workflows",
  description:
    "Ready-to-use reconciliation workflows and code examples for common use cases. Copy, customize, and deploy in minutes. E-commerce, SaaS, multi-currency, and more.",
  keywords: [
    "reconciliation examples",
    "reconciliation workflows",
    "code examples",
    "reconciliation cookbooks",
    "integration examples",
  ],
  canonical: "https://settler.dev/cookbook",
});

export default function CookbooksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
