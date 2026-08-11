# Surface Classification

Classify BEFORE designing. The surface type sets the expression budget,
the dominant heuristics, and which rules relax.

## Brand surface

Landing pages, corporate sites, portfolios, campaigns, storytelling,
launches. The visitor is deciding or feeling.
Prioritize: identity, memorability, art direction, narrative, rhythm,
differentiation. DESIGN_VARIANCE may run high; motion may be expressive;
density usually low. Conversion paths (forms, pricing) still follow
product-surface rules: the checkout inside a beautiful campaign is an
Operate zone. Brand surfaces with a conversion goal also load
`references/conversion/architecture.md`: classify the visitor's
awareness stage in the brief, order sections for THAT stage, one idea
per viewport, one primary CTA, objections answered where they occur.

## Product surface

SaaS apps, dashboards, tools, checkouts, CRMs, settings, internal apps.
The visitor is completing tasks, repeatedly.
Prioritize: clarity, speed, consistency, appropriate density, states,
navigation, error recovery. Convention is a feature (Jakob at maximum);
variance caps at 6; motion follows the frequency gate strictly; identity
lives in typography, spacing precision, color discipline and voice: not
in novelty layouts.

## AI surface (product-surface subtype)

Extraction flows, copilots, generation tools: any screen where a model's
output becomes user data. All product-surface rules apply, plus the
extraction contract in `references/production/ai-surfaces.md`: per-field
confidence shown, below-threshold fields marked and focused, everything
editable before applying, one explicit apply action. Demos follow its
design-for-failure protocol and are verified by rendered values.

## Hybrid surface

Marketing site + app, docs + product, storefront + account area. Draw the
zone map explicitly in the brief: which routes/sections are brand, which
are product. Apply each register to its zone. Three named failure modes:
landing rules leaking into operative panels (decorated dashboards),
product austerity flattening the brand story (dead marketing pages), and
signature asymmetry: the landing accretes the brand signature (bezels,
display type, motion) while the console users pay for stays generic
stacked cards. Export at least one signature element to the app's
identity moment (a header, a protagonist metric); it moves
distinctiveness more than another landing pass. Same-role data (stat
tiles, chart headlines) shares ONE treatment across areas: audit them as
a set.

## Visitor-mode lens (secondary check)

For each key screen, name what the visitor is doing:
- Persuade: deciding. Expression budget high, claims must be true.
- Operate: completing a task. Expression budget minimal, speed sacred.
- Read: understanding. Typography budget high, motion near zero.
- Experience: inside the work (galleries, stories). Expression maximal,
  orientation still mandatory.

The mode belongs to the SCREEN, not the product: a database company's
launch page is Persuade; a fashion house's size guide is Read. When a
screen mixes modes, split it into zones like a hybrid surface.

## Anti-patterns of classification

- Treating every product as a brand canvas (experimental dashboards).
- Treating every landing as a conversion machine with no identity.
- Letting the company's self-image ("we're a fun brand") override the
  visitor's mode on operative screens (billing is never fun).
