import { FlaskConical } from "lucide-react";

interface DemoBannerProps {
  label?: string;
}

export function DemoBanner({
  label = "This surface shows sample data for demonstration purposes.",
}: DemoBannerProps) {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Demo data</strong> — {label}
      </span>
    </div>
  );
}
