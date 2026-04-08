# Customization Guide

How to make Stella Decks look like your brand.

## Step 1: Define Your Design System

Edit `DESIGN.md` at the repo root. This is a structured template that captures your visual identity: colors, typography, spacing, and design principles.

The fastest way: Open the project in Claude Code. Claude detects the empty template and walks you through filling it in. You can upload brand guidelines, share reference URLs, or just describe what you want.

## Step 2: Update CSS Tokens

Edit the `:root` block in `decks/styles/deck.css`:

```css
:root {
  /* Colors */
  --ink: #1a2332;          /* Your dark color */
  --ink-light: #2d3a4a;    /* Your secondary dark */
  --coral: #e06370;        /* Your accent color */
  --coral-soft: #f0a0a8;   /* Softer accent */
  --warm-bg: #faf8f5;      /* Your light background */
  --warm-bg-alt: #f3f0eb;  /* Alternate light */
  --slate: #6b7a8d;        /* Body text */
  --slate-light: #d0d8e0;  /* Muted text */

  /* Fonts */
  --serif: 'Instrument Serif', Georgia, serif;
  --sans: 'DM Sans', -apple-system, sans-serif;

  /* Spacing */
  --pad-argument-y: 56px;
  --pad-argument-x: 80px;
  --pad-data-y: 48px;
  --pad-data-x: 64px;
  --headline-argument: 42px;
  --headline-data: 36px;
}
```

## Step 3: Change Fonts

1. Pick fonts from [Google Fonts](https://fonts.google.com/)
2. Update the `@import` URL at the top of `deck.css`
3. Update `--serif` and `--sans` tokens
4. Preview to check sizes and weights

Example: Switching to Playfair Display + Inter:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --serif: 'Playfair Display', Georgia, serif;
  --sans: 'Inter', -apple-system, sans-serif;
}
```

## Step 4: Add New Components

When you need a layout that doesn't exist in the component library:

1. Find the most similar existing component in `deck.css`
2. Copy its pattern and adapt
3. Name it `.slide--[descriptive-name]` following BEM conventions
4. Add it to `deck.css` (not inline `<style>`) if it's reusable
5. Document it in `docs/components.md`

## Step 5: Create Deck-Specific Overrides

For slides that need one-off styling, use an inline `<style>` block:

```html
<head>
<link rel="stylesheet" href="../../styles/deck.css">
<style>
  .slide--my-custom {
    /* one-off styles */
  }
</style>
</head>
```

Reserve inline styles for truly unique layouts. If you find yourself copying the same inline styles across multiple slides, move them to `deck.css`.

## Tips

- **Start with the example deck.** Copy slides as templates for your own.
- **Preview constantly.** `npx serve .` and check changes in the viewer.
- **Keep commits granular.** Each visual change is its own commit, easy to revert.
- **Use the archive.** Move removed slides to `archive/` instead of deleting.
- **Let the tokens work.** Change a color in `:root` and it updates everywhere. Don't hardcode hex values in component styles.
