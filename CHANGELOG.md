# Changelog

All notable changes to lexia-design. Format: Keep a Changelog; versioning:
semver. Rule changes should cite the observed failure or source update that
motivated them (changelog-driven hardening).

## [0.7.3] - 2026-08-11

### Fixed
- Plugin failed to load on Claude Code >= 2.1.220: `plugin.json` declared
  `"hooks": "./hooks/hooks.json"`, but the CLI auto-loads the standard
  `hooks/hooks.json`, so the manifest reference registered it twice
  ("Duplicate hooks file detected") and the whole plugin was rejected.
  The manifest `hooks` field is for ADDITIONAL hook files only; removed it.

## [0.7.2] - 2026-08-11

First real run of /lexia-design, on the plugin's own landing page. The
loop worked exactly as designed - including against its authors.

### The cycle, honestly

- Iteration 1 gated the landing at 49/100 F (raw 71.8): the specimen
  report in the terminal card presented numbers that existed nowhere -
  an unlabeled simulation, flagged by the plugin's own content doctrine
  and capped by its own gate. Iteration 2: 80.6/100 B, +31.6. Stopped by
  operator with two gates still failing (total 8.0 < 8.5,
  distinctiveness 7.0 < 7.5); follow-ups named in the committed
  .lexia-design/ memory, which now lives in-repo as a real artifact.

### Landing (iteration-2 fix set)

- The terminal now renders THIS page's actual committed gate output,
  failing gates included; footer recurs the score-bar motif with the
  page's real audit state.
- AA contrast: ink-faint lifted to 4.78:1 / 4.64:1 worst-case
  (computed, both themes); light ::selection fixed.
- Keyboard: scroll regions focusable and labeled; anchors clear the
  sticky header; nav/footer targets padded.
- Copy action: aria-live status, interruption-safe timers, working
  clipboard-denied fallback, no width jitter.
- Motion: signature fill is a viewport-gated one-shot scaleX (it fired
  below the fold at load, unseen); false-affordance card lift removed.
- Priorities de-carded into a typographic ladder; the four
  never-outranked principles carry the accent.
- og:image + twitter card; semantic term-bar; punctuation and wrap
  fixes; green reserved for pass states.

### Detector and evals

- 4 previously fixture-less rules now proven (scroll-hijack-lib,
  card-density, no-reduced-motion-anywhere, off-token-colors), and the
  smoke suite asserts full coverage: a rule without a fixture now fails
  CI. "Every one fixture-proven" was false when the landing claimed it;
  it is true now and enforced.
- Third self-audit precision fix: system/alpha-value-missing scoped to
  slash-digits inside class attribute values ("49/100" in prose no
  longer reads as an opacity utility). Rule-id parser in run-evals
  hardened.
- README sample report explicitly labeled as illustrative, linking to
  the landing's real one.

## [0.7.1] - 2026-08-11

Hardening without new taste rules, chosen as the highest-value work that
needs no field data: verify the arithmetic the whole gate rests on, and
make health and waivers inspectable.

### Added

- Gate arithmetic joins the smoke suite: 7 black-box subprocess cases
  prove the weighted mean (usability 6 with the rest at 9 must yield
  exactly 87.1), n/a renormalization (motion n/a still scores 90, never
  penalized), and every cap (49 fabrication, 59 critical, 79 regression,
  89 not-rendered). The /100 was previously enforced by usage, not by a
  test.
- `lexia-design-score.mjs doctor`: install health (Node version,
  templates, detector present) plus project-memory health (preferences
  parse, history lines parse, TRAJECTORY.md present). Exit 1 only on a
  broken install.
- `lexia-design-audit.mjs --waivers [dir]`: every inline waiver with
  file:line, rule ids and its recorded reason - the mechanical half of
  the "waivers pair with a decisions.jsonl entry" doctrine. Syntax
  documentation lines are excluded; the repo's own two self-waivers now
  both carry reasons.

## [0.7.0] - 2026-08-11

Tier 5: conversion architecture - the gap the learning database named
and could not close from its own corpus. Externally sourced (Schwartz's
awareness stages as attributed concept; Baymard's form research; NN/g on
link labels; WCAG 1.3.5), synthesized, and recorded in SOURCES.md
section 12.

### Added

- `references/conversion/architecture.md`: awareness-stage section
  ordering (the template order assumes one stage for every product; the
  brief now states the assumed stage so ordering is auditable), one idea
  per viewport, CTA hierarchy with the commitment ladder, objection
  placement adjacent to where objections occur, proof adjacency, and
  the form-friction catalog.
