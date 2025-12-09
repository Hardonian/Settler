import { Metadata } from "next";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "How It Works - 4 Simple Steps to Automated Reconciliation",
  description:
    "Learn how Settler automates payment reconciliation in 4 simple steps. Connect platforms, define rules, run reconciliation, and review results. Get started in 5 minutes.",
  keywords: [
    "how reconciliation works",
    "automated reconciliation process",
    "payment reconciliation steps",
    "transaction matching",
    "reconciliation workflow",
  ],
  canonical: "https://settler.dev/how-it-works",
});

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
