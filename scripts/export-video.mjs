#!/usr/bin/env node
/**
 * Export deck slides as an animated MP4 video.
 *
 * Usage:
 *   node scripts/export-video.mjs                  -> Video (example deck)
 *   node scripts/export-video.mjs my-deck           -> Export a specific deck
 *   node scripts/export-video.mjs my-deck --fps 60  -> Override framerate
 *
 * Output:
 *   exports/{deck}/{deck}.mp4
 *
 * Requires ffmpeg installed on the system.
 */

import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { lookup } from 'mime-types';
import { spawn, execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SLIDE_W = 1280;
const SLIDE_H = 720;

// ── Parse CLI args ──
const args = process.argv.slice(2);
const deckSlug = args.find(a => !a.startsWith('--')) || 'example';

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

// ── Check ffmpeg ──
function checkFfmpeg() {
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
  } catch {
    console.error('\n  ffmpeg is not installed.\n');
    console.error('  Install it:');
    console.error('    macOS:   brew install ffmpeg');
    console.error('    Ubuntu:  sudo apt install ffmpeg');
    console.error('    Windows: choco install ffmpeg\n');
    process.exit(1);
  }
}

// ── Auto-detect Chrome (same as export-deck.mjs) ──
function findChrome() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

// ── Static file server (same as export-deck.mjs) ──
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

// ── Read manifest and merge video config ──
const deckDir = resolve(root, 'decks', deckSlug);
const manifestPath = resolve(deckDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const slides = manifest.slides;
const videoConfig = manifest.video || {};

const FPS = parseInt(getArgValue('--fps')) || videoConfig.fps || 30;
const DEFAULT_TRANSITION = videoConfig.transition || 'cut';
const DEFAULT_TRANSITION_DURATION = videoConfig.transitionDuration || 0.5;
const DEFAULT_DURATION = videoConfig.duration || 'auto';
const RESOLUTION = videoConfig.resolution || [1920, 1080];
const [OUT_W, OUT_H] = RESOLUTION;
const SCALE_FACTOR = OUT_W / SLIDE_W;

const outDir = resolve(root, `exports/${deckSlug}`);
const outPath = resolve(outDir, `${deckSlug}.mp4`);

// ── Preload fonts (same logic as export-deck.mjs) ──
async function preloadFonts(page) {
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
}

// ── Content-aware duration calculation ──
async function calculateDuration(page, slideEntry) {
  // Check if the page declares a photo cycle duration
  const photoDuration = await page.evaluate(() => window.stellaPhotoDuration || 0);
  if (photoDuration > 0) {
    // Use cycle duration + 2s buffer for the last photo to breathe
    return Math.round((photoDuration + 2) * 10) / 10;
  }

  // Explicit per-slide duration takes priority
  if (typeof slideEntry.duration === 'number') {
    return slideEntry.duration;
  }

  // Deck-level fixed default
  if (typeof DEFAULT_DURATION === 'number') {
    return DEFAULT_DURATION;
  }

  // Auto-calculate from content
  const { wordCount, animGroups, isCoverOrDivider } = await page.evaluate(() => {
    const slide = document.querySelector('.slide');
    if (!slide) return { wordCount: 0, animGroups: 0, isCoverOrDivider: false };

    // Get visible text word count
    const text = slide.innerText || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Count animation order groups
    const orders = new Set();
    slide.querySelectorAll('[data-anim-order]').forEach(el => {
      orders.add(el.dataset.animOrder);
    });

    // Check slide type
    const isCoverOrDivider = slide.classList.contains('slide--cover') ||
                              slide.classList.contains('slide--divider') ||
                              slide.classList.contains('slide--close') ||
                              slide.className.includes('close');

    return { wordCount, animGroups: orders.size, isCoverOrDivider };
  });

  // Base: reading time at ~180wpm (3 words/sec) — slides are skimmed, not read
  let duration = Math.max(3, wordCount / 3);

  // Add time for animation groups
  duration += animGroups * 0.8;

  // Minimum for cover/divider/close slides
  if (isCoverOrDivider) {
    duration = Math.max(duration, 3);
  }

  // Cap at reasonable max
  duration = Math.min(duration, 10);

  return Math.round(duration * 10) / 10; // round to 0.1s
}

// ── Navigate to slide and prepare it ──
async function prepareSlide(page, slideEntry, index, port) {
  const slideFile = slideEntry.ref ? slideEntry.ref.file : slideEntry.file;
  const slideDeck = slideEntry.ref ? slideEntry.ref.deck : deckSlug;
  const url = `http://localhost:${port}/decks/${slideDeck}/slides/${slideFile}`;
  const num = String(index + 1).padStart(2, '0');

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await preloadFonts(page);

  // Set capture mode flag before any scripts run
  await page.evaluate(() => { window.__STELLA_CAPTURE = true; });

  // Inject slide number
  await page.evaluate((slideNum) => {
    const el = document.querySelector('.slide-num');
    if (el) el.textContent = slideNum;
  }, num);

  // Wait for rendering to settle
  await new Promise(r => setTimeout(r, 400));

  // Trigger animations so they exist (but paused)
  await page.evaluate(() => {
    const slide = document.querySelector('.slide');
    if (slide) slide.classList.add('anim-play');
  });

  // Small delay for browser to create animation objects
  await new Promise(r => setTimeout(r, 100));
}

// ── Capture frames for a slide ──
async function captureSlideFrames(page, duration, ffmpegStdin, animOffsetMs = 0) {
  const totalFrames = Math.round(duration * FPS);

  // Pause all animations at the starting offset
  await page.evaluate((offset) => {
    document.getAnimations().forEach(a => {
      a.pause();
      a.currentTime = offset;
    });
  }, animOffsetMs);

  for (let frame = 0; frame < totalFrames; frame++) {
    const timeMs = animOffsetMs + (frame / FPS) * 1000;

    // Advance animation clock and wait for repaint
    await page.evaluate(async (t) => {
      document.getAnimations().forEach(a => {
        a.currentTime = t;
      });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, timeMs);

    // Screenshot and pipe to ffmpeg
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
    });

    if (!ffmpegStdin.write(screenshot)) {
      // Backpressure: wait for drain
      await new Promise(r => ffmpegStdin.once('drain', r));
    }
  }

  return totalFrames;
}

