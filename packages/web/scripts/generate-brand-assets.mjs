/**
 * Derives favicons, PWA icons, horizontal OG preview art, and optional lockup PNGs from
 * the canonical circular mark under public/brand/settler/favicon-192x192.png.
 *
 * Wordmark in the UI is rendered as text (BrandWordmark) — do not ship a raster wordmark
 * that can drift to third-party stock art.
 *
 * Run: node ./scripts/generate-brand-assets.mjs
 * Or:  pnpm run generate:brand-assets
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const brandDir = join(webRoot, "public/brand/settler");
const appDir = join(webRoot, "src/app");

const markSourcePng = join(brandDir, "favicon-192x192.png");

/** Navy from brand spec — circular icon backdrop */
const NAVY = { r: 27, g: 63, b: 95, alpha: 1 };

const TEXT_HEX = "#0f172a";

/**
 * Build circular mark PNGs at `size` from the canonical circular mark asset (scaled).
 */
async function circularMarkPng(size) {
  const raw = await sharp(await readFile(markSourcePng))
    .resize(Math.round(size * 0.58), Math.round(size * 0.58), { fit: "inside" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const meta = await sharp(raw).metadata();
  const w = meta.width ?? size;
  const h = meta.height ?? size;

  const square = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([
      {
        input: raw,
        left: Math.round((size - w) / 2),
        top: Math.round((size - h) / 2),
      },
    ])
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );

  return sharp(square).ensureAlpha().composite([{ input: circleMask, blend: "dest-in" }]).png().toBuffer();
}

/**
 * Horizontal lockup raster for OG / structured-data URLs (mark + SVG text — no bitmap wordmark).
 */
async function composeHorizontalLockupRaster() {
  const targetMarkSize = 339;
  const markBuf = await readFile(markSourcePng);
  const resizedMark = await sharp(markBuf)
    .resize(targetMarkSize, targetMarkSize, { fit: "fill" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const gap = 40;
  const textW = 720;
  const textH = 200;
  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${textW}" height="${textH}" viewBox="0 0 ${textW} ${textH}">
      <text x="0" y="145" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="112" font-weight="650" fill="${TEXT_HEX}">Settler.dev</text>
    </svg>`
  );
  const textPng = await sharp(textSvg).png().toBuffer();
  const tm = await sharp(textPng).metadata();
  const tw = tm.width ?? textW;
  const th = tm.height ?? textH;

  const totalW = targetMarkSize + gap + tw;
  const totalH = Math.max(targetMarkSize, th);

  return sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: resizedMark, left: 0, top: Math.round((totalH - targetMarkSize) / 2) },
      { input: textPng, left: targetMarkSize + gap, top: Math.round((totalH - th) / 2) },
    ])
    .png()
    .toBuffer();
}

async function openGraphPng(lockupBuf) {
  const width = 1200;
  const height = 630;
  const lockup = await sharp(lockupBuf)
    .resize(Math.round(width * 0.72), null, { fit: "inside" })
    .png()
    .toBuffer();

  const lm = await sharp(lockup).metadata();
  const lw = lm.width ?? 800;
  const lh = lm.height ?? 200;

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 248, g: 250, b: 252 },
    },
  })
    .composite([
      {
        input: lockup,
        left: Math.round((width - lw) / 2),
        top: Math.round((height - lh) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function main() {
  await readFile(markSourcePng);

  await mkdir(brandDir, { recursive: true });
  await mkdir(appDir, { recursive: true });

  const horizontalLockup = await composeHorizontalLockupRaster();
  const lockupMeta = await sharp(horizontalLockup).metadata();
  const lockupFile = "settler-lockup-horizontal-light.png";
  await writeFile(join(brandDir, lockupFile), horizontalLockup);

  const webpPath = join(brandDir, "settler-lockup-horizontal-light.webp");
  await sharp(horizontalLockup).webp({ quality: 90, effort: 6 }).toFile(webpPath);

  for (const s of [192, 512]) {
    const buf = await circularMarkPng(s);
    const name = s === 192 ? "favicon-192x192.png" : "favicon-512x512.png";
    await writeFile(join(brandDir, name), buf);
  }

  const icon512 = await circularMarkPng(512);
  await writeFile(join(brandDir, "favicon.png"), icon512);
  await writeFile(join(brandDir, "app-icon.png"), icon512);

  const og = await openGraphPng(horizontalLockup);
  await writeFile(join(appDir, "opengraph-image.png"), og);
  await writeFile(join(appDir, "twitter-image.png"), og);

  const appIcon32 = await circularMarkPng(32);
  const appIcon180 = await circularMarkPng(180);
  await writeFile(join(appDir, "icon.png"), appIcon32);
  await writeFile(join(appDir, "apple-icon.png"), appIcon180);

  console.log(
    `Brand assets generated (lockup ${lockupMeta.width}x${lockupMeta.height}) from mark + vector text`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
