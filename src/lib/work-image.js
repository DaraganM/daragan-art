import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Reads the pixel size of a WebP file from its header (VP8, VP8L and VP8X variants).
function webpSize(file) {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${file} is not a WebP file`);
  }
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const v = b.readUInt32LE(21);
    return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8X") return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  throw new Error(`Unsupported WebP chunk "${kind}" in ${file}`);
}

/**
 * Finds `<slug>-<width>.webp` files in public/<folder> and returns what an <img> needs.
 * The build fails with a clear message when a slug has no files, so a broken image
 * reference cannot reach production.
 */
export function workImage(slug, folder = "works") {
  const dir = join(process.cwd(), "public", folder);
  const pattern = new RegExp(`^${slug}-(\\d+)\\.webp$`);
  const widths = existsSync(dir)
    ? readdirSync(dir).map((f) => pattern.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b)
    : [];
  if (widths.length === 0) {
    throw new Error(`No images for "${slug}" in public/${folder}/ (expected files like ${slug}-640.webp)`);
  }
  const largest = widths.at(-1);
  const { width, height } = webpSize(join(dir, `${slug}-${largest}.webp`));
  const url = (w) => `/${folder}/${slug}-${w}.webp`;
  return { widths, width, height, src: url(largest), srcset: widths.map((w) => `${url(w)} ${w}w`).join(", ") };
}
