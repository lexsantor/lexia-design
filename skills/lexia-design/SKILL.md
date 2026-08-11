---
name: lexia-design
description: >
  This skill should be used when the user asks to design, build, create,
  redesign, improve, review or audit a web interface: "design a landing
  page", "build this dashboard", "improve this UI", "redesign my site",
  "create a component/design system", "audit this interface", "make this
  look better", "add animations to", or any frontend work where visual
  quality, UX, accessibility or motion matters. Orchestrates the full
  lexia design cycle: direction, implementation, rendering, audit,
  convergence. Not for backend, data pipelines, infra, CLI tools or
  non-UI code.
argument-hint: "[request or target path]"
metadata:
  version: "0.1.0"
---

# Lexia Design

Design OS entry point. Coordinate the full cycle: understand, direct,
implement, render, audit, converge, deliver. Produce production-ready
frontend with a distinctive, accessible, truthful interface.

## Priority order (arbitration rule for every conflict)

1. User's objective  2. Clarity and usability  3. Accessibility
4. Content truthfulness  5. System coherence  6. Performance
7. Visual identity  8. Distinction from generic patterns
9. Motion and delight  10. Implementation convenience

When two principles collide, the lower number wins. One standing
exception: an explicit user brief commitment ("the brief wins") outranks
rules 7-9 and any anti-default preference in this plugin. Its limits: the
brief overrides this plugin's TASTE, never usability evidence,
accessibility or content truth, and never arithmetic — when a requested
change provably cannot fix the problem the user stated, say so once,
concretely, then execute the request anyway. Brand-owned items (logo,
CTA destination channel, contact routing, pricing, legal copy) are
proposals requiring the owner's sign-off, never autonomous fixes: state
that boundary before starting, and separate applied fixes from flagged
proposals in the report.

## Workflow

Follow `references/workflow.md` (bounded cycle, MAX_ITERATIONS=4,
thresholds, stop conditions). Compressed:

1. Inspect project + read `.lexia-design/` memory
   (`references/project-memory.md`). Existing projects: capture the
   BEFORE state; classify error vs inconsistency vs debt vs preference vs
   deliberate decision; incremental changes unless a full redesign was
   requested; never replace an existing identity with this plugin's
   taste. Never silently change URL slugs, nav labels, form field names,
   logos or legal copy.
2. Understand: one-sentence problem statement, audience, primary task.
   At most one clarifying question, only when the reading genuinely
   forks. First run in a project (no reference set stored and not
   declined): ask once for the user's reference set - real examples
   they rate in their niche, target audience, any real outcome data -
   and store it in project-preferences.json. Audits then judge against
   the user's standard, not a generic one. If declined, record it and
   never ask again.
3. Classify the surface (`references/surface-types.md`) and complete the
   direction protocol
   (`${CLAUDE_PLUGIN_ROOT}/references/visual-directions/direction-protocol.md`):
   dials, direction, anti-references, signature move. Write
   `.lexia-design/DESIGN-BRIEF.md`. For deep token/system work, hand off
   to the design-system skill. Check
   `${CLAUDE_PLUGIN_ROOT}/references/anti-slop/model-priors.md` before
   confirming a high-risk direction.
4. Implement: structure and real content first; tokens; components with
   ALL states; motion last, only after structure validates (motion-design
   skill for anything beyond micro-interactions). Follow
   `${CLAUDE_PLUGIN_ROOT}/references/heuristics/`,
   `accessibility/`, `anti-slop/` and the implementation rules below.
5. Render + audit + converge per workflow.md: run the deterministic
   detector, dispatch fresh-context reviewer agents (ux-auditor,
   visual-critic, motion-engineer), score with the gate script, fix top-3
   by impact, compare, stop at thresholds or no-progress. Use the
   design-audit skill for the full audit procedure.
6. Deliver: implementation + THE REPORT + updated `.lexia-design/`
   memory. Every run ends with the report table, whatever the verdict:
   blocking findings first, then `LEXIA SCORE X/100` with its grade and
   coverage, then the 15-dimension table (score, weight, points, delta,
   evidence), then gates, then direction/dials/exceptions/known issues,
   then one recommended next step. The gate script writes it to
   `.lexia-design/DESIGN-REPORT.md`; reproduce it in the final message.
   Never lead with the score, and never show a score for something that
   was not verified.

## Hard implementation rules

- Respect the existing stack and conventions; TypeScript if the project
  uses it; reuse existing components; no new dependencies without the
  justification protocol; no premature abstractions.
- Tier every edit by blast radius before making it. Low: copy, one local
  component, styles scoped to it. Medium: shared components, layout,
  navigation, form logic, page structure. High: design tokens, global
  styles, route structure, dependencies, deletions and renames. High-tier
  edits are listed and approved first, never bundled into a polish pass;
  enumerate the consumers of anything shared before touching it.
- No placeholders, no `TODO: implement`, no mocks presented as real.
- Semantic elements (no clickable divs), visible focus, working zoom and
  paste, no color-only signals, no emoji or improvised Unicode as icons.
- Never fabricate users, metrics, testimonials, prices, logos or activity
  (`${CLAUDE_PLUGIN_ROOT}/references/anti-slop/copy-rules.md`).
- Design empty/sparse/dense/loading/error/success states; test short,
  average and hostile-long content; verify 360px to ultra-wide plus safe
  areas; keep shareable state in the URL where the surface is
  navigational.
- Standard labels for standard actions; no performance sacrificed for
  decoration; interfaces must remain maintainable after this plugin is
  gone (readable, conventional code: no magic).

## Tooling

- Detector: `node ${CLAUDE_PLUGIN_ROOT}/scripts/lexia-design-audit.mjs
  [files|--deep dir]` (deterministic findings, JSON/text).
- Score gate: `node ${CLAUDE_PLUGIN_ROOT}/scripts/lexia-design-score.mjs
  gate --scores <file>` (thresholds, history, verdict); `init` scaffolds
  `.lexia-design/`.
- Subskills: design-system, design-audit, motion-design, update
  (`/lexia-design:update` for source refresh proposals).

## Scope discipline

Decline (and say why in one line) requests that are: backend/API-only,
data engineering, infra, non-UI scripting. For native mobile, state that
lexia-design targets web surfaces and apply only the transferable
principles. When another design system already governs the project
(Material, Carbon, GOV.UK class), install/extend the official system
instead of hand-rolling an imitation, and say so.
