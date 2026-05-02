#!/usr/bin/env node
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "public");

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const fmtKB = (n) => (n / 1024).toFixed(1) + " KB";
const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };

async function processFile(file, transform) {
  const before = (await fs.stat(file)).size;
  // Read into buffer FIRST to avoid Windows file lock during write
  const inputBuf = await fs.readFile(file);
  const outputBuf = await transform(sharp(inputBuf));
  await fs.writeFile(file, outputBuf);
  const after = outputBuf.length;
  const pct = (((before - after) / before) * 100).toFixed(0);
  console.log(`  ${path.relative(ROOT, file).padEnd(60)} ${fmtKB(before).padStart(10)} -> ${fmtKB(after).padStart(10)}  (-${pct}%)`);
}

async function main() {
  const all = await walk(ROOT);
  const images = all.filter((f) => /\.(png|jpe?g)$/i.test(f));
  console.log(`Found ${images.length} raster images under public/`);

  const specials = {
    "favicon.png": (s) => s.resize(64, 64, { fit: "contain" }).png({ compressionLevel: 9, palette: true }).toBuffer(),
    "og-default.png": (s) => s.resize(1200, 630, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
    "pwa-192x192.png": (s) => s.png({ compressionLevel: 9, palette: true }).toBuffer(),
    "pwa-512x512.png": (s) => s.png({ compressionLevel: 9, palette: true }).toBuffer(),
  };

  for (const [name, fn] of Object.entries(specials)) {
    const f = path.join(ROOT, name);
    if (await exists(f)) {
      try {
        await processFile(f, fn);
      } catch (e) {
        console.warn("  skip " + name + ":", e.message);
      }
    }
  }

  const skip = Object.keys(specials).map((n) => path.join(ROOT, n));
  const bulk = images.filter((f) => !skip.includes(f));
  console.log(`\nBulk compressing ${bulk.length} images:`);

  for (const file of bulk) {
    const isPng = /\.png$/i.test(file);
    try {
      // Probe metadata from buffer too
      const inputBuf = await fs.readFile(file);
      const meta = await sharp(inputBuf).metadata();
      const tooBig = meta.width && meta.width > 1600;
      await processFile(file, async (s) => {
        let pipeline = s;
        if (tooBig) pipeline = pipeline.resize(1600, null, { withoutEnlargement: true });
        return isPng
          ? pipeline.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer()
          : pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      });
    } catch (e) {
      console.warn("  skip", path.relative(ROOT, file), "-", e.message);
    }
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
