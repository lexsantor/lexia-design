# Learning Database

Unified, deduplicated field knowledge harvested for lexia-design. Every entry
is project-agnostic, in English (sources were mostly Spanish), and carries the
evidence that earned it a place. This file is INPUT for integration, not the
integration itself: entries move into `references/`, `skills/`, `agents/` and
the detector when they pass the CONTRIBUTING bar (a rule without a fixture is
not done).

- Harvested: 2026-08-11
- Corpus: a personal knowledge vault (77 files) — four full project learning
  logs (a bilingual static service site, a business SaaS-like site with 8+
  production sprints, a clinic site redesign, and a cross-project distillation
  covering an ERP/CRM plus an AI-native product), eleven thematic role guides,
  four agent-skill definitions, one article on AI writing tells, plus a vault
  self-audit.
- Baseline: deduplicated against lexia-design v0.2.0. Entries that merely
  restate existing plugin rules were dropped; entries that sharpen one are
  marked SHARPENS with the rule they refine.

## Evidence grading (read before trusting an entry)

- `field` — a defect that actually shipped, or a decision taken and paid for in
  a real project. The strongest tier; most entries here.
- `measured` — carries a number from an external source. Rare: exactly one
  entry in this corpus qualifies (LD-SLOP-01).
- `asserted` — the source states it without evidence. Kept only when the rule
  is falsifiable or mechanically checkable; treat as a default, not a law.
- `derived` — the source asserted something vague and the extraction turned it
  into a testable threshold. The threshold is a proposal, not a finding.

Status values: `NEW` (no plugin coverage), `SHARPENS <rule>` (refines existing
coverage), `TENSION <rule>` (conflicts; see the resolutions section).

## Integration protocol

1. Do not bulk-import. Take one section per release; the plugin's own doctrine
   is changelog-driven hardening with a motivation per change.
2. Detector proposals here are candidates. Each needs a fixture in
   `evals/fixtures/` and a manifest expectation before it ships, and must
   default to `review` confidence whenever detection is heuristic.
3. Framework-shaped rules (a specific CSS framework, a specific router) are
   written as the underlying failure mode plus a concrete instance. Import the
   failure mode; keep the instance as the example, never as the rule.
4. Resolve every TENSION entry explicitly (section at the end) before importing
   the entries it touches.
5. Date each imported entry in the registry it lands in. Registries decay:
   see LD-SLOP-18.

---

# 1. Design system and tokens

**LD-DS-01 · Declare the alpha placeholder in every color token**
Color tokens written as opaque color-function strings break every opacity
modifier: the framework cannot inject alpha into a complete function call, so
the utility compiles to nothing and is dropped silently. Declare tokens with
the framework's alpha slot before any `/opacity` utility exists in the
codebase.
- evidence: `field` — one session lost to three "design bugs" (black-on-black
  footer links, a missing hero overlay, hairline dividers rendering thick) that
  were one token-syntax bug.
- status: NEW
- detector: `system/alpha-value-missing` — a color value matching
  `(oklch|lch|lab|color|hsl|rgb)\([^)]*\)` in the theme config without
  `<alpha-value>`, while the codebase uses at least one `/\d+` opacity utility
  on that token — high — certain

**LD-DS-02 · Consume generated token utilities, never arbitrary `var()` classes**
Tokens declared in a CSS-first theme generate real utilities; referencing the
custom property inside an arbitrary-value class does not compile in current
majors and silently renders unstyled. The type scale collapsing to body size is
the usual symptom.
- evidence: `field` — `text-[var(--text-*)]` produced no style while
  `text-display` / `text-h1` did.
- status: NEW
- detector: `system/arbitrary-var-utility` —
  `(text|bg|rounded|shadow|tracking|leading)-\[var\(--` — high — review (valid
  in older majors)

**LD-DS-03 · One canonical content width token**
Define a single content max-width and apply it to header, footer, floating
chrome and every section wrapper. Mixed ad-hoc widths read as misalignment at
section boundaries and turn a global width change into a multi-file edit.
Forbid a second `max-w-*` nested inside the layout container.
- evidence: `field` — per-page width definitions were the first symptom of
  drift in a multi-session project; the first lint rule written was "no nested
  max-w inside the layout container".
- status: NEW
- detector: `system/container-width-drift` — three or more distinct
  `max-w-(\d?xl|screen-\w+|\[[^\]]+\])` values on section/container elements in
  one route tree, none of them a named project token — medium — review

**LD-DS-04 · Freeze the meaning of color and radius, not only the values**
The system doc fixes semantics: each accent maps to exactly one meaning across
the whole product, one radius for controls, and full-round reserved for status
pills and toggles. Without frozen semantics every new screen re-invents what a
color means.
- evidence: `field` — in an ERP, one accent meaning "produced by AI" everywhere
  and nothing else is what let users read AI-generated fields at a glance.
- status: NEW
- detector: `system/accent-semantic-overload` — the accent token used across
  more than N unrelated feature directories — low — review

**LD-DS-05 · Budget the brand color to decision moments**
Reserve the highest-saturation brand color for the blocks where the user is
meant to decide (final CTA, form block) and keep the rest on neutral surfaces.
Brand color spread evenly across sections stops signalling anything.
- evidence: `field` — brand hue restricted to the home final CTA and the
  contact/catalog form blocks.
- status: NEW
- detector: `system/accent-surface-overuse` — `bg-(brand|accent|primary)\b` on
  four or more distinct section-level elements in one route — low — review

**LD-DS-06 · Never ship the base kit's default tokens**
A component kit's stock token values must be overwritten with the project's
system before any screen is built. Shipping kit defaults is the fastest way to
make four different clients' products look like the same product.
- evidence: `field` — stated as a hard rule across projects built on a
  copy-paste component base.
- status: SHARPENS `references/component-libraries` vetting — adds the
  "defaults are a slop signature" framing and a mechanical check
- detector: `system/stock-kit-tokens` — the base kit's known default token
  values present verbatim in the global stylesheet — high — certain

**LD-DS-07 · One primitive per concept**
Every recurring visual concept gets exactly one implementation: one icon
module, one button, one CTA band, one page hero, one card type per entity.
Duplicated glyph sets and copy-pasted section bands are the main source of
drift in a small codebase.
- evidence: `field` — ~6 duplicated glyphs and 4 copy-pasted CTA bands
  collapsed into single primitives ended the coherence debt.
- status: SHARPENS system coherence — extends from tokens to components
- detector: `system/duplicate-primitive` — two or more components whose JSX
  contains the same signature block (repeated `<svg` path, or names matching
  `(Cta|CTA)(Band|Section|Strip)`) — medium — review

**LD-DS-08 · The app layer consumes primitives; native controls and inline tables are drift**
Any `<select>`, `<input>`, `<textarea>` or bare `<label>` rendered in
application screens, and any `<table>` assembled inline rather than through the
data-table primitive, will not inherit tokens, focus rings, density or
empty/loading states.
- evidence: `field` — native selects and hand-rolled tables (no zebra,
  different paddings) reappeared screen by screen until they became build
  errors.
- status: NEW
- detector: `system/native-control-in-app-layer` — `<(select|textarea)\b` or
  `<input\b(?![^>]*type="hidden")` outside the primitives directory — medium —
  review; `system/hand-rolled-table` — `<table\b` outside the primitives
  directory — medium — review

**LD-DS-09 · Grep the consumers before investing in a primitive**
Before hardening, refactoring or adding accessibility to a shared component,
count its real imports. A primitive with zero consumers is an orphan: the work
reaches no user while the screens that should use it have each hand-rolled
their own version.
- evidence: `field` — a sheet primitive had 0 consumers while ~17 panels
  reimplemented the overlay by hand; the focus trap added to it reached nobody.
- status: NEW
- detector: `system/orphan-primitive` — a file in the primitives directory with
  zero matching imports elsewhere — medium — certain

**LD-DS-10 · Not everything that looks like duplication is debt**
Audit intent before consolidating. Two similarly named components can serve
different purposes (an animated hero tile vs a data-density card), and a batch
of "components to migrate" can be mostly unrelated shapes. Forcing the
abstraction there produces less coherence, not more.
- evidence: `field` — a planned duplicate-card merge and a badge migration were
  both cancelled after inspection; merging would have degraded both surfaces.
- status: TENSION `system/near-duplicate-tokens` + "one primitive per concept"
- detector: no — this is the human gate on an existing detector

**LD-DS-11 · Token semantics live in exactly one place**
When the system doc and the stylesheet both describe what a token means, they
drift and the interface follows whichever the implementer read last. One file
owns semantics; the other links to it.
- evidence: `field` — an accent's rule ("emotional accent, never CTA, never
  error") was stated differently in stylesheet and design doc and had to be
  reconciled mid-audit.
- status: NEW
- detector: no

**LD-DS-12 · Ban raw `black` and `white`, not just hex and numeric scales**
Raw-color detection that only matches hex and numeric palette classes misses
`text-black`, `bg-white`, `border-white/10` — which carry no numeric scale and
are the most common source of an element invisible in one of the two themes.
- evidence: `field` — a fixed white surface disappeared in light theme and
  survived several audit rounds because the palette rule did not match it.
- status: SHARPENS `system/off-token-colors`
- detector: `system/raw-black-white` —
  `\b(text|bg|border|fill|stroke|ring|divide)-(black|white)(/\d+)?\b` outside
  the primitives/print/email directories — medium — review

**LD-DS-13 · Set `text-wrap: balance` on headings and `pretty` on body, once**
Apply balance to display and heading classes so headlines never break into a
two-word orphan line, and pretty to body defaults. This belongs in the type
layer, not in per-component decisions.
- evidence: `field` — applied globally to display/h2/h3 and to paragraph
  defaults in two independent projects.
- status: NEW
- detector: `system/no-text-wrap-balance` — a typography layer exists and the
  stylesheet contains no `text-wrap:\s*(balance|pretty)` nor the equivalent
  utilities — low — review

**LD-DS-14 · Bound the measure at 45-75 characters**
Body text at full container width on large screens is not read. Cap the measure
in the type layer and verify it at every breakpoint, not only at the widest.
- evidence: `derived` — the sources assert "responsive readability" and cap at
  50-75ch; 45-75 is the standard typographic band.
- status: NEW
- detector: `type/unbounded-measure` — a text container with 200+ characters of
  prose and no width constraint on itself or an ancestor, or carrying
  `max-w-none` — medium — review

**LD-DS-15 · The product surface inherits the brand system; only density changes**
An internal panel, CRM or dashboard attached to a marketing site is not a
separate project with its own system. Same tokens, same type scale, same
primitives; the only legitimate delta is data density. A second system is
unmanaged brand divergence.
- evidence: `field` — an ERP admin panel was explicitly derived from the site's
  system doc.
- status: SHARPENS surface classification (brand/product/hybrid)
- detector: no

