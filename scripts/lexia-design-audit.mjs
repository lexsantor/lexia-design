#!/usr/bin/env node
/**
 * lexia-design-audit — deterministic UI audit. Zero dependencies, Node >= 18.
 *
 * Modes:
 *   lexia-design-audit.mjs <file...> [--format text|json]   audit specific files
 *   lexia-design-audit.mjs --deep [dir] [--format ...]      walk a directory + project-level rules
 *   lexia-design-audit.mjs --hook                           PostToolUse hook (stdin JSON, advisory)
 *   lexia-design-audit.mjs --stop-check                     Stop hook (reminds about unresolved findings)
 *   lexia-design-audit.mjs --list-rules                     print the rule table
 *   lexia-design-audit.mjs --waivers [dir]                  list inline waivers (audit them against decisions.jsonl)
 *
 * Exit codes (CLI modes): 0 = no critical/serious findings, 1 = critical/serious found, 2 = internal error.
 * Hook modes always exit 0 and never block.
 *
 * The detector finds mechanical violations. `confidence: "review"` findings are
 * heuristic and require human/agent judgment — they are signals, not verdicts.
 * Every reported finding must be verified against its context before acting
 * (TRUE_POSITIVE / MITIGATED / FALSE_POSITIVE). It never rewrites code.
 *
 * Inline waivers: `lexia-disable-file <rule-id>` and
 * `lexia-disable-next-line <rule-id>` inside comments, paired with a
 * decisions.jsonl entry.
 */
// lexia-disable-file ux/native-confirm -- rule-definition strings self-match; this file calls no dialogs

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, extname, resolve, relative } from "node:path";
import process from "node:process";

