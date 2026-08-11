# Changelog

All notable changes to lexia-design. Format: Keep a Changelog; versioning:
semver. Rule changes should cite the observed failure or source update that
motivated them (changelog-driven hardening).

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
