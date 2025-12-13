/**
 * Playground Layout
 * 
 * Provides consistent layout and subscription context for all playground pages.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
