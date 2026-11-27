# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **QA Planners** schedule Customer Audits (CS) and Internal Audits (IA) for UTAC's Thai manufacturing sites and keep records complete.
- **QMS Hosts** review the audits assigned to them and record findings (Major, Minor, OFI, OBS).
- **QA Admins** maintain the QMS Host roster, form options, and holiday/restriction rules.
- **Report users** filter records, export Excel workbooks, and review the change history.
- **Developers** maintaining the React/TypeScript app and Cloudflare Worker.
- **UTAC IT** taking over ownership, releases, D1 data, and security review.

Thai is the working language for most users; English is used alongside it. User and developer documentation ship in Thai and English; the IT handover ships in English.

## Product Purpose

UTAC QA Calendar (QMS-CASS; the app header reads "Calendar Auditor") replaces spreadsheet audit planning with a shared, multi-user schedule. Success means every CS/IA audit across the seven sites is planned on an allowed day, carries complete required data, gets its results recorded, and can be reported without re-keying.

## Operating Context

- Desktop browsers on company devices: Microsoft Edge (UTAC standard) and Google Chrome, standard windows (not InPrivate/Incognito).
- Phones too (decided 2026-11-27): below 860px wide the app uses a bottom tab bar, card lists for Table and History, and 44px touch targets. Checked in Chromium phone emulation, not yet on real devices.
- Seven sites: `UTL1`, `UTL2`, `UTL2A`, `UTL2B`, `UTL3`, `UTL3A`, `UTL3T`.
- Views: Schedule (Week/Month/Year), Table, Summary, Manage (QMS Host, Options, Holidays), History.
- Deployed as a Cloudflare Worker serving static assets and a `/api/*` API backed by Cloudflare D1. Live account, URL, and deployed version are not verifiable from the repository.

## Capabilities and Constraints

- Five derived appointment statuses: Incomplete (red), New (purple), Updated (blue), Pending Result (amber), Complete (green). Card fill shows status; the left strip shows the site color.
- Day rules: Public Holiday blocks CS and IA; No Customer Audits blocks CS only; Shutdown Plant blocks CS and blocks IA at selected sites.
- CS requires 8 fields; IA requires 5 core fields. Incomplete drafts may be saved.
- Excel (.xlsx) export is client-side. Holiday Excel/CSV import does not exist.
- Known gaps for IT: `admin`/`user` roles are not enforced server-side; registration uses a shared `REGISTRATION_CODE`; passwords use salted SHA-256; `calendar_qa_snapshot` in localStorage keeps schedule data after sign-out.

## Brand Commitments

- Names: "UTAC QA Calendar (QMS-CASS)" in documentation; "Calendar Auditor · UTAC" in the app.
- UTAC logo: `public/utac-logo.jpg`, `docs/images/utac-logo.jpg`.
- Documentation matches the application's own look (confirmed by the user, 2026-11-27).

## Evidence on Hand

- App screenshots in `docs/images/` (login, header, Schedule month and week, appointment form, multi-select, Table, Summary, Manage → QMS Host, Manage → Holidays, History) are captured from the running dev app by `npm run docs:screenshots` (`scripts/capture-docs-screenshots.mjs`).
- All companies, people, and records in those screenshots are fictional demonstration data defined in that script; they are not real customers or staff.

## Product Principles

1. The schedule is only useful if it is complete and on an allowed day; guardrails beat after-the-fact cleanup.
2. One fact, one place: statuses, day rules, and required fields must read the same in every view and every document.
3. State what the repository proves and mark what IT must verify live; never present unverified production facts as confirmed.
4. Thai readers come first in user-facing material; English must say the same thing, not more or less.
