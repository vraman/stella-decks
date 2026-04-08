# Design System Reference

This document covers the CSS tokens and scales available in `deck.css`. For your project's specific design decisions, see `DESIGN.md` at the repo root.

## CSS Custom Properties

All visual decisions flow through `:root` custom properties in `deck.css`:

### Colors

| Property | Default | Purpose |
|----------|---------|---------|
| `--ink` | `#1a2332` | Dark slide backgrounds, headline text on light slides |
| `--ink-light` | `#2d3a4a` | Secondary dark, card backgrounds on dark slides |
| `--coral` | `#e06370` | Accent color: key stats, italic emphasis, chart highlights |
| `--coral-soft` | `#f0a0a8` | Softer accent for section labels on dark slides |
| `--warm-bg` | `#faf8f5` | Light slide backgrounds |
| `--warm-bg-alt` | `#f3f0eb` | Alternate card background on light slides |
| `--slate` | `#6b7a8d` | Body text on light slides |
| `--slate-light` | `#d0d8e0` | Body text on dark slides, muted elements |
| `--white` | `#ffffff` | Card backgrounds on light slides, text on dark slides |

### Typography

| Property | Default | Purpose |
|----------|---------|---------|
| `--serif` | `'Instrument Serif', Georgia, serif` | Headlines, big numbers, quotes |
| `--sans` | `'DM Sans', -apple-system, sans-serif` | Body text, labels, UI elements |

### Spacing

| Property | Default | Purpose |
|----------|---------|---------|
| `--pad-argument-y` | `56px` | Vertical padding for narrative slides |
| `--pad-argument-x` | `80px` | Horizontal padding for narrative slides |
| `--pad-data-y` | `48px` | Vertical padding for data-dense slides |
| `--pad-data-x` | `64px` | Horizontal padding for data-dense slides |
| `--headline-argument` | `42px` | Font size for narrative slide headlines |
| `--headline-data` | `36px` | Font size for data slide headlines |

## Typography Scale

| Element | Font | Size | Weight | Tracking | Notes |
|---------|------|------|--------|----------|-------|
| Cover headline | Serif | 72px | 400 | -1.5px | Accent italic `<em>` |
| Slide headline | Serif | 42-48px | 400 | -0.5px | `.slide-title` |
| Data headline | Serif | 36px | 400 | -0.5px | `.slide-title--data` |
| Section label | Sans | 12px | 600 | 2.5px | ALL CAPS |
| Card big number | Serif | 48px | 400 | -1px | |
| Card label | Sans | 13px | 500 | | |
| Body text | Sans | 15-17px | 400 | | Left-aligned |
| Slide number | Sans | 11px | 500 | 1px | Auto-injected at export |
| Slide closer | Sans | 18px | 400 | | Narrative bridge |
| Data table header | Sans | 11px | 600 | 1px | ALL CAPS |
| Footer/source | Sans | 9-10px | 400 | | |

## Dark Slide Palette

- Background: `--ink`
- Headlines: white
- Body: `--slate-light`
- Cards: `#1e2d3e` bg, `#2a3a4d` border at 0.5px, 12px border-radius
- Section labels: `--coral-soft`
- Dividers: `#2a3a4d`

## Light Slide Palette

- Background: `--warm-bg`
- Headlines: `--ink`
- Body: `--slate`
- Cards: white bg, `rgba(0,0,0,0.04)` border at 1px, 8px border-radius
- Section labels: `--coral`
- Dividers: `rgba(0,0,0,0.06)`

## Changing the Design System

1. Edit the `:root` block in `deck.css` to change token values
2. Update the `@import` URL if changing fonts
3. Document your changes in `DESIGN.md`
4. Preview the example deck to verify the look

The component styles reference tokens, not hardcoded values. Changing a token updates the entire system.
