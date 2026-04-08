# Stella Decks

An HTML slide deck system with a design system, browser viewer, and pixel-perfect PDF export. Built for AI-native workflows: a CLAUDE.md file makes Claude your deck design partner.

## Quick Start

```bash
git clone https://github.com/your-org/stella-decks.git
cd stella-decks
npm install
```

**Preview the example deck:**

```bash
npx serve .
# Open http://localhost:3000/viewer/index.html?deck=example
```

**Set up your design system:**

Open the project in Claude Code. Claude will detect the empty DESIGN.md and walk you through building your visual identity: colors, typography, spacing, and design principles.

**Create your first deck:**

```bash
mkdir -p decks/my-deck/slides
```

Create a `manifest.json`:

```json
{
  "title": "My First Deck",
  "slides": [
    { "file": "slide-cover.html", "label": "Cover" }
  ]
}
```

Copy a slide from `decks/example/slides/` as a starting point, edit it, and preview at `viewer/index.html?deck=my-deck`.

**Export to PDF:**

```bash
node scripts/export-deck.mjs my-deck
# Output: exports/my-deck/my-deck.pdf
```

## How It Works

**Slides are HTML.** Each slide is a self-contained HTML file (1280x720px, 16:9). They link to a shared CSS design system (`deck.css`) for colors, typography, and components.

**Manifests control order.** Each deck has a `manifest.json` listing slides in order with labels. The viewer and export scripts both read from it.

**The viewer previews in-browser.** `viewer/index.html` loads slides as iframes with keyboard navigation (arrows), overview grid (Esc), and fullscreen (F).

**Export is screenshot-based.** Puppeteer takes 2x retina screenshots of each slide, then pdf-lib composites them into a PDF. This avoids Chrome's print-mode CSS rendering bugs. Slide numbers are auto-injected from manifest order.

## Making It Yours

The design system lives in two places:

- **DESIGN.md** defines your visual identity: colors, typography, spacing, design principles, and rules. This is what Claude reads before making design decisions.
- **deck.css** implements it as CSS custom properties. Override the `:root` tokens to change the entire look.

The fastest way to set up your design system is to open the project in Claude Code and let Claude walk you through it. Upload brand guidelines, share a reference URL, or describe what you want, and Claude will generate a complete DESIGN.md and update deck.css to match.

Or edit DESIGN.md and deck.css manually. The CSS tokens:

```css
:root {
  --ink: #1a2332;        /* Dark backgrounds, headline text */
  --coral: #e06370;      /* Accent color */
  --warm-bg: #faf8f5;    /* Light backgrounds */
  --slate: #6b7a8d;      /* Body text */
  --serif: 'Instrument Serif', Georgia, serif;
  --sans: 'DM Sans', -apple-system, sans-serif;
}
```

## AI-Native Workflow

Stella Decks is designed to work with Claude Code. The CLAUDE.md file teaches Claude:

- How slides are structured (HTML patterns, manifest, components)
- How to edit slides (preserve patterns, add reusable styles to deck.css)
- Your design system (reads DESIGN.md for all visual decisions)
- How to help you build a design system from scratch (Design Setup workflow)

Open the project in Claude Code and ask it to create a slide, adjust a layout, or rethink the narrative arc. Claude reads BRIEF.md for each deck to understand the audience and intent.

## Project Structure

```
stella-decks/
  decks/
    styles/deck.css          # Shared design system
    assets/                  # Shared images
    example/                 # Starter deck (5 template slides)
      manifest.json
      BRIEF.md
      slides/
    {your-deck}/             # Your decks go here
  archive/                   # Parked slides
  context/                   # Research and notes
  exports/                   # Generated PNGs and PDFs
  viewer/index.html          # Slide viewer
  scripts/
    export-deck.mjs          # PNG + PDF export
    export-deck-md.mjs       # Markdown export
    generate-image.mjs       # AI image generation (optional)
  DESIGN.md                  # Your design system brief
  CLAUDE.md                  # AI assistant instructions
  docs/                      # Reference documentation
```

## Export

```bash
# Full export (PNGs + PDF)
node scripts/export-deck.mjs my-deck

# PNGs only (for Google Slides upload)
node scripts/export-deck.mjs my-deck --png-only

# Recompose PDF from existing PNGs
node scripts/export-deck.mjs my-deck --pdf-only

# Export as Markdown
node scripts/export-deck-md.mjs my-deck
```

Output: `exports/{deck}/slides/` (2560x1440 retina PNGs) and `exports/{deck}/{deck}.pdf`.

## Image Generation (Optional)

Generate design-system-aligned images via OpenAI. Add `OPENAI_API_KEY` to `.env`.

```bash
node scripts/generate-image.mjs --prompt "abstract data visualization" --template dark-atmosphere --name my-bg
node scripts/generate-image.mjs --dry-run --prompt "..." --name test  # Preview prompt without API call
```

Templates: `dark-atmosphere`, `light-spot`, `domain-icon`, `hero-background`, `cover-accent`.

## Deploy

Stella Decks is static HTML. Deploy anywhere:

**Any static host:** Upload the repo. Point to `viewer/index.html?deck=your-deck`.

**Vercel:** `npx vercel`. Add a rewrite rule for clean URLs:

```json
{ "rewrites": [{ "source": "/:deck", "destination": "/viewer/index.html?deck=:deck" }] }
```

**GitHub Pages / Netlify / Cloudflare Pages:** Push the repo. No build step needed.

## Philosophy

Stella Decks is opinionated about process, not aesthetics:

- **Slides are code.** Version-controlled HTML, not opaque binary files. Diff, branch, revert.
- **Design system first.** Define your visual identity once. Every slide inherits it.
- **AI-native.** CLAUDE.md + DESIGN.md make Claude a genuine design partner, not just a code generator.
- **Export is pixel-perfect.** Screenshot-based PDF avoids all CSS print rendering issues.
- **Content lives in briefs.** Every deck has a BRIEF.md that captures intent, audience, and key decisions.

## License

MIT
