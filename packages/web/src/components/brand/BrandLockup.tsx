import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_LOCKUP_PNG } from "./brand-assets";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";

export type BrandLockupOrientation = "horizontal" | "stacked";

type HorizontalLockupProps = {
  orientation?: "horizontal";
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
} & Omit<ImageProps, "src" | "width" | "height" | "alt">;

type StackedLockupProps = {
  orientation: "stacked";
  alt?: string;
  className?: string;
  stackedGapClassName?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  priority?: boolean;
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
    } = props;
    return (
      <div className={cn("flex flex-col items-center", stackedGapClassName, className)}>
        <BrandMark
          alt=""
          className={cn("h-14 w-14 sm:h-16 sm:w-16", markClassName)}
          priority={priority}
        />
        <BrandWordmark
          alt={alt}
          className={cn("h-8 w-auto max-w-[min(100%,280px)] sm:h-9", wordmarkClassName)}
          priority={priority}
        />
      </div>
    );
  }

  const { alt = "Settler.dev", className, priority, sizes, ...imageRest } = props;

  return (
    <Image
      src={BRAND_LOCKUP_PNG.src}
      width={BRAND_LOCKUP_PNG.width}
      height={BRAND_LOCKUP_PNG.height}
      alt={alt}
      className={className}
      priority={priority}
      sizes={sizes}
      {...imageRest}
    />
  );
}
