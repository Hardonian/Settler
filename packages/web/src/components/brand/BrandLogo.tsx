import { BrandLockup, type BrandLockupProps } from "./BrandLockup";

/**
 * Primary entry for product UI: horizontal lockup by default.
 * Use `orientation="stacked"` for auth cards and splash-style surfaces.
 */
export function BrandLogo(props: BrandLockupProps) {
  return <BrandLockup {...props} />;
}
