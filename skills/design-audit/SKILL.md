---
name: design-audit
description: >
  This skill should be used to audit an interface: "audit this UI",
  "review this design", "check accessibility", "find design problems",
  "why does this look AI-generated", "review UX of this page". Runs the
  deterministic detector plus fresh-context agent reviews, scores 15
  dimensions with evidence, and writes DESIGN-AUDIT.md. Also invoked by
  the lexia-design orchestrator during the convergence cycle.
argument-hint: "[path or scope]"
metadata:
  version: "0.1.0"
---

# Design Audit

Two independent tracks, never merged until synthesis: a deterministic
detector (no judgment) and agent judgment (fresh context). Detector
findings must not anchor the design judgment; run agents without showing
them the detector output.

## Procedure

1. Scope. Identify UI files (jsx/tsx/vue/svelte/html/css) and pages;
   read `.lexia-design/` for the brief, system contract and prior
   waivers. No brief? Audit against general rules and say the direction
   dimension is unanchored.
2. Deterministic pass:
   `node ${CLAUDE_PLUGIN_ROOT}/scripts/lexia-design-audit.mjs --deep <dir>
   --format json`. Rules with IDs (a11y/*, motion/*, slop/*, content/*,
   system/*, correctness/*, ux/*); exit 1 means serious+ findings exist.
   Then run the VERIFICATION pass: check every flag against its context
   and assign a verdict: TRUE_POSITIVE / MITIGATED (the concern is
   already handled: sr-only label present, skeleton carries
   role="status") / FALSE_POSITIVE. Report verdicts, never raw flags;
   regex tripwires without verification erode trust in the whole audit.
   Waived findings carry their decisions.jsonl reference. Also run the
   project's own build/typecheck/lint/tests if present: a red build caps
   PRODUCTION_READINESS at 3.
3. Render pass. Screenshot key pages at 375/768/1440 (+ both themes).
   Capture protocol, because full-page captures lie: sections behind
   scroll reveals render blank below the fold, and programmatic scroll
   faster than ~500ms per section fires neither the reveal nor lazy
   loading. Scroll for real with 700-900ms pauses and take VIEWPORT
   captures. Narrow widths need device-metrics emulation (headless window
   width bottoms out around 469px, so a "mobile" capture may be desktop).
   Automation screenshots come back downscaled: grain, glow and motion
   intensity cannot be judged from them, and saying so is part of the
   report. If rendering is impossible, mark visual dimensions "not
   visually verified" and pass `--not-rendered` to the gate: never score
   screenshots that don't exist.
4. Agent pass (parallel, disjoint lenses, screenshots + brief as input):
   - ux-auditor: heuristics, accessibility, states, forms, content
     integrity.
   - visual-critic: hierarchy, typography, color, spacing, coherence,
     distinctiveness, anti-slop judgment calls.
   - motion-engineer: only if motion exists or was requested.
   First audit of a build: fresh context (no inherited optimism).
   Re-audits of the same build: reuse the same reviewers with their
   prior findings, so the scale stays stable and "fixed" is verified
   against the original complaint. Findings where two lenses converge
   independently on the same file are near-certain: surface them first.
   Reviewers report their own verdicts; do not soften their wording in
   synthesis.
5. Checklist sweeps (self, using references under
   `${CLAUDE_PLUGIN_ROOT}/references/`): wcag-checklist.md gate items,
   forms-and-states.md seven states, anti-slop/registry.md two tests
   (interchangeability + reflex), responsive + content-length stress.
   Copy sweep per anti-slop/copy-rules.md: read every visible string
   aloud; flag reframes, bloated verbs, dead metaphors, chatter and
   repetition - then apply the counter-check: the corrected copy must not
   read as a list of avoided mistakes (all-staccato is the second tell).
   If the surface will be demoed to investors or clients, run the
   pre-demo purge gate: zero fabricated claims, every simulation
   labeled, every [PENDING] resolved or consciously accepted.
   On app surfaces add production/launch-and-structure.md: trust surface
   (legal routes, favicon, metadata, robots), timezone-safe "today"
   logic, revalidation targets vs rendering routes, waterfall counts,
   and the interaction motion of the highest-value component (teams
   polish landings and ship the core widget motion-dead).
6. Synthesize. Merge tracks; deduplicate; classify severity: critical
   (blocks use / a11y gate / fabrication), serious (materially degrades),
   moderate, minor, review (needs human judgment). Distinguish error vs
   inconsistency vs debt vs preference vs deliberate exception (check
   decisions.jsonl waivers before flagging known exceptions).
7. Score 15 dimensions per
   `${CLAUDE_PLUGIN_ROOT}/skills/lexia-design/references/scoring.md`,
   evidence mandatory, n/a renormalized. Performance is measured against
   a PRODUCTION build served locally, never a dev server, and speed-index
   and total-blocking-time are treated as directional only (they swing
   with machine load); decide on first paint, layout shift and bundle
   size. Findings that are HTTP response headers (content policy,
   transport security, frame options) go in a separate "not fixable here"
   bucket with the deployment owner named, so the score reflects what
   design and code control. Run
   `node ${CLAUDE_PLUGIN_ROOT}/scripts/lexia-design-score.mjs gate --scores
   <file>` to record history, compute the LEXIA SCORE and write the
   report.
8. Report. The gate writes `.lexia-design/DESIGN-REPORT.md`: the /100
   table, blockers first, dimensions with weight and evidence, gates.
   Write `.lexia-design/DESIGN-AUDIT.md` alongside it from the template:
   findings grouped by severity with file:line + verdict + evidence +
   recommendation + status column, exceptions honored. In chat: open with
   the blocking finding, not the score table, and close with ONE
   recommended next step, not a menu. Label each finding measured (a
   computed or rendered value with its location) or inferred (judgment),
   so score movement between audits is attributable to work rather than
   to a reviewer disagreeing with a prior call.

## Audit dimensions (what to look at, minimum)

UX flows, accessibility, semantics, hierarchy, layout, typography,
color, states, responsive, content, performance, motion, AI-slop,
visual debt, system coherence. Selection guidance:
`${CLAUDE_PLUGIN_ROOT}/references/heuristics/application-map.md`.

## Discipline

- Report what is, not what would be comfortable. A clean audit of a
  broken interface is the worst outcome this skill can produce.
- False positives honestly: "review" severity means human judgment
  required; say so instead of inflating certainty.
- Do not fix during the audit. Findings first, fixes as a separate step
  (the orchestrator or the user decides what to act on).
- Root-cause escalation: when the same finding CATEGORY appears in two or
  more consecutive audits, stop reporting instances and name the cause:
  an under-adopted primitive or a missing invariant. Patching the
  screenshot is not fixing the defect, and to the client it reads as "it
  keeps breaking". Recommend the invariant (build gate, primitive
  adoption) as the fix, not another pass of instance edits.
- Automate only what grep can decide; judge the rest. Exemptions to
  mechanical rules are NAMED lists with written reasons (financial tables
  that need a footer row, print and email templates, dense inline
  editors) recorded in decisions.jsonl and honored via lexia-disable
  directives. A silent skip destroys trust in the whole gate.
- If the project defines a design-lint script, verify the BUILD actually
  runs it, and on deploy that the host's build command runs the wrapper
  [system/design-gate-not-wired]: a gate outside the build catches drift
  only when someone remembers.
