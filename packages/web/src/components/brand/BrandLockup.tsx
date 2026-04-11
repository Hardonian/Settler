import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";

export type BrandLockupOrientation = "horizontal" | "stacked";

type HorizontalLockupProps = {
  orientation?: "horizontal";
  alt?: string;
  className?: string;
  priority?: boolean;
  /** Horizontal: mark + text wordmark (default). Stacked uses format="word". */
  wordmarkFormat?: "product" | "word";
};

type StackedLockupProps = {
  orientation: "stacked";
  alt?: string;
  className?: string;
  stackedGapClassName?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  priority?: boolean;
  wordmarkFormat?: "product" | "word";
};

export type BrandLockupProps = HorizontalLockupProps | StackedLockupProps;

export function BrandLockup(props: BrandLockupProps) {
  if (props.orientation === "stacked") {
    const {
      alt = "Settler.dev",
      className,
      stackedGapClassName = "gap-3",
      markClassName,
      wordmarkClassName,
      priority,
      wordmarkFormat = "word",
    } = props;
    return (
      <div className={cn("flex flex-col items-center", stackedGapClassName, className)}>
        <BrandMark
          alt=""
          className={cn("h-14 w-14 sm:h-16 sm:w-16", markClassName)}
          priority={priority}
        />
        <BrandWordmark alt={alt} format={wordmarkFormat} className={wordmarkClassName} />
      </div>
    );
  }

  const { alt = "Settler.dev", className, priority, wordmarkFormat = "product" } = props;

  return (
    <div
      className={cn(
        "inline-flex max-h-full min-h-8 w-auto max-w-full flex-nowrap items-center gap-2 sm:gap-3",
        className
      )}
    >
      <BrandMark
        alt=""
        className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
        priority={priority}
        sizes="(max-width: 640px) 28px, 32px"
      />
      <BrandWordmark alt={alt} format={wordmarkFormat} />
    </div>
  );
}