**LD-DS-16 · Re-brand an inherited dashboard by tokenizing first, never per component**
Three cases: built on a token-based kit, override the custom properties;
hardcoded values, run a value-to-token extraction pass BEFORE any re-brand;
foreign token system, write a mapping layer. Then re-verify contrast in every
interactive state, dark theme inheritance, and legibility at the panel's
smallest text size.
- evidence: `field` — contrast ratios that passed with the original palette
  broke with the client's.
- status: NEW
- detector: no

**LD-DS-17 · Cards must contrast with their own section surface**
A card on a section of the same surface color disappears; a border and a soft
shadow do not rescue it. Invert the pairing per section so the card boundary
reads before the border does.
- evidence: `field` — a testimonial carousel was moved to a white section with
  cream cards, inverting the site default.
- status: SHARPENS `system/near-duplicate-tokens` — the failure is contextual
  (card vs its section), not global token similarity
- detector: `system/card-surface-same-as-section` — a card-classed element
  whose background token equals its nearest section ancestor's — medium —
  review

**LD-DS-18 · Fix the heading case convention once, per project**
Heading capitalization is a system decision, not a per-heading choice. Declare
sentence case or title case and hold it across every level and surface;
sentence case is the default because title case is a recognizable machine tell,
but a brand that mandates otherwise overrides the default.
- evidence: `asserted`
- status: NEW
- detector: `system/heading-case-desync` — headings of the same level split
  across both conventions with the minority under 30% — medium — review

**LD-DS-19 · Ship a verbal identity spec alongside the tokens**
The design system output includes a verbal layer: tone rules, an allowed and
banned lexicon for THIS project, heading case, number/date/currency formats,
the canonical noun per entity and canonical verb per recurring action. Without
that artifact, copy consistency has nothing to be checked against and every
audit re-litigates the same decisions.
- evidence: `asserted` — named as a required pillar by two independent
  brand/copy guides; the project-scoped lexicon extension is the operational
  payoff.
- status: NEW
- detector: no — output-completeness check on the system doc

**LD-DS-20 · Map every claim to a proof type**
On brand surfaces each claim declares its proof: a number with source, a named
customer, a demo, a document, or nothing. Claims whose proof type is "nothing"
are downgraded to descriptive language or cut. This turns the fabrication ban
into a positive, auditable requirement.
- evidence: `asserted` — "messaging architecture and proof layers" named as a
  pillar by two guides; complements the existing fabrication detectors.
- status: SHARPENS content integrity
- detector: `content/unproven-claim` — a superlative or quantified claim
  (`#1|the (best|leading|fastest)|\d+% (faster|more|less)|\d+[k+] (customers|users)`)
  with no adjacent citation, source attribute or labeled data slot in the same
  section — medium — review

**LD-DS-21 · Centralize the asset path map**
All image paths resolve through one module. A photo swap becomes a one-line
edit instead of a grep across components, which is what makes late client
photo deliveries cheap and safe.
- evidence: `field` — a single image map meant every photo replacement touched
  exactly one file, across two projects.
- status: NEW
- detector: no

**LD-DS-22 · Branch the render; do not parametrize every class**
When a component has two genuinely different layouts, write two render branches
sharing data and subcomponents. Conditional class strings threaded through
every element destroy readability faster than the duplication costs. Derive
grid column counts from how many blocks are actually populated so no cell
renders empty.
- evidence: `field` — a card component kept two explicit render paths; column
  count computed from populated content.
- status: NEW
- detector: `system/conditional-class-soup` — three or more ternaries inside a
  single `className` template literal — low — review

**LD-DS-23 · Inventory the existing interface before adding to it**
In an existing codebase, map before styling: token source and naming, styling
approach, component inventory with duplicates flagged, file conventions, and
which surfaces are approval-required. Introducing a second way to do something
the project already does is a defect regardless of whether the new way is
better.
- evidence: `asserted` — core process of the onboarding-style skills; consistent
  with the plugin's "respect the existing stack".
- status: NEW — existing coverage vets EXTERNAL libraries, not the project's own
  prior art
- detector: `system/parallel-pattern` — two or more distinct implementations of
  the same primitive in one project (hand-rolled button alongside a library
  button; CSS modules and utility classes on the same component type) — medium
  — review

**LD-DS-24 · Enumerate consumers before touching anything shared**
Before changing a token, a shared component or a global style, list every
consumer and state the expected visual effect on each. Before deleting a style,
asset or component, verify references. Inspect before editing; map before
removing.
- evidence: `asserted` — the one rule repeated by all four agent-skill sources.
- status: NEW
- detector: no — workflow gate

**LD-DS-25 · Inside a brand-colored surface, derive every foreground from the on-brand token**
Muted foreground tokens fail contrast on saturated brand surfaces, and
brand-tinted decoration disappears against its own hue. Text uses the on-brand
token; chips and icon wells use on-brand at low alpha, never the brand token
against itself.
- evidence: `field` — muted ink on a yellow section failed contrast, and
  `bg-brand/15` chips inside a brand section were invisible.
- status: SHARPENS `system/accent-ink-indistinct` — that rule compares two
  tokens globally; this is contextual, per surface
- detector: `system/muted-foreground-on-brand` — an element with
  `bg-(brand|accent|primary)\b` containing a descendant using
  `text-\w+-(muted|subtle|secondary)` or `bg-(brand|accent|primary)/\d` — high —
  review

---

# 2. Accessibility

**LD-A11Y-01 · The brand color is usually not an accessible action color**
Compute contrast, never eyeball it, and re-run the computation after ANY token
change. A primary brand hue frequently fails as a CTA on light surfaces: ship a
dedicated action token rather than bending the brand. A destructive red cannot
be both legible text and a solid fill; give destructive states a soft treatment
(tinted surface plus accessible text).
- evidence: `field` — the primary blue failed on the CTA and was replaced by a
  dedicated variant; the destructive red required the soft treatment.
- status: SHARPENS the WCAG gate — adds "brand ≠ action token", the
  destructive-soft resolution, and re-verification as a mandatory post-edit step
- detector: no (contrast is computed) — but a token edit must trigger a
  contrast re-run

**LD-A11Y-02 · 16px floor for dense long-form text**
Legal pages, consent copy, policy and docs never drop below 16px to "fit".
Below that, reading long blocks is an accessibility problem and the page reads
cramped rather than dense.
- evidence: `field` — legal pages shipped at small text in two projects and had
  to be raised; raising also fixed perceived crowding.
- status: NEW
- detector: `a11y/small-text-longform` — `text-(xs|sm)\b` on an element with
  three or more paragraph children, or on a prose wrapper, or anywhere under a
  legal/privacy/terms route — medium — certain

**LD-A11Y-03 · Essential and legal content never sits behind a scroll reveal**
Reveal wrappers start at `opacity: 0` and depend on JS plus an intersection
event. Legal text, consent copy, prices, contact details and disclaimers render
unconditionally. Restrict scroll motion to chrome, navigation and decorative
sections.
- evidence: `field` — legal copy was found wrapped in a reveal component in one
  project; another made "legal never behind reveal" an explicit standing rule.
- status: NEW
- detector: `a11y/reveal-on-essential-content` — a reveal/motion wrapper inside
  a legal/privacy/terms route, or wrapping a price/phone/address node — high —
  certain

**LD-A11Y-04 · Off-screen carousel slides must be `inert`**
Slides outside the viewport stay in the tab order and the screen-reader stream
unless marked inert, so keyboard users tab into invisible content. Pair with
enlarged hit areas on the dot controls.
- evidence: `field` — both fixes were required on shipped carousels in two
  projects.
- status: SHARPENS the APG pattern coverage
- detector: `a11y/carousel-slide-not-inert` — a slide wrapper positioned
  off-screen or `aria-hidden` with no `inert` binding — medium — review

**LD-A11Y-05 · Accessible names get their own translation namespace**
`aria-label`, `alt` and screen-reader-only strings are the first to be
hardcoded and the last to be translated. Put them in a dedicated namespace so
they are greppable with one lookup and cannot silently stay in the source
language.
- evidence: `field` — a dedicated a11y namespace made previously forgotten
  labels auditable in a bilingual site.
- status: NEW
- detector: `i18n/hardcoded-accessible-name` — `aria-label="[A-Za-z][^"{}]{3,}"`
  or `alt="[A-Za-z][^"{}]{3,}"` (literal, no interpolation) in a project with a
  translation catalog — high — certain

**LD-A11Y-06 · Audit accessible names against the BUILT output, per locale**
Verify translation coverage on the rendered artifact, not the source: extract
every accessible name from each locale's built HTML and confirm none is in
another locale's language. Source-level checks miss labels injected by
libraries and component defaults.
- evidence: `field` — used as the build-time gate on a bilingual site.
- status: NEW
- detector: no — audit step

**LD-A11Y-07 · Locale diff audit: missing keys AND suspicious identical strings**
Flatten every catalog to dot notation and report keys missing from non-default
locales plus strings byte-identical to the default. Whitelist numbers, brand
names and short tokens; the residue is almost always untranslated long-form
copy that a key-count check would have passed.
- evidence: `field` — caught long descriptions never translated, in a site that
  passed key parity.
- status: NEW
- detector: `i18n/locale-key-drift` — default-locale key set not a subset of
  every other locale, plus value-identical pairs longer than 25 characters with
  4+ words — medium — certain

**LD-A11Y-08 · Fix a broken skip link; never delete it**
A skip link that shows constantly or overlaps the logo is a bug in the
visually-hidden/focus pair, usually an ancestor transform or containment
defeating it, not a reason to remove the affordance. Removing it while leaving
the target anchor behind produces a page that looks compliant and is not; the
fix is a fixed-position focus state layered above the header.
- evidence: `field` — a project permanently removed its skip link for exactly
  this reason and kept the orphan target.
- status: TENSION — the source's decision contradicts WCAG 2.4.1; import the
  failure mode, not the decision
- detector: `a11y/orphan-skip-target` — a `#main`-style target present with no
  element linking to it — high — certain

**LD-A11Y-09 · Bind accessibility attributes in the field primitive, not per instance**
The form field wrapper injects invalid state, description association and error
messaging into its child, so correctness is structural. Per-instance wiring is
where forms rot. The submit control carries busy state during flight.
- evidence: `field` — a field primitive injected the attributes by cloning,
  plus alert role and focus-to-first-invalid on submit.
- status: SHARPENS forms-and-states — moves the binding into the primitive
- detector: `a11y/aria-describedby-unbound` — an element with `aria-invalid` and
  no `aria-describedby` in the same component — medium — certain

**LD-A11Y-10 · Decorative numerals must be solid, not low-opacity text**
Large decorative numerals at 15-20% opacity land near 1.1:1 and fail contrast
while still reading as text. Use a solid darker brand shade: large text needs
only 3:1, so the signature survives and the element passes.
- evidence: `field` — section numerals at 18% opacity measured ~1.1:1; solid
  brand-dark passed comfortably.
