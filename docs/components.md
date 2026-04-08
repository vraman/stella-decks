# Component Library

Copy-paste HTML patterns from `deck.css`. Each component is shown with its HTML structure and relevant class names.

## Section Label

```html
<!-- On light slides -->
<div class="section-label section-label--light">Section Name</div>

<!-- On dark slides -->
<div class="section-label section-label--dark">Section Name</div>
```

## Slide Headline

```html
<!-- Standard headline with accent emphasis -->
<h2 class="slide-title">The key idea with <em>one emphasized phrase</em></h2>

<!-- Compact headline for data-dense slides -->
<h2 class="slide-title slide-title--data">Data Slide Title</h2>
```

One accent `<em>` per headline. Pick the single most important concept.

## Slide Number

```html
<!-- Light background slide -->
<div class="slide-num slide-num--light"></div>

<!-- Dark background slide -->
<div class="slide-num slide-num--dark"></div>
```

Always include this element. The number is auto-injected at export time.

## Slide Closer (Bridge)

```html
<!-- On dark slides (default) -->
<div class="slide-closer">
  A sentence that bridges to the next slide. Not a content block.
</div>

<!-- On light slides -->
<div class="slide-closer slide-closer--light">
  A sentence that bridges to the next slide.
</div>
```

## Cover Slide

```html
<div class="slide slide--cover">
  <div class="cover__top">
    <div class="cover__logo"><!-- Logo image or text --></div>
    <div class="cover__fund">Label / Date</div>
  </div>
  <div class="cover__middle">
    <div class="cover__positioning">POSITIONING LINE</div>
    <h1 class="cover__tagline">Main headline<br><em>with emphasis</em></h1>
  </div>
  <div class="cover__bottom">
    <div class="cover__bottom-line">Fact One &middot; Fact Two &middot; Fact Three</div>
  </div>
  <div class="slide-num slide-num--dark"></div>
</div>
```

## Stats Grid (At a Glance)

```html
<div class="slide slide--glance">
  <div class="section-label section-label--light">At a Glance</div>
  <h2 class="slide-title">Headline</h2>
  <div class="glance__grid">
    <div class="glance__card">
      <div class="glance__card-value">$50M</div>
      <div class="glance__card-label">Label</div>
      <div class="glance__card-sub">Supporting detail</div>
    </div>
    <!-- Accent variant -->
    <div class="glance__card glance__card--accent">
      <div class="glance__card-value">Top 5%</div>
      <div class="glance__card-label">Label</div>
    </div>
  </div>
  <div class="slide-num slide-num--light"></div>
</div>
```

## Pillar Cards (Thesis)

```html
<div class="thesis__pillar">
  <div class="thesis__pillar-title">Pillar Name</div>
  <div class="thesis__pillar-items">
    <div class="thesis__pillar-item">Bullet point one</div>
    <div class="thesis__pillar-item">Bullet point two</div>
  </div>
</div>
```

## Domain Cards (Dark)

```html
<div class="domains__card">
  <div class="domains__card-label">CATEGORY</div>
  <div class="domains__card-title">Domain Name</div>
  <div class="domains__card-examples">
    <div class="domains__card-example">Example one</div>
    <div class="domains__card-example">Example two</div>
  </div>
</div>
```

## Data Table

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Company</th>
      <th class="num">Metric</th>
      <th class="num">Result</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="company">Company Name</td>
      <td class="num">Value</td>
      <td class="moic-highlight">12.4x</td>
    </tr>
  </tbody>
</table>
```

## Fund Terms Grid

```html
<div class="slide slide--terms">
  <h2 class="terms__title">Fund Terms</h2>
  <div class="terms__grid">
    <div class="terms__card">
      <div class="terms__card-value">$150M</div>
      <div class="terms__card-label">Target Size</div>
    </div>
    <div class="terms__card">
      <div class="terms__card-value terms__card-value--coral">2.0%</div>
      <div class="terms__card-label">Management Fee</div>
    </div>
  </div>
  <div class="slide-num slide-num--light"></div>
</div>
```

## Section Divider

```html
<div class="slide slide--divider">
  <div class="divider__label">SECTION NAME</div>
  <div class="divider__title">Bold <em>Statement</em></div>
  <div class="divider__sub">Optional supporting text</div>
  <div class="slide-num slide-num--dark"></div>
</div>
```

## Hero Background (for case studies)

```html
<div class="hero__bg">
  <img src="../../assets/generated/my-image.png" alt="">
</div>
<div class="hero-gradient"></div>
<!-- Content goes over the gradient with position: relative; z-index: 2 -->
```

## TODO Marker

Add `class="todo"` to any element to flag it for review (yellow highlight with dashed outline):

```html
<div class="todo">This content needs to be finalized</div>
```
