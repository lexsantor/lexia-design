---
name: design-system
description: >
  This skill should be used to define or evolve a project's visual system:
  "create design tokens", "define the visual direction", "set up
  typography/color/spacing system", "document the design system",
  "make the UI consistent". Produces the direction contract, token set
  and DESIGN-SYSTEM.md. Usually invoked by the lexia-design orchestrator;
  also directly useful on its own.
metadata:
  version: "0.1.0"
---

# Design System

Turn a completed brief into a coherent, documented visual system. Input:
`.lexia-design/DESIGN-BRIEF.md` (if absent, run the direction protocol
first: `${CLAUDE_PLUGIN_ROOT}/references/visual-directions/direction-protocol.md`).

## Order of definition

1. Direction contract. From the chosen direction
   (`${CLAUDE_PLUGIN_ROOT}/references/visual-directions/directions.md`):
   thesis (2 sentences), tension (1), differentiator (1), signature move
   (1), breaks-if list (5-8 falsifiable items), non-resources list. This
   contract is auditable text: vague entries are defects.
2. Typography. Families (with license status noted), scale (name the
   ratio or the hand-tuned steps), weights used, leading per size band,
   tracking per size band, measure limits, tabular-numeral contexts.
   Reflex-face check against
   `${CLAUDE_PLUGIN_ROOT}/references/anti-slop/model-priors.md`.
3. Color. Derive from the direction's color logic: field(s), ink
   hierarchy (hue-tinted, never generic gray on color), ONE accent +
   lock, full semantic set (success/warning/danger/info), both themes
   composed separately (dark is not inverted light). Record measured
   contrast for every text/surface pair
   (`${CLAUDE_PLUGIN_ROOT}/references/accessibility/wcag-checklist.md`).
   Token quality is measured, not eyeballed: same-role tokens need real
   deltas (two grays a few RGB points apart render as one level:
   [system/near-duplicate-tokens]); record contrast(accent, ink) as a
   ratio: under ~2:1 the accent is functionally ink and every accent
   moment disappears [system/accent-ink-indistinct]. Shadows are themed
   tokens tinted toward the canvas hue, never hardcoded black rgba()
   [system/hardcoded-shadow-color].
   Token syntax fails silently, so verify it before redesigning anything:
   a color declared as an opaque color function breaks every opacity
   modifier (the utility compiles to nothing), which surfaces as three
   unrelated "design bugs" — invisible text, a missing overlay, dividers
   at the wrong weight. Declare the alpha slot in every color token
   before any /opacity utility exists [system/alpha-value-missing]. Same
   class of failure: arbitrary `var()` classes do not compile in current
   majors, so consume the generated utilities instead.
   Theming mechanics: if the app toggles theme via [data-theme] or a
   class, re-key the framework's dark variant to that mechanism
   (Tailwind 4: `@custom-variant dark
   (&:where([data-theme="dark"], [data-theme="dark"] *));`), or every
   dark: utility renders wrong whenever app theme != OS theme
   [system/dark-variant-desync].
4. Spacing and rhythm. Base unit (4 or 8), scale, section rhythm,
   container widths, VISUAL_DENSITY dial applied here; more space above
   headings than below.
5. Geometry. Radius tokens (concentric: child <= parent), border
   weights, shadow system (offset + blur from one light source, or none),
   z-elevation map.
6. Interaction language. Focus ring spec, hover/active/selected/disabled
   treatments, motion tokens (durations + easings from
   `${CLAUDE_PLUGIN_ROOT}/references/motion/principles.md`) even if
   MOTION_INTENSITY is low: instant is also a spec. Kill the de-facto
   second motion system: set the framework's DEFAULT transition
   duration/easing to your tokens (Tailwind 4:
   --default-transition-duration, --default-transition-timing-function)
   so bare transition utilities inherit the system.
7. Density and breakpoints. Breakpoint set, density shifts per
   breakpoint, touch-target floors per pointer type.

## Token discipline

- Emit tokens in the project's native mechanism (CSS custom properties,
  Tailwind theme, styled tokens file): never a parallel system.
- Every visual value in components resolves to a token; off-token values
  found later are audit findings [system/hardcoded-colors].
- Name tokens by role (--surface-raised, --ink-muted), not by value
  (--gray-300 as a role name is debt).
- ONE canonical content-width token, consumed by header, footer, floating
  chrome and every section wrapper. A second max-width nested inside the
  layout container is a defect [system/container-width-drift]: mixed
  widths read as misalignment at section boundaries and turn a global
  width change into a multi-file edit.
- Freeze SEMANTICS, not only values: each accent maps to exactly one
  meaning across the whole product (e.g. one accent = "AI-generated",
  nothing else); one radius for controls; full-round reserved for pills
  and toggles. Token semantics live in exactly ONE file; the other
  documents link to it. Without frozen semantics every new screen
  re-invents what a color means.
- Never ship a component kit's default tokens [system/stock-kit-tokens
  class of failure]: overwrite them with the project's system before any
  screen is built, or four clients' products become the same product.
- No raw black/white in app surfaces [system/raw-black-white]: they carry
  no theme scale and go invisible in one of the two themes.

## Primitive discipline

- One primitive per concept: one Button, one CTA band, one page hero, one
  icon module per glyph, one card type per entity. Duplicated glyphs and
  copy-pasted section bands are the main source of drift
  [system/duplicate-primitive].
- The app layer consumes primitives. Native selects, inputs, textareas
  and inline tables in application screens inherit no tokens, focus
  rings, density or states [system/native-control-in-app-layer,
  system/hand-rolled-table].
- Grep the consumers BEFORE investing in a primitive: hardening a
  component with zero consumers reaches no user while screens hand-roll
  their own version [system/orphan-primitive]. Enumerate consumers
  before changing anything shared, and state the expected visual effect
  on each.
- Not everything that looks like duplication is debt: audit INTENT before
  consolidating. An animated hero tile and a data-density card can share
  a name and serve different purposes; forcing the merge degrades both.
  Duplicate findings are questions, not verdicts.

## Documentation

Write/update `.lexia-design/DESIGN-SYSTEM.md` from the template
(`${CLAUDE_PLUGIN_ROOT}/templates/DESIGN-SYSTEM.md`): contract, tokens,
component inventory with states, external components registry (origin,
license, modifications:
`${CLAUDE_PLUGIN_ROOT}/references/component-libraries/policy.md`),
exceptions with reasons. On NEW visual worlds, write the full document
AFTER the first build passes review, from the built reality; update
incrementally thereafter. Keep decisions and their why in
`.lexia-design/decisions.jsonl`.

## Consistency maintenance

When touching an existing system: diff proposed changes against the
current DESIGN-SYSTEM.md; classify each divergence as error /
inconsistency / debt / deliberate exception; never flatten a deliberate
exception without asking; log everything.
