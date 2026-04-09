"use client";
import { CTABannerBlock } from "../pageSchema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export function CTABannerBlockComponent({ block }: { block: CTABannerBlock }) {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h2>{block.title}</h2>
        <p>{block.description}</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild>
            <Link href={block.primaryCta.href}>{block.primaryCta.label}</Link>
          </Button>
          {block.secondaryCta && (
            <Button variant="outline" asChild>
              <Link href={block.secondaryCta.href}>{block.secondaryCta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
