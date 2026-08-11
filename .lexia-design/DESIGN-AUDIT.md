# Design Audit — lexia-design landing, cycle 1 (2026-08-11)

Coverage: deterministic detector (79 rules) + 3 fresh-context reviewers
(ux-auditor, visual-critic, motion-engineer) · rendered 375/768/1440 dark
+ 1440 light. 26 consolidated findings: 23 TRUE_POSITIVE (20 fixed in
iteration 2, 3 deferred), 3 MITIGATED, 0 FALSE_POSITIVE.

## Iteration 1 blockers (both fixed)

1. [critical · content] The specimen report presented numbers that
   existed nowhere in-repo (83.1, iteration 3, 31 verdicts) inside a
   window labeled as the real artifact - an unlabeled simulation, the
   exact pattern content/unlabeled-simulation flags. Gated the page at
   49/100 (fabrication cap; raw 71.8). FIX: the terminal now renders THIS
   page's own committed gate output, failing gates included.
2. [serious · content] "79 rules, every one fixture-proven" was false:
   4 rules had no fixture (motion/scroll-hijack-lib, slop/card-density,
   project/no-reduced-motion-anywhere, system/off-token-colors). FIX:
   four new fixtures + a coverage assertion in the smoke suite, so the
   claim can never silently rot again.

## Fixed in iteration 2 (selection)

- ink-faint failed AA at body sizes (4.19:1 dark / 4.00:1 light) →
  lifted to 55%/42% lightness; worst case now 4.78/4.64 (computed).
- Overflow scroll regions unreachable by keyboard → tabindex + labels.
- Copy action silent to AT, dead-end failure path, stacked timers,
  width jitter → live region, select-and-instruct fallback, per-button
  timer, min-width.
- Signature bar fill fired below the fold at load → one-shot
  IntersectionObserver + scaleX (the width keyframe also survived only
  through a detector blind spot; both wrongs fixed together).
- Hover lift on non-interactive cards (false affordance) → passive
  border highlight only.
- Priorities section de-carded into a typographic ladder; the four
  never-outranked principles carry the accent.
- Anchor scroll under sticky header, nav/footer target sizes, light
  ::selection contrast, term-bar semantics, family-count wording, green
  reserved for pass states, proof-line wrap, og:image + twitter card.

## Deferred (named follow-ups, top of next cycle)

- Hero right third empty at wide viewports: occupy with the report
  artifact or motif (visual-critic candidate #5).
- Mid-page texture monotony: sections still share one card-grid texture;
  the ladder broke it once, one more section should abandon enclosure.
- Even 72px section rhythm: shape it (spacing critique held at 7).

## Mitigated (kept deliberately)

- Sticky-header backdrop blur: compositing cost accepted; 88% opaque
  backing, subtle effect. Watch on low-power devices.
- Single-file global reduced-motion kill: proportionate at 3
  micro-animations.
- Light accent-ink AA margin (4.60:1): passes; one token tweak from
  failing. Re-measure if the accent moves.

## Detector precision harvest (fixed at the root, in the detector)

Dogfooding surfaced one more over-broad heuristic:
system/alpha-value-missing treated any "N/M" text near a class attribute
as an opacity utility ("49/100" in copy). Scoped to slash-digits inside
class attribute values. Third precision fix earned by self-audit.
