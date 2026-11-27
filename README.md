# UTAC QA Calendar (QMS-CASS)

Web app for planning Customer Audits (CS) and Internal Audits (IA) across seven UTAC sites: `UTL1`, `UTL2`, `UTL2A`, `UTL2B`, `UTL3`, `UTL3A`, and `UTL3T`. Views: Schedule, Table, Summary, Manage, and History. Runs as a Cloudflare Worker with a Cloudflare D1 database.

## Documentation

| Guide | ไทย | English |
|---|---|---|
| User Guide · คู่มือผู้ใช้ | [Markdown](docs/th/user-guide.md) | [Markdown](docs/en/user-guide.md) |
| Developer Guide · คู่มือนักพัฒนา | [Markdown](docs/th/developer-guide.md) | [Markdown](docs/en/developer-guide.md) |
| IT Handover · คู่มือส่งมอบ IT | [Markdown](docs/th/it-handover.md) | [Markdown](docs/en/it-handover.md) |

Printable HTML versions: open [`docs/index.html`](docs/index.html). See [docs/README.md](docs/README.md) for how the docs are organized and rebuilt.

## Quick start

```bash
npm ci
npm run dev          # frontend only, browser-local dev data
```

For the Worker with a local D1 database:

```bash
npm run migrate:local
npm run dev:worker
```

Never connect local development to the production D1 database.

## Build and deploy

```bash
npm run lint
npm run build
npm run deploy       # build, confirm and apply pending D1 migrations, then deploy the Worker
```

Production migrations, releases, and recovery follow the [IT Handover runbook](docs/en/it-handover.md#5-release-and-database-runbook).

## Repository layout

| Path | Contents |
|---|---|
| `src/` | React + TypeScript frontend |
| `worker/index.ts` | Cloudflare Worker: API and static assets |
| `migrations/` | Ordered D1 SQL migrations |
| `wrangler.toml` | Worker, assets, and D1 binding |
| `docs/` | User, developer, and IT documentation |
| `scripts/build-docs.mjs` | Builds the HTML docs from Markdown (`npm run docs`) |
| `scripts/deploy.mjs` | Release: confirm and apply pending D1 migrations, then deploy (`npm run deploy`) |
| `scripts/capture-docs-screenshots.mjs` | Recaptures the doc screenshots from the dev app with fictional demo data (`npm run docs:screenshots`) |

## Open IT review items

Server-side role enforcement, account lifecycle and the shared registration code, password handling, business data kept in the browser after sign-out, a History whose entries are written by the browser, and browser-only validation. Details and suggested decisions: [IT Handover § Security findings](docs/en/it-handover.md#4-security-findings). Confirmed application defects are listed under [Known application issues](docs/en/it-handover.md#7-known-application-issues).
