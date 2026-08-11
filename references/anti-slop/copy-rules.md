# Content Integrity and Copy Rules

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
