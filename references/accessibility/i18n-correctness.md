# Internationalization Correctness

Localization mechanics (Intl formatting, string expansion, RTL) live in
`heuristics/ux-laws.md`. This file is the failure catalog: defects that render
the interface visibly wrong in one language while the build stays green and
every test passes. All three were found in shipped bilingual sites.

## The three that ship broken

1. **Pass the locale explicitly to the client i18n provider**
   [i18n/provider-missing-locale]. Without an explicit locale prop the provider
   falls back to the default: server HTML is correct while every
   client-rendered locale-dependent element (switcher active state, formatted
   numbers and dates) is wrong. Symptom: the language switcher marks the wrong
   language active.

2. **Switching locale requires a full navigation**
   [i18n/locale-switch-soft-nav]. Client-side navigation keeps the previous
   locale in cached context, so a switcher built on the framework's link
   component renders the new URL with the old language. Use a plain anchor so
   the localized layout remounts.

3. **No hardcoded locale segment in any href**
   [i18n/hardcoded-locale-href]. Server components rendered as layout children
   do not reliably inherit the request locale in nested or statically exported
   setups; they fall back silently and emit cross-locale links. Every component
   that builds localized URLs reads the locale from context.

## Auditing translation coverage

- Key parity is not coverage. Flatten every catalog and report BOTH keys
  missing from non-default locales AND strings byte-identical to the default.
  Whitelist numbers, brand names and short tokens; the residue is untranslated
  long-form copy that a key count would have passed.
- Verify accessible names against the BUILT output, per locale: extract every
  `aria-label` and `alt` from each locale's rendered HTML and confirm none is
  in another language. Source-level checks miss labels injected by libraries
  and component defaults.
- Give accessible names their own translation namespace. They are the first
  strings to be hardcoded and the last to be translated; a dedicated namespace
  makes them greppable in one lookup.

## Scoping and structure

- Ship one complete locale before three partial ones. Partial locales produce
  mixed-language screens, which read as broken rather than multilingual.
- Scope namespaces by surface (nav, hero, pricing, footer), not one flat bag:
  a component pulls only its own strings, collisions stay local, and an
  untranslated area shows up as a whole missing namespace.
- A key cannot be both a leaf string and a parent object. The collision throws
  at render, so the component breaks in production with an opaque message.
- Long-form content (legal, docs, catalog entries) leaves the message catalog
  for typed per-locale modules: catalogs handle short strings and handle nested
  paragraph arrays badly.
- Prefer always-on locale prefixes in the URL. Hidden-default modes create
  canonical, hreflang and sitemap edge cases, and they make locale-dependent
  link bugs invisible in the default language.

## Formatting

- Counters, stats, prices and dates format with the RESOLVED active locale,
  never a hardcoded one and never the browser default. Animated counters are
  the usual leak because intermediate values are generated in JS.
- Locale indicators are inline SVG, never emoji flags: emoji do not render on
  all platforms, cannot be styled, and cannot express sub-national flags.
