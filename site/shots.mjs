#!/usr/bin/env node
// Local-only thumbnail generator. Screenshots the above-the-fold of each note
// into site/thumbs/<topic>__<file>.png for the magazine-grid cards.
//
// This is the ONLY step that needs a browser. CI never runs it. Run it after
// adding or restyling notes, then commit the PNGs:
//
//   npm run shots && node site/build.mjs && git add site/thumbs index.html
//
// Notes without a committed thumbnail fall back to a generated poster card,
// so forgetting to run this never breaks the build.

import { chromium } from 'playwright';
import { readdirSync, statSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SITE_DIR, '..');
const THUMB_DIR = join(SITE_DIR, 'thumbs');

const WIDTH = 1200;
const HEIGHT = 750; // 16:10 above-the-fold capture

mkdirSync(THUMB_DIR, { recursive: true });

// Optional PNG compression via sharp (palette quantization, pngquant-style).
// Graceful: if sharp is not installed, raw screenshots are written instead.
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('sharp not installed; writing uncompressed PNGs (run `npm install` to enable compression).');
}

// Prefer Playwright's bundled Chromium; fall back to a system Chromium-based
// browser (Brave/Chrome) so this runs without a separate browser download.
const SYSTEM_BROWSERS = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  '/usr/bin/brave-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const executablePath = SYSTEM_BROWSERS.find((p) => existsSync(p));

const topics = readdirSync(ROOT).filter((n) => {
  if (n.startsWith('.') || n === 'site' || n === 'node_modules') return false;
  try {
    return statSync(join(ROOT, n)).isDirectory() && readdirSync(join(ROOT, n)).some((f) => f.endsWith('.html'));
  } catch {
    return false;
  }
});

if (executablePath) console.log(`Using system browser: ${executablePath}`);
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1, // 1200px source is ample for ~300px cards; keeps the repo lean
});

let count = 0;
for (const topic of topics) {
  const files = readdirSync(join(ROOT, topic)).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const url = pathToFileURL(join(ROOT, topic, file)).href;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(250);
    const out = join(THUMB_DIR, `${topic}__${basename(file, '.html')}.png`);
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    if (sharp) {
      await sharp(buf).png({ palette: true, quality: 80, effort: 9, compressionLevel: 9 }).toFile(out);
    } else {
      writeFileSync(out, buf);
    }
    console.log(`  shot: ${topic}/${file}`);
    count++;
  }
}

await browser.close();
console.log(`Captured ${count} thumbnails into site/thumbs/.`);
