# Conversion Architecture

The layer visual quality does not cover: whether a brand surface is
ORDERED to move its specific visitor toward its one action. A page can
score high on every visual dimension and still convert nobody, because
conversion is an information-ordering problem, not a styling problem.
Scope: brand surfaces and the conversion zones inside hybrids (pricing,
signup, checkout, contact). Product surfaces follow task-flow rules
instead.

Sources: awareness staging derives from Eugene Schwartz's five stages
(Breakthrough Advertising, 1966), used here as a concept with attribution;
form-friction findings from Baymard Institute's published research;
link-label findings from Nielsen Norman Group. See SOURCES.md section 12.
Nothing is copied; principles are synthesized and falsifiable.

## Audience awareness sets the section order

Classify the primary visitor BEFORE composing sections. Five stages,
from coldest to hottest: unaware, problem-aware, solution-aware,
product-aware, most-aware.

- Cold traffic (unaware, problem-aware): the page earns attention by
  naming the problem in the visitor's words before naming the product.
  Problem framing and consequence go above capability lists; the CTA
  asks for a small commitment (see the ladder below).
- Solution-aware: the page differentiates. Why this mechanism, versus
  the alternatives the visitor already knows. Comparison and proof
  carry more weight than problem narration, which now reads as padding.
- Product-aware and most-aware: the page removes friction. Offer,
  price, guarantee, and the direct CTA move UP; long persuasion in
  front of a ready buyer costs conversions instead of earning them.

The template order (hero, features, testimonials, pricing, FAQ) is what
`slop/default-section-sequence` flags: it assumes one awareness stage
for every product. State the assumed stage in DESIGN-BRIEF.md so the
ordering is auditable against it.

## One idea per viewport

Each scroll-stop advances exactly one claim, and the sections form an
argument, not an inventory: every section answers the objection or
question the previous one raises. The test at audit time: name each
viewport's single idea in one sentence. Two ideas competing in one
viewport, or a section whose idea no adjacent section sets up or
resolves, is an ordering defect, not a spacing defect.

## CTA hierarchy

- One primary action per page, visually singular. Every additional
  same-weight CTA divides attention and the measured path. Secondary
  actions exist but look secondary.
- The commitment ladder matches awareness: a cold visitor gets a
  low-commitment step (see how it works, read the guide); a hot visitor
  gets the direct step (start, buy, book). A "Buy now" in front of cold
  traffic and a "Learn more" in front of hot traffic are the same
  mistake in opposite directions.
- Labels carry the action and the value, front-loaded, specific
  [conversion/vague-cta]: "Start the free audit" beats "Learn more" and
  "Submit". Vague labels fail sighted scanners and screen-reader users
  listing links out of context (NN/g), and they hide the commitment
  behind a click.
- Repeat the primary CTA at natural decision points (after proof, after
  pricing, at the end); repetition of the SAME action is navigation,
  not noise. Adding DIFFERENT actions is noise.

## Objection placement

Objections are answered where they occur, not banished to a FAQ.
Inventory the real objections (price, effort, risk, trust, "will it
work for me"), then place each answer adjacent to the element that
raises it: cost objections at the pricing table, risk reversal
(guarantee, cancel-anytime, data-export) beside the commitment CTA,
credibility proof beside the claim it supports. A FAQ at the bottom
catches the residue; it is not the strategy. Proof adjacency is the
audit test: for every strong claim, real evidence within one viewport
[content rules still apply: no fabricated proof, ever].

## Form friction

Forms are where intent goes to die, and the defects are mechanical:

- Ask only for what the product uses today. Every field must name the
  feature that consumes it; "we might need it later" fails the test.
  Baymard's checkout research cut a typical 16-field checkout to 8 with
  no information loss [conversion/form-field-overload].
- Single column. Extensive multi-column forms cause skipped fields and
  misread relationships (Baymard, 2023). Exception: short logically
  paired fields (first/last name, expiry/CVC) on one line, inside an
  otherwise single-column flow.
- Autofill works only when enabled: identity fields carry `autocomplete`
  attributes (also WCAG 1.3.5, AA) and numeric fields the right
  `inputmode` [conversion/autocomplete-missing]. A form that fights the
  browser's autofill taxes every visitor to save the builder one line.
- Validate inline on blur, never only on submit; error messages state
  what happened and how to fix it (forms-and-states.md owns the states).
- Label the commitment: if a trial needs a card, say so at the field,
  not after submit. Surprise cost is the abandonment event.

## What this layer does NOT claim

No conversion-rate numbers are promised or invented; uplift claims
require the project's own measurement. The detector rules here are
tripwires on mechanical defects; section ordering and objection
placement are reviewer judgments recorded in the audit with the
awareness assumption they depend on.
