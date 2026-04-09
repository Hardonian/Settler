"use client";
import { StatsBlock } from "../pageSchema";
export function StatsBlockComponent({ block }: { block: StatsBlock }) {
  const cols = block.columns || 4;
  return (
    <section className="py-20">
      <div className={`max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-${cols} gap-6`}>
        {block.stats.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
