---
version: 1
slug: "docs-index-html"
primary_target: "docs/index.html"
related_targets: ["docs/en/user-guide.html","docs/th/user-guide.html","docs/en/developer-guide.html","docs/th/developer-guide.html","docs/en/it-handover.html"]
---

# Documentation (docs/)

Scope: generated HTML documentation for UTAC QA Calendar: docs home plus User Guide (TH/EN), Developer Guide (TH/EN), IT Handover (EN). Markdown in docs/en and docs/th is the single source; scripts/build-docs.mjs renders the HTML.

Visitor mode: Read. Readers: QA staff (Thai first), developers, UTAC IT. Job: find the task or fact fast, follow numbered steps, print a chapter as a procedure sheet.

Constraints: inherits the app's visual world (user confirmed); no new claims beyond the Markdown; works offline from file:// (self-hosted fonts, no CDN); prints cleanly.

## Direction contract

THESIS: Each guide is a QA procedure binder: every chapter is a white sheet on the app's sage desk with a ruled running head and a revision footer, colored audience tabs on the sheet's right edge switch binders, and divider tabs on the left edge track the chapter. Refuses the generic three-pane docs site.

OWN-WORLD: The app's own palette and type: sage desk #e9ebe6, white sheets, ink #15191e, Archivo text, IBM Plex Mono for running heads, table labels and code; audience tabs take site colors (User #2e7d32, Developer #1e5fa8, IT #123f73); callouts are the app's status badges (tint, 1px border, mono label chip); status and site values render as the app's swatches and site chips; code blocks are ink slabs like the app's black pills.

STORY: The reader lands on the cover sheet, sees which binder and revision they hold, scans the chapter list, jumps to a chapter sheet, follows numbered steps with screenshots, switches language or binder from the bar and tabs, and prints chapters as clean sheets.

FIRST VIEWPORT: Slim bar on the desk (logo, product name, mono "QMS-CASS · DOCUMENTATION", ไทย/EN segmented switch, ink Print button). A centered ~860px sheet: running head ruled in ink (guide name, revision), 48px title, lede, chapter list with mono numbers, each title followed by its sub-topic line, first callout. (Revised after finish review: the sketch's right-aligned mono hints were invented per chapter; the sub-topic line is derived from the Markdown and tells the reader what the chapter holds, so it replaces the hint column.) Audience tabs hang off the sheet's right edge; divider rail of chapter titles on the left at wide widths.

FORM: Binder sheets with audience tabs; position 7 on the ordered list; seed:7568b416ffe52fb9.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
