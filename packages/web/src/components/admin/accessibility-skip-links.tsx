/**
 * Accessibility Skip Links
 *
 * Skip navigation links for keyboard users.
 */

"use client";

import Link from "next/link";

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
      <nav aria-label="Skip navigation">
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="#main-content"
              className="px-4 py-2 bg-blue-600 text-white rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Skip to main content
            </Link>
          </li>
          <li>
            <Link
              href="#admin-navigation"
              className="px-4 py-2 bg-blue-600 text-white rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Skip to navigation
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