// ── Capture transition frames between slides ──
async function captureTransitionFrames(page, prevFrameBuffer, transition, transitionDuration, port, nextSlide, nextIndex, ffmpegStdin) {
  if (transition === 'cut' || transitionDuration <= 0) {
    return 0;
  }

  const totalFrames = Math.round(transitionDuration * FPS);

  // Navigate to next slide and prepare it
  await prepareSlide(page, nextSlide, nextIndex, port);

  // Pause animations at time 0 for the incoming slide
  await page.evaluate(() => {
    document.getAnimations().forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
  });

  // Get actual screenshot pixel dimensions (accounts for deviceScaleFactor)
  const screenshotW = Math.round(SLIDE_W * SCALE_FACTOR);
  const screenshotH = Math.round(SLIDE_H * SCALE_FACTOR);

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / totalFrames; // 0 to ~1
    const timeMs = (frame / FPS) * 1000;

    // Advance incoming slide animations and wait for repaint
    await page.evaluate(async (ms) => {
      document.getAnimations().forEach(a => {
        a.currentTime = ms;
      });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, timeMs);

    // Capture incoming slide frame
    const incomingFrame = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
    });

    // Composite the two frames using canvas in the browser
    const composited = await page.evaluate(async (prevB64, inB64, blendT, type, w, h) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      const loadImg = (b64) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'data:image/png;base64,' + b64;
      });

      const [prevImg, inImg] = await Promise.all([loadImg(prevB64), loadImg(inB64)]);

      if (type === 'crossfade') {
        // Draw outgoing at decreasing opacity
        ctx.globalAlpha = 1 - blendT;
        ctx.drawImage(prevImg, 0, 0, w, h);
        // Draw incoming at increasing opacity
        ctx.globalAlpha = blendT;
        ctx.drawImage(inImg, 0, 0, w, h);
      } else if (type === 'fade') {
        // Fade through black
        if (blendT < 0.5) {
          // First half: fade out A
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1 - (blendT * 2);
          ctx.drawImage(prevImg, 0, 0, w, h);
        } else {
          // Second half: fade in B
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = (blendT - 0.5) * 2;
          ctx.drawImage(inImg, 0, 0, w, h);
        }
      }

      ctx.globalAlpha = 1;
      return canvas.toDataURL('image/png').split(',')[1];
    }, prevFrameBuffer.toString('base64'), incomingFrame.toString('base64'),
       t, transition, screenshotW, screenshotH);

    const compositedBuffer = Buffer.from(composited, 'base64');
    if (!ffmpegStdin.write(compositedBuffer)) {
      await new Promise(r => ffmpegStdin.once('drain', r));
    }
  }

  return totalFrames;
}

