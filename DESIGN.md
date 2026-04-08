# Design System

<!-- This file defines the visual identity for your deck.
     Claude reads this before making any design decisions.
     Fill in each section to make the system yours.
     Tip: Ask Claude to help you build this — run the Design Setup workflow. -->

## Brand

<!-- Your brand name, positioning, one-line description.
     Example: "Acme Ventures — Europe's deep-tech seed fund" -->

## Voice

<!-- How your deck speaks. Give 2-3 adjectives and a sentence about
     what you want the reader to feel when they finish a slide.

     Examples:
     - "Confident, restrained, editorial. The reader should feel like
       they're reading The Economist, not a sales brochure."
     - "Warm, analytical, direct. Data-driven but human."
     - "Bold, ambitious, urgent. Every slide should feel like a headline." -->

## Color Palette

<!-- Define your color tokens. At minimum you need: a dark background,
     a light background, an accent color, headline text, body text, and muted text.
     These map directly to CSS custom properties in deck.css.

     The defaults (from deck.css) are shown below. Replace them with your palette.

     | Token           | Hex       | Usage                              |
     |-----------------|-----------|-------------------------------------|
     | --ink           | #1a2332   | Dark slide backgrounds, headlines   |
     | --ink-light     | #2d3a4a   | Secondary dark                      |
     | --coral         | #e06370   | Accent: key stats, italic emphasis  |
     | --coral-soft    | #f0a0a8   | Section labels on dark slides       |
     | --warm-bg       | #faf8f5   | Light slide backgrounds             |
     | --warm-bg-alt   | #f3f0eb   | Alternate card background           |
     | --slate         | #6b7a8d   | Body text on light slides           |
     | --slate-light   | #d0d8e0   | Body text on dark slides            |
     | --white         | #ffffff   | Cards on light, text on dark        |

     Accent color rule: What role does the accent play? Is it punctuation
     (highlight one element per slide) or is it used more freely? -->

## Typography

<!-- Headline font and body font. Recommend Google Fonts for easy loading.
     The defaults are Instrument Serif (headlines) + DM Sans (body).

     | Element         | Font          | Size    | Weight | Notes              |
     |-----------------|---------------|---------|--------|--------------------|
     | Cover headline  | Serif         | 72px    | 400    | Accent italic <em> |
     | Slide headline  | Serif         | 42-48px | 400    | -0.5px tracking    |
     | Section label   | Sans          | 12px    | 600    | ALL CAPS, 2.5px    |
     | Card big number | Serif         | 48px    | 400    |                    |
     | Body text       | Sans          | 15-17px | 400    | Left-aligned       |
     | Slide number    | Sans          | 11px    | 500    |                    |

     Key question: Serif or sans headlines?
     - Serif = editorial, authoritative (The Economist, Index Ventures)
     - Sans = modern, clean (Linear, Vercel) -->

## Slide Rhythm

<!-- How do you alternate slide types? The default system uses dark/light:
     - Dark slides (--ink background): Make assertions, one idea per slide
     - Light slides (--warm-bg background): Present evidence, data, proof

     You can keep this rhythm, use all one tone, or define your own system.
     What does each slide "type" mean in your deck? -->

## Spacing

<!-- Padding tiers. The defaults:
     - Argument slides (narrative, fewer elements): 56px top/bottom, 80px sides
     - Data slides (dense tables/grids): 48px top/bottom, 64px sides
     - Card grid gap: 24-32px
     - Card internal padding: 24-32px

     Are your slides generous with whitespace or dense with content? -->

## Design Principles

<!-- 3-5 rules that guide visual decisions. These are the most important
     part of this file — they tell Claude HOW to think about your slides.

     Examples:
     - "Typography carries the design. When in doubt, make the headline bigger
       and remove decoration."
     - "Every element earns its space. White space beats filler."
     - "Accent color is punctuation. Highlights one key element per slide.
       Used everywhere, it loses power."
     - "Editorial, not corporate. No gradients, no decorative shapes,
       no stock photography."
     - "Flat design. Only shadow: subtle card shadow on light backgrounds." -->

## What NOT to Do

<!-- Anti-patterns. What should Claude avoid when editing your slides?

     Examples:
     - No gradients or decorative shapes
     - No centered body text (exception: closing slide)
     - No em dashes (use commas, periods, or colons)
     - No stock photography
     - Never use the accent color as a background fill for large areas
     - No shadows except subtle card shadow on light backgrounds -->

## Component Aesthetics

<!-- How should reusable components look?

     Cards:
     - Light slides: white bg, 8px border-radius, 1px border rgba(0,0,0,0.04)
     - Dark slides: #1e2d3e bg, 12px border-radius, 0.5px border #2a3a4d

     Tables:
     - Header: sans 13px 600, 2.5px bottom border
     - Rows: 14px, 1px dividers

     Quotes:
     - Serif italic, with accent-colored opening mark

     Emphasis in headlines:
     - Italic serif in accent color via <em>. Never bold. -->
