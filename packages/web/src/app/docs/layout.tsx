import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsSearch } from "@/components/docs/DocsSearch";

export const metadata: Metadata = {
  title: 'Documentation - Settler',
  description: 'Complete API documentation, guides, and examples',
};

export default function DocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/10">
      <DocsSidebar />
      <main className="flex-1 ml-64">
        <div className="sticky top-0 z-10 bg-white dark:bg-card border-b border-border/40 dark:border-border px-6 py-4">
          <DocsSearch />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
