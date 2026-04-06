import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Enterprise Solutions - Custom Reconciliation Platform",
  description:
    "Enterprise reconciliation for tenant isolation, deterministic evidence, and governed operations. Identity and lifecycle capabilities are explicitly status-scoped (implemented vs staged).",
  keywords: [
    "enterprise reconciliation",
    "enterprise API",
    "SOC 2 compliance",
    "enterprise security",
    "on-premise reconciliation",
    "custom reconciliation",
  ],
  canonical: "https://settler.dev/enterprise",
});

export default function EnterpriseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
