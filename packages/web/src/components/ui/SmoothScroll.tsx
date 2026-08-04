export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // Native scrolling avoids a page-wide animation-frame loop, reduces initial
  // client work, and honors browser/user motion preferences by default.
  return <>{children}</>;
}
