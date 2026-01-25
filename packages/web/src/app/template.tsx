/**
 * Root Template (Next.js App Router)
 * 
 * Wraps all pages for consistent instrumentation and tracking.
 */

export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
