#!/usr/bin/env node
/**
 * Export deck slides as high-quality PNG screenshots, then compose into a PDF.
 *
 * Usage:
 *   node scripts/export-deck.mjs              -> PNGs + PDF (example deck)
 *   node scripts/export-deck.mjs my-deck      -> Export a specific deck
 *   node scripts/export-deck.mjs --png-only   -> PNGs only
 *   node scripts/export-deck.mjs --pdf-only   -> PDF only (requires PNGs already exported)
 *
 * Output:
 *   exports/{deck}/slides/01-slide-cover.png   (2560x1440, 2x retina)
 *   exports/{deck}/{deck}.pdf                  (1280x720pt pages, image-based)
 */

import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync, readdirSync, existsSync, unlinkSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { lookup } from 'mime-types';
import { PDFDocument } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SLIDE_W = 1280;
const SLIDE_H = 720;
const SCALE = 2; // 2x for retina quality

const args = process.argv.slice(2);
const pngOnly = args.includes('--png-only');
const pdfOnly = args.includes('--pdf-only');

const deckSlug = args.find(a => !a.startsWith('--')) || 'example';
const deckDir = resolve(root, 'decks', deckSlug);
const manifestPath = resolve(deckDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const slides = manifest.slides;

const pngDir = resolve(root, `exports/${deckSlug}/slides`);
const pdfPath = resolve(root, `exports/${deckSlug}/${deckSlug}.pdf`);

// ── Auto-detect Chrome ──
function findChrome() {
  const candidates = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Windows (WSL)
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined; // Let Puppeteer use its bundled Chromium
}

// ── Static file server ──
function startServer(port) {
  return new Promise((res) => {
    const server = createServer(async (req, resp) => {
      try {
        const filePath = resolve(root, decodeURIComponent(req.url).slice(1));
        const content = await readFile(filePath);
        const mime = lookup(filePath) || 'application/octet-stream';
        resp.writeHead(200, { 'Content-Type': mime });
        resp.end(content);
      } catch {
        resp.writeHead(404);
        resp.end('Not found');
      }
    });
    server.listen(port, () => res(server));
  });
}

// ── Export PNGs ──
async function exportPngs() {
  // Clear old PNGs before exporting
  if (existsSync(pngDir)) {
    for (const f of readdirSync(pngDir)) {
      if (f.endsWith('.png')) {
        unlinkSync(resolve(pngDir, f));
      }
    }
  }
  mkdirSync(pngDir, { recursive: true });

  const port = 3850;
  const server = await startServer(port);

  const chromePath = findChrome();
  const browser = await puppeteer.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
    timeout: 60000,
    protocolTimeout: 60000,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: SLIDE_W,
    height: SLIDE_H,
    deviceScaleFactor: SCALE,
  });

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideFile = slide.ref ? slide.ref.file : slide.file;
    const slideDeck = slide.ref ? slide.ref.deck : deckSlug;
    const url = `http://localhost:${port}/decks/${slideDeck}/slides/${slideFile}`;
    const num = String(i + 1).padStart(2, '0');
    const slug = slideFile.replace('.html', '');
    const outFile = resolve(pngDir, `${num}-${slug}.png`);

    process.stdout.write(`  PNG ${num}/${slides.length}: ${slide.label}...`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Preload all font weights
    await page.evaluate(async () => {
      const families = ['Instrument Serif', 'DM Sans'];
      const weights = ['400', '500', '600', '700'];
      const loads = [];
      for (const f of families) {
        for (const w of weights) {
          loads.push(document.fonts.load(`${w} 16px "${f}"`).catch(() => {}));
          loads.push(document.fonts.load(`italic ${w} 16px "${f}"`).catch(() => {}));
        }
      }
      await Promise.all(loads);
      await document.fonts.ready;
    });

    // Inject correct slide number from manifest order
    await page.evaluate((slideNum) => {
      const el = document.querySelector('.slide-num');
      if (el) el.textContent = slideNum;
    }, num);

    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: outFile,
      type: 'png',
      clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
    });

    console.log(' done');
  }

  await browser.close();
  server.close();
  console.log(`\n  ${slides.length} PNGs exported to ${pngDir}\n`);
}

// ── Compose PDF from PNGs ──
async function composePdf() {
  const pdf = await PDFDocument.create();

  const pngFiles = readdirSync(pngDir)
    .filter(f => f.endsWith('.png') && /^\d{2}-/.test(f))
    .sort();

  if (pngFiles.length === 0) {
    console.error('  No PNGs found. Run without --pdf-only first.');
    process.exit(1);
  }

  console.log(`  Composing ${pngFiles.length} slides into PDF...`);

  for (const file of pngFiles) {
    const imgBytes = await readFile(resolve(pngDir, file));
    const img = await pdf.embedPng(imgBytes);
    const page = pdf.addPage([SLIDE_W, SLIDE_H]);
    page.drawImage(img, { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H });
  }

  pdf.setTitle(manifest.title);
  pdf.setCreator('Stella Decks');
  pdf.setProducer('puppeteer + pdf-lib');

  const pdfBytes = await pdf.save();
  await writeFile(pdfPath, pdfBytes);
  console.log(`  PDF saved: ${pdfPath} (${pngFiles.length} pages, ${(pdfBytes.length / 1024 / 1024).toFixed(1)}MB)\n`);
}

// ── Main ──
async function main() {
  console.log(`\nExporting "${manifest.title}" (${slides.length} slides)\n`);

  if (!pdfOnly) {
    await exportPngs();
  }

  if (!pngOnly) {
    await composePdf();
  }

  console.log('Done.\n');
}

main().catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
