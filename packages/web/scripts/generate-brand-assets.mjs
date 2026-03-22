/**
 * Derives favicons, PWA icons, and social preview art from the canonical
 * horizontal lockup: public/assets/images/Settler-logo.png
 *
 * Run: node ./scripts/generate-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const sourcePng = join(webRoot, "public/assets/images/Settler-logo.png");
const brandDir = join(webRoot, "public/brand/settler");
const appDir = join(webRoot, "src/app");

/** Navy from brand spec — circular icon backdrop */
const NAVY = { r: 27, g: 63, b: 95, alpha: 1 };

/**
 * Left lockup region: geometric mark only (horizontal asset is mark + wordmark).
 * Tuned for 1303×339 official horizontal PNG.
 */
const MARK_EXTRACT = { left: 0, top: 0, width: 360, height: 339 };
/** Wordmark-only slice of the horizontal lockup (right of the mark). */
const WORDMARK_EXTRACT = { left: 400, top: 0, width: 903, height: 339 };

async function circularMarkPng(size) {
  const raw = await sharp(sourcePng)
    .extract(MARK_EXTRACT)
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

async function openGraphPng() {
  const width = 1200;
  const height = 630;
  const lockup = await sharp(sourcePng)
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
  await readFile(sourcePng);

  await mkdir(brandDir, { recursive: true });
  await mkdir(appDir, { recursive: true });

  for (const s of [192, 512]) {
    const buf = await circularMarkPng(s);
    const name = s === 192 ? "favicon-192x192.png" : "favicon-512x512.png";
    await writeFile(join(brandDir, name), buf);
  }

  const icon512 = await circularMarkPng(512);
  await writeFile(join(brandDir, "favicon.png"), icon512);
  await writeFile(join(brandDir, "app-icon.png"), icon512);

  const wordmarkBuf = await sharp(sourcePng).extract(WORDMARK_EXTRACT).png().toBuffer();
  await writeFile(join(brandDir, "wordmark.png"), wordmarkBuf);

  const og = await openGraphPng();
  await writeFile(join(appDir, "opengraph-image.png"), og);
  await writeFile(join(appDir, "twitter-image.png"), og);

  const appIcon32 = await circularMarkPng(32);
  const appIcon180 = await circularMarkPng(180);
  await writeFile(join(appDir, "icon.png"), appIcon32);
  await writeFile(join(appDir, "apple-icon.png"), appIcon180);

  console.log("Brand assets generated from Settler-logo.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