// ── Main ──
async function main() {
  checkFfmpeg();

  console.log(`\nExporting video: "${manifest.title}" (${slides.length} slides)`);
  console.log(`  Resolution: ${OUT_W}x${OUT_H} @ ${FPS}fps\n`);

  mkdirSync(outDir, { recursive: true });

  const port = 3851;
  const server = await startServer(port);
  const chromePath = findChrome();

  const browser = await puppeteer.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
    timeout: 60000,
    protocolTimeout: 120000,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: SLIDE_W,
    height: SLIDE_H,
    deviceScaleFactor: SCALE_FACTOR,
  });

  // First pass: calculate all durations
  const slideDurations = [];
  for (let i = 0; i < slides.length; i++) {
    await prepareSlide(page, slides[i], i, port);
    const duration = await calculateDuration(page, slides[i]);
    const transition = slides[i].transition || DEFAULT_TRANSITION;
    const transitionDuration = slides[i].transitionDuration || DEFAULT_TRANSITION_DURATION;
    slideDurations.push({ duration, transition, transitionDuration });
    process.stdout.write(`  Slide ${i + 1}: ${slides[i].label} — ${duration}s`);
    if (transition !== 'cut') {
      process.stdout.write(` (${transition} ${transitionDuration}s)`);
    }
    console.log('');
  }

  const totalDuration = slideDurations.reduce((sum, s, i) => {
    let d = s.duration;
    // Transition time is shared: subtract from current slide's hold time
    // (transition happens during the last N seconds of the current slide)
    return sum + d;
  }, 0);
  console.log(`\n  Total duration: ${totalDuration.toFixed(1)}s`);
  console.log(`  Estimated frames: ${Math.round(totalDuration * FPS)}\n`);

  // Spawn ffmpeg
  const ffmpeg = spawn('ffmpeg', [
    '-y',                         // overwrite output
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-i', '-',                    // read PNGs from stdin
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '18',
    '-movflags', '+faststart',
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    outPath,
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  let ffmpegErr = '';
  ffmpeg.stderr.on('data', (d) => { ffmpegErr += d.toString(); });

  const ffmpegDone = new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}:\n${ffmpegErr}`));
    });
    ffmpeg.on('error', reject);
  });

  let totalFramesCaptured = 0;

  // Second pass: capture frames
  for (let i = 0; i < slides.length; i++) {
    const { duration, transition, transitionDuration } = slideDurations[i];
    const isLastSlide = i === slides.length - 1;

    // Determine how much of this slide's duration is "hold" vs transition out
    const transOutDuration = (!isLastSlide && slideDurations[i + 1].transition !== 'cut')
      ? slideDurations[i + 1].transitionDuration
      : 0;
    const holdDuration = Math.max(0.5, duration - transOutDuration);

    process.stdout.write(`  Capturing slide ${i + 1}/${slides.length}: ${slides[i].label}...`);

    // Track animation time offset (non-zero if we arrived via a transition)
    let animOffsetMs = 0;

    // Navigate and prepare (skip if we already navigated during transition)
    if (i === 0 || slideDurations[i].transition === 'cut') {
      await prepareSlide(page, slides[i], i, port);
    } else {
      // We arrived via a transition — animations already advanced
      animOffsetMs = slideDurations[i].transitionDuration * 1000;
    }

    // Capture hold frames (continuing from animation offset if we came from a transition)
    const holdFrames = await captureSlideFrames(page, holdDuration, ffmpeg.stdin, animOffsetMs);
    totalFramesCaptured += holdFrames;
    console.log(` ${holdFrames} frames`);

    // Capture transition to next slide
    if (!isLastSlide && slideDurations[i + 1].transition !== 'cut') {
      const nextTransition = slideDurations[i + 1].transition;
      const nextTransDuration = slideDurations[i + 1].transitionDuration;

      process.stdout.write(`  Transition (${nextTransition} ${nextTransDuration}s)...`);

      // Capture last frame of current slide as buffer
      const lastFrame = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
      });

      const transFrames = await captureTransitionFrames(
        page, lastFrame, nextTransition, nextTransDuration,
        port, slides[i + 1], i + 1, ffmpeg.stdin
      );
      totalFramesCaptured += transFrames;
      console.log(` ${transFrames} frames`);
    }
  }

  // Close ffmpeg stdin to signal end of input
  ffmpeg.stdin.end();
  console.log(`\n  Encoding ${totalFramesCaptured} frames...`);

  await ffmpegDone;

  await browser.close();
  server.close();

  console.log(`  Video saved: ${outPath}`);
  console.log(`  (${totalFramesCaptured} frames, ${(totalFramesCaptured / FPS).toFixed(1)}s)\n`);
  console.log('Done.\n');
}

main().catch(err => {
  console.error('Video export failed:', err.message);
  process.exit(1);
});
