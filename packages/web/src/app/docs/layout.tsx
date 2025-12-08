import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Comprehensive documentation for Settler - Reconciliation as a Service API. Learn how to integrate Settler into your application with guides, API reference, and examples.",
  keywords: [
    "Settler documentation",
    "API documentation",
    "reconciliation API docs",
    "integration guide",
    "developer documentation",
  ],
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
