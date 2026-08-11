# Trajectory

One note per closed cycle: regressions, reapplied fixes, false
positives, what to do first next time, and the cleaner prompt for the
next attempt. Newest entry last; read the last entry at session start.

## Cycle 1 — 2026-08-11 · docs/index.html · stopped by operator at iteration 2/4

- Result: 49/100 F (fabrication cap, raw 71.8) → 80.6/100 B. Gates still
  failing: total 8.0 < 8.5, distinctiveness 7.0 < 7.5. Verdict was
  "continue"; stopped deliberately: remaining lifts are design decisions
  (hero right third, section texture variety, shaped rhythm), recorded
  above as the next cycle's starting point.
- What regressed: nothing (0 visual regressions between iterations).
- False positives: none. 3 findings mitigated with reasons.
- What to do FIRST next time: occupy the hero's right third with the
  report artifact at wide viewports - it attacks the two failing gates
  at once (distinctiveness + hierarchy) and the direction hands you the
  occupant.
- Reviewer continuity: re-engage the same three reviewer agents
  (ux a457dd558ac5f7beb · visual a350e5cc9c8519f2f · motion
  ac5c9bc39f53b1ae5 in the original session; fresh agents if expired).
- Cleaner prompt for next attempt: "lexia-design: iteration 3 of the
  landing cycle. Read .lexia-design/ first. Implement the deferred
  follow-ups in DESIGN-AUDIT.md in order; do not re-audit from scratch;
  re-render and gate against iteration 2."
- Meta-harvest: dogfooding produced 1 critical content finding on our
  own page, 4 missing fixtures, a smoke coverage gate, and the third
  detector precision fix. The audit loop finds real defects in surfaces
  its own authors polished.
