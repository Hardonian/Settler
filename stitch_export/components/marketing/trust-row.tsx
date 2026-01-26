import React from "react";

export const TrustRow: React.FC = () => {
  const badges = ["MIT License", "Self-hostable", "No Telemetry", "Community-Driven"];
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {badges.map((b) => (
        <span key={b} className="px-3 py-1 rounded-full border text-sm text-muted-foreground">
          {b}
        </span>
      ))}
    </div>
  );
};
