# AI Surfaces: Extraction, Proposal, Demo

Field-derived patterns for interfaces where a model's output becomes user
data. Source: an AI-native ERP whose core interaction was document-to-record
extraction (learning database, section 7). This is a product-surface
register: the credibility of the whole product rides on how the interface
handles uncertainty.

## The extraction contract

For any feature that turns a document, transcript or image into structured
fields:

1. The model returns structured output against a schema, each field as
   value plus confidence, never prose to be parsed downstream.
2. Fields below the confidence threshold are visually marked for review
   and receive focus first. Uncertainty is shown, not hidden: an
   extraction UI that displays every field with equal assurance is
   claiming an accuracy the model does not have.
3. "The AI proposes, the human confirms" is literal. Every field is
   editable BEFORE applying, and the human's overrides merge into the
   applied result. A confirm-only UI silently launders model errors into
   the database.
4. Applying is one explicit action with a named target ("Create record
   from 12 fields"), never automatic on extraction.

Threshold marking is a design token decision: the review state uses the
system's warning/attention treatment, not a new ad-hoc color.

## Model-output copy hygiene

Never render model narration or disclaimers as interface copy: the
detector's `content/meta-chatter` and `content/model-disclaimer-leak`
rules exist because chat-transcript phrasing leaks into empty states and
AI-product onboarding. If data currency matters, show a timestamp; if
confidence matters, show the number or the review mark.

## Demo protocol: design for failure

Never depend on a live model API in front of stakeholders.

- Ship a pre-extracted showcase record so the proposal appears instantly.
- Add an idempotent reset so the demo can run twice.
- Show a visible demo-status strip so nobody presents an already-consumed
  showcase.
- Label the simulation (`content/unlabeled-simulation`): a mocked
  extraction is never presented as live inference.

Verify demo data by the RENDERED values, not by the records existing.
Structurally valid seed data can still render zero across every headline
metric - the field case: seeded cost entries with no invoices displayed
zero sales and zero margin with every table technically "present", the
worst possible reading for investors. The pre-demo purge gate (copy-rules)
plus a rendered-value walk of every headline number is the check.

## Audit hooks

When auditing an AI surface, add to the standard product-surface pass:

- Does any extracted field apply without an edit opportunity?
- Is below-threshold confidence visually distinguishable?
- Do empty/loading/error states exist for the inference path, including
  quota exhausted and model unavailable?
- Do headline metrics render real values from the seeded data?
- Does any UI string leak model narration or disclaimers?
