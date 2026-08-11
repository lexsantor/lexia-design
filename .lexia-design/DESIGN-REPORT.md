# Design report — lexia-design landing (docs/index.html)

> No blocking issues open.

## LEXIA SCORE: 80.6 / 100 — B (Ship with named follow-ups)

| | |
|---|---|
| Iteration | 2 |
| Coverage | detector + 3 reviewer agents (ux, visual, motion), rendered 375/768/1440 dark + 1440 light |
| Dimensions scored | 15 of 15 |
| Weighted raw | 80.6 / 100 |
| Delta vs previous | +0.8 |
| Verdict | continue |

## Dimensions

| # | Dimension | Score | Weight | Points | Δ | Evidence |
|---|---|---|---|---|---|---|
| 1 | TASK_CLARITY | 8.5/10 | 9 | 7.7 | 0 |  |
| 2 | INFORMATION_ARCHITECTURE | 8/10 | 7 | 5.6 | 0 |  |
| 3 | USABILITY | 8/10 | 10 | 8 | +0.5 |  |
| 4 | ACCESSIBILITY | 8/10 | 10 | 8 | +2 | ink-faint 4.78:1 dark / 4.64:1 light worst-case (computed); scroll regions focusable; copy action announced |
| 5 | CONTENT_INTEGRITY | 9/10 | 9 | 8.1 | +4 | specimen replaced by this page's own committed gate output; 79/79 rules fixture-covered, asserted in smoke |
| 6 | VISUAL_HIERARCHY | 7.5/10 | 7 | 5.3 | +0.5 |  |
| 7 | TYPOGRAPHY | 7.5/10 | 6 | 4.5 | +0.5 |  |
| 8 | COLOR_AND_CONTRAST | 7.5/10 | 6 | 4.5 | +1 |  |
| 9 | SPACING_AND_RHYTHM | 7/10 | 5 | 3.5 | 0 | held at reviewer score: even 72px rhythm critique not addressed this iteration |
| 10 | RESPONSIVENESS | 8.5/10 | 7 | 6 | 0 |  |
| 11 | SYSTEM_COHERENCE | 8/10 | 6 | 4.8 | +0.5 |  |
| 12 | DISTINCTIVENESS | 7/10 | 6 | 4.2 | +0.5 | subjective; iteration-2 rescore is builder-verified on mechanical evidence, held conservative: motif now recurs x3, self |
| 13 | MOTION_QUALITY | 8/10 | 4 | 3.2 | +1.5 | fill viewport-gated one-shot scaleX; false-affordance lift removed; copy timers interruption-safe |
| 14 | PERFORMANCE | 9/10 | 6 | 5.4 | 0 |  |
| 15 | PRODUCTION_READINESS | 8.5/10 | 7 | 6 | +1 |  |
| | **TOTAL (applicable)** | | 105 | **80.6** | | |

## Gates

| Gate | Value | Threshold | Result |
|---|---|---|---|
| total | 8 | >= 8.5 | FAIL |
| distinctiveness | 7 | >= 7.5 | FAIL |
| criticalA11y | 0 | <= 0 | PASS |
| criticalUsability | 0 | <= 0 | PASS |
| regressions | 0 | <= 0 | PASS |

Scores are judgment anchored to evidence, not measurement. Dimensions
marked n/a are excluded and the total renormalized. A deeper audit
scoring lower than a shallower one is not a regression: compare only
across equal coverage.
