# Motion Principles

Motion is functional or it is removed. Every animation must serve at least
one of: explain causality, maintain spatial continuity, direct attention,
communicate state, improve orientation, or deliver brand-coherent delight.
"Looks cool" is not a function on anything seen often.

## The frequency gate (root decision)

Animation budget is inversely proportional to exposure frequency:
- 100+ times/day (shortcuts, command palettes, list navigation): zero
  animation. Keyboard-initiated actions never animate.
- Several times/day (menus, panels, toggles): near-imperceptible,
  <= 150ms.
- Occasional (modals, drawers, toasts): standard motion, 200-400ms.
- Rare (onboarding, success, launch moments): the only place for delight.

Fix hierarchy when motion feels wrong: delete it; reduce it; then fix
easing, origin, interruption, GPU load, timing asymmetry; polish last.

## Duration bands

- Press feedback: 100-160ms. Hover color/background: 150-250ms (a 500ms
  hover color reads as lag even under a front-loaded curve). Tooltips:
  125-200ms (first delayed; siblings instant). Dropdowns/selects:
  150-250ms. Modals/drawers: 200-400ms (up to 500ms with strong spatial
  choreography).
- Split durations per property when tiers differ: transform/shadow lifts
  may keep a slower tier while color stays fast; or give buttons the
  fast tier entirely (press override ~150ms stays). One element, one
  perceived speed.
- UI ceiling ~300ms as default; exceeding it needs a reason tied to
  consequence or distance. Brand/narrative surfaces may run 500-900ms.
- Exits at ~0.7-0.8x of entrances: leaving UI should get out of the way.
- Deliberate/destructive phases may be slow on purpose (hold-to-confirm
  fill ~2s linear); the system's response afterwards snaps (~200ms).

## Easing

- Entering/exiting UI: strong ease-out. On-screen movement: ease-in-out.
  Hover/color: ease. Constant motion (marquee, spinners, progress): linear.
- ease-in on UI is avoided: it delays motion at the moment of maximum
  attention. Exception: an element leaving under its own momentum may
  ease-in (conflict between sources resolved; see SOURCES.md #1).
- Built-in CSS keywords are weak; define tokens:
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1)
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)
- No bounce/elastic by reflex; overshoot only when the interaction itself
  carried momentum.

## Physicality

- Nothing enters from scale(0); real objects don't appear from nothing.
  Enter at scale 0.95-0.97 + opacity 0 [motion/scale-zero-entrance].
- transform-origin at the physical source: popovers/dropdowns/tooltips grow
  from their trigger; modals are the exception (center). SVG: animate
  wrapper <g> with transform-box: fill-box.
- Springs for gesture-driven, momentum-carrying motion; prefer the
  duration+bounce parametrization; critically damped by default; inherit
  release velocity so drag-to-animate has no seam; project momentum to
  choose targets. Dismissal by velocity, not only distance.
- Stagger group entrances 30-80ms/item, decorative only, never blocking
  input.

## Interruptibility

- CSS transitions retarget from the current value; CSS keyframes restart
  from zero: keyframes are wrong for anything the user can re-trigger
  rapidly.
- Never lock input during a transition. Always animate from the live
  on-screen value. @starting-style is the modern entry mechanism (check
  browser support for the project's matrix).
- Rapid re-trigger test is part of every motion audit: mash the toggle.

## Performance

- Animate transform and opacity only; width/height/top/left/margin animate
  layout [motion/layout-prop-transition]. Never transition: all
  [motion/transition-all]. Never transition filter (blur) in entrances:
  it is a paint tax on every section [motion/filter-transition]; reveals
  are transform+opacity only.
- One motion system, ENFORCED: declared tokens silently coexist with a
  de-facto second system of bare transition utilities running framework
  defaults. Tailwind 4: set --default-transition-duration and
  --default-transition-timing-function in @theme so only deliberate
  values remain in markup. Press states must include transform in their
  transition list or the press snaps [motion/press-without-transform].
- The richest interactive surface is usually motion-dead: teams polish
  landing motion and ship the core data widget with zero transitions.
  Inventory interaction motion (view swaps, selection states) on the
  highest-value component explicitly.
- will-change: sparingly, applied just before animating, removed after.
- No continuous animation work offscreen: pause loops with
  IntersectionObserver; nonessential loops stop when not visible.
- No scroll listeners for scroll effects: IntersectionObserver, CSS
  scroll-driven animations, or ScrollTrigger.
- Don't drive child transforms via CSS variables on a parent (style-recalc
  storm). Keep continuous values out of React state; use motion values or
  direct style writes.
- Validate on a mid-range Android with 4x CPU throttle and on iOS Low
  Power Mode. 60fps or reduce.

## Reveal wrappers have two hard exemptions

- The LCP element never waits for an observer [motion/lcp-behind-reveal]. The
  hero heading or hero media inside a reveal starts at opacity 0: visible
  flash plus a measurable LCP penalty. Reveal primitives ship an `immediate`
  escape hatch and above-the-fold content uses it.
- Essential content never sits behind a reveal (legal, prices, contact); see
  `../accessibility/wcag-checklist.md`.

Value animations carry a third rule: a count-up whose base state is zero
renders "0" on the server, without JS, before scroll, and to screen readers
[motion/countup-zero-base]. Base state is the real value; animate from zero
only for instances that enter below the fold. Under reduced motion, value
animations render the final value instantly: the information is the number,
and the motion carries none.

## Reduced motion (mandatory)

Reduced means gentler, not zero: keep comprehension-aiding opacity/color
fades; remove positional movement, parallax, scale choreography, autoplay.

CSS: wrap movement in @media (prefers-reduced-motion: no-preference), or
override under (prefers-reduced-motion: reduce) [motion/no-reduced-motion-
guard]. Reduced-motion blocks that zero durations must also cap
animation-iteration-count: a 0.01ms infinite loop still ticks every
frame. JS: gate with matchMedia("(prefers-reduced-motion: reduce)") and
listen for changes. WCAG technique C39. Content must be visible and
functional with JavaScript disabled or failed: never opacity:0 at rest
waiting for a script.

## Cleanup contract

Every animation system: kill timelines, cancel rAF, disconnect observers,
remove listeners on unmount/navigation. In React, effects with cleanup
(useGSAP for GSAP; see gsap-playbook.md). SPA route changes tear down
scroll-linked animations before the DOM they reference disappears.
