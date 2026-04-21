import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_LOCKUP_PNG } from "./brand-assets";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";

export type BrandLockupOrientation = "horizontal" | "stacked";

type HorizontalLockupProps = {
  orientation?: "horizontal";
  alt?: string;
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  sizes?: string;
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

  const { alt = "Settler.dev", className, priority, sizes, theme = "auto" } = props;

  const themeClass = theme === "dark" ? "invert" : theme === "auto" ? "dark:invert" : "";

  return (
    <Image
      src={BRAND_LOCKUP_PNG.webpSrc ?? BRAND_LOCKUP_PNG.src}
      width={BRAND_LOCKUP_PNG.width}
      height={BRAND_LOCKUP_PNG.height}
      alt={alt}
      className={cn(
        "max-h-full w-auto max-w-full object-contain object-left",
        themeClass,
        className
      )}
      priority={priority}
      sizes={sizes}
    />
  );
}
