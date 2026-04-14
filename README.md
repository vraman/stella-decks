# Stella Decks

An HTML-based slide deck system built for AI-native workflows with [Claude Code](https://claude.ai/code).

## What This Is

Instead of PowerPoint or Google Slides, each slide is a standalone HTML file (1280x720px, 16:9). A shared CSS design system provides the visual foundation. A browser-based viewer lets you preview and navigate. A screenshot pipeline exports pixel-perfect retina PNGs and PDFs.

- **`decks/`** — Where decks live. Each deck has a `manifest.json` (slide order), a `BRIEF.md` (purpose and audience), and individual HTML slide files.
- **`decks/styles/deck.css`** — A shared CSS design system with reusable components: cover slides, stat grids, data tables, quote blocks, section dividers, and more.
- **`viewer/index.html`** — A browser-based slide viewer with keyboard navigation (arrow keys), overview grid (Esc), and fullscreen (F).
- **`scripts/`** — Export tools: screenshot slides to PNG, compose into PDF, export as Markdown, and optionally generate images via OpenAI.
- **`context/`** — A place to drop reference materials: brand guidelines, inspiration decks, research, notes.
- **`DESIGN.md`** — The design system brief: colors, typography, spacing, visual rules. Claude reads this before making any design decision. You can also edit it manually along with the `:root` CSS custom properties in `deck.css`.

## What Claude Does

Open the project in Claude Code and Claude acts as a design partner — part graphic designer, part communication strategist. It thinks about visual hierarchy, narrative flow, and how to tell a compelling visual story.

**First run:** Claude detects a fresh project and walks you through setup:

1. **Design system** — Claude asks what your deck should feel like. Describe a vibe ("The Economist meets a16z"), pick from visual directions, or drop inspiration into `context/` first. Claude proposes colors, typography, spacing, and principles, then writes DESIGN.md and updates the CSS.
2. **First deck** — Claude asks what you're building and for whom, creates the deck structure, proposes a slide outline, and starts building slides.
3. **Export** — When you're ready, ask Claude to export. It runs the screenshot pipeline and produces a PDF.

You talk strategy and narrative. Claude handles the files.

**Two skills ship with Stella Decks:**

- **`/design-setup`** — Build your design system through conversation. One good sentence about what you want is enough to generate an entire design system: hex values, named Google Fonts, pixel spacing, and opinionated design principles written in your voice.
- **`/narrative-review`** — Review a deck's story structure the way a communications advisor would. Catches structural problems that are easy to miss: a thesis that never gets paid off, a data section that undermines what came before, a closing that doesn't connect back to the opening.

If you use [gstack](https://github.com/garrytan/gstack), `/design-consultation` is an alternative to `/design-setup` that adds competitive research and AI mockup previews.

## Quick Start

```bash
git clone https://github.com/rsarver/stella-decks.git
cd stella-decks
npm install
npm start
```

Open `http://localhost:3000` to see the example deck. Then open the project in Claude Code.

## How It Works

**Slides are HTML.** Each slide is a self-contained `.html` file linking to the shared `deck.css`. They use a component library of CSS classes for layout: `.slide--cover`, `.slide--thesis`, `.slide--data`, etc.

**Manifests control order.** Each deck has a `manifest.json` listing slides in sequence with labels. The viewer and export scripts both read from it. Filenames are descriptive slugs (`slide-thesis.html`), not numbered.

**Export is screenshot-based.** Puppeteer takes 2x retina screenshots of each slide, then pdf-lib composites them into a PDF. This avoids Chrome's print-mode CSS rendering bugs with `overflow: hidden`, `border-radius`, and `backdrop-filter`. Slide numbers are auto-injected from manifest order during export.

## Project Structure

```
stella-decks/
  decks/
    styles/deck.css              # Shared design system (token-driven CSS)
    assets/                      # Shared images across decks
    example/                     # Starter deck (5 template slides)
      manifest.json
      BRIEF.md
      slides/
    {your-deck}/                 # Your decks go here
  .claude/skills/
    design-setup/                # /design-setup — build your design system
    narrative-review/            # /narrative-review — review deck story structure
  archive/                       # Parked slides (move, don't delete)
  context/                       # Drop brand materials, research, notes here
  exports/                       # Generated PNGs and PDFs
  viewer/index.html              # Browser-based slide viewer
  scripts/
    export-deck.mjs              # Puppeteer screenshot -> PDF pipeline
    export-deck-md.mjs           # Deck -> Markdown exporter
    generate-image.mjs           # AI image generation (optional)
  DESIGN.md                      # Your design system brief
  CLAUDE.md                      # Teaches Claude how the system works
  docs/                          # Reference: design tokens, components, workflow
```

## Export

Ask Claude to export your deck, or run it directly:

```bash
node scripts/export-deck.mjs my-deck           # PNGs + PDF
node scripts/export-deck.mjs my-deck --png-only # PNGs only (for Google Slides)
node scripts/export-deck-md.mjs my-deck         # Markdown export
```

Output: `exports/{deck}/slides/` (2560x1440 retina PNGs) and `exports/{deck}/{deck}.pdf`.

## Image Generation (Optional)

Generate design-system-aligned images for slide backgrounds, icons, and case study visuals using OpenAI's image API. Add `OPENAI_API_KEY` to `.env`.

Templates: `dark-atmosphere`, `light-spot`, `domain-icon`, `hero-background`, `cover-accent`.

## Deploy

Stella Decks is static HTML. Deploy anywhere:

- **Vercel:** `npx vercel` with a rewrite: `{ "source": "/:deck", "destination": "/viewer/index.html?deck=:deck" }`
- **GitHub Pages / Netlify / Cloudflare Pages:** Push the repo. No build step needed.
- **Any static host:** Point to `viewer/index.html?deck=your-deck`.

## Philosophy

- **Slides are code.** Version-controlled HTML. Diff, branch, revert.
- **Design system first.** Define your visual identity once. Every slide inherits it.
- **AI-native.** CLAUDE.md + DESIGN.md make Claude a design partner, not a code generator.
- **Export is pixel-perfect.** Screenshots avoid CSS print rendering bugs.
- **Content lives in briefs.** Every deck has a BRIEF.md that captures intent and audience.

## License

MIT
