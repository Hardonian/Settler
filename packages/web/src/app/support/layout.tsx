import { Metadata } from "next";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Support & Help Center - Get Help with Settler",
  description:
    "Find answers, get help, and connect with our team. Comprehensive documentation, community support, email support, and 24/7 priority support for enterprise customers.",
  keywords: [
    "Settler support",
    "help center",
    "customer support",
    "technical support",
    "reconciliation help",
  ],
  canonical: "https://settler.dev/support",
});

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