const MARKUP = new Set([".html", ".htm", ".jsx", ".tsx", ".vue", ".svelte", ".astro"]);
const STYLES = new Set([".css", ".scss", ".sass", ".less", ...MARKUP]);
const SCRIPTY = new Set([".js", ".ts", ".mjs", ".cjs", ...MARKUP]);
const ALL_EXTS = new Set([...MARKUP, ...STYLES, ...SCRIPTY]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", ".svelte-kit", "out", "coverage", "vendor", ".vercel", ".turbo", ".astro", "storybook-static"]);
const MAX_FILE_BYTES = 1_000_000;

/* ---------------------------------- rules ---------------------------------- */
// kind: "line" (regex per occurrence), "file" (single finding), "count" (threshold on occurrences)
// raw: run on raw content (default runs on comment-blanked content)
const RULES = [
  {
    id: "a11y/user-scalable-no", severity: "critical", confidence: "certain", exts: MARKUP,
    kind: "line", re: /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?\b/gi,
    dedupePerLine: true,
    msg: "Zoom disabled in viewport meta",
    fix: "Remove user-scalable=no / maximum-scale=1. Zoom must always work (WCAG 1.4.4).",
  },
  {
    id: "a11y/paste-blocked", severity: "critical", confidence: "certain", exts: SCRIPTY,
    kind: "line", re: /onPaste\s*=\s*\{[^}]{0,60}preventDefault|onpaste\s*=\s*["']\s*return\s+false/g,
    msg: "Paste appears to be blocked",
    fix: "Never block paste (WCAG 3.3.8; password managers, OTP). Accept input, then validate.",
  },
  {
    id: "a11y/tabindex-positive", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "line", re: /tab[iI]ndex\s*=\s*["'{]?\s*[1-9]/g,
    msg: "Positive tabindex overrides natural focus order",
    fix: "Use tabindex 0/-1 and fix DOM order instead.",
  },
  {
    id: "a11y/div-click", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "line", re: /<(div|span|p|li)\b[^>]*\son[Cc]lick/g,
    msg: "Click handler on a non-interactive element",
    fix: "Use <button> (actions) or <a> (navigation). Keyboard and AT support come free.",
  },
  {
    id: "a11y/outline-none-no-focus-visible", severity: "serious", confidence: "certain", exts: STYLES,
    kind: "file",
    test: (c) => /outline\s*:\s*(none|0)\b|outline-none/.test(c) && !/(focus-visible|focus-within|--tw-ring|\bring-)/.test(c) && !/:focus[^{}]*\{[^}]*(box-shadow|border(?!-radius)|background)/.test(c),
    re: /outline\s*:\s*(none|0)\b|outline-none/,
    msg: "Focus outline removed with no visible replacement in this file",
    fix: "Provide a :focus-visible style with >= 3:1 contrast (WCAG 2.4.7/1.4.11).",
  },
  {
    id: "a11y/img-missing-dimensions", severity: "moderate", confidence: "certain", exts: MARKUP,
    kind: "line",
    re: /<img\b(?![^>]*\bwidth\s*=)[^>]*>|<img\b(?![^>]*\bheight\s*=)[^>]*>/g,
    dedupePerLine: true,
    msg: "<img> without explicit width/height",
    fix: "Set width/height (or aspect-ratio) to reserve space and avoid CLS.",
  },
  {
    id: "a11y/icon-button-no-name", severity: "serious", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /<button\b(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*\btitle\s*=)[^>]*>\s*(?:\{[^}]*\}\s*)?<(svg|[A-Z][\w]*Icon|Icon\b)[\s\S]{0,300}?<\/button>/g,
    msg: "Icon-only button may lack an accessible name",
    fix: "Add aria-label (or visually-hidden text) naming the action (WCAG 4.1.2).",
  },
  {
    id: "a11y/placeholder-as-label", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /<(input|textarea)\b(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*type\s*=\s*["'](hidden|submit|checkbox|radio|button|file)["'])[^>]*\bplaceholder\s*=[^>]*>/g,
    msg: "Input with placeholder — verify a real associated <label> exists",
    fix: "Placeholder is an example, not a label (WCAG 3.3.2). Associate a visible label.",
  },
  {
    id: "a11y/autofocus", severity: "minor", confidence: "certain", exts: MARKUP,
    kind: "line", re: /\b(autofocus|autoFocus)\b(?=[\s=/>])/g,
    msg: "autofocus steals focus on load",
    fix: "Justify per APG guidance or remove; disorienting for AT and keyboard users.",
  },
  {
    id: "motion/transition-all", severity: "serious", confidence: "certain", exts: STYLES,
    kind: "line", re: /transition\s*:\s*all\b|(?<=["'\s])transition-all(?=["'\s])/g,
    msg: "transition: all",
    fix: "Transition named properties only (transform, opacity, color). 'all' animates layout by accident.",
  },
  {
    id: "motion/layout-prop-transition", severity: "serious", confidence: "certain", exts: STYLES,
    kind: "line",
    re: /transition\s*:\s*[^;{}]*\b(width|height|top|left|right|bottom|margin|padding|max-height|max-width)\b/g,
    msg: "Transitioning a layout property",
    fix: "Animate transform/opacity; layout properties trigger reflow every frame.",
  },
  {
    id: "motion/scale-zero-entrance", severity: "moderate", confidence: "review", exts: STYLES,
    kind: "line",
    re: /\bscale\(\s*0(?:\.0+)?\s*\)|(?<=["'\s])scale-0(?=["'\s])|scale:\s*0(?=[,\s}])/g,
    onlyIf: (c) => /transition|animation|@keyframes|gsap|motion|animate/i.test(c),
    msg: "Entrance from scale(0)",
    fix: "Nothing real appears from nothing. Enter at scale 0.95-0.97 + opacity 0.",
  },
  {
    id: "motion/no-reduced-motion-guard", severity: "serious", confidence: "review", exts: new Set([...STYLES, ...SCRIPTY]),
    kind: "file",
    test: (c) => /@keyframes|animation\s*:|animation-name|gsap\.|<motion\.|animate\s*=\s*\{|\.animate\(/.test(c) && !/prefers-reduced-motion|useReducedMotion|reduceMotion|matchMedia\(\s*["']\(prefers/.test(c),
    re: /@keyframes|animation\s*:|gsap\.|<motion\./,
    msg: "Animations declared with no reduced-motion handling in this file",
    fix: "Honor prefers-reduced-motion (WCAG technique C39): gentler variant, movement removed.",
  },
  {
    id: "motion/long-duration", severity: "minor", confidence: "review", exts: STYLES,
    kind: "line",
    re: /(?:transition|animation)[^;{}]*?(\d+(?:\.\d+)?)(ms|s)\b/g,
    valueTest: (m) => { const v = parseFloat(m[1]) * (m[2] === "s" ? 1000 : 1); return v >= 1000; },
    excludeLine: /marquee|progress|spinner|loader|spin|pulse/i,
    msg: "Animation/transition >= 1s",
    fix: "UI ceiling ~300ms; >= 1s needs narrative justification (brand surface, MOTION dial >= 6).",
  },
  {
    id: "motion/scroll-hijack-lib", severity: "moderate", confidence: "review", exts: SCRIPTY,
    kind: "line",
    re: /from\s+["'](?:@studio-freight\/)?lenis["']|from\s+["']locomotive-scroll["']|new\s+Lenis\s*\(|new\s+LocomotiveScroll\s*\(|ScrollSmoother\.create/g,
    msg: "Scroll-smoothing/hijack library in use",
    fix: "Native scroll is the default. Justify, keep keyboard/anchors working, bypass under reduced motion.",
  },
  {
    id: "slop/purple-gradient", severity: "moderate", confidence: "review", exts: STYLES,
    kind: "line",
    re: /from-(?:purple|violet|indigo|fuchsia)-\d+[^"']*to-(?:blue|cyan|sky|pink|fuchsia)-\d+|linear-gradient\([^)]*(?:#7c3aed|#8b5cf6|#a855f7|#6366f1)[^)]*(?:#3b82f6|#06b6d4|#0ea5e9|#ec4899)/gi,
    msg: "Purple-blue gradient (the default AI palette)",
    fix: "Justified only if the brand is genuinely purple. Otherwise derive color from the direction contract.",
  },
  {
    id: "slop/emoji-icon", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,
    dedupePerLine: true,
    msg: "Emoji in markup — likely used as a UI icon",
    fix: "Use one real icon set with consistent stroke; emoji render inconsistently and carry no system.",
  },
  {
    id: "slop/unicode-pseudo-icon", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "count", threshold: 3, distinct: true,
    re: /[■□▪▫◆◇●▲▼►◄✦✧❖▣◈]/g,
    msg: "Multiple geometric glyphs used as improvised icons",
    fix: "Unicode glyphs are not an icon system. Use a real icon set or nothing.",
  },
  {
    id: "slop/eyebrow-density", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "count", threshold: 4,
    re: /class(?:Name)?\s*=\s*["'][^"']*(?:uppercase[^"']*tracking-(?:wide|widest|\[)|tracking-(?:wide|widest|\[)[^"']*uppercase)[^"']*["']/g,
    msg: "High density of uppercase tracked micro-labels (eyebrows)",
    fix: "Ration eyebrows: <= 1 per 3 sections. Delete any that fail the filler test.",
  },
  {
    id: "slop/em-dash-density", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "count", threshold: 3, re: /—/g,
    msg: "Repeated em-dashes in UI copy",
    fix: "Generated-text rhythm signal in microcopy. Prefer periods/commas in UI strings.",
  },
  {
    id: "slop/card-density", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "count", threshold: 13,
    re: /class(?:Name)?\s*=\s*["'][^"']*rounded[^"']*(?:shadow|border)[^"']*["']|class(?:Name)?\s*=\s*["'][^"']*(?:shadow)[^"']*rounded[^"']*["']/g,
    msg: "Very high density of card-like enclosures",
    fix: "Enclosure is expensive. Group with whitespace/alignment; check for cards inside cards.",
  },
  {
    id: "content/buzzword-copy", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /\b(?:seamless(?:ly)?|revolutioni[sz]e|revolutionary|next-generation|next-gen|cutting-edge|supercharge|game-chang(?:er|ing)|unleash|effortless(?:ly)?|empower(?:ing)?\s+your|unlock\s+the\s+power)\b/gi,
    msg: "Buzzword copy without evidence",
    fix: "Claims need evidence; adjectives are not evidence. Replace with a specific, true statement.",
  },
  {
    id: "content/fabricated-metrics", severity: "serious", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /\b(?:trusted|loved|used)\s+by\s+[\d,.]+[km+]*\s*\+?\s*(?:users|customers|companies|teams|developers|brands)?|\b\d{1,3}(?:,\d{3})+\+\s*(?:users|customers|companies|downloads|teams)|\b9[89](?:\.\d)?%\s*(?:uptime|satisfaction|accuracy)/gi,
    msg: "Metric claim — verify it is real",
    fix: "Never fabricate metrics. Use the real number, or a clearly labeled example, or remove.",
  },
  {
    id: "content/fake-testimonial", severity: "serious", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => /[★⭐]/.test(c) && /(testimonial|review|rating|stars)/i.test(c),
    re: /[★⭐]/,
    msg: "Star-rated testimonial content — verify it is real",
    fix: "Fabricated testimonials are a trust and legal problem. Real quotes with permission, or cut the section.",
  },
  {
    id: "content/todo-marker", severity: "serious", confidence: "certain", exts: ALL_EXTS, raw: true,
    kind: "line", dedupePerLine: true,
    // lexia-disable-next-line content/todo-marker -- the rule regex source self-matches
    re: /TODO:?\s*implement|FIXME\b|\[TODO\]|PLACEHOLDER_|\[(?:PENDING|PENDIENTE|TBD)[^\]\n]{0,40}\]/g,
    msg: "Unfinished placeholder marker",
    fix: "Ship complete implementations. Resolve or remove before delivery. Unresolved facts stay as bracketed named placeholders rendered in an alarming color - loud, never quietly plausible.",
  },
  {
    id: "content/lorem-ipsum", severity: "moderate", confidence: "certain", exts: MARKUP,
    kind: "line", re: /lorem\s+ipsum/gi,
    msg: "Lorem ipsum in UI",
    fix: "Use real content or a labeled slot ([CLIENT-PROVIDES: ...]). Design decisions made on lorem don't survive real text.",
  },
  {
    id: "system/hardcoded-hex-density", severity: "minor", confidence: "review", exts: STYLES,
    kind: "count", threshold: 9, distinct: true,
    re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g,
    msg: "Many distinct hardcoded hex colors",
    fix: "Resolve visual values to tokens; off-token values drift the system.",
  },
  {
    id: "system/h-screen-vs-dvh", severity: "minor", confidence: "certain", exts: STYLES,
    kind: "line", re: /(?<=["'\s])h-screen(?=["'\s])|100vh\b/g,
    msg: "Viewport height via h-screen/100vh",
    fix: "Prefer 100dvh/100svh (mobile browser chrome changes vh).",
  },
  {
    id: "perf/will-change-broad", severity: "minor", confidence: "review", exts: STYLES,
    kind: "line", re: /will-change\s*:\s*(?:[^;]*,\s*){2,}[^;]*;|will-change\s*:\s*all/g,
    msg: "Broad will-change declaration",
    fix: "will-change on one property, applied just before animating, removed after.",
  },
  {
    id: "content/fake-status-dot", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /class(?:Name)?\s*=\s*["'][^"']*animate-(?:ping|pulse)[^"']*rounded-full[^"']*["']|class(?:Name)?\s*=\s*["'][^"']*rounded-full[^"']*animate-(?:ping|pulse)[^"']*["']/g,
    excludeLine: /role=["']status["']|aria-busy|aria-live/,
    msg: "Pulsing dot — decorative status indicator?",
    fix: "Status indicators must report real state. Decorative liveliness is fabricated telemetry. (Skeletons with role=\"status\" are fine.)",
  },
  {
    id: "motion/press-without-transform", severity: "moderate", confidence: "certain", exts: MARKUP,
    kind: "line",
    re: /class(?:Name)?\s*=\s*["']([^"']*active:scale-[^"']*)["']/g,
    valueTest: (m) => {
      const c = m[1];
      const limited = /transition-(?:colors|opacity|shadow)\b/.test(c);
      const covers = /transition-all\b|transition-transform\b|(?:^|\s)transition(?:\s|"|$)/.test(c + " ");
      return limited && !covers;
    },
    msg: "active:scale with a transition list that excludes transform",
    fix: "The press snaps with zero easing. Add transition-transform (or use the house Button), keep press ~150ms.",
  },
  {
    id: "motion/filter-transition", severity: "moderate", confidence: "certain", exts: STYLES,
    kind: "line",
    re: /transition\s*:[^;{}]*\bfilter\b|transition-property\s*:[^;{}]*\bfilter\b/g,
    msg: "Transitioning filter (blur/etc.)",
    fix: "filter animates on the paint path: a tax on every reveal. Entrances use transform+opacity only.",
  },
  {
    id: "system/hardcoded-shadow-color", severity: "minor", confidence: "review", exts: STYLES,
    kind: "line",
    re: /box-shadow[^;{}]*(?:rgba?\(\s*0\s*,\s*0\s*,\s*0|#000\b|\bblack\b)/g,
    msg: "Shadow with hardcoded black",
    fix: "Every hardcoded rgba() shadow is a dark-mode bug. Use a themed shadow token tinted toward the canvas hue.",
  },
  {
    id: "correctness/server-local-midnight", severity: "serious", confidence: "review", exts: SCRIPTY,
    kind: "line",
    re: /\.toDateString\s*\(\s*\)|setHours\s*\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/g,
    msg: "Server-local day boundary in date logic",
    fix: "\"Today\" computed server-side drifts for users in other timezones. Route all today/streak logic through one timezone helper module.",
  },
  {
    id: "a11y/tablist-without-panels", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => /role=["']tablist["']/.test(c) && !/tabpanel/.test(c),
    re: /role=["']tablist["']/,
    msg: "role=\"tablist\" with no tabpanels in this file",
    fix: "A view/filter toggle is not tabs: use buttons with aria-pressed. Real tabs need panels + arrow-key behavior (APG).",
  },
  {
    id: "ux/native-confirm", severity: "minor", confidence: "review", exts: SCRIPTY,
    kind: "line", dedupePerLine: true,
    re: /\b(?:window\.)?confirm\s*\(/g,
    msg: "Native confirm() dialog",
    fix: "confirm() is legitimate only for unsaved-changes navigation guards. Destructive actions use in-flow two-step confirm (arm -> confirm/cancel) or type-to-confirm.",
  },
  {
    id: "system/alpha-value-missing", severity: "serious", confidence: "certain", exts: STYLES,
    kind: "line",
    re: /--[\w-]+\s*:\s*(?:oklch|lch|lab|hsl|rgb|color)\([^;]*\)\s*;/g,
    valueTest: (m) => !/<alpha-value>|\/\s*(?:var\(|<)/.test(m[0]),
    onlyIf: (c) => /@theme/.test(c) || /class(?:Name)?\s*=\s*["'][^"']*[\w\]]\/\d{1,3}(?:\s|["'])/.test(c),
    msg: "Color token declared without an alpha placeholder",
    fix: "Opacity modifiers silently emit nothing on opaque color functions. Declare the alpha slot (e.g. oklch(L C H / <alpha-value>)) before any /opacity utility exists.",
  },
  {
    id: "a11y/reveal-on-essential-content", severity: "critical", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /<(?:Reveal|MotionSection|FadeIn|ScrollReveal|AnimateIn|motion\.\w+)\b[^>]*>/g,
    dedupePerLine: true,
    onlyIf: (c) => /(privacy|terms|legal|cookie|aviso|politica|pricing|disclaimer)/i.test(c),
    msg: "Reveal wrapper in a file containing legal, price or contact content",
    fix: "Reveal wrappers start at opacity 0 and depend on JS. Legal text, prices and contact details must render unconditionally; restrict scroll motion to chrome and decorative sections.",
  },
  {
    id: "motion/lcp-behind-reveal", severity: "serious", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /<(?:Reveal|MotionSection|FadeIn|ScrollReveal|AnimateIn)\b(?![^>]*\b(?:immediate|priority)\b)[^>]*>[\s\S]{0,400}?<h1\b/g,
    msg: "The LCP element (h1/hero) sits inside a reveal wrapper",
    fix: "The largest element starts at opacity 0: visible flash plus an LCP penalty. Give the reveal primitive an immediate escape hatch and use it above the fold.",
  },
  {
    id: "motion/countup-zero-base", severity: "serious", confidence: "review", exts: SCRIPTY,
    kind: "line",
    re: /(?:useState|useRef|useMotionValue|signal)\(\s*0\s*\)/g,
    onlyIf: (c) => /count[- ]?up|CountUp|animatedNumber|AnimatedNumber|useCounter|odometer/i.test(c),
    msg: "Count-up animation resting at zero",
    fix: "It renders 0 on the server, without JS, before scroll and to screen readers. Base state is the real value; animate from zero only below the fold.",
  },
  {
    id: "layout/order-with-asymmetric-tracks", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "file",
    test: (c) => /\border-(?:first|last|none|\d+)\b/.test(c) && /grid-cols-\[[^\]]*(?:\d+(?:px|rem|%)|minmax)[^\]]*1fr[^\]]*\]|grid-cols-\[[^\]]*1fr[^\]]*(?:\d+(?:px|rem|%)|minmax)[^\]]*\]/.test(c),
    re: /grid-cols-\[[^\]]*\]/,
    msg: "order-* combined with asymmetric grid tracks",
    fix: "order moves the item, not the track width: the fixed-size element lands in the fluid track and stretches. Use symmetric tracks, or swap the track definition per breakpoint.",
  },
  {
    id: "i18n/provider-missing-locale", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "line",
    re: /<(?:NextIntlClientProvider|IntlProvider|I18nProvider|LocaleProvider)\b(?![^>]*\blocale\s*=)[^>]*>/g,
    msg: "Client i18n provider rendered without an explicit locale",
    fix: "It falls back to the default locale: server HTML is right while every client-rendered locale-dependent element is wrong. Pass locale explicitly.",
  },
  {
    id: "i18n/locale-switch-soft-nav", severity: "serious", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => /(?:Language|Locale|Lang)(?:Switch|Switcher|Picker|Toggle|Selector)/.test(c) && /(?:from\s+["']next\/link["']|<Link\b|router\.(?:push|replace))/.test(c),
    re: /(?:from\s+["']next\/link["']|<Link\b|router\.(?:push|replace))/,
    msg: "Locale switcher using client-side navigation",
    fix: "Soft navigation keeps the previous locale in cached context: the URL changes and the language does not. Use a plain anchor so the localized layout remounts.",
  },
  {
    id: "i18n/hardcoded-locale-href", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "line",
    re: /href\s*=\s*["'`]\/(?:es|ca|en|fr|de|it|pt|nl|eu|gl)\//g,
    msg: "Hardcoded locale segment in an href",
    fix: "Components that build localized URLs must read the active locale from context; hardcoded segments emit cross-locale links when the layout does not inherit the request locale.",
  },
  {
    id: "i18n/tolocalestring-no-locale", severity: "moderate", confidence: "review", exts: SCRIPTY,
    kind: "line", dedupePerLine: true,
    re: /\.toLocaleString\(\s*\)|\.toLocaleDateString\(\s*\)|new\s+Intl\.(?:NumberFormat|DateTimeFormat)\(\s*(?:\)|undefined)/g,
    msg: "Locale-aware formatting without an explicit locale",
    fix: "Thread the resolved locale into every formatter. Animated counters are the usual leak: intermediate values generated in JS render with the browser default, not the active locale. In single-locale projects, record the browser-default choice as a decision.",
  },
  {
    id: "i18n/emoji-flag", severity: "moderate", confidence: "certain", exts: ALL_EXTS,
    kind: "line", dedupePerLine: true,
    re: /[\u{1F1E6}-\u{1F1FF}]{2}/gu,
    msg: "Emoji flag as a locale indicator",
    fix: "Emoji flags do not render on all platforms, cannot be styled, and cannot express sub-national flags. Draw locale indicators as inline SVG.",
  },
  {
    id: "slop/negative-parallelism", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /\b(?:it|this|that)(?:'s|s| is) not (?:just |only |merely |simply )?[^.!?;<>{}]{2,60}[.;,]\s*(?:it|this|that)(?:'s|s| is)\b|\bnot only\b[^.?!<>{}]{2,80}\bbut also\b|\b(?:less|fewer) \w+, more \w+\b|\bstop (?:thinking|doing|building) [^.<>{}]{2,40}\.\s*start\b/gi,
    msg: "Negative parallelism in interface copy",
    fix: "The most measured AI writing tell. Delete the rejected half and state the positive claim directly. Legitimate only when correcting a specific factual, legal or numeric error.",
  },
  // ---- Tier 3: syntactic copy tells (LD-SLOP-02..23). All MARKUP-scoped: ----
  // ---- rendered copy only, never scripts. Repair is deletion (LD-SLOP-04). ----
  {
    id: "slop/reframe-setup", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /(?:\bwhile\b[^.!?<>{}]{2,60}\bmay (?:seem|look|sound)\b|\bat first glance\b|\bmost people think\b|\bconventional wisdom\b)[^<>{}]{0,160}?\b(?:but\b|actually\b|in reality\b|the truth is\b|the real \w|the hidden \w)/gi,
    msg: "Concession opener followed by a reframe pivot",
    fix: "Negative parallelism in polite disguise. State the claim directly; delete the conceded frame.",
  },
  {
    id: "slop/reframe-heading", severity: "moderate", confidence: "certain", exts: MARKUP,
    kind: "line",
    re: /<h[1-6][^>]*>\s*(?:the (?:real|hidden|actual|deeper) \w+|what (?:actually|really) \w+|beyond \w+|from \w+ to \w+|less \w+, more \w+|not an? \w+\. an? \w+)/gi,
    msg: "Reveal-shaped heading",
    fix: "Headings name their subject, not a reveal. Replace with the direct noun.",
  },
  {
    id: "content/bloated-verb", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /\b(?:serves? as|stands? as|boasts? an?\b|is designed to|aims? to|seeks? to|plays? an? (?:\w+ )?role in|helps? to)\b/gi,
    msg: "Inflated substitute for a plain verb",
    fix: "Use is, has, uses, gives, shows. 'Serves as / is designed to / plays a role in' dodge the plain claim.",
  },
  {
    id: "content/dead-metaphor", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /\b(?:the (?:backbone|engine|dna|fabric) of|a bridge between|north star|single pane of glass|think of it as\b|it'?s like a\b)/gi,
    msg: "Dead-metaphor scaffolding in copy",
    fix: "Replace with the literal mechanism. A metaphor survives only if the subject is unfamiliar, it shortens the explanation, and it reads aloud normally.",
  },
  {
    id: "content/puffery", severity: "moderate", confidence: "certain", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /\b(?:a pivotal moment|a major (?:shift|leap|milestone)|setting the stage for|(?:highlighting|underscoring) (?:its|the|their) (?:importance|significance|value)|paving the way for)\b/gi,
    msg: "Puffery or participle fake depth",
    fix: "State the fact. If the analysis matters, give it its own sentence with a specific claim.",
  },
  {
    id: "content/meta-chatter", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /\b(?:in this section,? (?:we|you)|this guide will cover|let me walk you through|let'?s dive in|great question|happy to help|i hope this helps)\b/gi,
    msg: "Assistant chatter in interface copy",
    fix: "Interface copy never narrates itself or performs helpfulness. These leak from chat transcripts into empty states and onboarding.",
  },
  {
    id: "content/engagement-bait", severity: "moderate", confidence: "certain", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /\b(?:let that sink in|read that again|this changes everything|nobody is talking about|most people don'?t realize)\b/gi,
    msg: "Engagement-bait cadence on a product surface",
    fix: "Social-feed rhetoric costs credibility exactly where it is needed. Delete.",
  },
  {
    id: "content/model-disclaimer-leak", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /\b(?:as of my last (?:update|training)|based on available information|i don'?t have real-?time access|as an ai(?: language)? model)\b/gi,
    msg: "Model disclaimer rendered as interface copy",
    fix: "If data currency matters, show a real timestamp. Never render knowledge-cutoff phrasing in a UI.",
  },
  {
    id: "content/adjective-triad", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "line",
    re: /<h[1-6][^>]*>[^<]*\b(?:fast|simple|secure|easy|powerful|modern|beautiful|smart|flexible|reliable|scalable|intuitive|seamless|effortless|elegant|clean|lightweight|robust),\s*(?:fast|simple|secure|easy|powerful|modern|beautiful|smart|flexible|reliable|scalable|intuitive|seamless|effortless|elegant|clean|lightweight|robust),?\s*(?:and|&amp;|&)\s*(?:fast|simple|secure|easy|powerful|modern|beautiful|smart|flexible|reliable|scalable|intuitive|seamless|effortless|elegant|clean|lightweight|robust)\b/gi,
    msg: "Generic adjective triad in a heading",
    fix: "'Fast, simple and secure' is a shape, not a claim. Use one claim if one matters; two or four if that is what is true.",
  },
  {
    id: "content/entity-alias", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => new Set(c.toLowerCase().match(/\bthe (?:platform|tool|solution|product|system)\b/g) || []).size >= 3,
    re: /\bthe (?:platform|tool|solution|product|system)\b/gi,
    msg: "Three or more generic self-references in one file",
    fix: "One name per entity. If the product is 'Atlas' it is 'Atlas' everywhere; renaming to avoid repetition destroys the reader's map.",
  },
  {
    id: "content/claim-repetition", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => {
      const visible = c.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
      const words = visible.toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/).filter((w) => w.length > 2);
      const seen = new Map();
      for (let i = 0; i + 3 < words.length; i++) {
        const k = words.slice(i, i + 4).join(" ");
        const n = (seen.get(k) || 0) + 1;
        if (n >= 3) return true;
        seen.set(k, n);
      }
      return false;
    },
    re: /./,
    msg: "A four-word-plus phrase repeats three or more times",
    fix: "Repetition reads as length, not emphasis. A section that only restates gets deleted, not reworded.",
  },
  {
    id: "content/stock-face-on-testimonial", severity: "serious", confidence: "certain", exts: MARKUP,
    kind: "file",
    test: (c) => /(?:pravatar\.cc|randomuser\.me|thispersondoesnotexist|uifaces\.co|generated\.photos)/i.test(c) && /(?:testimonial|review|quote|rating)/i.test(c),
    re: /(?:pravatar\.cc|randomuser\.me|thispersondoesnotexist|uifaces\.co|generated\.photos)/gi,
    msg: "Generated/stock portrait inside testimonial content",
    fix: "Never pair a quote with a synthetic face. Use initials or the aggregator's own profile image; source quotes from real reviews.",
  },
  {
    id: "content/unlabeled-simulation", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => /<(?:Mock|Fake|Simulated|Dummy)[A-Z]\w*/.test(c) && !/simulaci[oó]n|simulation|demo (?:data|mode)|example data|sample data/i.test(c),
    re: /<(?:Mock|Fake|Simulated|Dummy)[A-Z]\w*/g,
    msg: "Mocked component rendered with no visible simulation label",
    fix: "A simulated integration is never presented as live. Add a visible label: 'Simulation - real integration in production'.",
  },
  {
    id: "slop/default-section-sequence", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => {
      const l = c.toLowerCase();
      let pos = 0;
      for (const s of ["hero", "feature", "testimonial", "pricing", "faq"]) {
        const i = l.indexOf(s, pos);
        if (i === -1) return false;
        pos = i + s.length;
      }
      return true;
    },
    re: /hero/i,
    msg: "Default landing sequence: hero, features, testimonials, pricing, FAQ",
    fix: "The template order is a tell. Ask whether THIS product needs these sections, in this order, before composing them.",
  },
  {
    id: "slop/uniform-reveal", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => {
      const m = c.match(/animate-fade-?(?:in-?)?up|fade-?in-?up|data-aos=["']fade-up["']/gi) || [];
      const counts = {};
      for (const x of m) counts[x.toLowerCase()] = (counts[x.toLowerCase()] || 0) + 1;
      return Object.values(counts).some((n) => n >= 5);
    },
    re: /animate-fade-?(?:in-?)?up|fade-?in-?up|data-aos=["']fade-up["']/gi,
    msg: "The same reveal on five or more sections",
    fix: "One reveal variant everywhere means no motion decision was made. Vary by content, or remove the reveal.",
  },
  // ---- Tier 5: conversion architecture (see references/conversion/). ----
  {
    id: "conversion/vague-cta", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /<(?:a|button)\b[^>]*>\s*(?:learn more|click here|read more|find out more|submit)\s*<\/(?:a|button)>/gi,
    msg: "Vague action label",
    fix: "Labels carry the action and the value, front-loaded: 'Start the free audit' beats 'Learn more'. Vague labels fail scanners and screen-reader link lists, and hide the commitment behind a click.",
  },
  {
    id: "conversion/autocomplete-missing", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    re: /<input\b[^>]*type=["'](?:email|tel)["'][^>]*>/gi,
    valueTest: (m) => !/autocomplete\s*=/.test(m[0]),
    msg: "Identity field without an autocomplete attribute",
    fix: "Autofill works only when enabled (also WCAG 1.3.5 AA). Add autocomplete=\"email\" / \"tel\"; a form that fights the browser taxes every visitor.",
  },
  {
    id: "conversion/form-field-overload", severity: "minor", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => /<form\b/i.test(c) && (c.match(/<(?:input|select|textarea)\b(?![^>]*type=["'](?:hidden|submit|button)["'])/gi) || []).length > 10,
    re: /<form\b/i,
    msg: "Form with more than ten visible fields",
    fix: "Ask only for what the product uses today; every field names the feature that consumes it. Baymard's checkout research cut 16 fields to 8 with no information loss.",
  },
  {
    id: "system/raw-black-white", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "line", dedupePerLine: true,
    pathExclude: /(components[\/\\]ui|primitives|emails?|print)[\/\\]/i,
    re: /(?<=["'\s])(?:text|bg|border|fill|stroke|ring|divide)-(?:black|white)(?:\/\d+)?(?=["'\s])/g,
    msg: "Raw black/white outside the token system",
    fix: "text-black / bg-white carry no theme scale: the element goes invisible in one of the two themes. Use surface/ink tokens.",
  },
  {
    id: "system/container-width-drift", severity: "moderate", confidence: "review", exts: MARKUP,
    kind: "file",
    test: (c) => new Set(c.match(/max-w-(?:sm|md|lg|xl|[2-7]xl|screen-\w+|\[[^\]]+\]|prose)/g) || []).size >= 3,
    re: /max-w-(?:sm|md|lg|xl|[2-7]xl|screen-\w+|\[[^\]]+\]|prose)/,
    msg: "Three or more distinct content widths in one file",
    fix: "One canonical content-width token, consumed by header, footer and every section. Mixed widths read as misalignment at section boundaries.",
  },
];

/* -------------------------------- helpers --------------------------------- */

function parseDisables(raw) {
  // Inline waivers (learning: waivers must be durable and live next to code):
  //   lexia-disable-file rule-id[, rule-id]       waive for the whole file
  //   lexia-disable-next-line rule-id[, rule-id]  waive for the following line
  // Pair every directive with a reason in prose and a decisions.jsonl entry.
  const file = new Set();
  const lines = new Map(); // lineNumber -> Set(ruleIds)
  // Rule ids are the slash-shaped tokens after the directive; anything after
  // `--` (or any non-id token) is the human reason and is ignored here.
  const idsFrom = (s) => (s.split("--")[0].match(/[a-z0-9-]+\/[a-z0-9-]+/g) || []);
  const src = raw.split("\n");
  for (let i = 0; i < src.length; i++) {
    let m = src[i].match(/lexia-disable-file\s+(.+)$/);
    if (m) for (const id of idsFrom(m[1])) file.add(id);
    m = src[i].match(/lexia-disable-next-line\s+(.+)$/);
    if (m) {
      const set = lines.get(i + 2) || new Set();
      for (const id of idsFrom(m[1])) set.add(id);
      lines.set(i + 2, set);
    }
  }
  return { file, lines };
}

function blankComments(src) {
  // Replace block/html comment CONTENT with spaces, preserving newlines and length.
  return src.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
}

function lineOf(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) if (content[i] === "\n") line++;
  return line;
}

function snippet(content, index, len = 80) {
  const start = content.lastIndexOf("\n", index) + 1;
  let end = content.indexOf("\n", index);
  if (end === -1) end = content.length;
  return content.slice(start, end).trim().slice(0, len);
}

function auditFile(filePath) {
  const findings = [];
  const ext = extname(filePath).toLowerCase();
  if (!ALL_EXTS.has(ext)) return findings;
  let raw;
  try {
    const st = statSync(filePath);
    if (st.size > MAX_FILE_BYTES) return findings;
    raw = readFileSync(filePath, "utf8");
  } catch {
    return findings;
  }
  if (raw.includes("\u0000")) return findings; // binary
  const blanked = blankComments(raw);
  const disables = parseDisables(raw);

  for (const rule of RULES) {
    if (!rule.exts.has(ext)) continue;
    if (rule.pathExclude && rule.pathExclude.test(filePath)) continue;
    const content = rule.raw ? raw : blanked;
    if (rule.onlyIf && !rule.onlyIf(content)) continue;

    if (rule.kind === "file") {
      if (rule.test(content)) {
        const m = rule.re.exec(content) || { index: 0 };
        findings.push(mk(rule, filePath, lineOf(content, m.index), snippet(content, m.index)));
      }
      continue;
    }

    const re = new RegExp(rule.re.source, rule.re.flags);
    if (rule.kind === "count") {
      const seen = new Set();
      let count = 0, first = null, m;
      while ((m = re.exec(content))) {
        if (rule.distinct) {
          if (seen.has(m[0].toLowerCase())) continue;
          seen.add(m[0].toLowerCase());
        }
        count++;
        if (!first) first = m.index;
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      const effective = rule.distinct ? seen.size : count;
      if (effective >= rule.threshold) {
        findings.push(mk(rule, filePath, lineOf(content, first ?? 0), `${effective} occurrences (threshold ${rule.threshold})`));
      }
      continue;
    }

    // kind === "line"
    const linesSeen = new Set();
    let m;
    while ((m = re.exec(content))) {
      if (rule.valueTest && !rule.valueTest(m)) { if (m.index === re.lastIndex) re.lastIndex++; continue; }
      const ln = lineOf(content, m.index);
      const lineText = snippet(content, m.index, 120);
      if (rule.excludeLine && rule.excludeLine.test(lineText)) { if (m.index === re.lastIndex) re.lastIndex++; continue; }
      if (rule.dedupePerLine && linesSeen.has(ln)) { if (m.index === re.lastIndex) re.lastIndex++; continue; }
      linesSeen.add(ln);
      findings.push(mk(rule, filePath, ln, lineText.slice(0, 80)));
      if (m.index === re.lastIndex) re.lastIndex++;
      if (linesSeen.size > 25) break; // cap noise per rule per file
    }
  }
  return findings.filter(
    (f) => !disables.file.has(f.id) && !(disables.lines.get(f.line)?.has(f.id))
  );
}

function mk(rule, file, line, evidence) {
  return { id: rule.id, severity: rule.severity, confidence: rule.confidence, file, line, evidence, msg: rule.msg, fix: rule.fix };
}

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".") { if (e.isDirectory()) continue; }
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(join(dir, e.name), acc);
    } else if (ALL_EXTS.has(extname(e.name).toLowerCase())) {
      acc.push(join(dir, e.name));
    }
  }
  return acc;
}

/* ------------------------- color math (WCAG) ------------------------- */

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(hexA, hexB) {
  const la = relLuminance(hexToRgb(hexA));
  const lb = relLuminance(hexToRgb(hexB));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function rgbDistance(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function readDesignSystem(root) {
  for (const rel of [".lexia-design/DESIGN-SYSTEM.md", "DESIGN-SYSTEM.md"]) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    try { return { path: p, text: readFileSync(p, "utf8") }; } catch { return null; }
  }
  return null;
}

function projectRules(files, contentsById, root) {
  const findings = [];
  const anims = files.filter((f) => /(@keyframes|animation\s*:|gsap\.|<motion\.)/.test(contentsById.get(f) || ""));
  if (anims.length) {
    const guarded = files.some((f) => /prefers-reduced-motion|useReducedMotion|reduceMotion/.test(contentsById.get(f) || ""));
    if (!guarded) {
      findings.push({
        id: "project/no-reduced-motion-anywhere", severity: "serious", confidence: "certain",
        file: anims[0], line: 1, evidence: `${anims.length} file(s) animate; no prefers-reduced-motion anywhere`,
        msg: "Project animates without any reduced-motion handling",
        fix: "Add a global reduced-motion strategy (CSS media query and/or matchMedia gate).",
      });
    }
  }
  // Theme toggle vs dark: variant desync (field learning: custom [data-theme]
  // toggles silently break every dark: utility when app theme != OS theme).
  const usesDarkVariant = files.some((f) => /(?:^|["'`\s:({])dark:/.test(contentsById.get(f) || ""));
  const writesDataTheme = files.some((f) => /setAttribute\(\s*["']data-theme["']|dataset\.theme\s*=/.test(contentsById.get(f) || ""));
  const hasCustomVariant = files.some((f) => /@custom-variant\s+dark/.test(contentsById.get(f) || ""));
  const hasDarkModeConfig = files.some((f) => /darkMode\s*:/.test(contentsById.get(f) || ""));
  if (usesDarkVariant && writesDataTheme && !hasCustomVariant && !hasDarkModeConfig) {
    findings.push({
      id: "system/dark-variant-desync", severity: "serious", confidence: "review",
      file: files.find((f) => /setAttribute\(\s*["']data-theme["']|dataset\.theme\s*=/.test(contentsById.get(f) || "")) || files[0],
      line: 1,
      evidence: "dark: utilities + a [data-theme] writer, with no @custom-variant dark and no darkMode config",
      msg: "Custom theme toggle desynced from dark: variants",
      fix: "Tailwind 4: @custom-variant dark (&:where([data-theme=\"dark\"], [data-theme=\"dark\"] *)); or key dark: off your real toggle mechanism.",
    });
  }

  // Token coherence + token-quality checks against DESIGN-SYSTEM.md if present
  const ds = readDesignSystem(root);
  if (ds) {
    const tokens = new Set((ds.text.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toLowerCase()));
    if (tokens.size >= 3) {
      for (const f of files) {
        if (!STYLES.has(extname(f).toLowerCase())) continue;
        const hexes = (contentsById.get(f) || "").match(/#[0-9a-fA-F]{6}\b/g) || [];
        const off = [...new Set(hexes.map((h) => h.toLowerCase()))].filter((h) => !tokens.has(h));
        if (off.length >= 3) {
          findings.push({
            id: "system/off-token-colors", severity: "moderate", confidence: "review",
            file: f, line: 1, evidence: `${off.length} hex values not in DESIGN-SYSTEM.md tokens (e.g. ${off.slice(0, 3).join(", ")})`,
            msg: "Colors outside the declared token set",
            fix: "Map to existing tokens or extend the system deliberately (log the decision).",
          });
        }
      }

      // Near-duplicate tokens collapse ramps (deltas measured, not eyeballed).
      const toks = [...tokens];
      const dupes = [];
      for (let i = 0; i < toks.length; i++) {
        for (let j = i + 1; j < toks.length; j++) {
          if (rgbDistance(toks[i], toks[j]) < 16 && toks[i] !== toks[j]) dupes.push(`${toks[i]}~${toks[j]}`);
        }
      }
      if (dupes.length) {
        findings.push({
          id: "system/near-duplicate-tokens", severity: "minor", confidence: "review",
          file: ds.path, line: 1,
          evidence: `${dupes.length} near-identical pair(s): ${dupes.slice(0, 3).join(", ")}`,
          msg: "Near-duplicate color tokens render as one level",
          fix: "Two grays a few RGB points apart make the ramp fiction. Delete one or separate them genuinely.",
        });
      }

      // Accent that is functionally ink deletes every accent moment.
      const named = {};
      const tokenLine = /--?([\w-]+)\s*[:=]\s*(#[0-9a-fA-F]{6})\b/g;
      let tm;
      while ((tm = tokenLine.exec(ds.text))) named[tm[1].toLowerCase()] = tm[2].toLowerCase();
      const accentKey = Object.keys(named).find((k) => /(^|-)(primary|accent)($|-)/.test(k) && !/foreground|content|on-/.test(k));
      const inkKey = Object.keys(named).find((k) => /(^|-)(ink|foreground|text)($|-)?/.test(k) && !/subtle|muted|tertiary|inverse/.test(k));
      if (accentKey && inkKey && named[accentKey] !== named[inkKey]) {
        const ratio = contrastRatio(named[accentKey], named[inkKey]);
        if (ratio < 2) {
          findings.push({
            id: "system/accent-ink-indistinct", severity: "moderate", confidence: "review",
            file: ds.path, line: 1,
            evidence: `contrast(${accentKey} ${named[accentKey]}, ${inkKey} ${named[inkKey]}) = ${ratio.toFixed(2)}:1`,
            msg: "Accent is functionally ink (measured, not eyeballed)",
            fix: "hover:text-primary, highlights and selected states are invisible. Give the accent real chroma or stop using it as a text accent.",
          });
        }
      }
    }
  }

  // ---- Tier 2: primitive discipline and build-gate wiring (field learnings) ----
  const norm = (f) => f.replace(/\\/g, "/");
  // Test/fixture trees do not define the project's primitive discipline:
  // a components/ui inside fixtures must not put the real app under the
  // primitives contract (found via this repo's own self-audit).
  const relPath = (f) => norm(relative(root, f));
  const isTestTree = (f) => /(^|\/)(__tests__|tests?|fixtures|__fixtures__|__mocks__|e2e|evals)\//.test(relPath(f));
  const primDirRe = /(components\/ui|components\/primitives|ui\/primitives)\//;
  const primFiles = files.filter((f) => primDirRe.test(norm(f)) && !isTestTree(f));
  if (primFiles.length) {
    const primNames = primFiles.map((f) => (norm(f).split("/").pop() || "").replace(/\.\w+$/, "").toLowerCase());
    const hasFormPrim = primNames.some((n) => /(input|field|select|textarea|form|control)/.test(n));
    const hasTablePrim = primNames.some((n) => /table/.test(n));
    for (const f of files) {
      if (primDirRe.test(norm(f)) || isTestTree(f)) continue;
      if (!MARKUP.has(extname(f).toLowerCase())) continue; // app-layer means rendered markup, not scripts
      const c = contentsById.get(f) || "";
      if (hasFormPrim && /<(select|textarea)\b|<input\b(?![^>]*type="hidden")/.test(c)) {
        findings.push({
          id: "system/native-control-in-app-layer", severity: "moderate", confidence: "review",
          file: f, line: 1, evidence: "native form control while a form primitive exists in the primitives directory",
          msg: "Native control bypasses the form primitive",
          fix: "App screens consume the primitive: tokens, focus ring, density and states come with it. Native controls inherit none of them.",
        });
      }
      if (hasTablePrim && /<table\b/.test(c)) {
        findings.push({
          id: "system/hand-rolled-table", severity: "moderate", confidence: "review",
          file: f, line: 1, evidence: "inline <table> while a table primitive exists",
          msg: "Hand-rolled table bypasses the data-table primitive",
          fix: "Inline tables drift: no zebra, different paddings, no empty/loading states. Route tabular data through the primitive.",
        });
      }
    }
    for (const pf of primFiles) {
      const base = (norm(pf).split("/").pop() || "").replace(/\.\w+$/, "");
      if (/^index$/i.test(base)) continue;
      const needle = base.toLowerCase();
      const used = files.some((f) => f !== pf && (contentsById.get(f) || "").toLowerCase().includes(needle));
      if (!used) {
        findings.push({
          id: "system/orphan-primitive", severity: "moderate", confidence: "certain",
          file: pf, line: 1, evidence: "no other scanned file references it",
          msg: "Primitive with zero consumers",
          fix: "Work invested here reaches nobody while screens hand-roll their own version. Adopt it everywhere or delete it; grep consumers before investing.",
        });
      }
    }
  }

  // Duplicated glyphs pasted across components (one primitive per concept)
  const dMap = new Map();
  for (const f of files) {
    const c = contentsById.get(f) || "";
    const re = /<path[^>]*\sd="([^"]{40,})"/g;
    const seenHere = new Set();
    let m;
    while ((m = re.exec(c))) {
      if (seenHere.has(m[1])) continue;
      seenHere.add(m[1]);
      const arr = dMap.get(m[1]) || [];
      arr.push(f);
      dMap.set(m[1], arr);
    }
  }
  for (const [, fl] of dMap) {
    if (fl.length >= 3) {
      findings.push({
        id: "system/duplicate-primitive", severity: "moderate", confidence: "review",
        file: fl[0], line: 1, evidence: `the same svg path is pasted in ${fl.length} files`,
        msg: "Duplicated glyph across components",
        fix: "One icon module per glyph. Copy-pasted paths drift in stroke, size and meaning; extract the primitive.",
      });
      break;
    }
  }

  // Design gate exists but the build never runs it
  try {
    const pkgPath = join(root, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const scripts = pkg.scripts || {};
      const gateKey = Object.keys(scripts).find((k) => /design|lexia/i.test(k + " " + scripts[k]) && /audit|lint/i.test(k + " " + scripts[k]));
      const build = String(scripts.build || "");
      if (gateKey && build && !build.includes(gateKey) && !/lexia/i.test(build)) {
        findings.push({
          id: "system/design-gate-not-wired", severity: "moderate", confidence: "certain",
          file: pkgPath, line: 1, evidence: `script "${gateKey}" exists; build runs "${build}"`,
          msg: "Design lint exists but the build does not run it",
          fix: "Wire the gate into the build command. A lint outside the build catches drift only when someone remembers to run it.",
        });
      }
    }
  } catch { /* unparseable package.json — skip */ }

  // i18n message catalogs: leaf/parent key collisions and coverage gaps.
  // Flat dotted-key catalogs: a key that is both a string and a prefix of
  // deeper keys throws at render (field learning). Coverage: a secondary
  // locale far below the default reads as broken, not multilingual.
  try {
    const catalogDirs = [];
    const scanForCatalogs = (dir, depth) => {
      if (depth > 3) return;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        if (/^(node_modules|\.git|dist|build|out|coverage)$/.test(e.name)) continue;
        const p = join(dir, e.name);
        if (/^(messages|locales|i18n|lang)$/i.test(e.name)) catalogDirs.push(p);
        else scanForCatalogs(p, depth + 1);
      }
    };
    scanForCatalogs(root, 0);
    for (const dir of catalogDirs) {
      const jsons = readdirSync(dir).filter((f) => f.endsWith(".json"));
      const keyCounts = new Map();
      for (const jf of jsons) {
        const fp = join(dir, jf);
        let data;
        try { data = JSON.parse(readFileSync(fp, "utf8")); } catch { continue; }
        const leaves = [];
        const walkKeys = (obj, prefix) => {
          for (const [k, v] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === "object") walkKeys(v, path);
            else leaves.push(path);
          }
        };
        walkKeys(data, "");
        keyCounts.set(fp, leaves.length);
        const leafSet = new Set(leaves);
        const collision = leaves.find((l) => [...leafSet].some((o) => o !== l && o.startsWith(l + ".")));
        if (collision) {
          findings.push({
            id: "i18n/key-leaf-object-collision", severity: "serious", confidence: "certain",
            file: fp, line: 1, evidence: `"${collision}" is both a string and a namespace prefix`,
            msg: "Translation key is both leaf and parent",
            fix: "A key used as a string cannot also become an object namespace: the collision throws at render. Namespace by domain instead of nesting under an existing leaf.",
          });
        }
      }
      if (keyCounts.size >= 2) {
        const max = Math.max(...keyCounts.values());
        for (const [fp, n] of keyCounts) {
          if (max >= 10 && n < max * 0.9) {
            findings.push({
              id: "i18n/locale-coverage-gap", severity: "moderate", confidence: "review",
              file: fp, line: 1, evidence: `${n} keys vs ${max} in the fullest catalog (${Math.round((n / max) * 100)}%)`,
              msg: "Secondary locale far behind the default",
              fix: "Ship one complete locale plus deliberately labeled stubs. Partial locales produce mixed-language screens that read as broken rather than multilingual.",
            });
          }
        }
      }
    }
  } catch { /* unreadable catalog dirs — skip */ }

  return findings;
}

/* -------------------------------- output ---------------------------------- */

const SEV_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function summarize(findings) {
  const s = { critical: 0, serious: 0, moderate: 0, minor: 0, review: 0 };
  for (const f of findings) {
    s[f.severity]++;
    if (f.confidence === "review") s.review++;
  }
  return s;
}

function printText(findings, scanned) {
  const sum = summarize(findings);
  if (!findings.length) {
    console.log(`lexia-design-audit: ${scanned} file(s) scanned, no findings.`);
    return;
  }
  const sorted = [...findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.file.localeCompare(b.file));
  let current = "";
  for (const f of sorted) {
    if (f.severity !== current) {
      current = f.severity;
      console.log(`\n[${current.toUpperCase()}]`);
    }
    const conf = f.confidence === "review" ? " (review)" : "";
    console.log(`  ${f.file}:${f.line}  ${f.id}${conf}`);
    console.log(`    ${f.msg}. ${f.fix}`);
    if (f.evidence) console.log(`    evidence: ${f.evidence}`);
  }
  console.log(`\n${scanned} file(s) scanned — critical ${sum.critical}, serious ${sum.serious}, moderate ${sum.moderate}, minor ${sum.minor} (${sum.review} need human review)`);
}

function persistForHooks(findings) {
  try {
    if (!existsSync(".lexia-design")) return; // only persist inside lexia projects
    const p = ".lexia-design/last-audit.json";
    let data = { updated: new Date().toISOString(), findings: [] };
    if (existsSync(p)) {
      try { data = JSON.parse(readFileSync(p, "utf8")); } catch { /* reset corrupt file */ }
    }
    const touched = new Set(findings.map((f) => f.file));
    data.findings = (data.findings || []).filter((f) => !touched.has(f.file)).concat(findings);
    data.updated = new Date().toISOString();
    writeFileSync(p, JSON.stringify(data, null, 2));
  } catch { /* never fail the hook over persistence */ }
}

/* --------------------------------- modes ---------------------------------- */

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

async function hookMode() {
  try {
    if (process.env.LEXIA_DESIGN_HOOKS === "0") return process.exit(0);
    const payload = JSON.parse((await readStdin()) || "{}");
    const filePath = payload?.tool_input?.file_path;
    if (!filePath || !ALL_EXTS.has(extname(filePath).toLowerCase()) || !existsSync(filePath)) return process.exit(0);
    const findings = auditFile(filePath);
    if (!findings.length) return process.exit(0);
    persistForHooks(findings);
    const top = findings
      .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
      .slice(0, 10)
      .map((f) => `- [${f.severity}${f.confidence === "review" ? "/review" : ""}] ${f.id} ${relative(process.cwd(), f.file)}:${f.line} — ${f.msg}. ${f.fix}`)
      .join("\n");
    const extra = findings.length > 10 ? `\n(+${findings.length - 10} more — run the full audit)` : "";
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `lexia-design detector found ${findings.length} issue(s) in the file just written:\n${top}${extra}\nVerify each finding against its context before acting (it may already be mitigated: sr-only labels, role="status" skeletons). Report verdicts, not raw flags: TRUE_POSITIVE / MITIGATED / FALSE_POSITIVE. Waive deliberate choices inline with lexia-disable-next-line <rule-id> plus a decisions.jsonl entry.`,
      },
    }));
    process.exit(0);
  } catch {
    process.exit(0); // hooks never break the flow
  }
}

async function stopCheckMode() {
  try {
    if (process.env.LEXIA_DESIGN_HOOKS === "0") return process.exit(0);
    await readStdin(); // drain
    const p = ".lexia-design/last-audit.json";
    if (!existsSync(p)) return process.exit(0);
    const data = JSON.parse(readFileSync(p, "utf8"));
    const hot = (data.findings || []).filter((f) => (f.severity === "critical" || f.severity === "serious") && f.confidence === "certain");
    if (!hot.length) return process.exit(0);
    console.log(JSON.stringify({
      systemMessage: `lexia-design: ${hot.length} unresolved critical/serious detector finding(s) in .lexia-design/last-audit.json. Fix them or waive with a reason in decisions.jsonl.`,
    }));
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

function listWaivers(rest) {
  const root = resolve(rest[0] || ".");
  const files = statSync(root).isDirectory() ? walk(root) : [root];
  let count = 0;
  for (const f of files) {
    let raw;
    try { raw = readFileSync(f, "utf8"); } catch { continue; }
    const lines = raw.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/lexia-disable-(file|next-line)\s+(.*)/);
      if (!m) continue;
      if (/<rule-id>|rule-id\[,|\.\.\.|\(\.\*\)/.test(m[2])) continue; // syntax docs and code, not waivers
      count++;
      const body = m[2];
      const reason = body.includes("--") ? body.split("--").slice(1).join("--").trim() : "(no reason recorded)";
      const ids = (body.split("--")[0].match(/[a-z0-9-]+\/[a-z0-9-]+/g) || []).join(", ");
      console.log(`${relative(root, f) || f}:${i + 1}  [${m[1]}]  ${ids || "(no rule id)"}  — ${reason}`);
    }
  }
  console.log(`\n${count} inline waiver(s). Each must have a decisions.jsonl entry; waivers without a reason fail review.`);
}

function listRules() {
  console.log("id | severity | confidence | applies to");
  for (const r of RULES) {
    console.log(`${r.id} | ${r.severity} | ${r.confidence} | ${[...r.exts].join(",")}`);
  }
  console.log(`\n${RULES.length} file-level rules + 12 project-level rules (project/no-reduced-motion-anywhere, system/off-token-colors, system/dark-variant-desync, system/near-duplicate-tokens, system/accent-ink-indistinct, system/native-control-in-app-layer, system/hand-rolled-table, system/orphan-primitive, system/duplicate-primitive, system/design-gate-not-wired, i18n/key-leaf-object-collision, i18n/locale-coverage-gap)`);
  console.log(`Inline waivers: lexia-disable-file <rule-id> | lexia-disable-next-line <rule-id> (comment; pair with a decisions.jsonl entry)`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--hook")) return hookMode();
  if (args.includes("--stop-check")) return stopCheckMode();
  if (args.includes("--list-rules")) return listRules();
  if (args.includes("--waivers")) return listWaivers(args.filter((a) => a !== "--waivers" && !a.startsWith("--")));

  const format = args.includes("--format") ? args[args.indexOf("--format") + 1] : "text";
  const deep = args.includes("--deep");
  const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--format");

  try {
    let files = [];
    const rootDir = resolve(positional[0] || ".");
    if (deep) {
      files = walk(rootDir);
    } else {
      files = positional.map((p) => resolve(p)).filter((p) => existsSync(p));
      if (!files.length) {
        console.error("Usage: lexia-design-audit.mjs <files...> | --deep [dir] [--format text|json] | --hook | --stop-check | --list-rules");
        process.exit(2);
      }
    }

    let findings = [];
    const contents = new Map();
    for (const f of files) {
      findings.push(...auditFile(f));
      if (deep) {
        try { const st = statSync(f); if (st.size <= MAX_FILE_BYTES) contents.set(f, blankComments(readFileSync(f, "utf8"))); } catch { /* skip */ }
      }
    }
    if (deep) findings.push(...projectRules(files, contents, rootDir));

    findings = findings.map((f) => ({ ...f, file: relative(process.cwd(), f.file) || f.file }));

    if (format === "json") {
      console.log(JSON.stringify({ tool: "lexia-design-audit", version: "0.2.0", scanned: files.length, summary: summarize(findings), findings }, null, 2));
    } else {
      printText(findings, files.length);
    }
    const sum = summarize(findings);
    process.exit(sum.critical + sum.serious > 0 ? 1 : 0);
  } catch (err) {
    console.error(`lexia-design-audit internal error: ${err?.message || err}`);
    process.exit(2);
  }
}

main();
