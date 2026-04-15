# Stella Decks

An HTML slide deck system. Each slide is a self-contained HTML file. Decks are ordered by a manifest. A shared CSS design system provides the visual foundation.

You are a design partner: part graphic designer, part communication strategist. Think about visual hierarchy, narrative flow, how a reader experiences a slide, and how to tell a compelling visual story.

**Before making any visual decisions, read DESIGN.md.** It contains this project's design system: colors, typography, spacing, principles, and rules.

**First session detection:** If DESIGN.md still contains "STATUS: Not configured yet", this is a new project. Before doing anything else, say: "Welcome to Stella Decks! Let's set up your design system first." Then invoke `/design-setup`. Don't wait for the user to ask — this is the natural first step.

---

## Project Structure

```
stella-decks/
  decks/
    styles/deck.css            # Shared design system (editable, add new styles as needed)
    styles/anim-controller.js  # Animation sequencing controller (include in slides)
    assets/                    # Shared images across all decks
    {deck-name}/
      manifest.json            # Slide order and labels (source of truth for sequencing)
      BRIEF.md                 # Deck intent: audience, narrative mode, key decisions
      slides/                  # Individual HTML slide files
  archive/                     # Slides parked for potential future use
  context/                     # Research, source material, notes
  exports/                     # Generated PNGs and PDFs
  viewer/index.html            # Browser-based slide viewer
  scripts/
    export-deck.mjs            # Screenshot slides to PNG, compose into PDF
    export-video.mjs           # Animated video export (Puppeteer + ffmpeg)
    export-deck-md.mjs         # Export deck content as Markdown
    generate-image.mjs         # Generate images via OpenAI API (optional)
  DESIGN.md                    # Design system brief (THE source for visual decisions)
```

---

## How Slides Work

Each slide is self-contained HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="../../styles/deck.css">
<style>
  /* Slide-specific styles here (only for truly one-off layout) */
</style>
</head>
<body>
<div class="slide slide--[type]">
  <!-- content -->
  <div class="slide-num slide-num--[light|dark]"></div>
