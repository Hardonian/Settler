"use client";
import { TwoColumnTextBlock } from "../pageSchema";
export function TwoColumnTextBlockComponent({ block }: { block: TwoColumnTextBlock }) {
  return (
    <section className="py-20">
      <div
        className={`max-w-7xl mx-auto grid md:grid-cols-2 gap-8 ${block.reverse ? "md:flex-row-reverse" : ""}`}
      >
        <div>
          <h2>{block.leftColumn.title}</h2>
          <p>{block.leftColumn.content}</p>
        </div>
        <div>
          <h2>{block.rightColumn.title}</h2>
          <p>{block.rightColumn.content}</p>
        </div>
      </div>
    </section>
  );
}
