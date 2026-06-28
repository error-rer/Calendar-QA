# Fab QA Scheduler

A collaborative weekly QA-coverage planner for a microchip manufacturer
(Nexsil Microsystems). React + Vite + TypeScript implementation of the
**Fab QA Scheduler** design handed off from Claude Design.

## Running

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

The sign-in screen accepts any credentials (it's a seeded demo — the
"Sign in" and "Continue with Okta SSO" buttons both enter the app).

## What's included

- **Login** — split brand / sign-in layout, Okta SSO, Enter-to-submit.
- **Schedule** — a Week / Month scale toggle plus three grouping views
  (By engineer / By site / By customer). The weekly scale is a sticky grid
  with drag-and-drop staffing from the unstaffed-order pool,
  drag-to-reschedule, live conflict detection (double-booking + missing
  certifications), week navigation with "copy week", Employee/Customer
  filters and per-site visibility toggles, presence avatars, and an
  activity feed.
- **Month view** — a 7-column calendar (today outlined, weekends dimmed)
  with per-day shift/conflict badges and order chips; click any weekday to
  drill into that week. Below the grid, a "Customer orders · {month}"
  card section summarises shifts / days / engineers / conflicts per order.
  Month navigation and the period label/tag follow the active scale.
- **Detail panel** — order/customer info, required-vs-held certs, day/night
  toggle, notes thread, duplicate/remove.
- **Create-shift modal** — pick an order + engineer side-by-side with live
  cert/busy validation and a conflict-warning banner; also opens prefilled
  from an empty grid cell.
- **Create-order modal** — open a new customer order (code, product,
  customer with suggestions, fab site, priority, required certs) into the
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
  panel, create-shift validation, and month badges. Opened from the
  schedule toolbar's "Leave" button or the user menu. On the mobile
  single-day layout, an "Away" banner lists who's off on the selected day
  and the day strip dots the days that have absences.
- **Profile** — banner header, planning stats, account details, sites under
  coverage, and a personal activity feed.
- **Manage (admin)** — stat cards plus Engineers / Fab sites / Customer
  orders tabs whose edits feed back into the schedule's conflict logic.
- **Responsive** — below ~860px the app reflows to a hamburger drawer,
  single-day card list, compact month calendar, full-screen modal/detail,
  and a stacked login.

All data is seeded in memory (`src/data.ts`); changes live for the session
and reset on reload. There is no backend.

## Structure

| Path | Purpose |
| --- | --- |
| `src/types.ts` | Domain types (Engineer, Order, Assignment, …) |
| `src/data.ts` | Constants + seeded initial state |
| `src/useScheduler.ts` | All state, actions, conflict logic, and the view model |
| `src/ui.tsx` | `css()` style-string parser + hover/focus helper components |
| `src/components/*` | Login, Header, Schedule (incl. month grids + leave tags), DetailPanel, CreateModal, OrderModal, EngineerModal, SiteModal, CustomerModal, LeaveModal, Admin, Profile |

Styling mirrors the design prototype's inline styles verbatim (parsed via
`css()`) to stay pixel-accurate; the view model in `useScheduler.ts` is a
direct port of the prototype's render logic.
