'use client';
import { CodeExampleBlock } from '../pageSchema';
export function CodeExampleBlockComponent({ block }: { block: CodeExampleBlock }) {
  return <section className="py-20"><div className="max-w-7xl mx-auto"><h2>{block.title}</h2><p>{block.description}</p><pre className="mt-8 p-4 bg-slate-900 text-slate-100 rounded overflow-x-auto"><code>{block.code}</code></pre></div></section>;
}
