import React from "react";
import Link from "next/link";
import { StitchHeader } from "./components/Header";
import { StitchFooter } from "./components/Footer";

// Simple landing page using Stitch-like UI skeleton
export default function StitchHome() {
  return (
    <div>
      <StitchHeader />
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <section className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Settler: Stitch UI as frontend facelift</h1>
          <p className="text-lg text-muted-foreground mb-6">
            A drop-in frontend ornament that preserves existing backend flows while modernizing
            visuals.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/docs/quickstart" className="btn btn-primary">
              Run locally
            </Link>
            <Link href="https://github.com/settler-dev/settler" className="btn btn-secondary">
              Star on GitHub
            </Link>
            <Link href="/docs" className="btn">
              View docs
            </Link>
          </div>
        </section>
      </main>
      <StitchFooter />
    </div>
  );
}
