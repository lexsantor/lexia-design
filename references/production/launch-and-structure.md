# Launch Readiness, Structure and Data Correctness

Field-derived checks (source: docs/learnings/2026-08-nutrionyx.md) that sit
between "design" and "shippable". PRODUCTION_READINESS scores against this
file; the launch gate below is part of every pre-delivery audit on app
surfaces.

## Trust surface (launch blockers masquerading as polish)

A product handling EU personal data without its trust surface is not
unpolished; it is unlaunchable. Gate checklist:

- /privacy and /terms routes exist and are reachable from the footer.
- GDPR Art. 13: the privacy notice is linked at the point of data
  collection: every signup-like form links it.
- Favicon file(s) present; per-route metadata: metadataBase + title
  template, description, og image.
- robots.txt exists and excludes private/authenticated areas.
- Provisional legal text is acceptable pre-launch when labeled (version +
  date + "fiscal identification pending"), flagged for lawyer review, and
  NEVER inventing company identifiers. Do not block the build on it.

## Data correctness in "today" products

- Server-local midnight is a clinical bug. Any adherence/streak/"today"
  feature computed with new Date().setHours(0,0,0,0) or toDateString()
  drifts for users whose timezone differs from the server. All today
  logic routes through ONE timezone helper module (dayStart, sameDay,
  weekdayIndex). Detector: [correctness/server-local-midnight].
- Cache revalidation targets where the UI lives, not where the feature
  started. Cross-check every revalidatePath/revalidateTag (or
  cache-invalidation equivalent) argument against the page that renders
  the mutated data; the symptom (stale list after a mutation) only shows
  in manual testing.

## Structure patterns (App-Router-flavored, generalizable)

- Shell in the layout, not in pages. A per-page sidebar remounts on
  navigation and vanishes under the root loading boundary. Route groups
  solve guard exceptions (the "create your org" page must not sit behind
  the org guard that redirects to it).
- Guards in one cached helper. Wrap the session -> role -> org resolution
  once (React.cache() or equivalent); five copies of a guard are five
  places for the next auth bug.
- Detail pages accrete waterfalls. After the entity resolves, everything
  else is independent: one Promise.all. Audit rule: count awaits between
  the entity fetch and the JSX; a heavy page with 15+ sequential
  round-trips is a finding.
- Per-segment loading/error boundaries are part of the design system: a
  single root skeleton is wrong for every area but one, and a root error
  boundary unmounts the shell.
- Uploads that outgrow server-action body limits stay route handlers,
  submitted via fetch from one shared client uploader (pending state,
  double-submit guard, inline error, refresh, JSON responses). Native
  multipart posts reload the page and park errors in sticky query params.

## Generated asset pipelines

- Calibrate overlays against the image's alpha channel, not by eye:
  measure the silhouette per row from the PNG alpha and derive
  coordinates; per-variant tables come from measuring each render, never
  from scaling one.
- Generated asset variants need a reference chain: subsequent views
  generate with the first accepted asset as the style reference;
  material/lighting/framing consistency does not survive text-only
  prompts.
