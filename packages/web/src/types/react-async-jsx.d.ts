/**
 * React JSX Type Augmentation for Async Server Components
 *
 * Next.js App Router supports async server components (functions that return
 * Promise<ReactNode>). TypeScript 5.x / @types/react 18.x don't natively
 * support this. This module augmentation tells TypeScript that async component
 * return types are valid JSX element types.
 *
 * This mirrors what Next.js generates in .next/types/app.d.ts at build time,
 * making `tsc --noEmit` work correctly without a prior Next.js build.
 */

import "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES {
    // Allow async server component return types (Promise<ReactNode>) in JSX.
    Promise: Promise<React.ReactNode>;
  }
}
