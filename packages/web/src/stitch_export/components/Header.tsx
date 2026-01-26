import Link from "next/link";
import React from "react";

// Lightweight Stitch-inspired marketing header (non-blocking, non-intrusive)
export const StitchHeader: React.FC = () => {
  return (
    <header className="w-full border-b border-muted py-4">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-xl">Settler</span>
          <nav className="hidden sm:flex gap-4 text-sm">
            <Link href="/">Home</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/docs/quickstart" className="text-sm px-3 py-2 rounded-md border">
            Get started
          </Link>
          <Link href="/login" className="text-sm px-3 py-2 rounded-md border">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
};
