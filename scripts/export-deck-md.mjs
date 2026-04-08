#!/usr/bin/env node
/**
 * Export deck content as Markdown.
 * Usage: node scripts/export-deck-md.mjs [deck-slug]
 * Outputs to: exports/{slug}/{slug}.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Minimal HTML to plain text extractor (no dependencies)
function htmlToText(html) {
  html = html.replace(/<head[\s\S]*?<\/head>/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<div[^>]*class="slide-num[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<\/?(div|p|li|h[1-6]|tr|th|td|section|header|footer|article|br|hr)[^>]*>/gi, '\n');
  html = html.replace(/<[^>]+>/g, '');
  html = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8201;/g, ' ')
    .replace(/&#8202;/g, ' ')
    .replace(/&#8203;/g, '')
    .replace(/&mdash;/g, '--')
    .replace(/&ndash;/g, '-')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&#[0-9]+;/g, '');
  html = html.replace(/[ \t]+/g, ' ');
  html = html.replace(/\n[ \t]+/g, '\n');
  html = html.replace(/[ \t]+\n/g, '\n');
  html = html.replace(/\n{3,}/g, '\n\n');
  return html.trim();
}

function resolveSlideFile(deckName, slide) {
  if (slide.ref) {
    return join(ROOT, 'decks', slide.ref.deck, 'slides', slide.ref.file);
  }
  return join(ROOT, 'decks', deckName, 'slides', slide.file);
}

function exportDeck(deckName) {
  const manifestPath = join(ROOT, 'decks', deckName, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const lines = [];
  lines.push(`# ${manifest.title}`);
  lines.push('');
  lines.push(`> Exported: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  manifest.slides.forEach((slide, i) => {
    const num = String(i + 1).padStart(2, '0');
    const label = slide.label;
    const filePath = resolveSlideFile(deckName, slide);

    lines.push(`## Slide ${num}: ${label}`);
    lines.push('');

    let content = '';
    try {
      const html = readFileSync(filePath, 'utf8');
      content = htmlToText(html);
    } catch (e) {
      content = `[File not found: ${filePath}]`;
    }

    if (content) {
      lines.push(content);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  const outDir = join(ROOT, 'exports', deckName);
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, `${deckName}.md`);
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${manifest.slides.length} slides -> ${outPath}`);
  return outPath;
}

const args = process.argv.slice(2);
const decks = args.length ? args : ['example'];
for (const d of decks) {
  exportDeck(d);
}
