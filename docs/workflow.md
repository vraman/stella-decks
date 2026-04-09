# Workflow Guide

Day-to-day workflow for building and maintaining decks.

## Preview

Start a local server:

```bash
npm start
```

Opens at `http://localhost:3000` (redirects to example deck). To view a specific deck:

```
http://localhost:3000/viewer/index.html?deck=my-deck
```

### Viewer Controls

| Key | Action |
|-----|--------|
| Left/Right arrows | Navigate slides |
| Escape | Toggle overview grid |
| F | Toggle fullscreen |

The viewer reads from `manifest.json`. Changes to slide HTML are visible on reload. Changes to the manifest require a page refresh.

## Creating a New Deck

```bash
mkdir -p decks/my-deck/slides
```

Create `decks/my-deck/manifest.json`:

```json
{
  "title": "My Deck",
  "slides": [
    { "file": "slide-cover.html", "label": "Cover" }
  ]
}
```

Create `decks/my-deck/BRIEF.md` documenting the deck's purpose and audience.

Copy slides from `decks/example/slides/` as starting points.

## Creating a New Slide

1. Find the most similar existing slide
2. Copy it as `decks/{deck}/slides/slide-{descriptive-name}.html`
3. Edit the content, keeping the class structure
4. Add it to `manifest.json` in the correct position
5. Preview in the viewer

## Reordering Slides

Edit `manifest.json`. The manifest controls order, not filenames.

## Removing Slides

1. Move the file to `archive/`
2. Remove the entry from `manifest.json`

Never delete slide files. The archive preserves work for potential future use.

## Exporting

### PDF + PNG Export

```bash
node scripts/export-deck.mjs my-deck
```

Produces:
- `exports/my-deck/slides/01-slide-cover.png` (2560x1440, retina)
- `exports/my-deck/my-deck.pdf` (1280x720pt pages)

Slide numbers are auto-injected from manifest order.

### PNG Only (for Google Slides)

```bash
node scripts/export-deck.mjs my-deck --png-only
```

Upload the PNGs to Google Slides as full-slide images.

### Markdown Export

```bash
node scripts/export-deck-md.mjs my-deck
```

Extracts text content from all slides. Useful for providing deck content as context to AI tools.

## Image Generation

Optional. Requires `OPENAI_API_KEY` in `.env`.

```bash
# Generate with a template
node scripts/generate-image.mjs --prompt "neural network visualization" --template dark-atmosphere --name my-bg

# Preview the prompt without calling the API
node scripts/generate-image.mjs --dry-run --prompt "..." --name test

# Generate for a specific deck
node scripts/generate-image.mjs --prompt "..." --name icon --deck my-deck
```

Templates: `dark-atmosphere`, `light-spot`, `domain-icon`, `hero-background`, `cover-accent`.

Output: `decks/assets/generated/` (shared) or `decks/{deck}/assets/generated/` (deck-specific).

Use generated images in slides:

```html
<!-- Hero background -->
<div class="hero__bg">
  <img src="../../assets/generated/my-bg.png" alt="">
</div>
<div class="hero-gradient"></div>

<!-- Atmospheric overlay -->
<div style="position:absolute;inset:0;background-image:url('../../assets/generated/my-bg.png');background-size:cover;opacity:0.2;pointer-events:none;"></div>
```

## Deploy

Stella Decks is static HTML. No build step required.

**Local sharing:** `npx serve .` and share your IP.

**Vercel:** Push the repo, add a rewrite rule for clean URLs.

**GitHub Pages:** Enable in repo settings. Point to root.

**Any static host:** Upload the entire directory.

## Version Control Tips

- Keep commits granular: one visual change per commit
- Use `git revert` to undo changes (not `git reset`)
- Commit DESIGN.md and BRIEF.md changes separately from slide changes
- The exports/ directory is gitignored; re-export as needed
