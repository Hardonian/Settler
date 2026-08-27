import { SchemaMapper } from "@/components/ingestion/SchemaMapper";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "AI Ingestion Mapper | Settler",
  description: "Upload and auto-map your CSV ledgers seamlessly.",
};

export default function AiMapperPage() {
  return (
    <div className="space-y-8 pb-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Settler Intelligence</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Zero-Code AI Ingestion
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-2xl">
          Drag and drop your raw bank statements or custom CSV exports. Our deterministic AI will
          analyze your headers and auto-map them to Settler&apos;s immutable ledger schema,
          significantly reducing time-to-value.
        </p>
      </div>

      <div className="pt-4">
        <SchemaMapper />
      </div>
    </div>
  );
}
