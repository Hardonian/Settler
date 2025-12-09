import { Metadata } from "next";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Enterprise Solutions - Custom Reconciliation Platform",
  description:
    "Enterprise-grade reconciliation with SOC 2 Type II, SSO, SAML, RBAC, unlimited scale, dedicated support, and on-premise deployment options. Custom solutions for large organizations.",
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
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
