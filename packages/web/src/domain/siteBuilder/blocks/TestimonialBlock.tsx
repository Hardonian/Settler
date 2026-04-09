"use client";
import { TestimonialBlock } from "../pageSchema";
export function TestimonialBlockComponent({ block }: { block: TestimonialBlock }) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8">
          {block.testimonials.map((t, i) => (
            <div key={i} className="p-6 border rounded">
              <p>{t.quote}</p>
              <p className="mt-4 font-semibold">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
