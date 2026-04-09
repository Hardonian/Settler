"use client";

import Image from "next/image";
import { LogoCloudBlock } from "../pageSchema";

export function LogoCloudBlockComponent({ block }: { block: LogoCloudBlock }) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto">
        <h2>{block.title}</h2>
        <div className="grid grid-cols-5 gap-8">
          {block.logos.map((logo, index) => (
            <Image
              key={index}
              src={logo.imageUrl}
              alt={logo.name}
              width={160}
              height={48}
              className="h-12 object-contain opacity-60"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