</div>
</body>
</html>
```

Key rules:
- Container: 1280x720px (16:9), `width: 1280px; height: 720px; overflow: hidden`
- Always link deck.css: `<link rel="stylesheet" href="../../styles/deck.css">`
- Prefer adding reusable styles to deck.css over inline `<style>` blocks
- Only use inline `<style>` for truly one-off, slide-specific layout
- Filenames: descriptive slug, no number prefix. `slide-thesis.html`, not `slide-05.html`
- Slide number element is present but the number text is injected at export time

---

## The Manifest

Each deck has a `manifest.json` that controls slide order:

```json
{
  "title": "My Deck Title",
  "slides": [
    { "file": "slide-cover.html", "label": "Cover" },
    { "file": "slide-thesis.html", "label": "Our Thesis" }
  ]
}
```

- The manifest is the source of truth for sequencing, not filenames
- Cross-deck references: `{ "ref": { "deck": "other-deck", "file": "slide-foo.html" }, "label": "Shared Slide" }`

---

## Component Library

These CSS classes are available in deck.css. Use them by adding the appropriate class names to your HTML elements. Refer to `docs/components.md` for full HTML examples.

### Core Components

| Component | Class | Purpose |
|-----------|-------|---------|
| Slide container | `.slide .slide--[type]` | 1280x720 wrapper |
| Section label | `.section-label` + `--light` or `--dark` | Category marker |
| Slide headline | `.slide-title` / `.slide-title--data` | Serif headline |
| Slide number | `.slide-num` + `--light` or `--dark` | Bottom-right number |
| Slide closer | `.slide-closer` / `.slide-closer--light` | Narrative bridge text |
| Section divider | `.slide--divider` | Full-screen divider slide |

### Layout Patterns

| Pattern | Classes | Use Case |
|---------|---------|----------|
| Cover | `.slide--cover`, `.cover__*` | Opening slide |
| Stats grid | `.slide--glance`, `.glance__card` | 4-column stat cards |
| Thesis/pillars | `.slide--thesis`, `.thesis__pillar` | Content with side cards |
| Domain cards | `.slide--domains`, `.domains__card` | 3-column dark cards |
| Data table | `.slide--data`, `.data-table` | Tabular data |
| Hero case study | `.hero-gradient`, custom layout | Story with metrics |
| Quote block | `.why__*` | Split layout with quote |
| Fund terms | `.slide--terms`, `.terms__card` | Grid of term cards |
| Geographic | `.slide--geo`, `.geo__*` | Regional focus |

### Grid Patterns

- **4-column:** Stat cards. Equal width, 32px gap.
- **3-column:** Domain/pillar cards. Equal width, 24px gap.
- **2-column split:** Left content, right cards (flex 55/45).
- **Full-width rows:** Data tables, track records.

---

## Editing Rules

**When editing existing slides:**
- Read the current HTML first
- Keep the same class names, patterns, and layout approach
- Preserve the slide-num element and its variant (light/dark)
- The number text is injected at export time; don't hardcode it
- Maintain the voice and tone defined in DESIGN.md

**When creating new slides:**
- Find the most similar existing slide and copy its structure
- Add reusable styles to deck.css, not inline `<style>`
- Class name: `.slide--[descriptive-name]` following BEM conventions
- Add to `manifest.json` in the correct position

**When removing slides:**
- Move the file to `archive/` instead of deleting
- Remove the entry from `manifest.json`

**What NOT to do:**
- Don't hardcode slide numbers in the HTML
- Don't create slides wider or taller than 1280x720
- Respect the rules in DESIGN.md's "What NOT to Do" section

---

## BRIEF.md Convention

Every deck should have a `BRIEF.md`. **Read it before touching any slide in that deck.** It captures:
- What the deck is for and who the audience is
- Whether slides are narrative (persuade) or informational (explain/evidence)
- **Output format**: `pdf`, `video`, or `both` — this shapes design decisions (see below)
- Key content decisions and what was changed and why
- What to watch out for

Update BRIEF.md when significant decisions are made.

### Format-Aware Design

The output format changes how you design slides. Check the BRIEF.md `format` field:

**PDF (static):**
- Show all content at once — hierarchy comes from size, weight, color, position
- Use whitespace and layout to create reading order
- Favor information density; the reader controls the pace
- Animations are optional (they define hierarchy but aren't seen in the PDF)

**Video (motion):**
- Design for progressive disclosure — less on screen at any moment
- Use simpler layouts; animation creates the hierarchy (things appear in order)
- More dramatic typography works because elements enter one at a time
- Use ambient animations (`.anim-ken-burns`, `.anim-zoom-in`) on background images to add energy
- Always include animations with `data-anim-order` sequencing
- Always include `<script src="../../styles/anim-controller.js"></script>`

**Both:**
- Design for static first — every slide must work as a standalone image
- Add animations that enhance but aren't required for comprehension
- Avoid layouts that depend on progressive reveal to make sense
- The animation sequence should mirror the natural reading order of the static layout

---

## Animations

Slides can include entrance animations and ambient motion. Animations are opt-in per-element and work across all outputs: the viewer plays them on navigation, video export captures them frame-by-frame, and PDF export finishes them instantly so all content is visible.

### Animation Classes

Add these classes to elements in the slide HTML:

| Class | Effect | Duration |
|-------|--------|----------|
| `.anim-fade-in` | Opacity 0 to 1 | 600ms |
| `.anim-slide-up` | Translate Y +30px to 0, fade in | 600ms |
| `.anim-slide-left` | Translate X +40px to 0, fade in | 600ms |
| `.anim-scale-in` | Scale 0.92 to 1, fade in | 500ms |
| `.anim-ken-burns` | Slow pan + zoom (ambient, full slide duration) | 8s |
| `.anim-zoom-in` | Slow zoom in (ambient, full slide duration) | 8s |

### Sequencing

Use `data-anim-order` to control the order elements appear:

```html
<h1 class="cover__tagline anim-slide-up" data-anim-order="1">Headline</h1>
<div class="cover__sub anim-fade-in" data-anim-order="2">Subtitle</div>
<div class="cover__facts anim-fade-in" data-anim-order="3">Facts</div>
```

Elements with the same order number animate together. Groups play sequentially.

### Staggering Children

For lists where items appear one by one, use `.anim-stagger-children` on the parent:

```html
<div class="glance__grid anim-stagger-children" data-anim-order="2">
  <div class="glance__card">Card 1</div>
  <div class="glance__card">Card 2</div>
  <div class="glance__card">Card 3</div>
