/**
 * UpgradePrompt Component
 * Shows upgrade messaging for commercial features
 */

import { getUpgradeMessage } from "../utils/licensing";

export interface UpgradePromptProps {
  feature: string;
  featureName?: string;
  compact?: boolean;
  onUpgrade?: () => void;
}

export function UpgradePrompt({
  feature,
  featureName,
  compact = false,
  onUpgrade,
}: UpgradePromptProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open("https://settler.dev/pricing", "_blank", "noopener,noreferrer");
    }
  };

  if (compact) {
    return (
      <div
        style={{
          padding: "0.75rem",
          backgroundColor: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "6px",
          fontSize: "0.875rem",
        }}
      >
        <span style={{ color: "#92400e" }}>
          {featureName || feature} requires Settler Commercial.{" "}
        </span>
        <button
          onClick={handleUpgrade}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#92400e",
            textDecoration: "underline",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Upgrade →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        border: "2px dashed #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#f9fafb",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
      <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#111827" }}>
        {featureName || feature} is a Commercial Feature
      </h3>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          maxWidth: "500px",
          margin: "0 auto 1.5rem",
        }}
      >
        {getUpgradeMessage(feature)}
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={handleUpgrade}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          View Pricing
        </button>
        <a
          href="https://settler.dev/docs/commercial-features"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "white",
            color: "#3b82f6",
            border: "1px solid #3b82f6",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
