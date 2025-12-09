'use client';
import { PricingTableBlock } from '../pageSchema';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
export function PricingTableBlockComponent({ block }: { block: PricingTableBlock }) {
  return <section className="py-20"><div className="max-w-7xl mx-auto"><h2>{block.title}</h2><div className="grid md:grid-cols-3 gap-8">{block.plans.map((plan, i) => <div key={i} className="p-6 border rounded"><h3>{plan.name}</h3><p className="text-3xl font-bold">{plan.price}</p><ul className="mt-4 space-y-2">{plan.features.map((f, j) => <li key={j}>{f}</li>)}</ul><Button className="mt-6 w-full" asChild><Link href={plan.cta.href}>{plan.cta.label}</Link></Button></div>)}</div></div></section>;
}
