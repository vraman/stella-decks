#!/usr/bin/env node
/**
 * Generate design-system-aligned images using OpenAI's image API.
 * Reads visual style from DESIGN.md or falls back to sensible defaults.
 *
 * Usage:
 *   node scripts/generate-image.mjs --prompt "..." --name my-image
 *   node scripts/generate-image.mjs --prompt "..." --template dark-atmosphere --name shift-bg
 *   node scripts/generate-image.mjs --dry-run --template domain-icon --prompt "..." --name test
 *
 * Output: decks/assets/generated/{name}.{format}
 */

import { readFileSync, mkdirSync, existsSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Load .env ──
function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── CLI Arguments ──
const { values: args } = parseArgs({
  options: {
    prompt:     { type: 'string' },
    template:   { type: 'string' },
    size:       { type: 'string', default: '1536x1024' },
    format:     { type: 'string', default: 'png' },
    background: { type: 'string', default: 'auto' },
    quality:    { type: 'string', default: 'high' },
    name:       { type: 'string' },
    deck:       { type: 'string' },
    reference:  { type: 'string' },
    model:      { type: 'string', default: 'gpt-image-1' },
    'dry-run':  { type: 'boolean', default: false },
    help:       { type: 'boolean', default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`
  generate-image.mjs -- Generate design-system-aligned images for slides

  Required:
    --prompt "..."       Creative prompt (prepended with design system prefix)
    --name slug          Output filename slug (no extension)

  Optional:
    --template name      dark-atmosphere | light-spot | domain-icon | hero-background | cover-accent
    --size WxH           1536x1024 (default) | 1024x1024 | 1024x1536
    --format fmt         png (default) | webp
    --background mode    auto (default) | transparent
    --quality level      high (default) | medium | low
    --deck slug          Save to decks/{slug}/assets/generated/ instead of shared
    --reference paths    Comma-separated image paths for style consistency
    --model id           gpt-image-1 (default) | gpt-image-1.5 | gpt-image-1-mini
    --dry-run            Print full prompt without calling API
    --help               Show this help
  `);
  process.exit(0);
}

if (!args.prompt) { console.error('Error: --prompt is required'); process.exit(1); }
if (!args.name)   { console.error('Error: --name is required');   process.exit(1); }

// ── Design System Prompt ──
// Reads style guidance from DESIGN.md if available, otherwise uses a generic default.
function loadDesignPrefix() {
  const designPath = resolve(root, 'DESIGN.md');
  if (existsSync(designPath)) {
    const content = readFileSync(designPath, 'utf-8');
    // Extract color palette and design principles for image generation context
    const colors = content.match(/## Color Palette[\s\S]*?(?=\n## )/)?.[0] || '';
    const principles = content.match(/## Design Principles[\s\S]*?(?=\n## )/)?.[0] || '';
    const notToDo = content.match(/## What NOT to Do[\s\S]*?(?=\n## |$)/)?.[0] || '';

    if (colors || principles) {
      return `Visual style based on project design system. ${colors}\n${principles}\n${notToDo}\nNo text in the image. No logos unless explicitly requested.`;
    }
  }

  // Fallback: generic editorial style
  return `Editorial, restrained visual style. Flat design with no gradients or decorative shapes. Clean geometric forms. Large areas of negative space. No text in the image. No logos. No stock photography aesthetics. Serious, intelligent, understated.`;
}

const BASE_PREFIX = loadDesignPrefix();

const TEMPLATES = {
  'dark-atmosphere': `Background texture for a dark slide. Near-black tones dominating, with sparse accent color points or lines. Abstract, atmospheric: think particles, data networks, fields of light in darkness. Must work behind white text when overlaid at 15-30% opacity. No focal point competing with text. Horizontal composition.`,

  'light-spot': `Small accent illustration for a light-background slide. Monochrome using only dark tones with optional accent color. Style like a woodcut or risograph print. Completely flat, no shadows, no 3D, no perspective. Simple, iconic, editorial.`,

  'domain-icon': `Monochrome icon/symbol on a transparent background. Flat, geometric, minimal strokes. No fills, no gradients, no 3D. Editorial infographic iconography style.`,

  'hero-background': `Full-bleed background image for a case study slide. Dark overall tone (will be behind a gradient overlay and white text). Stylized, abstract representation of the technology or product. Rich in subtle detail but not photorealistic. Moody, atmospheric, editorial.`,

  'cover-accent': `Extremely subtle background element for a dark cover slide. Near-monochrome with barely-visible lighter forms. Maximum restraint. The best version is the one you almost cannot see. Will sit behind large serif typography.`,
};

// ── Build Full Prompt ──
function buildPrompt() {
  let parts = [BASE_PREFIX];

  if (args.template) {
    const tmpl = TEMPLATES[args.template];
    if (!tmpl) {
      console.error(`Error: unknown template "${args.template}". Available: ${Object.keys(TEMPLATES).join(', ')}`);
      process.exit(1);
    }
    parts.push(tmpl);
  }

  parts.push(args.prompt);
  return parts.join('\n\n');
}

// ── Template overrides ──
function applyTemplateDefaults() {
  if (args.template === 'domain-icon') {
    args.background = 'transparent';
    args.format = 'png';
  }
}

// ── Output path ──
function getOutputPath() {
  const ext = args.format === 'webp' ? 'webp' : 'png';
  const dir = args.deck
    ? resolve(root, 'decks', args.deck, 'assets', 'generated')
    : resolve(root, 'decks', 'assets', 'generated');
  mkdirSync(dir, { recursive: true });
  return resolve(dir, `${args.name}.${ext}`);
}

// ── Main ──
async function main() {
  applyTemplateDefaults();
  const fullPrompt = buildPrompt();
  const outputPath = getOutputPath();

  console.log(`\n  Model:      ${args.model}`);
  console.log(`  Template:   ${args.template || '(none)'}`);
  console.log(`  Size:       ${args.size}`);
  console.log(`  Format:     ${args.format}`);
  console.log(`  Background: ${args.background}`);
  console.log(`  Quality:    ${args.quality}`);
  console.log(`  Output:     ${outputPath}`);
  console.log(`\n  Full prompt:\n  ${fullPrompt.replace(/\n/g, '\n  ')}\n`);

  if (args['dry-run']) {
    console.log('  [dry-run] No API call made.\n');
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not set. Add it to .env or set as environment variable.');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const params = {
    model: args.model,
    prompt: fullPrompt,
    n: 1,
    size: args.size,
    quality: args.quality,
    response_format: 'b64_json',
  };

  if (args.model.startsWith('gpt-image')) {
    params.output_format = args.format;
    params.background = args.background;
    delete params.response_format;
  }

  console.log('  Generating...');

  try {
    const result = await openai.images.generate(params);
    const imageData = result.data[0].b64_json;
    const buffer = Buffer.from(imageData, 'base64');

    await writeFile(outputPath, buffer);
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
    console.log(`  Done. ${sizeMB}MB written to ${outputPath}\n`);
  } catch (err) {
    console.error(`\n  Generation failed: ${err.message}`);
    if (err.status === 401) console.error('  Check your OPENAI_API_KEY.');
    if (err.status === 429) console.error('  Rate limited. Wait and retry.');
    process.exit(1);
  }
}

main();
