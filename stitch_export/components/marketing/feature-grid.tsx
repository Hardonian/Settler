import React from "react";

export const FeatureGrid: React.FC = () => {
  const features = [
    { title: "Open Source", text: "Self-hostable, no vendor lock-in" },
    { title: "Auditable", text: "End-to-end traceability for reconciliation" },
    { title: "Cloud Ready", text: "Optional managed cloud when you’re ready" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {features.map((f) => (
        <div key={f.title} className="border rounded-lg p-6">
          <div className="font-semibold mb-2">{f.title}</div>
          <div className="text-sm text-muted-foreground">{f.text}</div>
        </div>
      ))}
    </div>
  );
};
