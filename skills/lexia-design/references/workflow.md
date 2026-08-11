# Execution Workflow

Bounded convergence cycle. Not an infinite loop: open-ended self-QA burns
the user's budget. Defaults (overridable in
.lexia-design/project-preferences.json):

MAX_ITERATIONS = 4
MIN_TOTAL_SCORE = 8.5
MIN_DISTINCTIVENESS_SCORE = 7.5
CRITICAL_ACCESSIBILITY_ISSUES = 0
CRITICAL_USABILITY_ISSUES = 0
VISUAL_REGRESSIONS = 0

## Cycle

1. INSPECT. Existing project: stack, conventions, shared components,
   current visual system, dependencies, run it if possible, capture the
   BEFORE state (screenshots). New project: confirm stack. Read
   .lexia-design/ if present (project-memory.md).
2. UNDERSTAND. Restate the problem in one sentence. Identify audience and
   primary task. At most ONE clarifying question, only if the reading
   genuinely forks; otherwise declare the interpretation and proceed.
3. DIRECTION. Surface type, dials, direction contract, anti-references,
   signature move (direction-protocol.md). Write DESIGN-BRIEF.md.
4. IMPLEMENT. Structure and content first; tokens and components next;
   states always; motion only after structure validates. Respect
   references/ rules and the project's conventions.
5. RUN. Start the dev server / build. A build that doesn't compile is
   iteration zero; fix before any visual judgment.
6. RENDER. Load the real pages at 375px, 768px, 1440px (+ ultra-wide for
   brand surfaces). Dark and light if both exist.
7. EVIDENCE. Screenshot each breakpoint/theme. Prefer Playwright if
   available in the environment; else any browser tooling available; if
   NOTHING can render, say so explicitly, run the static audit only, and
   mark all visual scores as "not visually verified": never invent visual
   judgments of unrendered UI.
8. AUDIT. Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/lexia-design-audit.mjs
   --deep <dir>` for deterministic findings, then VERIFY each detector
   finding against its context before reporting: verdicts are
   TRUE_POSITIVE / MITIGATED (e.g. sr-only label exists, skeleton has
   role="status") / FALSE_POSITIVE. Never act on or report raw flags.
   In parallel, dispatch reviewer agents with disjoint lenses
   (ux-auditor, visual-critic, motion-engineer when motion exists) with
   the screenshots + brief. First audit: fresh context, so reviewers do
   not inherit the builder's optimism. Re-audits in later iterations:
   reuse the SAME reviewers with their previous findings as input, so
   the scale stays stable and "fixed" claims are verified against the
   original complaint. Where two lenses converge independently on the
   same file, confidence is near-certain: schedule those first. On app
   surfaces, include the launch gate
   (`${CLAUDE_PLUGIN_ROOT}/references/production/launch-and-structure.md`).
9. PRIORITIZE. Merge findings; tier by effort x impact:
   tier 1 bugs and launch blockers, tier 2 system coherence, tier 3
   structure, tier 4 polish. Blockers: accessibility criticals, broken
   flows, content fabrications, build errors.
10. FIX. Complete tier 1 before touching tier 2; mixed-tier fixing
    loses the audit trail. Within a tier, top-3 by impact. No cosmetic
    work while functional errors exist. If a finding category already
    appeared in the previous iteration, do not fix instances again:
    escalate to the root cause (adopt the primitive, add the invariant,
    wire the gate into the build) and fix THAT. Waive deliberate deviations the
    same day, twice: inline (`lexia-disable-next-line <rule-id>`) and in
    decisions.jsonl.
11. RE-RENDER. Same breakpoints, same pages.
12. COMPARE. Against the previous iteration: fixed? regressed? Run
    `node ${CLAUDE_PLUGIN_ROOT}/scripts/lexia-design-score.mjs gate` with the
    new scores; it appends history and returns a verdict. Record the
    audit's coverage (`"coverage"` field in the scores file): a deeper
    audit scoring lower than a shallower one is NOT a regression: new
    lenses surface new defect classes. Without coverage, the number is
    meaningless across cycles. Revert any change that scored worse than
    what it replaced on the same coverage.
13. STOP when: all thresholds met; OR verdict says no measurable
    improvement over the previous iteration; OR MAX_ITERATIONS reached.
    Never continue chasing subjective perfection. On stop with unmet
    thresholds: report exactly what remains and why, honestly.

## Rendering strategy notes

- Screenshot loop only needs 1 batched round per iteration (all
  breakpoints in one pass), not per-tweak captures.
- Compare hero/first-viewport against the brief's stated composition
  before auditing deeper sections; every later section inherits the
  hero's shortfall.
- Test content variants during render: short, average, hostile-long
  strings on key components.

## Delivery (always ends with the report)

Every run ends with the report, whatever the verdict — converged, stopped
at max iterations, or stopped for no progress. The gate writes
`.lexia-design/DESIGN-REPORT.md` and it is reproduced in the final
message. Order is fixed:

1. Blocking findings first, if any. Never lead with the score.
2. `LEXIA SCORE X/100 — grade (label)`, with the coverage beside it and
   the raw value when a cap applied.
3. The dimension table: score, weight, points, delta vs previous
   iteration, evidence per row.
4. The gates table.
5. What was built, direction and dials, exceptions logged, remaining
   known issues, and how to run it.
6. ONE recommended next step, not a menu.

Never declare thresholds met without the gate output, and never present a
score for a dimension that was not verified: mark it n/a and let the gate
renormalize. Then update `.lexia-design/` (project-memory.md), including
a short trajectory note: which fixes regressed, which were reapplied,
which findings were false positives, and what to do first next time.
