---
name: UTAC QA Calendar (QMS-CASS) Documentation
description: QA procedure binders for the UTAC QA Calendar, drawn in the app's own sage, ink and site colors.
colors:
  desk: "#e9ebe6"
  sheet: "#ffffff"
  ink: "#15191e"
  ink-raised: "#2b3134"
  ink-2: "#3a403a"
  ink-3: "#4a5048"
  label: "#5f665e"
  label-disabled: "#7d837b"
  hairline-strong: "#d8dcd4"
  sheet-edge: "#dfe2db"
  rule: "#e0e3dc"
  rule-2: "#eef1ea"
  wash: "#f4f6f1"
  wash-2: "#f1f3ee"
  scroll-thumb: "#c8ccc4"
  link: "#2756d6"
  focus: "#2756d6"
  search-hit: "#fde68a"
  selection: "#cdd9ff"
  status-incomplete: "#dc2626"
  status-new: "#7c3aed"
  status-updated: "#0284c7"
  status-pending: "#d97706"
  status-complete: "#059669"
  site-utl1: "#c0392b"
  site-utl2: "#2e7d32"
  site-utl2a: "#66bb6a"
  site-utl2b: "#1b5e20"
  site-utl3: "#1e5fa8"
  site-utl3a: "#4a90d9"
  site-utl3t: "#123f73"
  callout-note-fg: "#2756d6"
  callout-note-bg: "#f4f7ff"
  callout-note-border: "#cdd9ff"
  callout-tip-fg: "#047857"
  callout-tip-bg: "#f0fdf6"
  callout-tip-border: "#b5ecd0"
  callout-important-fg: "#6d28d9"
  callout-important-bg: "#f7f5ff"
  callout-important-border: "#d6ccfd"
  callout-warning-fg: "#a4500b"
  callout-warning-bg: "#fffaeb"
  callout-warning-border: "#f8d98a"
  callout-caution-fg: "#b91c1c"
  callout-caution-bg: "#fef4f4"
  callout-caution-border: "#f9c0c0"
  copied: "#86efac"
typography:
  display:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(34px, 4.6vw, 52px)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(26px, 3.1vw, 34px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.58
  body:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.68
  body-th:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.85
  body-small:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.55
  control:
    fontFamily: "Archivo, IBM Plex Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "IBM Plex Mono, IBM Plex Sans Thai, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.1em"
  code:
    fontFamily: "IBM Plex Mono, IBM Plex Sans Thai, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  swatch: "3px"
  sheet: "4px"
  inline-code: "5px"
  chip: "6px"
  badge: "7px"
  control: "9px"
  block: "10px"
  menu: "12px"
  diagram: "14px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "22px"
  xl: "28px"
  section: "44px"
  sheet-x: "72px"
components:
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "34px 72px 30px"
    width: "860px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-ink-hover:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.sheet}"
  button-quiet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-quiet-hover:
    backgroundColor: "{colors.wash-2}"
  segment:
    backgroundColor: "{colors.wash-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.badge}"
    padding: "8px 12px"
  segment-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
  segment-disabled:
    textColor: "{colors.label-disabled}"
  audience-tab-user:
    backgroundColor: "{colors.site-utl2}"
    textColor: "{colors.sheet}"
    rounded: "0 10px 10px 0"
    width: "44px"
  audience-tab-developer:
    backgroundColor: "{colors.site-utl3}"
    textColor: "{colors.sheet}"
    rounded: "0 10px 10px 0"
    width: "44px"
  audience-tab-it:
    backgroundColor: "{colors.site-utl3t}"
    textColor: "{colors.sheet}"
    rounded: "0 10px 10px 0"
    width: "44px"
  running-head:
    textColor: "{colors.label}"
    typography: "{typography.label}"
  step-badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.badge}"
    size: "25px"
  chapter-number:
    textColor: "{colors.sheet}"
    rounded: "{rounded.badge}"
    padding: "3px 9px"
  callout-note:
    backgroundColor: "{colors.callout-note-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "14px 18px 4px"
  callout-tip:
    backgroundColor: "{colors.callout-tip-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "14px 18px 4px"
  callout-important:
    backgroundColor: "{colors.callout-important-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "14px 18px 4px"
  callout-warning:
    backgroundColor: "{colors.callout-warning-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "14px 18px 4px"
  callout-caution:
    backgroundColor: "{colors.callout-caution-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "14px 18px 4px"
  site-chip:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "0 8px 0 6px"
  code-slab:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.desk}"
    typography: "{typography.code}"
    rounded: "{rounded.block}"
    padding: "15px 18px"
  code-inline:
    backgroundColor: "{colors.wash-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inline-code}"
    padding: "0.08em 0.36em"
  copy-button:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.desk}"
    rounded: "{rounded.badge}"
    padding: "6px 9px"
  table:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.block}"
  table-header:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.label}"
    padding: "10px 14px"
  figure-frame:
    backgroundColor: "{colors.wash}"
    rounded: "{rounded.block}"
  rail-link:
    textColor: "{colors.ink-2}"
    rounded: "10px 0 0 10px"
    padding: "8px 14px"
  rail-link-current:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  open-link:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  open-link-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
