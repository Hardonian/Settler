import { SETTLER_BRAND } from "../assets";
import { SETTLER_IMAGES } from "@/lib/images/image-config";
import { BRAND_STRINGS } from "../strings";

describe("canonical brand assets", () => {
  it("horizontal lockup points at generated brand folder files", () => {
    expect(SETTLER_BRAND.lockupHorizontalLight.src).toBe(
      "/brand/settler/settler-lockup-horizontal-light.png"
    );
    expect(SETTLER_BRAND.lockupHorizontalLight.webpSrc).toBe(
      "/brand/settler/settler-lockup-horizontal-light.webp"
    );
    expect(SETTLER_IMAGES.logoMain.path).toBe(SETTLER_BRAND.lockupHorizontalLight.src);
    expect(SETTLER_IMAGES.logoMain.webpPath).toBe(SETTLER_BRAND.lockupHorizontalLight.webpSrc);
    expect(SETTLER_IMAGES.logoHorizontalDark.path).toBe(SETTLER_BRAND.lockupHorizontalLight.src);
    expect(SETTLER_IMAGES.logoHorizontalDark.webpPath).toBe(
      SETTLER_BRAND.lockupHorizontalLight.webpSrc
    );
    expect(SETTLER_IMAGES.logoMain.alt).toBe(BRAND_STRINGS.productSiteName);
  });

  it("does not reference removed wrong horizontal asset path", () => {
    expect(SETTLER_BRAND.lockupHorizontalLight.src).not.toContain("Settler-logo");
    expect(JSON.stringify(SETTLER_IMAGES)).not.toContain("Settler-logo");
  });
});
