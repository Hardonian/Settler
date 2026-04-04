"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, ArrowUpRight } from "lucide-react";
import { visualProofRegistry } from "@/lib/public/visual-proof-registry";

type RegistryKey = keyof typeof visualProofRegistry;

export function RealityEvidencePanel({ scope, title }: { scope: RegistryKey; title?: string }) {
  // @ts-ignore
  const entries = visualProofRegistry[scope] ?? [];

  return (
    <section className="rounded-3xl border border-border bg-card p-8 md:p-10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <CheckCircle2 className="w-32 h-32 text-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {title ?? "Implementation Evidence"}
          </h2>
        </div>

        <p className="text-muted-foreground leading-relaxed max-w-2xl text-lg">
          Settler is built on verifiable truth. This registry connects marketing claims to concrete
          implementation modules, ensuring every capability is auditable.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((entry, idx) => (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={entry.title}
              className="group/item rounded-2xl border border-border bg-background/50 p-6 hover:border-primary/30 hover:bg-background transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-foreground text-lg">{entry.title}</h3>
                <CheckCircle2 className="w-5 h-5 text-primary/40 group-hover/item:text-primary transition-colors" />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{entry.detail}</p>

              <div className="flex flex-wrap gap-2">
                {entry.refs.map((ref) => (
                  <Link
                    key={`${entry.title}-${ref.href}`}
                    href={ref.href.startsWith("/") ? ref.href : "/open-source"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
                  >
                    <span className="opacity-50 font-medium uppercase tracking-tighter">
                      {ref.type}
                    </span>
                    <span>{ref.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
