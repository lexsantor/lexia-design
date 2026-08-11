# Design Brief — lexia-design landing (docs/index.html)

2026-08-11 · first lexia cycle on this project · incremental refinement

## Problem, audience, task

- Problem: the landing is correct and self-consistent but partially
  interchangeable with other dev-tool pages; distinctiveness sits at 7.5
  by the plugin's own prior assessment.
- Audience: developers arriving from the GitHub repo, release notes or
  social links. Awareness: solution-aware to product-aware (they know
  the category; they need differentiation and low-friction install).
- Primary task: understand what the plugin does in under 30 seconds and
  copy the install command. Secondary: reach the repo.

## Surface and dials

- Surface: brand, with one conversion zone (the install command).
- DESIGN_VARIANCE 5 · MOTION_INTENSITY 3 · VISUAL_DENSITY 4.
- Constraint: identity is already published (banner, README, report
  card). This cycle refines it; it does not replace it.

## Direction contract

Direction: "the instrument reads itself" - the page is styled as the
product's own report output. Near-black canvas, one orange accent, mono
for anything measured, terminal framing for evidence.

Signature move (this iteration): the page presents its OWN audit as a
proof element - a self-audit line in the hero backed by the real CI
gate, and the score-bar motif as the single recurring brand element.
Honest by construction: the claim is enforced by CI on every push.

Anti-references (recorded, never proposed again this project):
- Gradient-mesh / glassmorphism dev-tool hero.
- Uniform fade-up reveals on every section.
- A second accent color.

Breaks if:
- Any number on the page is not verifiable in-repo -> fabrication cap.
- The detector reports > 0 findings on docs/index.html -> CI fails.
- Motion ships without the reduced-motion guard.
- The template section order (hero/features/testimonials/pricing/FAQ)
  appears.
- A viewport carries two competing ideas.

## Reference set

Declined by the user on 2026-08-11 (recorded in project-preferences,
never re-asked): audits judge against the plugin's own registry and the
interchangeability test.
