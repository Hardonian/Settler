import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const metadata: Metadata = {
  title: "Demo Preview - Settler",
  description:
    "Interactive demo of Settler's reconciliation engine, receipt ingestion, and API playground. No authentication required.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ErrorBoundary componentName="DemoLayout">
        <Navigation />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}
