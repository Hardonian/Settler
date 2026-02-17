import { Check } from "lucide-react";

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 leading-relaxed">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