- status: SHARPENS WCAG 1.4.3 — names opacity-as-decoration as the anti-pattern
- detector: `a11y/low-opacity-large-text` — `opacity-\[?0?\.?(0\d|1\d|2[0-5])\]?`
  or `text-\w+/(5|10|15|20)\b` on an element sized `text-(4xl|5xl|6xl|7xl|8xl|9xl)`
  — high — review

**LD-A11Y-11 · Compact toggles need a non-color active state**
In a small control (locale switcher, segmented toggle) changing only the text
color is not perceivable enough. Add a filled background plus a ring so the
active state survives low contrast, color blindness and small size.
- evidence: `field` — a text-color-only active state on a language switcher was
  not noticeable and was fixed with background plus ring.
- status: SHARPENS WCAG 1.4.1 — names the control class and prescribes the fix
- detector: no

**LD-A11Y-12 · Popup-dependent submissions need an in-page fallback state**
Any submit path that opens an external app or window can be blocked silently.
Render a success state containing a visible fallback control that re-triggers
the action from a user gesture, so a blocked popup is never a dead end.
- evidence: `field` — an inline success state with an explicit "open now"
  fallback after a programmatic window open.
- status: NEW — adds a blocked-handoff state to the seven-states model
- detector: `ux/window-open-no-fallback` — `window\.open\(` inside a submit
  handler with no sibling render branch linking to the same target — medium —
  review

**LD-A11Y-13 · Mark the active destination with `aria-current`, and add breadcrumbs from five pages up**
Styling the active nav link without `aria-current` gives sighted users
orientation and denies it to everyone else. Any site of five or more pages, and
every internal panel, carries breadcrumbs.
- evidence: `field` — both added retroactively to a multi-page site and its
  panel.
- status: NEW
- detector: `a11y/nav-active-without-aria-current` — a nav link applying an
  active class from a pathname comparison with no `aria-current` in the same
  expression — medium — review

---

# 3. Internationalization that changes the UI

The plugin's i18n coverage is mechanics-level (Intl, expansion, RTL awareness).
This section is the failure catalog: every entry is a defect that renders the
interface visibly wrong in one language while the build stays green.

**LD-I18N-01 · Pass the locale explicitly to the client i18n provider**
Without an explicit locale prop, the client provider falls back to the default
locale: server HTML is correct while every client-rendered locale-dependent
element (switcher active state, formatted numbers and dates) is wrong.
- evidence: `field` — a language switcher marked the default locale active
  while on the other locale's route.
- status: NEW
- detector: `i18n/provider-missing-locale` — the project's i18n provider
  rendered without a `locale` prop — high — certain

**LD-I18N-02 · Switching locale requires a full navigation**
Client-side navigation keeps the previous locale in cached context, so a
switcher built on the framework's link component renders the new URL with the
old language. Use a plain anchor so the localized layout remounts.
- evidence: `field` — soft navigation kept the locale hook pinned to the
  previous language after the route changed.
- status: NEW
- detector: `i18n/locale-switch-soft-nav` — a component named
  `(Language|Locale)(Switch|Switcher|Picker|Toggle)` importing the framework
  link component or calling a client router push — high — certain

**LD-I18N-03 · No hardcoded locale segment in any href**
Server components rendered as layout children do not reliably inherit the
request locale in nested or statically exported setups and silently fall back,
emitting cross-locale links. Any component that builds localized URLs reads the
locale from client context.
- evidence: `field` — on one locale's route, the server-rendered footer emitted
  hrefs pointing at the other locale.
