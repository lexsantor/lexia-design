# Focus, Keyboard and ARIA Patterns

## Focus management

- :focus-visible for pointer-suppressed rings; :focus-within for composite
  controls. Never remove an indicator without an equal-or-better
  replacement; indicator itself needs 3:1 contrast (1.4.11) and must not be
  fully obscured by sticky UI (2.4.11).
- Modals/drawers: trap focus inside; initial focus on the first meaningful
  control (or the dialog itself for reading); Escape closes; on close,
  return focus to the trigger.
- Route changes in SPAs: move focus to the new main heading or a live
  region announcement; Back/Forward restores scroll position.
- Dynamic insertion: if content appears in response to an action and the
  user must act on it, move focus to it; otherwise announce via aria-live.
- Multi-step flows that navigate per step reset focus to <body>: give the
  new step's heading tabIndex={-1} and focus it on mount. No visible ring
  needed (not keyboard-reachable), and do NOT add outline-none for it.
- Selection cards built on sr-only radios/checkboxes hide keyboard focus:
  the wrapping label needs has-[:focus-visible]: styles (or
  peer-focus-visible when sibling-structured). Check every styled
  selection-card group.
- scroll-margin-top on anchor targets so sticky headers don't cover them.
- Focus order follows visual order; DOM order is the source of truth; avoid
  order-scrambling CSS on interactive sequences.

## Keyboard contract per surface

- Enter submits a focused form input; Cmd/Ctrl+Enter submits from textarea.
- Escape closes the top-most dismissible layer only.
- Arrow keys navigate WITHIN composite widgets (tabs, menus, listboxes,
  radio groups); Tab moves BETWEEN widgets. Roving tabindex or
  aria-activedescendant per APG.
- Shortcuts: internationalize for non-QWERTY, show platform symbols, never
  override browser/OS shortcuts without an escape hatch.
- During drag: text selection disabled, dragged element inert, keyboard
  alternative exists (2.5.7).

## WAI-ARIA APG pattern index

Authoritative interaction semantics per component:
https://www.w3.org/WAI/ARIA/apg/patterns/ (30 patterns, verified
2026-07-31): Accordion, Alert, Alert/Message Dialogs, Breadcrumb, Button,
Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid,
Landmarks, Link, Listbox, Menu/Menubar, Menu Button, Meter, Radio Group,
Slider, Slider Multi-Thumb, Spinbutton, Switch, Table, Tabs, Toolbar,
Tooltip, Tree View, Treegrid, Window Splitter.

Rules of engagement:
- Before building a custom widget, check whether a native element does the
  job (select, details/summary, dialog, input types). Native first.
- If custom, implement the APG pattern completely: role, states, properties
  AND keyboard behavior. A role without its keyboard contract is worse than
  no role ("no ARIA is better than bad ARIA").
- View toggles are not tabs: role="tablist" without tabpanels and
  arrow-key behavior is a broken contract [a11y/tablist-without-panels].
  A front/back or filter toggle is buttons with aria-pressed.
- Component libraries: verify their primitives against the APG pattern
  before trusting marketing claims; test with keyboard and a screen reader
  smoke pass (VoiceOver/NVDA) on the composed page, not the isolated demo.

## Touch and pointer

- touch-action: manipulation on tappable controls (kills double-tap zoom
  delay); intentional -webkit-tap-highlight-color.
- overscroll-behavior: contain on modals/drawers/scroll areas so scroll
  doesn't chain to the page.
- Inputs >= 16px font-size on iOS to prevent focus zoom; never disable
  zoom.
- Hover-only affordances need visible/focus equivalents; gate hover motion
  with @media (hover: hover) and (pointer: fine).
