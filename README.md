# SDS Techware Shop — Catalogue & Quotation Prototype (Baseline v1)

React + TypeScript + Vite prototype of an IT product catalogue and quotation-enquiry website for SDS Techware (Sri Lanka), with a staff workspace for products, stock and customer requests.

> **This is a frontend-only prototype, not a production system.** All data lives in the visitor's browser (`localStorage`). There is no backend, no sign-in, no payment processing, and no email/SMS sending. See [Prototype limitations](#prototype-limitations).

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | **22.12 or newer** (22 LTS recommended; see `.nvmrc`) |
| npm | 10 or newer (the only supported package manager; `package-lock.json` is committed) |

`.npmrc` sets `engine-strict=true`, so installing on an older Node version fails early with a clear message.

## Setup and commands

```bash
npm ci               # clean, reproducible install from package-lock.json
npm run dev          # development server → http://localhost:3000
npm run typecheck    # TypeScript check (no output files)
npm test             # unit tests (Vitest)
npm run build        # type check + production build → dist/
npm run preview      # serve the production build → http://localhost:4173
npm run verify       # typecheck + tests + production build in one go
```

Use `npm install <package>` only when intentionally adding a dependency, and commit the updated `package-lock.json`. Do not use `--force` or `--legacy-peer-deps`.

Optional browser smoke check (33 automated checks of the main flows on desktop and mobile):

```bash
npm run build && npm run preview           # terminal 1
npm install --no-save playwright           # terminal 2 (one-off)
npx playwright install chromium            # one-off browser download
node scripts/browser-smoke-check.mjs
```

## Deployment notes

- `npm run build` produces a static site in `dist/`. Product images are served from `public/images/products/` and work in the production build.
- The staff workspace uses the path `/admin`. Static hosts must rewrite unknown paths to `index.html` (SPA fallback), otherwise a direct visit to `/admin` returns 404.
- The app assumes it is served from the site root (`/`). Serving from a sub-path needs `base` in `vite.config.ts` and route changes.
- No environment variables are needed. Anything prefixed `VITE_` is embedded in the public bundle — never put secrets there.

## Project structure

```
src/
  App.tsx, main.tsx, index.css
  config/        business.ts (company details, flagged for confirmation), settings.ts (limits/defaults)
  types/         shared domain types
  lib/           storage.ts (all browser storage access), csv, download, format, ids
  features/      pure, unit-tested business logic
    catalog/       pricing.ts (public price rule), catalogFilters.ts, search.ts, productRecords.ts
    quotation/     quoteItems.ts, quotationText.ts, generateQuotationPdf.ts
    inventory/     restock.ts (drafts, goods receipts, stock counts), history.ts, thresholds.ts, exports.ts
    alerts/        notifications.ts (back-in-stock & price requests, manual notification status)
    reviews/ staff/ support/ warranty/ configurator/   (demo content and helpers)
  store/         StoreContext.tsx composing focused hooks (catalog, inventory, quote, alerts, browsing, reviews, staff)
  hooks/         useDialog.ts (Escape, focus trap, scroll lock)
  components/    common/, storefront/, admin/ (admin/restock/ = low-stock & restocking UI)
  data/          demo fixtures (sample catalogue, reviews, requests)
public/images/products/   sample product photos
docs/            PROJECT_HANDOVER.md, UPDATE_WORKFLOW.md, VERIFICATION_REPORT.md
scripts/         browser-smoke-check.mjs (optional)
```

## Key business rules

- **Public price:** shown only when public visibility is on **and** the price is a valid number greater than zero. LKR 0 is never published. Everything else is "Price on Request" — in cards, details, search, comparison, filters, sorting, statistics, charts and exports (`src/features/catalog/pricing.ts`).
- **Restocking:** reorder drafts never change stock. Stock increases only through an explicitly confirmed goods receipt, applied all-or-nothing and recorded in stock history. Purchase cost is separate from selling price; unknown cost stays unknown.
- **Customer requests:** the app never sends messages. Staff contact customers themselves and record it with "Mark as manually notified" (time and demo role are stored).
- **Identity:** with no sign-in, actions are attributed to "Demo session (<role> role)".

## Prototype limitations

| Area | Status |
| --- | --- |
| Data storage | Browser `localStorage` only; per browser, not shared, can be cleared by the user. |
| Staff access / roles | Demo role switcher; no authentication. Anyone can open `/admin` and switch roles. |
| Hidden prices | Hidden in the UI only. The full catalogue (including hidden prices and purchase costs) is in the browser. A real backend must exclude private prices from public responses. |
| Stock history | Convenience log in the browser; **not** a secure or tamper-proof audit trail. |
| Back-in-stock / price alerts | Requests are saved locally; nothing is monitored or emailed. |
| Quotation enquiry | Customer downloads, prints or copies the enquiry; the app does not submit it anywhere. |
| Support chat | Scripted demo assistant; not a person, not monitored. |
| Reviews | Demo samples plus browser-local, unmoderated, unverified reviews. |
| Price chart | Illustrative simulated curve for public-price items only; not real history. |
| Warranty lookup | Fictional sample records only. |
| Server configurator | Builds a request; no prices, no stock, no validated compatibility. |
| Business details | Several values need confirmation — see `docs/PROJECT_HANDOVER.md`. |

More detail: [docs/PROJECT_HANDOVER.md](docs/PROJECT_HANDOVER.md). Change history: [CHANGELOG.md](CHANGELOG.md).
