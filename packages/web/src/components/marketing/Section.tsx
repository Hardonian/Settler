import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function Section({
  children,
  className,
  containerClassName,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("px-4 py-14 sm:px-6 md:py-16 lg:px-8 lg:py-20", className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>{children}</div>
    </section>
  );
}
