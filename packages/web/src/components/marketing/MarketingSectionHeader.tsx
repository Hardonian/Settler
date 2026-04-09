import { cn } from "@/lib/utils";

export interface MarketingSectionHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Default start; center aligns title block for banded sections */
  align?: "start" | "center";
  /** Override default `text-2xl font-bold` on the heading when a page needs larger responsive type */
  titleClassName?: string;
  className?: string;
}

/**
 * Shared marketing section title rhythm (eyebrow → heading → supporting copy).
 * Does not wrap outer Section spacing — parent controls vertical padding.
 */
export function MarketingSectionHeader({
  title,
  eyebrow,
  description,
  align = "start",
  titleClassName,
  className,
}: MarketingSectionHeaderProps) {
  return (
    <div
      className={cn(
        "space-y-3 mb-10",
        align === "center" && "text-center mx-auto max-w-2xl",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={cn("font-bold tracking-tight text-foreground", titleClassName ?? "text-2xl")}>
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground leading-relaxed",
            align === "center" ? "mx-auto" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
