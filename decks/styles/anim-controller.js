/**
 * Stella Decks — Animation Controller
 *
 * Reads data-anim-order attributes, computes cumulative delays,
 * expands .anim-stagger-children containers, and triggers playback.
 *
 * Include in a slide to enable sequenced animations:
 *   <script src="../../styles/anim-controller.js"></script>
 *
 * In capture mode (window.__STELLA_CAPTURE), animations are NOT
 * auto-triggered — the export script controls the animation clock.
 */
(function () {
  'use strict';

  const ENTRANCE_DURATION = 600; // ms, matches --anim-entrance-duration
  const STAGGER_GAP = 120;      // ms between staggered children

  const slide = document.querySelector('.slide');
  if (!slide) return;

  // Collect all animated elements with an explicit order
  const ordered = Array.from(slide.querySelectorAll('[data-anim-order]'));

  // Sort by order value (numeric)
  ordered.sort((a, b) => {
    return (parseInt(a.dataset.animOrder, 10) || 0) -
           (parseInt(b.dataset.animOrder, 10) || 0);
  });

  // Group by order number
  const groups = new Map();
  for (const el of ordered) {
    const order = parseInt(el.dataset.animOrder, 10) || 0;
    if (!groups.has(order)) groups.set(order, []);
    groups.get(order).push(el);
  }

  // Compute cumulative delay for each group
  let cumulativeDelay = 0;
  const sortedOrders = Array.from(groups.keys()).sort((a, b) => a - b);

  for (const order of sortedOrders) {
    const elements = groups.get(order);
    let maxGroupDuration = 0;

    for (const el of elements) {
      // Check if this is a stagger-children container
      if (el.classList.contains('anim-stagger-children')) {
        const children = Array.from(el.children);
        children.forEach((child, i) => {
          const childDelay = cumulativeDelay + (i * STAGGER_GAP);
          child.style.setProperty('--anim-delay', childDelay + 'ms');
          maxGroupDuration = Math.max(maxGroupDuration,
            (i * STAGGER_GAP) + ENTRANCE_DURATION);
        });
      } else {
        el.style.setProperty('--anim-delay', cumulativeDelay + 'ms');
        maxGroupDuration = Math.max(maxGroupDuration, ENTRANCE_DURATION);
      }
    }

    cumulativeDelay += maxGroupDuration;
  }

  // Expose total animation duration for the export script
  window.stellaAnimDuration = cumulativeDelay;

  // In capture mode, let the export script control timing
  if (window.__STELLA_CAPTURE) {
    window.stellaAnimReady = true;
    return;
  }

  // Expose a replay function for the viewer to call
  window.stellaPlayAnimations = function () {
    slide.classList.remove('anim-play');
    // Force reflow so removing/re-adding the class restarts animations
    void slide.offsetHeight;
    slide.classList.add('anim-play');
  };

  // If inside an iframe (viewer), wait for the viewer to call stellaPlayAnimations
  if (window !== window.top) {
    return;
  }

  // Direct file load: trigger animations immediately
  slide.classList.add('anim-play');
})();