---

# Design System: UTAC QA Calendar (QMS-CASS) Documentation

## Overview

**Creative North Star: "The QA Procedure Binder"**

Every guide is a binder of controlled procedure sheets. Each chapter is a white sheet laid on the app's sage desk, headed by a ruled running head (guide name left, revision right) and closed by a revision footer with previous/next links and a folio. Colored audience tabs hang off the sheet's right edge and switch binders; at wide widths a divider rail of chapter titles on the left tracks the chapter in view. The documentation index is the binder shelf: one spine per audience, each in that audience's site color.

The system is scoped to the documentation surface (`docs/`), and it inherits rather than invents. The desk, ink and Archivo text come from the app's global stylesheet (`src/index.css`); the status swatches come from `STATUS_COLOR_MAP` in `src/types.ts`; the site chips and audience tab colors come from `initialSiteColors` in `src/data.ts`. The user confirmed that the docs match the app. When the app's values change, these tokens follow; the docs never fork a private shade of a site or status.

The density is that of a printed manual: one centered sheet, generous side margins, 70ch reading measure, mono for anything that is a label, code or a number, and print as a first-class output where each chapter becomes its own A4 page. It explicitly refuses the generic three-pane docs site.

**Key Characteristics:**
- Sage desk, white sheets, near-black ink; color appears only where it carries meaning (audience, site, status, callout kind, link).
- Archivo for reading, IBM Plex Mono for running heads, numbers, table labels and code, IBM Plex Sans Thai for every Thai glyph; all self-hosted for offline use.
- Ink is the action color: the Print button, the active language segment, step badges and code slabs are all ink.
- Paper-like depth: one soft drop under each sheet, flat blocks inside it.
- Thai gets its own looser metrics, never just the English values.

## Colors

A restrained sage-and-ink neutral world, with color reserved for the app's own semantic sets.

