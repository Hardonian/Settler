/**
 * React JSX Type Augmentation for Async Server Components
 *
 * This module augments React's JSX types to support async server components.
 * This is needed because @types/react 18.x doesn't natively support async components in JSX.
 */

import type { ReactNode } from "react";

// Augment DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES to include Promise<ReactNode>
declare global {
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES {
    // Add Promise as a valid JSX element type - this allows async components
    Promise: Promise<ReactNode>;
  }
}

export {};