- status: NEW
- detector: `i18n/hardcoded-locale-href` — `href=["'`]/(es|ca|en|fr|de|it|pt)/`
  literal in markup — high — certain

**LD-I18N-04 · Format computed and animated numbers with the resolved locale**
Counters, stats, prices and dates run through locale-aware formatting using the
active locale, never a hardcoded one and never the browser default. Animated
counters are the usual leak because intermediate values are generated in JS.
- evidence: `field` — a count-up utility had to thread the resolved locale to
  render thousands separators correctly.
- status: SHARPENS the Intl basics — names counters as the specific leak
- detector: `i18n/tolocalestring-no-locale` — `\.toLocaleString\(\s*\)` or
  `Intl\.(NumberFormat|DateTimeFormat)\(\s*(\)|undefined)` in a multi-locale
  project — medium — certain

**LD-I18N-05 · Translation keys cannot be both leaf and parent**
A key used as a string cannot also become an object namespace. The collision
throws at render, so the component using that key breaks in production with an
opaque message. Namespace by domain instead of nesting under an existing leaf.
- evidence: `field` — adding a child namespace under an existing string key
  threw and broke every component calling it.
- status: NEW
- detector: `i18n/key-leaf-object-collision` — the same dotted path present as
  both string value and object in a message file — high — certain

**LD-I18N-06 · Scope namespaces by surface, not one flat bag**
Split catalogs by functional scope so a component pulls only its own strings,
collisions stay local, and untranslated areas show up as whole missing
namespaces. A component holding a second namespace hook for accessible names
costs nothing.
- evidence: `field` — multi-namespace structure plus a secondary hook per
  component.
- status: NEW
- detector: no

**LD-I18N-07 · Long-form content leaves the message catalog**
Translation files handle short strings and handle nested arrays of paragraphs,
lists and structured sections badly. Long-form content (legal, docs, catalog
entries) belongs in typed source modules per locale, which also gives explicit
named placeholders for pending facts.
- evidence: `field` — legal and catalog content moved to typed modules with
  explicit pending markers.
- status: NEW
- detector: no

**LD-I18N-08 · Prefer always-on locale prefixes in the URL**
Explicit prefixes on every route beat "hide the default locale" modes: the
hidden-default mode creates canonical, hreflang and sitemap edge cases that
cost more than the shorter URL is worth, and it makes locale-dependent link
bugs invisible in the default language.
- evidence: `field` — chosen deliberately after weighing the SEO and sitemap
  consequences.
- status: NEW
- detector: no

**LD-I18N-09 · Ship one complete locale before three partial ones**
Every new string multiplies across catalogs. Launch one complete locale plus
deliberately labeled stubs and expand when content is stable; partial locales
produce mixed-language screens that read as broken rather than multilingual.
- evidence: `field` — starting with three full locales was named an explicit
  anti-recommendation after every new string required editing three files.
- status: SHARPENS the i18n heuristics into a scoping rule
- detector: `i18n/locale-coverage-gap` — key count in a secondary locale below
  90% of the default — medium — certain

**LD-I18N-10 · Locale flags are inline SVG, never emoji**
Emoji flags do not render on all platforms, cannot be styled, and cannot
express sub-national flags at all. Draw locale indicators as inline SVG.
- evidence: `field` — a sub-national locale made emoji impossible; both flags
  were drawn as inline SVG.
- status: SHARPENS `slop/emoji-icon` — here the failure is rendering
  correctness, not taste
- detector: `i18n/emoji-flag` — a regional-indicator pair in source — medium —
  certain

---

# 4. Motion

**LD-MOT-01 · The LCP element never waits for an observer**
Scroll-reveal wrappers start at zero opacity. Applied to the hero heading or
hero media, the largest element flashes empty and the LCP degrades measurably.
Reveal primitives need an immediate escape hatch, and above-the-fold content
must use it.
- evidence: `field` — hero flash plus LCP penalty traced to the reveal wrapper,
  independently in two projects.
- status: NEW
- detector: `motion/lcp-behind-reveal` — an `<h1>` or hero media inside a
  reveal/motion wrapper without an immediate/priority escape — high — review

**LD-MOT-02 · A counter that rests at zero lies**
Count-up components whose base state is zero render "0" on the server, without
JS, before scroll, and to screen readers. Set the base state to the real value
and animate from zero only for instances that enter below the fold.
- evidence: `field` — a dashboard displayed "0 documents processed" in SSR and
  to assistive tech while claiming the opposite.
- status: NEW — belongs to content truthfulness as much as to motion
- detector: `motion/countup-zero-base` — a count-up component whose initial
  value is 0 and whose non-JS fallback is not the target value — high — review

**LD-MOT-03 · Reduced motion on value animations means the final value immediately**
For count-ups, progress fills and meters the reduced-motion branch renders the
final value instantly rather than slowing the animation. The information is the
number; the motion carries none.
- evidence: `field` — a count-up utility jumps straight to target under the
  reduced-motion query.
- status: SHARPENS "reduced motion is gentler, not zero" — this is the stated
  exception where zero is correct
- detector: no

**LD-MOT-04 · One animation runtime per project**
Two or more animation runtimes are never justified by the interface; each must
earn its bundle with a concrete UX improvement. Heavy animation and chart
libraries below the fold load dynamically, without SSR.
- evidence: `field` — a panel shipped 200KB+ of chart and animation JS the user
  never scrolled to.
- status: SHARPENS "one motion system" — adds the mechanical dependency check
  and the below-fold import rule
- detector: `project/multiple-motion-libs` — two or more known animation
  runtimes in the dependency manifest — medium — certain

**LD-MOT-05 · Reversible movements get symmetric easing**
Keep at least two easing tokens: a brand ease-out for entrances and reveals,
and an ease-in-out reserved for movements that will play backwards (accordions,
toggles, hover translates that return). The entrance ease makes a return feel
wrong.
- evidence: `field` — the token set separated brand ease from a movement ease
  explicitly labeled for reversible motion.
- status: TENSION with the blanket "no ease-in on UI" — narrow that rule to
  entrances and one-way transitions
- detector: no

**LD-MOT-06 · Centralize the reduced-motion guard in one reveal wrapper**
Do not repeat the reduced-motion check per animated element. Ship one section
reveal wrapper owning the viewport trigger and the reduced-motion branch, and
require all scroll-reveal to go through it. A guard that can be forgotten will
be forgotten.
- evidence: `field` — a single motion-section wrapper chosen over per-component
  observers.
- status: SHARPENS `motion/no-reduced-motion-guard` — prescribes the enforcement
  mechanism instead of the policy
- detector: `motion/whileinview-outside-wrapper` — viewport-triggered animation
  or a raw IntersectionObserver in a component that does not import the
  project's reveal wrapper, when one exists — medium — review

**LD-MOT-07 · Marquee acceptance checklist**
A CSS-only marquee (duplicated track, linear infinite) is the right
implementation, but ships only with three additions: pause on hover so content
can be read, gradient mask fades at both edges so items do not clip, and a full
stop under reduced motion.
- evidence: `field` — all three shipped together.
- status: SHARPENS the infinite-animation guidance into a complete checklist
- detector: `motion/marquee-no-pause` — an infinite linear keyframe animation on
  a translated track with no paused play-state rule and no reduced-motion block
  in the same stylesheet — medium — review

**LD-MOT-08 · Log rejected motion upgrades with their trigger condition**
When you stay on the cheaper motion tier, record where the heavier library
would have paid off and under what condition you would revisit. That converts
an open temptation into a closed decision.
- evidence: `field` — the one case that would have justified a heavier runtime
  was documented and deliberately not built.
- status: SHARPENS the tech ladder plus rejected-patterns memory — the rejection
  must name its trigger
- detector: no

**LD-MOT-09 · Use the removal test on every animation**
Mastered motion is close to invisible: the user reports the product feels
smoother without naming what moved. The audit test is removal — turn it off; if
comprehension, causality and perceived speed are unchanged, the animation is
decoration and gets cut rather than tuned.
- evidence: `derived` — the source asserts invisibility as the goal; the
  removal test is the operationalization.
- status: SHARPENS the frequency gate with a runnable procedure
- detector: no

**LD-MOT-10 · Anchor overlay motion to its trigger, on exit too**
When a surface expands from an element, the entrance originates at that element
AND returns to it on exit. Spatial continuity is what tells the user where the
surface came from and where it went; a centered fade discards that information.
- evidence: `asserted`
- status: SHARPENS the transform-origin guidance — extends it to exits and
  makes it a placement rule
- detector: no

---

# 5. Layout and UX

**LD-UX-01 · Never combine `order` with asymmetric grid tracks**
`order` moves an item between tracks; it does not move the track's width. On a
fixed-plus-fluid grid, reordering drops a fixed-width element into the fluid
track where it stretches or pixelates. Use symmetric tracks and reorder freely,
or keep source order and swap the track definition per breakpoint.
- evidence: `field` — an alternating editorial layout pushed a portrait into
  the fluid column, stretching it; hit independently in two projects.
- status: NEW
- detector: `layout/order-with-asymmetric-tracks` — a file containing both an
  `order-*` class and a grid template mixing an absolute track with `1fr` —
  high — certain

**LD-UX-02 · Sticky only sticks inside a parent tall enough to scroll past**
Sticky positioning is bounded by its containing block. A sticky element inside a
short sidebar stops sticking as soon as that wrapper scrolls out, which on
mobile is almost immediately. Move it out to be a sibling of the main content
inside the full-height wrapper.
- evidence: `field` — two failed attempts adjusting offsets and breakpoints
  before moving the element out of the short aside.
- status: NEW
- detector: `layout/sticky-in-short-parent` — `sticky` with an offset on an
  element whose nearest ancestor is an `<aside>` or carries `h-fit|self-start` —
  medium — review

**LD-UX-03 · A wide child inside a grid item needs `min-w-0`**
Grid and flex items default to automatic minimum width, so a wide table inside
a card inside a multi-column grid refuses to shrink: horizontal scroll silently
stops working and the page grows. Add `min-w-0` on the item plus an explicit
single-column base at small widths.
- evidence: `field` — the identical bug appeared on several screens of one
  product.
- status: NEW
- detector: `layout/grid-child-overflow-no-min-w-0` — an overflow-x container or
  `<table>` inside a grid/flex item whose class list lacks `min-w-0` — medium —
  review

**LD-UX-04 · Multi-column grids declare their single-column base**
A codebase can be fully tokenized and still collapse on mobile: token linting
sees values, not breakpoints. Declare the single-column base explicitly and
audit layout/breakpoints as a separate axis with its own evidence.
- evidence: `field` — after the token lint went green, every mobile squash came
  from multi-column grids with no single-column base.
- status: NEW
- detector: `layout/grid-not-responsive` — a multi-column grid class with no
  single-column base and no breakpoint prefix — medium — review

**LD-UX-05 · Bento breaks on high-variance and long-form content**
Bento layouts stretch short cards to the row height and leave dead whitespace
inside them; dense flow fixes the gaps but scrambles reading order. Use bento
only for comparable-density tiles, never for legal or long-form content.
- evidence: `field` — a bento built for legal pages produced huge empty areas
  next to an eight-bullet card and was rebuilt.
- status: SHARPENS the bento entry in the anti-slop registry with its failure
  condition
- detector: `layout/bento-longform` — a bento-style grid where two or more
  children contain lists or three or more paragraphs — medium — review

**LD-UX-06 · Long-form documents: sticky table of contents plus one linear column**
For legal, docs and policy pages the reliable pattern is a sticky TOC with
anchor links beside a single linear reading column: reading order preserved,
jump navigation available, no dead space regardless of section length.
- evidence: `field` — the refactor that replaced the failed bento.
- status: NEW
- detector: no

**LD-UX-07 · Equal-status entities get symmetric layout, not editorial alternation**
Two founders or two equally weighted entities read as a hierarchy the moment
you alternate them editorially; use twin columns. Person profiles also resist
large card containers — open editorial blocks read better than a boxed card.
- evidence: `field` — alternation was abandoned for twin profiles in two
  projects.
- status: NEW
- detector: no

**LD-UX-08 · Alternate section backgrounds from the data index, not `nth-child`**
Even/odd variants count DOM position among all siblings, including heroes and
interstitials, so the alternation desynchronizes and two adjacent sections end
up the same color with no separation. Compute the background from the map index
of the repeated collection.
- evidence: `field` — the hero counted as a child, making the first section
  share its background.
- status: NEW
- detector: `layout/nth-child-bg-alternation` — `(even|odd):bg-` on a mapped
  section-level element — medium — review

**LD-UX-09 · One primary action per view, placed where the thumb is**
If every button looks primary, none is. Exactly one primary action per screen;
everything else drops to secondary or tertiary. On mobile the primary action
belongs in the lower half of the viewport, and nothing critical sits in the top
corners.
- evidence: `field` — adopted as a hard rule after views shipped with competing
  CTAs.
- status: NEW
- detector: `ux/multiple-primary-actions` — more than one button using the
  primary variant within a single page component — medium — review

**LD-UX-10 · Give every public form a fallback channel**
When the submission backend is unavailable, or its key is embedded at build
time and missing, the form degrades to a direct contact channel rather than
rendering a dead submit. For small local businesses, routing submissions into
the messaging channel the team actually answers converts better than email: the
form's job becomes structure, not delivery.
- evidence: `field` — a build-embedded key meant a missing value silently
  produced a non-functional form; composing a labeled message into the team's
  channel improved received data quality.
- status: NEW
- detector: no

**LD-UX-11 · Operator surfaces need shortcuts, bulk actions and prefilled defaults**
In internal panels the same action runs dozens of times a day. Keyboard
shortcuts on repetitive flows, bulk actions in every list, and predictable
fields pre-filled are not polish: they decide whether the tool is used or
worked around.
- evidence: `field` — derived from ERP operator flows.
- status: NEW — the plugin has the efficiency laws but no product-surface
  requirement list
- detector: no

**LD-UX-12 · URL state changes need a full-path push**
Filters, sort and view mode live in search params so state is shareable,
survives back/forward and can be server-rendered. Replacing only the query
string on the same path can fail to re-emit, leaving the UI showing stale
results after a filter click; push path plus query.
- evidence: `field` — a same-path replace did not re-emit search params and
  left stale filter results.
- status: SHARPENS "URL as state" with the visible failure and the fix
- detector: `ux/router-replace-same-path` — a client router replace with a
  literal path in a component that reads search params — medium — review

**LD-UX-13 · Operator-facing errors show full, copyable detail**
Admin and internal surfaces are debugging tools. Truncated or generic error
text turns a five-minute fix into an outage because the operator cannot forward
what they cannot read. Show the complete message, make it selectable, give it a
copy affordance.
- evidence: `field` — a production failure blocked an editor for ~2h partly
  because the error surfaced truncated in the logs UI.
- status: NEW
- detector: `ux/truncated-error-text` — an error/alert component applying
  truncation, line clamping or a string slice to the message — medium — review

**LD-UX-14 · Third-party embeds must degrade visibly and gracefully**
Content blockers, private DNS and privacy browsers intercept third-party
scripts at the network layer and can return synthetic success responses, so the
page believes the widget loaded. Every chat widget, map, embedded player or
analytics-driven UI needs a designed blocked state — a native fallback, not an
empty hole — and layout must not depend on the embed's height. Assume a
double-digit percentage of visitors never receive it.
- evidence: `field` — a blocked script returned a fake success with valid
  headers while nothing reached the vendor.
- status: NEW
- detector: `ux/embed-without-fallback` — an external script or iframe with no
  sibling fallback element — medium — review

**LD-UX-15 · Prefer a hidden honeypot over a challenge on low-volume forms**
For low-traffic forms a hidden honeypot field plus routing into an existing
human channel removes essentially all spam with zero user friction. Add a
challenge only after real spam volume proves it necessary.
- evidence: `field` — honeypot only, no captcha, no backend, zero spam
  reported.
- status: NEW
- detector: no

**LD-UX-16 · One label per destination across nav, breadcrumb, heading and title**
The words a user clicks must be the words that greet them. Nav label,
breadcrumb segment, page heading and document title for one destination are the
same string or a documented systematic variant; divergence breaks information
scent exactly when the user is checking whether they arrived.
- evidence: `derived` — the source asserts taxonomy and labeling as a pillar;
  the cross-artifact check is the only machine-verifiable form of it.
- status: NEW
- detector: `ia/label-desync` — link text not matching the target route's
  heading or document title, normalized — medium — review

**LD-UX-17 · Acknowledge within ~100ms even when the work is slow**
Any control that triggers work changes state within about 100ms of the press,
independent of how long the work takes; anything that can exceed roughly 400ms
shows determinate or skeleton progress and disables re-entry. Motion exists to
hide latency, never to add it.
- evidence: `derived` — the source asserts motion-for-perceived-performance;
  the budgets are the standard interaction thresholds.
- status: SHARPENS the in-flight form rules by generalizing them beyond forms
- detector: `ux/no-immediate-feedback` — an async click or submit handler with
  no pending, disabled or busy state set before the first await — high — review

**LD-UX-18 · Consent UI must match actual data behavior**
If the product sets no tracking or advertising cookies, ship the technical
notice only. A full advertising consent banner on a site that stores nothing
but a consent flag is both a truthfulness defect and a self-inflicted
conversion tax.
- evidence: `field` — only the technical variant applied, so no advertising
  banner was built.
- status: NEW
- detector: `content/policy-claims-unshipped-tech` — policy or banner copy
  naming analytics/advertising vendors with no matching script, dependency or
  env key in the repo — high — review

---

# 6. Anti-slop: copy and composition

The plugin's registry catches vocabulary, punctuation and visual priors. The
biggest gap this corpus closes is SYNTACTIC: the shapes generated copy takes
regardless of which words fill them. Read LD-SLOP-17 before importing any of
this — over-applying these rules produces a second, equally recognizable tell.

**LD-SLOP-01 · Ban negative parallelism**
No sentence, heading, caption or CTA rejects one frame to install another:
"It's not X, it's Y", "Not X. Y.", "Less X, more Y", "Not only X but also Y",
"The question isn't X, it's Y". The ban holds across sentence boundaries and
applies even when "not" is absent ("The dashboard looks like a reporting tool.
It is really a decision filter.").
- evidence: `measured` — the only external measurement in the corpus: counts of
  the construction in large-cap filings rose from ~50 (2023) to 200+ (2025),
  with named instances at several enterprise vendors.
- status: NEW — the registry has no syntactic tell
- detector: `slop/negative-parallelism` —
  `(?i)\b(?:it|this|that)(?:'s| is)? not (?:just |only |merely |simply )?[^.!?;]{2,60}[.;,]\s*(?:it|this|that)(?:'s| is)\b`
  plus `\bnot only\b[^.?!]{2,80}\bbut also\b`, `\b(?:less|fewer) \w+, more \w+\b`,
  `\bstop (?:thinking|doing) [^.]{2,40}\.\s*start\b` — high — certain

**LD-SLOP-02 · Ban the soft reframe setup**
Reject the same structure in polite disguise: a clause conceding a frame
("While X may seem", "At first glance", "Most people think", "Conventional
wisdom says") followed within two sentences by a pivot ("but", "actually", "in
reality", "the truth is", "the real", "the hidden"). The pivot word is fine
alone; it fails when it performs a reframe.
- evidence: `asserted`
- status: NEW
- detector: `slop/reframe-setup` — a concession opener plus a pivot within two
  sentences — medium — review

**LD-SLOP-03 · Section headings name their subject, not a reveal**
Banned heading shapes: "The real problem", "What actually matters", "The hidden
cost", "Beyond X", "From chaos to clarity", "Not a tool. A system." Replace
with the direct noun. These are literal heading strings on brand surfaces, so
the cost is visible.
- evidence: `asserted`
- status: NEW
- detector: `slop/reframe-heading` —
  `(?i)^\s*(?:the (?:real|hidden|actual|deeper) \w+|what (?:actually|really) \w+|beyond \w+|from \w+ to \w+|less \w+, more \w+)\s*$`
  — medium — certain

**LD-SLOP-04 · Contrast survives only for factual correction; repair by deletion**
Keep the construction when it corrects a specific factual, legal or numeric
error ("The file is 12 MB, not 12 GB"). Everywhere else the repair is
mechanical: delete the rejected half, keep the positive claim, rewrite as a
direct sentence.
- evidence: `asserted` — this is what keeps LD-SLOP-01 from being a blunt
  instrument, and it supplies the FALSE_POSITIVE verdict for its findings.
- status: NEW — waiver semantics for the three rules above
- detector: no — verification and repair procedure

**LD-SLOP-05 · Use the plain verb**
Do not dodge "is" and "has" with inflated substitutes: serves as, stands as,
marks a, represents a, boasts a, is designed to, aims to, seeks to, plays a
role in, helps to. Use is, has, uses, gives, shows, causes, changes, removes.
- evidence: `asserted`
- status: NEW — distinct from `content/buzzword-copy`, which targets nouns and
  adjectives
- detector: `content/bloated-verb` —
  `(?i)\b(?:serves? as|stands? as|marks? a|represents? a|boasts? an?|is designed to|aims? to|seeks? to|plays? an? \w* ?role in|helps? to)\b`
  — medium — review

**LD-SLOP-06 · Ban dead-metaphor scaffolding in claims**
No "the backbone of", "the engine of", "the DNA of", "the fabric of", "a bridge
between", "north star", "single pane of glass", nor their setups ("Think of it
as", "It's like"). Replace with the literal mechanism.
- evidence: `asserted` — with a usable permission test: the subject is genuinely
  unfamiliar, the analogy shortens the explanation, it does not mislead, and it
  reads aloud normally.
- status: NEW
- detector: `content/dead-metaphor` — the phrase list above — medium — review

**LD-SLOP-07 · Ban puffery and participle fake depth**
Do not inflate ordinary facts ("a pivotal moment", "a major shift", "setting
the stage for") or attach analytic-sounding participles ("highlighting its
importance", "underscoring its significance", "paving the way for"). State the
fact; if the analysis matters, give it its own sentence with a specific claim.
- evidence: `asserted`
- status: SHARPENS `content/buzzword-copy` — that rule is lexical, this is
  phrasal and catches copy containing no buzzwords
- detector: `content/puffery` — the phrase list above — medium — certain

**LD-SLOP-08 · Strip meta commentary and assistant chatter from UI strings**
Interface copy never narrates itself or performs helpfulness: "In this
section", "This guide will cover", "Let me walk you through", "Let's dive in",
"Great question", "Happy to help", "I hope this helps". These leak from chat
transcripts into empty states, onboarding and AI product surfaces.
- evidence: `asserted`
- status: NEW
- detector: `content/meta-chatter` — the phrase list in rendered strings — high
  — certain

**LD-SLOP-09 · Ban engagement bait**
No "Let that sink in", "Read that again", "This changes everything", "Nobody is
talking about", "Most people don't realize". Social-feed cadence pasted onto a
product surface costs credibility exactly where it is needed.
- evidence: `asserted`
- status: NEW
- detector: `content/engagement-bait` — the phrase list — medium — certain

**LD-SLOP-10 · Block model-disclaimer leakage on AI surfaces**
Never render knowledge-cutoff or capability disclaimers as interface copy: "As
of my last update", "Based on available information", "I don't have real-time
access", "As an AI language model". If data currency matters, show a real
timestamp.
- evidence: `asserted` — practical consequence: AI-facing products ship these in
  placeholder and empty-state copy.
- status: NEW
- detector: `content/model-disclaimer-leak` — the phrase list — high — certain

**LD-SLOP-11 · Break the triad habit**
Do not default every claim to three items; "fast, simple and secure" is a
shape, not a claim. Use one if one matters, two or four if that is what is
true. Scope this to headings and prose: three-tier pricing, three-step wizards
and three-column comparisons are structurally motivated.
- evidence: `asserted`
- status: SHARPENS the three-identical-cards prior — from composition to
  language; keep both
- detector: `content/adjective-triad` — a heading matching
  `\b(\w+), (\w+),? and (\w+)\b` where all three are generic-quality adjectives
  — low — review

**LD-SLOP-12 · Kill false ranges**
Delete "from X to Y" sweeps whose middle cannot be named ("from startups to
enterprises", "from ancient traditions to modern innovation"). Name the middle
or delete the range.
- evidence: `asserted` — with an explicit falsification test
- status: NEW
- detector: `content/false-range` — `(?i)\bfrom [\w -]{3,30} to [\w -]{3,30}\b`
  in headings or hero copy where neither endpoint is numeric, a date or a place
  — low — review

**LD-SLOP-13 · One name per entity across the whole interface**
Do not rename a thing to avoid repetition. If the product is "Atlas" it is
"Atlas" everywhere, not "the platform", then "the tool", then "the solution".
Pick one noun per concept and reuse it in nav, headings, body, empty states and
errors; centralize those names in one module so a late terminology change stays
coherent.
- evidence: `field` + `asserted` — a rename propagated cleanly across 10+
  surfaces precisely because names were centralized.
- status: SHARPENS "standard labels for standard actions" — that covers verbs on
  controls; this covers nouns for entities, where generated copy drifts
- detector: `content/entity-alias` — three or more distinct generic
  self-references ("the platform", "the tool", "the solution") within one
  page's copy, or any co-occurring with the product's proper name — low — review

**LD-SLOP-14 · Break metronome rhythm across sibling copy**
Card decks and feature grids whose sibling descriptions are all the same length
are generated filler. Vary length deliberately; if every sibling genuinely
needs identical length, the content is interchangeable and the section should
be cut or restructured.
- evidence: `derived` — the writing claim is asserted; the countable form is the
  operationalization.
- status: NEW — complements `slop/card-density` (count) with a content-uniformity
  signal
- detector: `slop/uniform-copy-length` — three or more siblings of one component
  type whose text-length coefficient of variation is under 0.08 — low — review

**LD-SLOP-15 · Cut repeated claims within a page**
The same claim in the hero, again in features, and again above the CTA is
padding that reads as length, not emphasis. Every section adds information; a
section that only restates gets deleted, not reworded.
- evidence: `derived`
- status: NEW
- detector: `content/claim-repetition` — any normalized four-word-plus phrase
  occurring three or more times in a page's visible copy, excluding nav, footer
  and button labels — low — review

**LD-SLOP-16 · Every claim carries something countable, or it is cut**
Replace vague claims with specific ones at audit time: "users were frustrated"
becomes "users clicked export six times because the page gave no loading
state". A value proposition with no number, name, mechanism or constraint is a
deletion candidate, not a rewrite candidate.
- evidence: `asserted` — consistent with, and opposite in direction to, the
  fabrication ban: do not invent numbers AND do not ship unfalsifiable claims.
- status: SHARPENS the filler test — filler asks "does this say anything", this
  asks "what would prove it false"
- detector: no — reviewer-level judgment

**LD-SLOP-17 · Avoiding a tell must not create a new tell**
These rules describe taste, not a checklist to satisfy. Do not swing into
all-staccato sentences, one-line paragraphs everywhere, or copy that reads as a
list of avoided mistakes, and do not refuse the exact right word because it
appears on a ban list. Write normally, then remove what sounds machine-made.
- evidence: `asserted` — but this is the guardrail the whole section depends on.
- status: NEW — extends "defaults, not bans" from visual priors to copy
- detector: no — belongs in the registry preamble and the audit self-check

**LD-SLOP-18 · Date every registry entry and expire it**
AI writing tells drift: words that passed two years ago read as machine-made
now. Every registry entry carries the date added and last confirmed; on a fixed
cadence, re-read recent output, add what now feels machine-made, delete what no
longer fires. A ban list that only grows becomes wrong.
- evidence: `asserted` — with concrete drift examples of specific words moving
  from acceptable to tell.
- status: SHARPENS the update flow — the registry must decay, not only grow,
  and entries need provenance dates so staleness is measurable
- detector: no — maintenance rule for the update skill

**LD-SLOP-19 · Uniformity is a tell: radius, spacing, type and reveal**
Additions to the visual registry, all of them "no decision was made": identical
border radius on buttons, cards, inputs and modals; identical spacing across
the whole UI regardless of density or hierarchy; one sans family with no real
type hierarchy; the same fade-up reveal on every section.
- evidence: `field` — the observed symptom catalogue across generated
  interfaces.
- status: NEW (extends the registry)
- detector: `slop/uniform-radius` — one radius token on 90%+ of radius-bearing
  components — low — review; `slop/uniform-reveal` — the same reveal variant on
  five or more top-level sections — low — review

**LD-SLOP-20 · The default section sequence is a tell**
Hero, features, testimonials, pricing, FAQ, footer shipped in that order
without asking whether this product needs those sections. Same for a generic
five-item navbar and a four-column template footer that do not reflect the real
information architecture.
- evidence: `field`
- status: NEW
- detector: `slop/default-section-sequence` — a page composing that exact
  section order — low — review

**LD-SLOP-21 · Label anything simulated, and purge false claims before any demo**
Mocked integrations carry a visible label ("Simulation — real integration in
production"); a simulated integration is never presented as live. Before
showing the product to investors or clients, purge every fabricated claim:
invented metrics, fictional testimonials, borrowed logos, sections describing
features that do not exist.
- evidence: `field` — what blocked an investor demo was not architecture, it was
  the false claims still in the interface.
- status: SHARPENS the fabrication detectors — adds the simulation label pattern
  and the pre-demo purge gate
- detector: `content/unlabeled-simulation` — components named mock/demo/fake/
  simulated rendered in app routes with no visible label string nearby — high —
  review

**LD-SLOP-22 · Make unresolved facts loud, not quietly plausible**
Every fact not yet supplied (company ID, address, registry data, price) gets a
bracketed named placeholder that is both greppable AND rendered in an alarming
color, so shipping it by accident is impossible. Never substitute a
plausible-looking value.
- evidence: `field` — pending markers rendered in the brand accent specifically
  so they shout during review.
- status: SHARPENS `content/todo-marker` — adds the visual-loudness requirement,
  which is what actually prevents shipping
- detector: extend `content/todo-marker` with `\[(PENDING|PENDIENTE|TBD)[^\]]*\]`
  plus a check that such nodes carry a distinguishing class — high — certain

**LD-SLOP-23 · Source testimonials from real aggregators, and never attach a synthetic face**
When the client cannot supply testimonials, extract real public reviews, keep
real names where they are public, abbreviate anonymous ones, and display the
true aggregate rating with its source and count. Never author the quotes — and
never pair a real attributed quote with a stock or generated human portrait;
use initials or the aggregator's own profile image.
- evidence: `field` — real reviews were used with the true aggregate displayed;
  the same project then assigned stock portraits by guessed gender and age,
  which is the failure this entry closes.
- status: SHARPENS `content/fake-testimonial` — supplies the positive procedure
  the detector lacks, and closes the hybrid case
- detector: `content/stock-face-on-testimonial` — an image from a known
  avatar-generation or stock-portrait host inside a testimonial/review/quote
  component — high — certain

**LD-SLOP-24 · Write institutional copy in the first person plural**
"We have been training drivers for 34 years" beats the impersonal gerund
construction. Use first person plural in hero body copy, about sections and
leadership quotes; it costs nothing and removes the brochure tone.
- evidence: `field` — direct before/after applied to hero body and a leadership
  quote.
- status: NEW
- detector: no

---

# 7. AI-native surfaces

**LD-AI-01 · Surface per-field confidence and make the proposal editable**
For any extraction feature (document to record, transcript to fields), return
structured output against a schema with each field as value plus confidence.
Fields below the threshold are visually marked for review and receive focus.
"The AI proposes, the human confirms" must be literal: fields are editable
BEFORE applying, with the human's overrides merged into the result. A
confirm-only UI silently launders model errors into the database.
- evidence: `field` — built as the core interaction of an AI-native ERP; the
  pitch only reads as credible when the UI shows uncertainty.
- status: NEW — the plugin has no AI-output surface pattern
- detector: no

**LD-AI-02 · Design the demo for failure, and verify it by what renders**
Never depend on a live model API in front of stakeholders. Ship a pre-extracted
showcase record so the proposal appears instantly, add an idempotent reset, and
show a visible demo-status strip so nobody presents an already-consumed
showcase. Then verify demo data by the RENDERED values, not by the records
existing: structurally valid seed data can still render zero across every
headline metric.
- evidence: `field` — seeded data contained only cost entries and no invoices,
  so the product displayed zero sales and zero margin with every table
  "present" — the worst possible reading for investors.
- status: NEW
- detector: no — rendered-value verification is a rendering check

---

# 8. Production, launch and visible correctness

**LD-PROD-01 · Share metadata: production base, per-page title, one URL form**
The metadata base URL points at production — share previews do not load assets
from a staging host, and a preview that fails from staging is correct, not a
bug. Title templates apply to the document title, NOT to the share title, so
every page sets its share title explicitly. Canonical, sitemap and structured
data emit the identical URL form (trailing slash included) from one helper.
- evidence: `field` — previews rendered without images from a staging base and
  with an inherited home-page title, in two projects.
- status: SHARPENS the trust-surface metadata item with three concrete failure
  modes
- detector: `content/metadata-base-non-prod` — a metadata base containing
  localhost, a preview host or "staging" — high — certain;
  `content/og-title-inherited` — page metadata defining a share object with no
  explicit title — medium — certain

**LD-PROD-02 · Static export forces the manual image contract**
With a static export target the framework's image component is unavailable, so
every image is a raw tag carrying explicit dimensions and an explicit loading
strategy, with eager reserved for the LCP image alone. Losing the optimizer
does not remove the obligation to optimize; record it as a platform constraint
so audits stop recommending the optimizer.
- evidence: `field` — two static-export projects; optimizer recommendations were
  repeatedly non-applicable findings.
- status: SHARPENS `a11y/img-missing-dimensions` with the causal chain that makes
  the omission systematic
- detector: `perf/img-missing-loading-attr` — an image tag without a loading
  attribute in a static-export project — low — certain; `production/img-eager-count`
  — more than one eager/priority image per route — low — review

**LD-PROD-03 · Crop source images to the slot ratio; never trust `object-cover`**
Design slots have a ratio; delivered photography usually does not. Centre-crop
then removes heads, faces and product. Pre-crop with attention-aware cropping
to the exact target ratio, keeping filenames so no layout or code changes. As a
side effect, client originals at 200-270KB land at 20-95KB in a modern format
at quality ~80.
- evidence: `field` — vertical client photos in 4:3 slots cut off heads in two
  projects; smart-crop under the same filenames fixed it with zero layout risk.
- status: NEW
- detector: no

**LD-PROD-04 · Never display an image larger than its source**
Constrain the container when the source asset is low-resolution instead of
letting the layout scale it. A max-width cap is a legitimate design decision,
not a compromise.
- evidence: `field` — sub-500px portraits pixelated in large slots and were
  capped at ~380-440px containers.
- status: NEW
- detector: `perf/upscaled-image` — an image whose intrinsic width is below the
  rendered container's declared minimum — medium — review

**LD-PROD-05 · Preconnect to third-party origins serving above-the-fold assets**
Any external origin serving hero imagery, map embeds or fonts gets preconnect,
secondary origins get DNS prefetch. This removes a DNS plus TLS round trip from
first paint, visible directly as hero image pop-in.
- evidence: `field` — preconnect to the image CDN and map host, prefetch for the
  messaging deep-link domain.
- status: NEW
- detector: `perf/third-party-lcp-no-preconnect` — a priority image whose host is
  external with no preconnect link to that host — low — certain

**LD-PROD-06 · Disable link prefetch when the payload does not exist**
In statically exported apps the framework's link prefetch requests
server-component payloads that were never generated, producing silent 404s that
surface as console errors in every audit. Disable prefetch or use plain
anchors.
- evidence: `field` — flagged under "browser errors logged to the console" in a
  Lighthouse audit.
- status: NEW
- detector: `production/prefetch-in-static-export` — a static export config plus
  any framework link without prefetch disabled — medium — certain

**LD-PROD-07 · Exactly one layout renders the document shell**
If two nested layouts both render the document element and body, the browser
collapses the nested body and drops its class while the server sent it,
producing a hydration mismatch that loses font or theme classes. The shell
belongs to the layout that owns the language attribute; outer layouts pass
children through.
- evidence: `field` — root and locale layouts both rendering the shell caused
  the mismatch.
- status: SHARPENS "shell in the layout" with the duplicate-shell failure
- detector: `production/duplicate-document-shell` — more than one layout file in
  the same route ancestry containing the document element — high — certain

**LD-PROD-08 · Allowlist every host you might ever load, on day one**
A feature gated behind an unset public env var emits no tag, so the content
policy never complains. Months later the var gets set, the tag appears, and the
policy blocks it: a latent regression surfacing as a silently missing UI
feature. List every plausible script, style and font host up front; unused
entries are harmless.
- evidence: `field` — a script gated by an unset var returned nothing for months,
  then hit a policy block the day the var was set.
- status: NEW
- detector: `prod/external-host-not-in-policy` — an external host in a script,
  link or import with no matching entry in the security-headers file — high —
  review

**LD-PROD-09 · Build-time public env vars gate visible features and need a cache-free rebuild**
Public-prefixed env vars are substituted at compile time, not read in the
browser. Setting one in a dashboard changes nothing until a rebuild that skips
the cache, so a feature the client believes is live is still absent. Design the
unset state deliberately and verify by grepping the deployed HTML, not by
trusting the dashboard.
- evidence: `field` — an analytics ID did not appear until a cache-free rebuild;
  in a sibling project a form key baked at build time meant the contact form
  silently fell back to phone links.
- status: NEW
- detector: `prod/public-env-gated-render` — a public env var used in a
  truthiness guard that returns nothing — medium — certain

**LD-PROD-10 · Lock the full type weight set and the load path up front**
Decide every weight the design will use before implementation; discovering a
missing weight later means a rebuild or faux-bold rendering. Fonts outside the
framework's font manifest need an explicit stylesheet link, and that host must
be in the content policy from day one.
- evidence: `field` — the body face was missing from the font manifest, and
  weights 500/700 were added mid-project.
- status: NEW
- detector: `system/font-weight-gap` — a font-weight utility with no matching
  weight in the loaded font declaration — medium — review

**LD-PROD-11 · Reserve space for everything that arrives late, fonts included**
Layout shift is a visual defect, not a performance metric. Every
asynchronously mounted element (image, embed, banner, chart, conditional alert)
declares its box before it loads, and web fonts declare a display strategy plus
a metric-matched fallback so the swap does not reflow paragraphs.
- evidence: `derived` — the source asserts layout-shift prevention; the font
  metric-override mechanism is established practice.
- status: SHARPENS `a11y/img-missing-dimensions` — extends it to the non-image
  cases, which are the ones that usually ship broken
- detector: `perf/unreserved-async-box` — a font-face block without a display
  strategy, or a conditionally rendered media/iframe/chart with no dimensions,
  aspect ratio or min-height — medium — review

**LD-PROD-12 · Derive post-submit UI state; do not set it in an effect**
Collapsing a dialog, resetting a form or redirecting after a successful action
is derived from the action result, not written with a state setter inside an
effect. Effects carry only genuinely external side effects (toast, parent
callback, logging).
- evidence: `field` — setting open state inside the post-submit effect tripped
  the lint rule and blocked commits; deriving it removed the setter entirely.
- status: NEW
- detector: `ux/setstate-in-effect` — a state setter called directly in an effect
  body outside an async callback or timer — medium — certain

**LD-PROD-13 · Pin the CSS framework major before writing any styles**
Scaffolders install the newest major by default; utility names, plugin APIs and
entry directives differ across majors, so rules written against the wrong major
fail silently. Confirm the major in the first commit and align then, not
mid-project. Do NOT encode a version preference — the rule is "pin and verify",
which ages well.
- evidence: `field` — a default install broke prior-major utilities and plugin
  integration; a decision at start would have cost minutes instead of a session.
- status: NEW
- detector: `system/framework-version-mismatch` — both majors' entry directives
  present, or a new-major dependency alongside an old-major config using the
  legacy plugin API — high — review

**LD-PROD-14 · A brand font can gate LCP; that is a decision, not a defect**
When the LCP element is a heading in a variable brand face, lab LCP is bounded
by the font swap and will not drop below roughly 3.5-4s on mobile without
abandoning the typeface. Record it as an explicit brand trade-off in the system
doc instead of re-finding it in every audit; real-world cached performance is
materially better than lab.
- evidence: `field` — repeated lab LCP failures on a serif-display brand traced
  to font swap, not to the page.
- status: NEW
- detector: no

**LD-PROD-15 · Centralize entity names so a rename stays coherent**
Names of locations, plans, tiers and features live in one constants module and
are referenced everywhere, including inside translated strings via
interpolation. A late terminology change touches 10+ surfaces, and any surface
that missed the rename reads as a different product.
- evidence: `field` — a rename propagated across 10+ places because names were
  centralized.
- status: NEW (implementation counterpart of LD-SLOP-13)
- detector: no

---

# 9. Audit and process

**LD-DA-01 · Wire the design gate into the build, and verify the host runs it**
Design drift in multi-session projects has one root cause: no mandatory
invariant layer. Put the design lint in the build command so reintroducing raw
palette or a native control fails the build, not the review. Then verify the
HOST's build command actually runs the wrapper — a host configured to call the
framework build directly skips the gate on every deploy while local stays
green.
- evidence: `field` — every pass reintroduced different widths, unstyled tables
  and raw colors until the gate existed.
- status: SHARPENS the detector from an audit-time tool to a build-time gate
- detector: `system/design-gate-not-wired` — a lint script exists but the build
  script does not invoke it — medium — certain

**LD-DA-02 · Automate only what grep can decide; exemptions are named lists with reasons**
Split invariants into mechanically checkable (widths, native controls, raw
palette, odd values) and judgment-based (hierarchy, rhythm, tone). Automate
only the first. Exemptions are explicit per-rule lists with a written reason —
financial tables needing a footer row, dense inline editors, print and email
templates — never silent skips.
- evidence: `field` — the lint held only because each rule carried a documented
  exemption list; silent exceptions had previously destroyed trust in it.
- status: SHARPENS inline waivers — adds the per-rule exemption list and the
  automate/judge split as an authoring principle
- detector: no

**LD-DA-03 · Tokenization and responsiveness are separate audits**
A token linter sees values, not breakpoints. A codebase can be fully tokenized
and still collapse on mobile. Run layout and breakpoint review as its own axis
with its own evidence, never as a byproduct of token compliance.
- evidence: `field` — after the token lint went green, every mobile squash
  remained.
- status: NEW
- detector: see LD-UX-04

**LD-DA-04 · Patching the screenshot is not fixing the defect**
When the same class of problem returns audit round after audit round, stop
fixing instances: the cause is an under-adopted primitive or a missing
invariant. Escalate to automation or adoption. Instance-level patching is
visible to the client as "it keeps breaking".
- evidence: `field` — repeated rounds of width, color and control fixes; only
  the invariant layer stopped the recurrence.
- status: SHARPENS the convergence loop with a root-cause escape hatch
- detector: the audit history can flag any finding category appearing in two or
  more consecutive audits — medium — certain

**LD-DA-05 · Capture protocol: full-page screenshots lie when reveals exist**
Full-page capture renders everything below the fold blank when sections use
intersection-triggered reveals, and programmatic scroll faster than ~500ms per
section triggers neither the reveal nor lazy loading. Scroll for real with
700-900ms pauses and take viewport captures. Headless window width bottoms out
around 469px, so narrow-viewport checks need device-metrics emulation, not
window sizing. Automation screenshots come back downscaled, so grain, glow and
motion intensity cannot be judged from them — that needs a human on a real
screen.
- evidence: `field` — an entire audit round ran against blank below-fold
  captures; "mobile" captures were 469px desktop.
- status: NEW — the plugin renders screenshots but has no capture-fidelity
  contract
- detector: no

**LD-DA-06 · Measure against a production build, and know which metrics are noise**
Never measure performance on a dev server: unminified, uncompressed, hot reload
active. Serve the production build and measure there. Local lab runs are noisy:
speed index and total blocking time swing with machine load, so decide on first
paint, layout shift and bundle size and treat the rest as directional. Set the
budget up front rather than measuring at the end.
- evidence: `field` — dev-server scores were low while the same build served
  properly scored in the high nineties; contradictory runs on one build led to
  chasing a non-existent regression.
- status: NEW
- detector: no

**LD-DA-07 · Bucket hosting-layer findings separately from code findings**
Some findings (content policy, transport security, frame options) are HTTP
response headers and cannot be fixed or tested in the codebase or on localhost.
Report them in a separate "not fixable here" bucket with the deployment owner
named, so the score reflects what design and code actually control.
- evidence: `field` — a best-practices score was fully explained by missing
  hosting headers and one browser-extension warning, not by the code.
- status: NEW
- detector: no

**LD-DA-08 · Parallel lenses: read-only, evidence-anchored, disjoint on fix**
Run review lenses in parallel, strictly read-only, each finding anchored to
file and line. Verify every finding against the real code before acting:
parallel reviewers are accurate but not infallible. When fixing in parallel,
assign disjoint file groups, put an explicit "no build, no commit, no push"
instruction at the top of each fork, and let the parent run a single build at
the end. Resolve findings in numbered, categorized packs of 7-10.
- evidence: `field` — a fork pushed the tree despite the instruction; concurrent
  builds raced on the same cache; pack-based resolution kept a large findings
  table tractable.
- status: SHARPENS reviewer continuity — adds the execution contract and pack
  size
- detector: no

**LD-DA-09 · Walk the whole critical flow as a first-time user, then keyboard-only**
Before delivery, complete the end-to-end critical path as a new user, then
repeat it with the keyboard alone. If the keyboard pass cannot complete the
flow, it is one blocker (usability and accessibility), not two findings.
- evidence: `field` — used as the pre-delivery gate; keyboard-only passes
  surfaced flow breaks that component-level review missed.
- status: SHARPENS per-component keyboard coverage with an end-to-end gate
- detector: no

**LD-DA-10 · Record standing constraints before the first audit**
Capture the constraints that would otherwise generate recurring false positives:
static export, single-locale content, "every page has a hero", asset
conventions, brand exceptions. An audit that keeps re-raising known constraints
trains the reader to skim it.
- evidence: `field` — optimizer recommendations were non-applicable under static
  export and had to be restated every round.
- status: SHARPENS project memory — a pre-audit constraints file that suppresses
  known-inapplicable findings
- detector: no

**LD-DA-11 · Name the failure modes of the design loop**
The convergence cycle checks itself against a fixed taxonomy: wrong first move
(editing before rendering or reading the existing system), chasing symptoms
(patching the call site instead of the token), looping (the same fix reapplied
in different wording), overbuilding (sections not in the brief), scope drift,
ignored evidence (proceeding past a render or detector output that contradicts
the plan), no verification (not re-rendering after the fix), and missed stop
point.
- evidence: `derived` — taken structurally from a trajectory-review skill and
  mapped onto design work.
- status: NEW — the plugin has a no-progress stop but no vocabulary for WHY
  progress stopped
- detector: `process/repeat-fix` — the same file and property targeted by three
  or more edits across separate iterations with no intervening score change on
  the related dimension — medium — review

**LD-DA-12 · Verify per batch, not at the end**
Fix in small same-category batches and run the smallest useful check after each
one: re-render the affected surface, re-run the detector on the touched files.
Accumulating a large unverified diff destroys attribution, which is what makes
a regression cheap to fix.
- evidence: `asserted` — consistently stated across the agent-skill sources.
- status: SHARPENS the bounded cycle — it bounds iterations; this bounds the
  diff inside an iteration
- detector: no

**LD-DA-13 · Reports open with the blocker and close with one next step**
The report opens with the blocking finding, not the score table, and ends with
a single recommended next action, not a menu. Each finding is labeled measured
(a computed or rendered value with its location) or inferred (judgment), so
score movement between audits is attributable to work rather than to a
reviewer disagreeing with a prior judgment call.
- evidence: `asserted` — mandatory closing sections in the agent-skill sources;
  the measured/inferred split comes from the same corpus.
- status: SHARPENS "evidence mandatory" — labeling evidence TYPE is what makes
  cross-audit deltas readable
- detector: no

**LD-DA-14 · Verify demo and seed data by rendered values**
Seeded records that are structurally valid can still render zero across every
headline metric. Verify the rendered numbers, not the presence of tables, before
any stakeholder-facing session.
- evidence: `field` — see LD-AI-02.
- status: NEW
- detector: no

---

# 10. Workflow and plugin self-architecture

**LD-WF-01 · No UI before the system document exists**
The first question on any interface work is whether a system document exists.
If yes, it is the single source of truth and no variable gets invented. If no,
produce a minimum viable one first: brand colors with the full semantic set,
type roles and scale, base unit, radii, shadow scale, and the brand tone as
three adjectives PLUS what the brand is not PLUS one or two client reference
URLs. No component generation before that file exists.
- evidence: `field` — stated as an operating rule after projects that generated
  UI first and retrofitted the system.
- status: SHARPENS the direction contract — adds the hard generation gate, the
  explicit semantic color set and "what it is not" as a required field
- detector: no

**LD-WF-02 · Give every design decision an ID and cite it at the point of use**
Named decisions are referenced from code comments, commit subjects and PR
bodies, so anyone reading the artifact reaches the rationale. Pair with a plan
agreed before implementation and a handoff note at session close listing state,
new decisions, ordered backlog and the first step for next time.
- evidence: `field` — ID-referenced decisions prevented re-litigating closed
  ones; plan-as-doc before coding was credited with cutting scope rework to
  zero.
- status: SHARPENS `decisions.jsonl` — the ID must be cited where the decision
  bites, not only stored
- detector: `process/undocumented-waiver` — an inline disable comment with no
  decision ID reference — low — certain

**LD-WF-03 · Do the safe thing, flag the rest — and publish the boundary**
Anything touching brand identity, business channels, pricing or legal content
is a proposal requiring owner sign-off, never an autonomous fix. State the list
before work starts: deleting files, renaming or moving, restructuring routes or
navigation, changing global tokens or global CSS, adding a dependency, removing
content or sections, replacing a working component wholesale. The audit output
separates applied fixes from flagged proposals, each with its rationale, so
review is a decision list rather than a diff review.
- evidence: `field` — the working pattern across projects; brand items were
  carried as a pending list rather than changed.
- status: SHARPENS "the brief wins" — see the resolutions section
- detector: no

**LD-WF-04 · Tier edits by blast radius, not only by severity**
Classify every intended edit before making it. Low: copy, one local component,
styles scoped to that component. Medium: shared components, layout files,
navigation, form logic, page structure. High: design tokens, global
stylesheets, route structure, dependencies, deletions and renames. High-tier
edits are listed and approved before they happen, never bundled into a polish
pass.
- evidence: `asserted` — the same three-level taxonomy in all four agent-skill
  sources; domain-critical here because a token edit is the highest-reach change
  available and looks like the smallest.
- status: NEW — orthogonal to the existing severity tiers
- detector: no

**LD-WF-05 · Separate the requested change from the stated problem**
Record both what the user asked for and the problem they said it would solve.
When a requested change provably cannot fix the stated problem, say so once,
concretely, then execute the request anyway unless it breaks accessibility or
truthfulness. Silent compliance and silent substitution are both failures.
- evidence: `asserted`
- status: SHARPENS "the brief wins" — the brief overrides taste, not arithmetic;
  one flag, then execute
- detector: no

**LD-WF-06 · Close every cycle with a trajectory note**
When the cycle converges or stops, write a short retrospective into project
memory: which fixes regressed, which were reapplied, which findings were false
positives, what to do first next time, and what a cleaner prompt would say.
This is what makes iteration budgets compound across sessions instead of
resetting.
- evidence: `asserted` — an entire skill in the corpus exists for this, ending
  in a rewritten prompt for the next attempt.
- status: NEW — decisions, rejected patterns and score history record outcomes;
  none records PATH
- detector: no

**LD-WF-07 · Collect the user's reference set at first run**
A design skill without the user's swipe file, target audience and real outcome
data applies generic criteria. Make collecting a reference set (10-20 real
examples in the user's niche, plus any real performance data) an explicit
onboarding step stored in project memory, so audits judge against the user's
standard rather than a default one.
- evidence: `asserted` — named as the prerequisite that was missing from an
  otherwise complete tooling stack.
- status: SHARPENS project preferences — makes the reference set a first-run
  prompt rather than passive accumulation
- detector: no

**LD-WF-08 · A manifesto is not a skill**
Role descriptions and principle documents state values without procedure. A
skill needs steps, decision criteria and verifiable outputs. Keep principle
documents as reference files consumed by a skill; never promote them to skills.
- evidence: `field` — a vault audit found eleven role documents, all
  declarative, none executable.
- status: SHARPENS the plugin's reference/skill split with a promotion test
- detector: no

**LD-WF-09 · Few skills with rich references beat many overlapping skills**
Splitting one domain into sibling skills makes them compete for activation and
fire unreliably. Consolidate into few skills with disjoint trigger surfaces and
push domain material into reference files. Before adding a capability,
inventory what is already installed: duplicating an existing skill costs
activation reliability, not just effort.
- evidence: `field` — a vault audit killed proposed UI, motion and bootstrap
  skills because installed equivalents already existed.
- status: SHARPENS the current architecture — names activation competition as
  the concrete failure mode, relevant whenever this plugin is tempted to split
  design-audit or design-system further
- detector: no

**LD-WF-10 · Keep the loaded surface pruned**
Every always-loaded skill and plugin is re-read per turn. An unpruned toolchain
multiplied session cost by an order of magnitude while contributing nothing.
Load design-relevant tooling only, and make pruning part of project setup.
- evidence: `field` — ~156 loaded skills reloading each turn drove sessions past
  $100 before pruning to the four actually used.
- status: NEW
- detector: no

---

# 11. Tensions and resolutions

Resolve these before importing the entries they touch.

**T1 · "The brief wins" vs "the client is not the user" (LD-WF-03, LD-WF-05)**
The plugin's override lets an explicit brief beat plugin taste. Two sources
restrict that: client aesthetic preference does not beat demonstrated
usability, and brand-owned assets (logo colors, CTA destination channels,
contact routing, pricing, legal copy) require approval rather than designer
discretion.
Resolution: encode as "brief > plugin taste; brief ≠ override of usability
evidence or accessibility". Add the ownership boundary as a published list, and
the one-flag-then-execute rule so the brief still wins on execution.

**T2 · "One primitive per concept" vs "not all duplication is debt" (LD-DS-07, LD-DS-10)**
Both are field-proven. Precedence: prove shared INTENT before merging.
`system/near-duplicate-tokens` and duplicate-primitive findings are questions,
not verdicts; the reviewer must state what both consumers need before a merge
is proposed.

**T3 · Blanket "no ease-in on UI" vs symmetric easing (LD-MOT-05)**
Narrow the existing rule to entrances and one-way transitions. Bidirectional
movement (accordion, toggle, hover translate that returns) legitimately takes
ease-in-out; keep two easing tokens rather than one.

**T4 · Skip link removal (LD-A11Y-08)**
The source's DECISION (delete the skip link) contradicts WCAG 2.4.1 and must
not be absorbed. Absorb the failure mode and the fix, and add the orphan-target
detector so a deleted skip link with a surviving anchor is caught.

**T5 · Em dashes: hard ban vs density rule**
One source bans em dashes outright. Keep the plugin's existing density rule: em
dashes are legitimate punctuation and a zero-tolerance rule fires on well-set
editorial copy. Do not adopt the ban.

**T6 · Metaphor ban vs the direction contract (LD-SLOP-06)**
Applied literally, a blanket metaphor ban strips the differentiator: a thesis, a
tension and a signature move are frequently expressed metaphorically.
Resolution: apply the ban to product UI copy and generic claims; permit at most
one deliberate, project-specific metaphor in brand narrative when the direction
contract names it.

**T7 · Rule of three (LD-SLOP-11)**
Scope to headings and prose only. Three-tier pricing, three-step wizards and
three-column comparisons are structurally motivated and must not fire.

**T8 · Sentence case as a universal (LD-DS-18)**
Encode consistency as the rule and sentence case as the default, never as a
ban: some brands mandate title case or all caps.

**T9 · Real quote plus synthetic face (LD-SLOP-23)**
A true quote with a stock or generated human portrait is MORE deceptive than an
initials avatar and no more useful. Never pair an attributed real quote with a
synthetic face.

**T10 · Emoji in generated message payloads**
The emoji-as-icon ban applies to rendered UI chrome. A plain-text payload sent
into a plain-text channel may legitimately use emoji as its only structural
marker; carve this out so the detector does not fire on message templates.

**T11 · "Prefer framework version N" (LD-PROD-13)**
Do not encode a version preference; it ages badly. The transferable rule is
pin-and-verify at scaffold time.

---

# 12. Priority for integration

Ranked by expected defect prevention per unit of work, using the plugin's own
priority order (usability and accessibility before identity).

**Tier 1 — import first**
LD-DS-01 (alpha placeholder), LD-A11Y-03 (legal behind reveal), LD-MOT-01 (LCP
behind reveal), LD-MOT-02 (counter resting at zero), LD-UX-01 (order with
asymmetric tracks), LD-I18N-01/02/03 (locale correctness triad), LD-SLOP-01
(negative parallelism), LD-DA-05 (capture protocol), LD-DA-06 (production-build
measurement).
Rationale: each is a shipped, visible defect; eight of the ten are mechanically
detectable; the capture and measurement entries fix the audit's INPUT validity,
which silently invalidates everything downstream.

**Tier 2 — the coherence layer**
LD-DS-03 (container width), LD-DS-04 (semantic freeze), LD-DS-07/08/09
(primitive discipline), LD-DS-12 (raw black/white), LD-DA-01 (build gate),
LD-DA-02 (exemption lists), LD-DA-04 (root-cause escalation), LD-WF-04 (blast
radius), LD-WF-03 (ownership boundary).

**Tier 3 — copy and content**
The rest of section 6, plus LD-DS-19 (verbal identity spec) and LD-DS-20
(claim-to-proof), gated by LD-SLOP-17 (anti-overfitting) and LD-SLOP-18 (dated,
expiring entries) — import those two FIRST or the section becomes a new tell.

**Tier 4 — new capability**
Section 7 (AI-native surfaces) is a genuinely absent category, not a
refinement. Section 3 (i18n) beyond the triad. LD-WF-06 (trajectory note),
LD-WF-07 (reference set).

**Known gap, not covered by this corpus**
Conversion architecture: section ordering by audience awareness, one idea per
viewport, CTA hierarchy across a page, objection placement, form-friction
reduction. The vault's own audit named this as its central gap, and this
database does not close it. It is orthogonal to visual quality and is where
brand-surface work is actually judged. Source it separately before promising
it.

---

# 13. What the corpus contained and this file deliberately omits

- **Backend and infrastructure**: ORM and database choice, migrations, auth
  internals, payment gateways, email providers and deliverability, blob
  storage, deploy and DNS, CI minutes, PR stacking, rate limiting, secret
  handling. Retained only where a failure surfaced in the interface (LD-PROD-08,
  LD-PROD-09).
- **Jurisdiction-specific legal templates**: national privacy and cookie
  checklists, special-category data handling. Not portable, and encoding legal
  templates in a design plugin is a liability. Retained only the transferable
  principles (LD-UX-18, LD-SLOP-21, LD-SLOP-22).
- **Agent and tooling configuration**: the corpus's largest single block by page
  count was guides to structuring the `.claude` directory, CLAUDE.md templates,
  prompt-engineering newsletters and project scaffolding. Out of scope for a
  design OS; only architecture-level lessons survived (LD-WF-08 to LD-WF-10).
- **Role manifestos**: eleven thematic guides that are table-of-contents
  templates for roles (brand strategy, marketing funnels, product ownership,
  security hardening). Roughly a hundred headings dropped; ten entries survived,
  each rewritten into something falsifiable.
- **Local tooling and OS gotchas**: image-library file locks, dev-server cache
  collisions, headless PDF generation, editor configuration.
- **Analytics methodology**: blocking rates, measurement-protocol validation.
  Retained only the design consequence (LD-UX-14).
- **Vault-specific inventory**: file counts, per-file value judgements and a
  personal roadmap of future skills.

Provenance for every entry: `docs/learnings/2026-08-nutrionyx.md` (the earlier
harvest, already integrated in v0.2.0) and the vault described at the top of
this file. Nothing here was copied verbatim from a third party; all entries are
rewritten from first-party project logs and one public article whose only
reusable asset is a factual measurement and a pattern list.