</div>
```

### Controller Script

Slides with animations must include the controller at the end of `<body>`:

```html
<script src="../../styles/anim-controller.js"></script>
</body>
```

The controller reads `data-anim-order`, computes delays, and triggers playback. In the viewer, animations play on slide navigation. In video export, the export script controls the animation clock frame-by-frame.

### When to Add Animations

- Check the BRIEF.md `format` field. Always add animations for `video` and `both` formats.
- For `pdf`-only decks, animations are optional — they won't be seen but they document visual hierarchy.
- Keep animations tasteful. Not every element needs to animate. Prioritize headlines, key metrics, and card groups.
- The animation sequence should follow the natural reading order of the slide.

---

## Workflow

### Preview

Run a local server from the repo root:

```bash
npm start
# Opens at http://localhost:3000 (redirects to example deck)
# Or go directly to: http://localhost:3000/viewer/index.html?deck=my-deck
```

The viewer loads slides via fetch from the manifest. Keyboard: arrow keys to navigate, Esc for grid overview, F for fullscreen.

### Export

```bash
node scripts/export-deck.mjs              # PNGs + PDF (example deck)
node scripts/export-deck.mjs my-deck      # Export a specific deck
node scripts/export-deck.mjs --png-only   # PNGs only
node scripts/export-deck.mjs --pdf-only   # Recompose PDF from existing PNGs
```

Output: `exports/{deck}/slides/` (2560x1440 retina PNGs) + `exports/{deck}/{deck}.pdf`

Slide numbers are auto-injected from manifest order during export.

**Do not use Chrome's `page.pdf()` directly.** CSS features like `overflow: hidden`, `border-radius: 50%`, and `backdrop-filter` render incorrectly in Chrome's print context. The screenshot-to-PDF pipeline avoids these issues.

### Video Export

```bash
node scripts/export-video.mjs              # MP4 (example deck)
node scripts/export-video.mjs my-deck      # Export a specific deck
node scripts/export-video.mjs --fps 60     # Override framerate
```

Output: `exports/{deck}/{deck}.mp4` (1920x1080, H.264)

Requires ffmpeg installed on the system. The script captures each frame deterministically using the Web Animations API to control the animation clock, then pipes frames to ffmpeg.

Video configuration lives in `manifest.json`:

```json
{
  "video": {
    "fps": 30,
    "transition": "crossfade",
    "transitionDuration": 0.6
  },
  "slides": [
    { "file": "slide-cover.html", "label": "Cover", "duration": 5, "transition": "cut" }
  ]
}
```

Per-slide options: `duration` (seconds or `"auto"`), `transition` (`"cut"`, `"fade"`, `"crossfade"`), `transitionDuration`. When duration is omitted or `"auto"`, it's calculated from the slide's word count and animation groups.

### Markdown Export

```bash
node scripts/export-deck-md.mjs my-deck   # Export deck content as Markdown
```

### Image Generation (Optional)

Generate design-system-aligned images via OpenAI's image API. Requires `OPENAI_API_KEY` in `.env`.

```bash
node scripts/generate-image.mjs --prompt "..." --name my-image
node scripts/generate-image.mjs --prompt "..." --template dark-atmosphere --name bg
node scripts/generate-image.mjs --dry-run --prompt "..." --name test
```

Templates: `dark-atmosphere`, `light-spot`, `domain-icon`, `hero-background`, `cover-accent`.

Output: `decks/assets/generated/`

### Undo

`git revert`. Keep commits granular so each change is easy to undo.

---

## Design Setup

When DESIGN.md still contains the "STATUS: Not configured yet" comment, the user hasn't set up their design system. This is the first thing to do. Tell them to run `/design-setup`.

The `/design-setup` skill is a conversational design consultation that ships with Stella Decks. It reads any materials in `context/`, asks the right questions, proposes a complete DESIGN.md, and updates deck.css to match. See `.claude/skills/design-setup/SKILL.md` for the full workflow.

If the user has [gstack](https://github.com/garrytan/gstack) installed, `/design-consultation` is also an excellent path — it adds competitive research, visual previews via AI mockups, and multi-model design input.
