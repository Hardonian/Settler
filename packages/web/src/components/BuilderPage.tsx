/**
 * Builder.io Page Component
 * Wrapper that dynamically imports the actual component with SSR disabled
 * This avoids React context issues during build-time rendering
 */

import dynamic from "next/dynamic";

// Dynamically import the Builder page with SSR disabled
const BuilderPageInner = dynamic(() => import("./BuilderPageInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>Loading page...</div>
    </div>
  ),
});

interface BuilderPageProps {
  model?: string;
  content?: any;
  apiKey?: string;
}

export default function BuilderPage(props: BuilderPageProps) {
  return <BuilderPageInner {...props} />;
}

// Re-export SEO helper from inner component
export { BuilderPageWithSEO } from "./BuilderPageInner";
