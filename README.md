# Fab QA Scheduler

A collaborative weekly QA-coverage planner for a microchip manufacturer
(Nexsil Microsystems). React + Vite + TypeScript implementation of the
**Fab QA Scheduler** design handed off from Claude Design.

## Running

```bash
npm install
npm run dev      # dev server at http://localhost:5173 (no backend — in-memory only)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

⚠️ **The sign-in screen has no real access control.** Any email/password
(and the "Continue with Okta SSO" button) logs you in — there's no
credential check at all. That's fine for local/demo use, but if this is
deployed somewhere reachable by more than you, anyone with the URL can get
in and read/write all data. Add real auth before treating this as anything
but an internal prototype.

## What's included

- **Login** — split brand / sign-in layout, Okta SSO, Enter-to-submit.
- **Schedule** — a Week / Month scale toggle plus four grouping views
  (By QA / By internal / By customer / By sub-department). The weekly scale is a sticky grid
  with drag-and-drop staffing from the unstaffed-order pool,
  drag-to-reschedule, live conflict detection (double-booking), week navigation with "copy week", Employee/Customer
  filters and per-site visibility toggles, presence avatars, and an
  activity feed.
- **Month view** — a 7-column calendar (today outlined, weekends dimmed)
  with per-day appointment/conflict badges and order chips; click any weekday to
  drill into that week. Below the grid, a "Customer orders · {month}"
  card section summarises appointments / days / engineers / conflicts per order.
  Month navigation and the period label/tag follow the active scale.
- **Detail panel** — order/customer info, department + sub-department, day/night
  toggle, notes thread, duplicate/remove.
- **Create-appointment modal** — pick an order + engineer side-by-side with live
  busy validation and a conflict-warning banner; also opens prefilled
  from an empty grid cell.
- **Create-order modal** — open a new customer order (code, product,
  customer with suggestions, internal site, priority) into the
  unstaffed pool.
- **Create engineer / fab site / customer** — modal forms (opened from the
  user menu, plus the Manage tabs for engineers and sites) that add real
  records: a new engineer joins the roster and grids; a new fab site flows
  into the sidebar, site filter/visibility, By-site view and order form; a
  new customer appears in the By-customer view, filter and order
  suggestions. Each logs to the activity feed.
- **Leave / time-off** — log per-day leave (Vacation / Sick / Personal /
  Training) for an engineer across the viewed week, so the team sees who's
  unavailable. Leave days show as striped tags in the By-engineer grid
  (click to clear) and count as conflicts when an engineer is staffed on a
  day they're off — surfaced in the chip, day header, conflict pill, detail
  panel, create-appointment validation, and month badges. Opened from the
  schedule toolbar's "Leave" button or the user menu. On the mobile
  single-day layout, an "Away" banner lists who's off on the selected day
  and the day strip dots the days that have absences.
- **Profile** — banner header, planning stats, account details, sites under
  coverage, and a personal activity feed.
- **Manage (admin)** — stat cards plus Engineers / Fab sites / Customer
  orders tabs.
- **Responsive** — below ~860px the app reflows to a hamburger drawer,
  single-day card list, compact month calendar, full-screen modal/detail,
  and a stacked login.

On `npm run dev`, data lives in memory only and resets on reload. With the
Cloudflare Pages + D1 backend below, it's persisted and shared across
everyone hitting the deployed URL.

## Structure

| Path | Purpose |
| --- | --- |
| `src/types.ts` | Domain types (Engineer, Order, Assignment, …) |
| `src/data.ts` | Constants + seeded initial state |
| `src/useScheduler.ts` | All state, actions, and the view model; hydrates from `/api/state` on mount and fires an API call alongside every local mutation |
| `src/api.ts` | Fetch client for the `/api/*` endpoints |
| `src/ui.tsx` | `css()` style-string parser + hover/focus helper components |
| `src/components/*` | Login, Header, Schedule, DetailPanel, CreateModal, EditModal, AppointmentFormFields (shared Customer/Internal Audit fields), OrderModal, EngineerModal, SiteModal, Admin, Profile |
| `functions/api/[[path]].ts` | Cloudflare Pages Function — the backend API, backed by D1 |
| `migrations/0001_init.sql` | D1 schema + seed data (base fab sites only) |
| `wrangler.toml` | Cloudflare Pages + D1 binding config |

Styling mirrors the design prototype's inline styles verbatim (parsed via
`css()`) to stay pixel-accurate.

## Backend & deployment (Cloudflare Pages + D1)

The app talks to a small Pages Functions API (`functions/api/[[path]].ts`)
backed by a D1 (SQLite) database, so the schedule is shared across everyone
using the deployed URL instead of living only in one browser tab.

First-time setup (run these yourself — they touch your own Cloudflare
account):

```bash
npx wrangler login
npx wrangler d1 create calendar-qa-db
# paste the returned database_id into wrangler.toml (both spots)
npm run migrate:remote
npm run build && npm run pages:deploy
```

To develop against a local D1 instance instead of plain Vite:

```bash
npm run migrate:local
npm run build && npm run dev:pages
```

Alternatively, connect the GitHub repo in the Cloudflare dashboard for
auto-deploy on every push to `main`, instead of running `pages:deploy`
manually.
