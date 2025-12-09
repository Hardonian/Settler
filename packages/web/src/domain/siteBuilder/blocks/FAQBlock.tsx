'use client';
import { FAQBlock } from '../pageSchema';
export function FAQBlockComponent({ block }: { block: FAQBlock }) {
  return <section className="py-20"><div className="max-w-4xl mx-auto"><h2>{block.title}</h2><div className="space-y-4">{block.items.map((item, i) => <div key={i} className="p-4 border rounded"><h3 className="font-semibold">{item.question}</h3><p className="mt-2">{item.answer}</p></div>)}</div></div></section>;
}
