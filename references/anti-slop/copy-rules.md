# Content Integrity and Copy Rules

Provenance: entries below carry the date they entered the registry
(2026-07 base, 2026-08 syntactic tells) and are re-confirmed or deleted on
every `/lexia-design:update` cycle. Tells drift with model generations; a
ban list that only grows becomes wrong. And the standing guardrail:
avoiding a tell must not create a new tell. These rules describe taste,
not a checklist to satisfy - write normally, then remove what sounds
machine-made.

Truth binds claims, not demonstrations. Author demonstration content at full
fidelity and label it synthetic; never invent anything a reader could take
as a real-world claim.

## Never fabricate (hard rule)

Users, metrics, customers, testimonials, prices, financial data, activity
feeds, telemetry, certifications, partner/press logos, results, ratings,
download counts, team members, addresses, legal text, company
identifiers. Provisional legal text is the one sanctioned exception:
acceptable pre-launch when labeled (version + date + "fiscal
identification pending"), flagged for lawyer review, and never inventing
identifiers. Do not block the build on it.

If a real value is unknown:
- Keep the slot with an explicit marker: `[CLIENT-PROVIDES: metric]` or a
  visible "Example data" label in demo contexts.
- Ask for the source only when the slot blocks the primary message;
  otherwise continue with the assumption visible.
- Empty and honest beats full and fake. A testimonial section with no real
  testimonials is cut, not populated.

Demo/synthetic data rules: realistic in shape, labeled in context (seed
names like "Example Corp", dataset comments, a demo banner in mock apps),
never plausible-specific about the actual company ("4.9/5 from 2,300
reviews" is a lie unless it is true).

## Standard labels for standard actions

Sign in. Sign out. Save. Cancel. Delete. Next. Back. Search. Themed
replacements ("Initiate session", "Begin your journey") tax every user on
every use; they must repay that tax with real utility, which they almost
never do. Menu items that open a follow-up end with a real ellipsis
character. In-progress labels tell the truth ("Saving...").

## Register

Match the surface: operative and financial surfaces get neutral, precise,
calm language; brand surfaces may take more voice, but voice is specificity
and rhythm, not exclamation marks. Error messages: what happened, why, next
action, no blame, no jokes in high-stakes contexts.

## Syntactic tells (the shape, not the words)

Vocabulary bans miss copy that contains no banned words but takes a generated
shape. The strongest of these, and the only entry in this whole registry with
an external measurement behind it, is negative parallelism
[slop/negative-parallelism]: rejecting one frame to install another. "It's not
X, it's Y", "Not X. Y.", "Less X, more Y", "Not only X but also Y", "The
question isn't X, it's Y". Counts of the construction in large-cap filings rose
from roughly 50 (2023) to over 200 (2025). The ban holds across sentence
boundaries and applies with the word "not" absent ("The dashboard looks like a
reporting tool. It is really a decision filter.").

Its polite disguises fail too: a concession opener ("While X may seem", "At
first glance", "Most people think") followed within two sentences by a pivot
("but", "actually", "in reality", "the truth is", "the real", "the hidden").
Section headings take the same shape and are the most visible case: "The real
problem", "What actually matters", "Beyond X", "From chaos to clarity".
Headings name their subject.

Exception, and it is the only one: the construction survives when it corrects a
specific factual, legal or numeric error ("The file is 12 MB, not 12 GB").
Everywhere else the repair is mechanical: delete the rejected half, keep the
positive claim, rewrite as a direct sentence.

Guardrail: avoiding a tell must not create a new one. Do not swing into
all-staccato sentences, one-line paragraphs everywhere, or copy that reads as a
list of avoided mistakes, and do not refuse the exact right word because it
appears on a list. Write normally, then remove what sounds machine-made. These
entries also expire: tells drift with model generations, so each carries the
date it was added and gets re-confirmed or deleted on the update cadence.


## Phrase families that read as machine-made (added 2026-08)

Each family maps to a detector rule; repair is deletion or the plain
sentence, never a synonym swap.

- Bloated verbs [content/bloated-verb]: serves as, stands as, boasts a,
  is designed to, aims to, seeks to, plays a role in, helps to. Use is,
  has, uses, gives, shows, causes, changes, removes.
- Dead metaphors [content/dead-metaphor]: the backbone/engine/DNA/fabric
  of, a bridge between, north star, single pane of glass, "think of it
  as". Permission test: the subject is genuinely unfamiliar, the analogy
  shortens the explanation, it does not mislead, and it reads aloud
  normally. Otherwise state the literal mechanism.
- Puffery and participle fake depth [content/puffery]: a pivotal moment,
  a major shift, setting the stage for, highlighting its importance,
  underscoring its significance, paving the way for. State the fact; if
  the analysis matters it gets its own sentence with a specific claim.
- Assistant chatter [content/meta-chatter]: "In this section", "This
  guide will cover", "Let me walk you through", "Let's dive in", "Great
  question", "Happy to help". Leaks from chat transcripts into empty
  states, onboarding and AI product surfaces. Interface copy never
  narrates itself or performs helpfulness.
- Engagement bait [content/engagement-bait]: "Let that sink in", "Read
  that again", "This changes everything", "Nobody is talking about".
  Social-feed cadence pasted onto a product surface costs credibility
  exactly where it is needed.
- Model-disclaimer leakage [content/model-disclaimer-leak]: "As of my
  last update", "Based on available information", "I don't have
  real-time access", "As an AI language model". If data currency
  matters, show a real timestamp.

## Shape habits (added 2026-08)

- The triad habit [content/adjective-triad]: do not default every claim
  to three items; "fast, simple and secure" is a shape, not a claim. Use
  one if one matters, two or four if that is what is true. Scope: headings
  and prose. Three-tier pricing, three-step wizards and three-column
  comparisons are structurally motivated and exempt.
- False ranges: delete "from X to Y" sweeps whose middle cannot be named
  ("from startups to enterprises"). Name the middle or delete the range.
  Reviewer judgment, no detector - the idiomatic uses are too dense.
- Metronome rhythm [related: slop/card-density]: sibling card or feature
  descriptions all the same length are generated filler. Vary length
  deliberately; if every sibling genuinely needs identical length, the
  content is interchangeable and the section should be restructured.
- Claim repetition [content/claim-repetition]: the same claim in the
  hero, again in features, again above the CTA is padding. Every section
  adds information; a section that only restates gets deleted, not
  reworded.
- Default section sequence [slop/default-section-sequence]: hero,
  features, testimonials, pricing, FAQ in that order without asking
  whether THIS product needs those sections. Same for the generic
  five-item navbar and the four-column template footer.
- Uniform reveal [slop/uniform-reveal]: the same fade-up on every
  section means no motion decision was made.

## Naming and specificity (added 2026-08)

- One name per entity [content/entity-alias]: if the product is "Atlas"
  it is "Atlas" everywhere - not "the platform", then "the tool", then
  "the solution". One noun per concept across nav, headings, body, empty
  states and errors; centralize the names in one module so a late rename
  propagates cleanly.
- Every claim carries something countable, or it is cut: "users were
  frustrated" becomes "users clicked export six times because the page
  gave no loading state". A value proposition with no number, name,
  mechanism or constraint is a deletion candidate, not a rewrite
  candidate. This is the filler test sharpened: not "does this say
  anything" but "what would prove it false". Do not invent the number to
  pass the test - that is the fabrication ban's territory.
- Institutional copy takes first person plural: "We have been training
  drivers for 34 years" beats the impersonal gerund construction. Hero
  body, about sections, leadership quotes.

## Simulation and testimonial integrity (added 2026-08)

- Anything simulated carries a visible label [content/unlabeled-simulation]:
  "Simulation - real integration in production". A mocked integration is
  never presented as live.
- Pre-demo purge gate: before any investor or client demo, purge every
  fabricated claim - invented metrics, fictional testimonials, borrowed
  logos, sections describing features that do not exist. What blocks
  demos in practice is not architecture; it is false claims still in the
  interface.
- Unresolved facts stay loud [content/todo-marker]: every fact not yet
  supplied (company ID, address, price) gets a bracketed named
  placeholder - `[PENDING: registry ID]` - both greppable AND rendered in
  an alarming color, so shipping it by accident is impossible. Never
  substitute a plausible-looking value.
- Testimonials come from real aggregators [content/stock-face-on-testimonial]:
  extract real public reviews, keep names where public, abbreviate
  anonymous ones, show the true aggregate rating with source and count.
  Never author the quotes, and never pair a real quote with a stock or
  generated portrait - use initials or the aggregator's own profile
  image. The hybrid case (real quote, synthetic face) is still a
  fabrication.

## Banned-by-default vocabulary

seamless, powerful, revolutionize/revolutionary, next-generation, cutting-
edge, supercharge, unleash, unlock the power, empower, effortless,
game-changing, "in today's fast-paced world". These survive only attached
to evidence ("powerful" next to a benchmark is a claim; alone it is
filler). [content/buzzword-copy]

Em-dash discipline: in UI microcopy and headings, prefer periods and
commas; repeated em-dashes across a page read as generated text
[slop/em-dash-density]. In long-form body copy an em-dash is legitimate
typography; this is a density rule, not a ban.

## Filler test

Delete the label. If zero information disappeared, it was filler: mono-caps
subtitles restating the heading, pseudo-code kickers, decorative status
text. Remove.

## Self-audit before delivering

Re-read every visible string asking: is it true, is it specific, is it
mine (could a competitor paste it unchanged?), does it name the action or
the value. Rewrite anything that fails in plain functional language.