### Primary
- **Binder Ink** (#15191e): body text, headings, the 2px rule under every running head, the shelf's top rule, the Print button, the active language segment, step badges, code slabs. Hover on ink surfaces lifts to **Raised Ink** (#2b3134), which is also the copy button's fill.

### Secondary
- **Procedure Blue** (#2756d6): links and the focus ring, and the Note callout's label. Links are always underlined (1px, offset 3px; 2px on hover).

### Neutral
- **Sage Desk** (#e9ebe6): the page background behind sheets and the sticky bar; also the text color on ink code slabs. Same value as the app body background.
- **Sheet White** (#ffffff): sheets, tables, menus, quiet buttons, the current rail entry.
- **Ink 2** (#3a403a): lede, rail links, segment text, secondary prose.
- **Ink 3** (#4a5048): figure captions, checkbox strokes, the index's Thai alt titles.
- **Ledger Gray** (#5f665e): every mono label: running heads, table headers, chapter numbers, contents sub-topic lines, footer direction labels, list markers.
- **Disabled Gray** (#7d837b): an unavailable language segment only.
- **Strong Hairline** (#d8dcd4): bar bottom border, control borders, the sheet's 1px bottom edge.
- **Sheet Edge** (#dfe2db): the sheet border and the current rail entry's border.
- **Rule** (#e0e3dc) and **Faint Rule** (#eef1ea): table and contents dividers; faint rule separates numbered steps and table rows.
- **Wash** (#f4f6f1) and **Wash 2** (#f1f3ee): table header fill, figure frame fill, row and menu hover, inline code fill, the language switch track.
- **Selection** (#cdd9ff): text selection; same as the Note callout border.
- **Search Hit** (#fde68a): matched words in search results and on the page a result opens (CSS Custom Highlight). Never used for anything else.

### Status set (from `STATUS_COLOR_MAP`)
Incomplete (#dc2626), New (#7c3aed), Updated (#0284c7), Pending Result (#d97706), Complete (#059669). In the docs these appear only as 12px rounded swatches beside the status word, never as text color or a fill behind text.

### Site set (from `initialSiteColors`)
UTL1 (#c0392b), UTL2 (#2e7d32), UTL2A (#66bb6a), UTL2B (#1b5e20), UTL3 (#1e5fa8), UTL3A (#4a90d9), UTL3T (#123f73). They render as site chips (8% tint fill, 40% tint border, solid 8px square, ink text). Three of them double as audience colors: User Guide takes UTL2 green, Developer Guide takes UTL3 blue, IT Handover takes UTL3T navy.

### Callout kinds
Five kinds, each a foreground / tint / border triple: Note (blue), Tip (green #047857), Important (violet #6d28d9), Warning (amber-brown #a4500b), Caution (red #b91c1c). These are the docs' own darker set, tuned so the label passes AA on white; they are modeled on the app's status badge form, not its status values.

### Named Rules
**The Borrowed Palette Rule.** Every semantic color in the docs is the app's value: sites from `initialSiteColors`, statuses from `STATUS_COLOR_MAP`, desk and ink from `src/index.css`. Change the app first, then the docs; never tune a site or status shade for the docs alone.

**The Ink Acts Rule.** The single action color is ink. Blue is for links and focus only; site colors are for audience and site identity only.

## Typography

**Display / Body Font:** Archivo (variable 400–700, latin + latin-ext), with IBM Plex Sans Thai, then system-ui.
**Label / Mono Font:** IBM Plex Mono (400, 500, 600), with IBM Plex Sans Thai for Thai, then ui-monospace.
**Thai:** IBM Plex Sans Thai (400, 600 serving 600–700), loaded on the Thai unicode range only.

**Character:** A tight, confident grotesk for headings over a mono that reads like the controlled-document furniture of a QA binder: revision stamps, figure numbers, table column labels.

### Hierarchy
- **Display** (700, clamp 34–52px, line-height 1.03, -0.03em, balanced): the sheet title, once per page.
- **Headline** (700, clamp 26–34px, 1.12, -0.02em): chapter titles, preceded by a mono chapter-number badge in the binder's audience color.
- **Title** (700, 21px, 1.3, -0.01em): sections within a chapter, prefixed by a mono section number in Ledger Gray; h4 is 17px.
- **Lede** (400, 19px, 1.58, max 62ch): the paragraph under the title.
- **Body** (400, 16.5px, 1.68, max 70ch): all prose; 16px below 700px; 11pt in print. Strong is 650.
- **Body small** (14.5px, 1.55, tabular numerals): tables; 13.5px on phones. Captions and footer text are 13.5px.
- **Label** (Plex Mono 500, 11–12px, 0.08–0.12em, uppercase): running heads, table headers, contents title, footer direction labels, figure numbers, callout badges (700).
- **Code** (Plex Mono 400, 13.5px, 1.6): code slabs; inline code is 0.84em at 500.

### Named Rules
**The Thai Metrics Rule.** Thai pages (`body.th`) run body at 17px / 1.85, loosen heading line-heights (display 1.25, headline 1.35, title 1.45), drop negative and positive tracking to 0, and set uppercase-mono labels (table headers, callout badges, figure numbers) in the sans at 12–13px with no case transform. Thai never inherits English tracking.

**The Mono Is Furniture Rule.** Mono marks the binder's apparatus (numbers, revisions, labels, code). It is never used for prose or headings.

## Layout

A centered binder on a desk. The sticky bar is 60px (56px on phones) on the desk color with a hairline bottom border. Below it, the desk row centers an 860px binder (900px on the index) with 28px top padding and 96px bottom. Sheets are stacked with 28px between them; each sheet has 34px / 72px / 30px padding. The running head sits 40px above the title. Reading measure caps at 70ch for prose, lists, callouts, code and captions; the lede caps at 62ch.

The divider rail (236px) sits to the binder's left, sticky under the bar, starting 64px down so its first entry aligns with the sheet's content. Audience tabs hang 45px off the binder's right edge, sticky 92px under the bar.

Spacing rhythm is loose and editorial rather than a strict scale: 6px list gaps, 10–14px cell and control padding, 22–28px between blocks, 44px above a section title, 48px above the footer.

### Responsive
- **1259px and below:** the rail disappears; a "Contents" disclosure menu appears in the bar; the desk keeps 70px right padding for the hanging tabs.
- **999px and below:** the binder goes full width (desk padding 18px / 14px); audience tabs move above the sheet and turn horizontal, rounded on top, sitting on the sheet's top edge.
- **699px and below:** bar padding 12px, the mono product line and the Print button hide, sheet padding 24px / 20px, chapter-number badges stack above the headline, the footer drops its folio to two columns, and index shelf entries collapse to spine + text with the open buttons wrapping below.

### Print
A4 with 16mm / 14mm margins. Bar, rail, tabs, menus, copy buttons, footer links and the index's open buttons hide. Every chapter sheet starts a new page (the cover does not); sheets lose border, shadow and radius. Code slabs invert to Wash on Ink with a hairline border and wrap. Figures, tables, callouts and code never split; headings never orphan. Audience tabs, chapter badges, spines, swatches and site squares keep their color (`print-color-adjust: exact`).

## Elevation & Depth

Paper on a desk. The sheet is the only lifted surface at rest: a 1px Strong Hairline edge directly below it plus a long, soft, negatively-spread drop, so it reads as a sheet lying on the desk rather than a floating card. Everything inside the sheet is flat, separated by hairline borders and wash fills. Two other surfaces carry shadow: the current rail entry, which casts a small leftward shadow so it reads as the divider tab pulled forward, and the Contents menu popover.

### Shadow Vocabulary
- **Sheet on desk** (`box-shadow: 0 1px 0 #d8dcd4, 0 24px 46px -32px rgba(21,25,30,.4)`): every sheet.
- **Sheet pulled** (`0 1px 0 #d8dcd4, 0 34px 60px -28px rgba(21,25,30,.5)`): the start frame of the jump animation only.
- **Divider tab** (`-6px 6px 14px -12px rgba(21,25,30,.4)`): the current rail entry.
- **Popover** (`0 18px 40px -18px rgba(21,25,30,.35)`): the Contents menu.

### Named Rules
**The Flat Inside Rule.** Inside a sheet nothing casts a shadow. Tables, callouts, figures and code separate by border and fill.

## Shapes

Soft but disciplined corners that scale with the object: swatches 3px, the sheet itself only 4px (paper, not a card), inline code 5px, site chips 6px, step badges, chapter badges and segments 7px, buttons and open links 9px, every in-sheet block (table, callout, code slab, figure frame) 10px, the menu 12px, the diagram frame 14px. Tabs are rounded on the free side only: right side when hanging off the sheet, top side when horizontal, left side for rail entries, so each reads as attached to the sheet. Borders are 1px hairlines everywhere except the 2px ink rule under running heads and above the index shelf.

## Components

### Buttons
- **Shape:** gently rounded (9px), 13px / 600 Archivo, 10px / 14px padding, 1px Strong Hairline border.
- **Ink (Print):** ink fill and border, white text; hover lifts to Raised Ink.
- **Quiet:** white fill, ink text; hover to Wash 2. The Contents disclosure uses this style and turns ink while open, with a drawn chevron.
- **Focus:** the global focus ring.

### Search
A 38px field in the bar (white, Strong Hairline border, 9px radius, Ledger Gray placeholder) with a `/` key hint; focus turns the border ink with a soft blue ring. Results drop down as a white panel (12px radius, menu shadow): each result is a 7px-radius row with a mono location line (guide · language · section), a 14.5px / 650 title, the chapter in Ledger Gray, and a snippet; matches are marked in Search Hit. Arrow keys move through results, Enter opens one, Esc closes. On phones the field takes its own row under the bar. Hidden in print.

### Language switch
A segmented control: Wash 2 track with hairline border, 10px radius, 3px inset; 7px-radius segments at 13px / 600. The current language is ink with white text; hover is a light sage fill; an unavailable language is Disabled Gray with a not-allowed cursor and no hover.

### Sheet
White, 4px radius, Sheet Edge border, Sheet on desk shadow. Opens with the running head (mono label row, guide left and revision right, 2px ink rule below) and ends with the revision footer: three columns (previous, folio, next) above a hairline, direction labels in mono, folio hidden on phones.

### Audience tabs and divider rail (signature)
Audience tabs are 44px vertical tabs (12.5px / 700) in the binder's color: inactive at an 11% tint fill, 30% tint border and 78%-darkened text; hover deepens the tint and slides the tab 3px outward; the current binder is solid with white text. Rail entries are 13.5px Ink 2 with a mono number; hover washes; the current chapter becomes a white tab joined to the sheet (white fill, Sheet Edge border, 600 weight, divider tab shadow). Chapter tracking is set by script as the reader scrolls and is carried across language switches.

### Step list
Numbered procedures drop list bullets for 25px ink badges (7px radius, mono 600 12px white numerals), each step separated by Faint Rule lines top and bottom. Acceptance checklists use the same ruled rows with a custom 17px checkbox (1.5px Ink 3 stroke, 4px radius).

### Callouts
Status-badge form: tint fill, 1px tinted border, 10px radius, max 70ch, and a small white mono label chip (uppercase, 0.08em, 5px radius) in the kind's foreground. Body text stays ink at the body size. Five kinds: Note, Tip, Important, Warning, Caution.

### Site chips and swatches
A site name renders as a mono 12px / 600 chip with a solid 8px square in the site color. A status emoji in source renders as a 12px status swatch beside the word. A hex value renders as a swatch plus inline code.

### Code
Inline code is mono 500 on Wash 2 with a light border, 5px radius, and breaks anywhere. Blocks are ink slabs (10px radius, Sage Desk text) with a mono copy button top right (Raised Ink fill); on success it reads the localized "Copied" in mint green for 1.6s.

### Tables
White, 10px radius, Rule border, horizontally scrollable. Headers are mono uppercase 11px Ledger Gray on Wash (sans 13px, no case change on Thai pages); rows separate by Faint Rule and wash on hover; first column at 550 weight; tabular numerals.

### Figures
Screenshots sit in a Wash frame with a Rule border and 10px radius, capped at 540px tall (110mm in print), with a 13.5px Ink 3 caption led by a mono figure number in ink. Diagram figures drop the frame, run full width with a 640px minimum (scrolling sideways on phones), and are authored in the same palette (`docs/images/architecture.svg`).

### Index shelf
Under a 2px ink rule, each binder is a row: a 46px vertical spine in the audience color with white text, the entry (21px title, Thai alt title, summary, inline chapter list spaced item by item with mono numbers), and open links per language. Open links are 9px quiet buttons that fill ink on hover; an unavailable language is dashed and gray.

### Contents list
Cover sheets carry a mono "Contents" label over a ruled list: mono number column (52px), chapter title at 17.5px / 650, and a 13.5px sub-topic line derived from the chapter's sections. Hover washes the row and underlines the title.

## Do's and Don'ts

### Do:
- **Do** take every site and status color from `initialSiteColors` and `STATUS_COLOR_MAP` (The Borrowed Palette Rule).
- **Do** start each chapter as its own sheet with a running head and revision footer, so it prints as its own page.
- **Do** set numbers, revisions, table headers and code in IBM Plex Mono, and everything readers read in Archivo.
- **Do** apply the Thai metrics (17px / 1.85 body, zero tracking, sans labels) on every Thai page.
- **Do** keep prose, lists, callouts and code at or under 70ch.
- **Do** keep the 2px outline focus ring in Procedure Blue (offset 2px) on every interactive element.
- **Do** gate every movement (smooth scroll, the 0.7s sheet pull on jump, the tab slide) behind `prefers-reduced-motion: no-preference`; state transitions use `cubic-bezier(.16,1,.3,1)` or plain 0.2s color fades.
- **Do** check contrast: Ledger Gray labels are 5.9:1 on white and 4.9:1 on the desk; inactive tab text, callout labels and white-on-tab text all clear 4.5:1.

### Don't:
- **Don't** build a three-pane docs site (fixed sidebar, content, right-hand TOC); the binder and its tabs are the navigation.
- **Don't** use a site or status color as text or as a fill behind body text; they mark identity as tabs, spines, chips and swatches.
- **Don't** use blue for buttons or emphasis; actions are ink.
- **Don't** add shadows inside a sheet (The Flat Inside Rule).
- **Don't** let a Thai page inherit English tracking or English line-heights.
- **Don't** load fonts from a CDN; the docs must work offline from the repository.
