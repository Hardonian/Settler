import Link from "next/link";
import { visualProofRegistry } from "@/lib/public/visual-proof-registry";

type RegistryKey = keyof typeof visualProofRegistry;

export function RealityEvidencePanel({ scope, title }: { scope: RegistryKey; title?: string }) {
  const entries = visualProofRegistry[scope] ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {title ?? "Implementation evidence references"}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This section ties visuals to concrete routes/modules so claims remain testable and
        auditable.
      </p>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <article
            key={entry.title}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {entry.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{entry.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.refs.map((ref) => (
                <Link
                  key={`${entry.title}-${ref.href}`}
                  href={ref.href.startsWith("/") ? ref.href : "/open-source"}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300"
                >
                  {ref.type}: {ref.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