- 3 fixture-proven rules, new `conversion/` family (67 file + 12
  project = 79 total):
  - `conversion/vague-cta` - "Learn more / Click here / Submit" as the
    whole label of a link or button
  - `conversion/autocomplete-missing` - email/tel inputs without an
    autocomplete attribute (WCAG 1.3.5's mechanical half)
  - `conversion/form-field-overload` - a form with more than ten
    visible fields
- Fixture `conversion-form.html`
- Wiring: brand surfaces with a conversion goal load the reference;
  the audit skill adds the conversion pass (viewport-idea naming,
  order-vs-stage check, one primary CTA, proof adjacency, form sweep),
  with ordering verdicts recording the awareness assumption they
  depend on.
- SOURCES.md section 12 with access dates and re-verification notes.

### Fixed

- Primitive-discipline project rules no longer treat test/fixture trees
  (`fixtures/`, `tests/`, `evals/`, `__mocks__/`, `e2e/`) as the
  project's primitives directory: a components/ui inside fixtures was
  putting real app markup under the primitives contract (found via this
  repo's own self-audit, where the eval fixtures flagged the landing's
  data table).

### Honest limits

- No conversion-rate claims: uplift requires the project's own
  measurement. Ordering and objection placement stay reviewer
  judgments; only the mechanical defects are detector rules.

## [0.6.1] - 2026-08-11

The public landing page, and two detector precision fixes it surfaced by
being the first plain-CSS HTML file the detector met.

### Added

- `docs/index.html`: single-file GitHub Pages landing. Inline CSS/JS,
  system fonts, zero dependencies, dark/light via prefers-color-scheme,
  reduced-motion guard, skip link, focus-visible styles, selectable text
  throughout. The page passes the repo's own detector with 0 findings,
  and CI now enforces that on every push.
- README links the site.

### Fixed

- `system/alpha-value-missing` no longer fires on plain-CSS `:root`
  custom properties: it is scoped to Tailwind token contexts (`@theme`,
  or class-attribute opacity utilities present). It had produced 24
  false positives on one plain HTML file.
- `content/claim-repetition` strips `<style>` and `<script>` blocks
  before counting visible copy; CSS declarations no longer read as
  repeated claims.

## [0.6.0] - 2026-08-11

Tier 4 of the learning-database integration: new capability, not
refinement. AI-native surfaces enter as a first-class category, i18n goes
beyond the correctness triad, and two workflow learnings close the loop
between cycles.

### Added

- `references/production/ai-surfaces.md` (LD-AI-01/02): the extraction
  contract - structured output with per-field confidence, below-threshold
  fields marked and focused, everything editable BEFORE applying, one
  explicit apply action - plus the demo-for-failure protocol
  (pre-extracted showcase, idempotent reset, visible demo-status strip)
  verified by RENDERED values, not by records existing. Wired into
  surface classification (new AI-surface subtype) and the audit skill.
- 4 fixture-proven i18n detector rules (64 file + 12 project = 76 total):
  - `i18n/tolocalestring-no-locale` - formatters and animated counters
    without an explicit locale (LD-I18N-04)
  - `i18n/emoji-flag` - regional-indicator pairs as locale UI (LD-I18N-10)
  - `i18n/key-leaf-object-collision` - a translation key that is both
    string and namespace prefix; throws at render (LD-I18N-05, project)
  - `i18n/locale-coverage-gap` - a secondary catalog under 90% of the
    fullest one (LD-I18N-09, project)
- Fixtures: `counter-format.ts`, `i18n-catalog/` (deep), emoji flag in
  `LocaleSwitcher.tsx`
- Trajectory notes (LD-WF-06): every closed cycle appends to
  `.lexia-design/TRAJECTORY.md` - regressions, reapplied fixes, false
  positives, what to do FIRST next time, and the cleaner prompt for the
  next attempt. Scaffolded by `score init`; the session-start read
  protocol honors the last entry. Decisions and scores record outcomes;
  this records the path.
- Reference set at first run (LD-WF-07): the orchestrator asks once for
  the user's real examples, audience and outcome data, stored in
  project-preferences.json, so audits judge against the user's standard
  instead of a generic one. Declining is recorded and never re-asked.
- i18n reference updated with the four new rule IDs.

### Changed

- README: counts refreshed, per-family rule counts in the detector table,
  AI-surfaces row in the knowledge base, TRAJECTORY.md in the memory
  tree, score bands as a text ladder. All content remains selectable,
  indexable text by policy (see 2026-08-11 revert).

## [0.5.0] - 2026-08-11

Tier 3 of the learning-database integration: the syntactic copy layer.
The registry caught vocabulary; this release catches the SHAPES generated
copy takes regardless of which words fill them (LD-SLOP-02..24), guarded
by the two meta-rules imported first: avoiding a tell must not create a
new tell (LD-SLOP-17), and registry entries are dated and expire on the
update cadence (LD-SLOP-18).

### Added

- 15 fixture-proven detector rules (62 file + 10 project = 72 total):
  - `slop/reframe-setup` - concession opener + pivot ("At first glance...
    but in reality") (LD-SLOP-02)
  - `slop/reframe-heading` - reveal-shaped headings ("The real problem
    with...") (LD-SLOP-03)
  - `content/bloated-verb` - "serves as / is designed to / plays a role
    in" (LD-SLOP-05)
  - `content/dead-metaphor` - "the backbone of / north star / single
    pane of glass" (LD-SLOP-06)
  - `content/puffery` - "a pivotal moment / paving the way for"
    (LD-SLOP-07)
  - `content/meta-chatter` - assistant chatter in UI strings ("Let me
    walk you through") (LD-SLOP-08)
  - `content/engagement-bait` - "Let that sink in / This changes
    everything" (LD-SLOP-09)
  - `content/model-disclaimer-leak` - "As of my last update" rendered as
    interface copy (LD-SLOP-10)
  - `content/adjective-triad` - generic adjective triads in headings
    (LD-SLOP-11)
  - `content/entity-alias` - three+ generic self-references ("the
    platform / the tool / the solution") in one file (LD-SLOP-13)
  - `content/claim-repetition` - a 4-word phrase repeated 3+ times in
    one page (LD-SLOP-15)
  - `content/stock-face-on-testimonial` - generated/stock portrait hosts
    inside testimonial content (LD-SLOP-23)
  - `content/unlabeled-simulation` - Mock/Fake/Simulated components
    rendered with no visible label (LD-SLOP-21)
  - `slop/default-section-sequence` - hero/features/testimonials/
    pricing/FAQ in template order (LD-SLOP-20)
  - `slop/uniform-reveal` - the same fade-up on 5+ sections (LD-SLOP-19)
- `content/todo-marker` extended with `[PENDING|PENDIENTE|TBD ...]`
  bracketed placeholders; doctrine requires them rendered loud, in an
  alarming color, never quietly plausible (LD-SLOP-22)
- `evals/fixtures/copy-slop.tsx`: 16-rule fixture proving the layer
- copy-rules.md: four new doctrine sections - phrase families, shape
  habits, naming and specificity, simulation and testimonial integrity
  (LD-SLOP-04/05/11/12/13/14/15/16/21/22/23/24), each dated
- design-audit skill: copy sweep with the anti-overfitting counter-check,
  and the pre-demo purge gate (zero fabricated claims before any
  investor/client demo)
- update skill: copy-tell decay - each cycle proposes additions AND
  deletions; entries carry added/confirmed dates
- registry.md preamble: the two standing meta-rules

### Not automated, by decision

- False ranges (LD-SLOP-12) and countable-claims (LD-SLOP-16) stay
  reviewer judgment: idiomatic "from X to Y" density makes a regex
  FP-heavy, and falsifiability needs context no regex has.
- Metronome rhythm (LD-SLOP-14) is doctrine; sibling-length variance
  needs DOM grouping the detector deliberately does not do.

## [0.4.0] - 2026-08-11

Tier 2 of the learning database: the coherence layer. Motivation
(field-proven, see docs/learnings/learning-database.md): in multi-session
projects the recurring failure is not one bad screen but drift — widths,
colors and controls diverging pass after pass until every audit repeats
itself.

### Added

- Detector, 7 new rules, each fixture-proven (LD- ids from the learning
  database): system/raw-black-white (LD-DS-12),
  system/container-width-drift (LD-DS-03),
  system/native-control-in-app-layer and system/hand-rolled-table
  (LD-DS-08, gated on a primitives directory actually existing),
  system/orphan-primitive (LD-DS-09), system/duplicate-primitive
  (LD-DS-07, same svg path pasted across 3+ files),
  system/design-gate-not-wired (LD-DA-01, package.json build vs lint
  scripts). 47 file rules + 10 project rules = 57 total.
- Rule-level path exclusions (pathExclude) so token rules skip
  primitives, print and email directories by design.
- Fixture evals/fixtures/primitives-drift/: a miniature app with a
  primitives directory, an orphan primitive, native controls and an
  inline table bypassing existing primitives, three content widths in
  one file, raw black/white, a glyph pasted across three files, and a
  design-lint script the build never runs. All seven rules assert.

### Changed

- design-system skill: one canonical content-width token; semantics
  frozen (each accent one meaning product-wide, radius semantics, single
  source of truth for token meaning); never ship kit defaults; new
  Primitive discipline section including the intent gate (LD-DS-10: not
  all duplication is debt — duplicate findings are questions, not
  verdicts).
- design-audit skill: root-cause escalation (a finding category
  recurring across consecutive audits stops being instance-fixed and
  escalates to primitive adoption or an invariant, LD-DA-04); exemptions
  are named lists with written reasons, never silent skips (LD-DA-02);
  deploy-side verification that the host build runs the gate.
- workflow: the FIX step escalates recurring categories to the root
  cause instead of re-fixing instances.

## [0.3.0] - 2026-08-11

Tier 1 of the knowledge-vault harvest (docs/learnings/learning-database.md),
plus the report the plugin now always ends with.

### Added

- **LEXIA SCORE /100 and a mandatory end-of-run report.** The gate computes a
  weighted composite over the 15 dimensions (weights follow the priority
  order: usability and accessibility 10, task clarity and content integrity 9,
  down to motion 4), renormalized over applicable dimensions, and writes
  `.lexia-design/DESIGN-REPORT.md`: blockers first, then the score with its
  coverage, then the dimension table with weight, points, delta and evidence,
  then gates. New subcommands `report` and `weights`; `gate --format report`
  prints the table. Motivation: the user asked for a single /100 in table
  form; the caps below exist so the number cannot hide a blocker.
- **Hard score caps**, each printed with its reason and the raw value it was
  capped from: fabricated content 49, critical a11y/usability or failing build
  59, visual regression 79, not visually verified 89. Grade bands A-F.
- **Nine Tier-1 detector rules**, each fixture-proven (LD- ids refer to the
  learning database): system/alpha-value-missing (LD-DS-01),
  a11y/reveal-on-essential-content (LD-A11Y-03), motion/lcp-behind-reveal
  (LD-MOT-01), motion/countup-zero-base (LD-MOT-02),
  layout/order-with-asymmetric-tracks (LD-UX-01), i18n/provider-missing-locale
  (LD-I18N-01), i18n/locale-switch-soft-nav (LD-I18N-02),
  i18n/hardcoded-locale-href (LD-I18N-03), slop/negative-parallelism
  (LD-SLOP-01). 45 file rules + 5 project rules total.
- **references/accessibility/i18n-correctness.md**: the failure catalog for
  localization defects that render the UI wrong while the build stays green,
  plus coverage auditing (built-output verification per locale,
  identical-string diffs) and the a11y-namespace practice.
- **Capture protocol** in design-audit (LD-DA-05): full-page captures render
  blank below reveals, scroll needs 700-900ms pauses, narrow widths need
  device-metrics emulation, automation screenshots are downscaled and cannot
  judge grain or motion.
- **Production-build measurement and a hosting-layer bucket** (LD-DA-06,
  LD-DA-07): never measure on a dev server; header-level findings are reported
  separately with the deployment owner named.
- **Blast-radius tiering** of edits (LD-WF-04) and consumer enumeration before
  touching anything shared (LD-DS-24).
- Four new fixtures (tokens-broken.css, legal-page.tsx, LocaleSwitcher.tsx,
  stat-counter.tsx); the detector self-test now covers 54 expected firings.

### Changed

- **"The brief wins" scoped** (tension T1 in the learning database): the brief
  overrides plugin taste, never usability evidence, accessibility, content
  truth or arithmetic. Brand-owned items (logo, CTA channel, contact routing,
  pricing, legal copy) are proposals requiring sign-off; the report separates
  applied fixes from flagged proposals.
- Reveal wrappers now carry two documented exemptions (LCP element, essential
  content) in both the motion and accessibility references.
- Layout failure catalog added to the heuristics reference (order vs tracks,
  sticky containing block, min-w-0, nth-child alternation, card-on-section
  contrast).
- Copy rules gained the syntactic-tell section with its anti-overfitting
  guardrail and expiry requirement (LD-SLOP-17, LD-SLOP-18) — imported BEFORE
  the ban list, deliberately.

## [0.2.0] - 2026-08-11

First changelog-driven hardening release. Motivation: 37 field learnings
from a full four-tier audit-and-fix cycle on a production clinical SaaS
(docs/learnings/2026-08-nutrionyx.md), plus one live false positive
observed while editing this repo with the plugin's own hook active.

### Added

- Verification protocol: detector findings now require a verdict
  (TRUE_POSITIVE / MITIGATED / FALSE_POSITIVE) before reporting or
  scoring; encoded in design-audit, workflow, ux-auditor, hook guidance
  and the audit template. Motivation: learning 2 (a full cycle where
  every placeholder-as-label flag was already mitigated).
- Inline waivers: `lexia-disable-file <rule-id>` and
  `lexia-disable-next-line <rule-id>` comments, paired with
  decisions.jsonl entries (learning 5 + live self-referential FP where
  the detector flagged its own rule table).
- Detector, 6 new file rules (each fixture-proven):
  motion/press-without-transform (learning 14),
  motion/filter-transition (16), system/hardcoded-shadow-color (12),
  correctness/server-local-midnight (19), a11y/tablist-without-panels
  (27), ux/native-confirm (31).
- Detector, 3 new project rules with pure-JS WCAG color math:
  system/dark-variant-desync (9), system/near-duplicate-tokens (10),
  system/accent-ink-indistinct (11) — contrast is now measured, not
  trusted.
- Coverage-aware scoring: gate records a "coverage" field; a deeper
  audit scoring lower is no longer treated as no-progress (learning 3).
- Reviewer continuity: first audit fresh-context, re-audits reuse the
  same reviewers with prior findings (learning 6); two-lens convergence
  scheduled first (learning 1).
- Tiered fixing: bugs/launch blockers -> coherence -> structure ->
  polish, completing each tier before the next (learning 4).
- references/production/launch-and-structure.md: trust surface / GDPR
  Art. 13 launch gate (7-8), timezone-safe "today" logic (19),
  revalidation targets (20), structure patterns (21-25), generated
  asset pipelines (36-37).
- Knowledge integrated across references/skills/agents: theming desync
  and token-quality guidance, default-transition enforcement (13),
  hover duration tier + per-property splits (15), reduced-motion
  iteration-count cap (17), highest-value-component motion audit (18),
  selection-card focus, step-flow focus, mounted aria-live, skeleton
  status + i18n, confirm() policy (26-31), signature parity to the paid
  surface, stat-tile set audits, empty-state activation, row-hover
  affordance (32-35), provisional legal text (8).
- Fixtures: today-logic.ts, theme-desync/ (first --deep directory
  fixture; runner extended), new violations in slop-landing and
  motion-heavy. Detector self-test now covers 45 expected firings.
- CI workflow (.github/workflows/ci.yml): syntax checks + offline smoke
  on push/PR.

### Fixed

- content/fake-status-dot no longer flags correct skeletons carrying
  role="status"/aria-busy (learning 2, observed FP class).
- content/todo-marker and ux/native-confirm no longer double-report one
  line, and no longer self-match the detector's own rule table.
- Project-level rules now resolve DESIGN-SYSTEM.md relative to the
  scanned root instead of the process cwd.

## [0.1.1] - 2026-07-31

### Changed

- Renamed `bin/` to `scripts/`. Motivation (observed failure): claude.ai-
  hosted plugin validation rejects top-level `bin/` because it is added to
  PATH on the CLI without appearing on the admin approval surface. All
  entry points were already invoked via explicit
  `${CLAUDE_PLUGIN_ROOT}/scripts/...` paths in hooks and skills, so no
  functionality changed; PATH exposure was never relied upon.

## [0.1.0] - 2026-07-31

Initial release.

### Added

- Orchestrator skill `/lexia-design` with bounded convergence cycle
  (4 iterations, scored gates) and priority order.
- Skills: design-system, design-audit, motion-design, update.
- Fresh-context reviewer agents: design-director, ux-auditor,
  visual-critic, motion-engineer.
- Deterministic detector (30 file rules + 2 project rules) wired to a
  PostToolUse hook (advisory) and a Stop reminder hook; disable with
  LEXIA_DESIGN_HOOKS=0.
- Scoring gate with per-project thresholds and evaluation history.
- Source drift checker (metadata only) + UPDATE_PROPOSAL scaffold.
- Knowledge references: UX heuristics catalog and application map;
  anti-slop registry, copy rules and model priors; WCAG 2.2 checklists
  (verified 2026-07-31, incl. 3.3.3=AA and 2.3.3=AAA corrections), focus/
  keyboard and forms/states guides; motion principles, tech ladder and
  GSAP 3.15 playbook; 12 visual directions + direction protocol;
  component-library policy and verified catalog (Skiper UI, Vengeance UI).
- Evals: 14 cases (12 positive, 2 negative), grading rubrics, fixtures
  with a detector self-test, offline smoke runner, gated live mode.
- Templates for DESIGN-BRIEF, DESIGN-SYSTEM, DESIGN-AUDIT, decisions
  JSONL and project preferences.
- SOURCES.md attributions and sources.lock.json pins for all 13 sources.
