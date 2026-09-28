# Verification Report — Baseline v1

Date: 2026-09-27. Environment: Linux, Node 22.22.2, npm 10.9.7, Chromium (Playwright 1.x, headless).
All results below come from a **fresh extraction of the delivered ZIP** unless noted.

## Commands run

| Check | Command | Result |
| --- | --- | --- |
| Clean install | `npm ci` | ✅ Passed — 133 packages added, 0 vulnerabilities reported |
| Type check (strict) | `npm run typecheck` | ✅ Passed — no errors |
| Unit tests | `npm test` | ✅ Passed — 6 files, 44 tests |
| Production build | `npm run build` (runs type check first) | ✅ Passed — `dist/` created; product images copied to `dist/images/products/` |
| Combined | `npm run verify` | ✅ Passed |
| Dev server | `npm run dev` | ✅ Started; `/`, `/src/main.tsx` and a product image returned HTTP 200 |
| Production preview | `npm run preview` | ✅ `/`, `/admin` and product images returned HTTP 200 |
| Browser smoke check | `node scripts/browser-smoke-check.mjs` against the preview build | ✅ 33 passed, 0 failed |

Unit tests cover: public price rule (hidden, null, zero, invalid), storefront-safe product copies, public-only bounds/budget/sorting/statistics, goods receipt validation, unconfirmed starting stock, atomic batch failure (no partial updates or history), purchase cost vs selling price, reorder drafts not changing stock, stock counts, legacy history migration, manual-notification status transitions, price alerts only for public prices, quotation migration and totals, storage backups and write failures, image path migration. Rule mutations (e.g. publishing LKR 0, allowing partial batches) were tried and caused test failures, confirming the tests exercise the rules.

## Browser checks (desktop 1366×900 and mobile 390×844)

Passed:
- Home loads without runtime errors; product images load in the production build.
- No hidden price text anywhere on catalogue, search suggestions, sorted grid, budget calculator, product details, comparison and quotation drawer; clipboard enquiry text contains no hidden prices.
- Search suggestions; keyboard selection (Arrow + Enter) opens details; Escape closes.
- Category, brand and in-stock filters; "Clear all filters" resets counts (13 → 3 → 3 → 13).
- Price sort: published prices first (LKR 1,800 < 3,800 < 43,500) in both directions; Price-on-Request items after them.
- Budget calculator bounds derived from public prices only.
- Hidden-price product: "Price on Request", no chart values, no price-alert action. Public-price product: chart labelled "DEMO — simulated data" (lazy-loaded).
- Product detail dialog scrolls on desktop and mobile.
- Comparison matrix: no exact stock counts; Escape closes.
- Quotation: typed quantity (3 × LKR 1,800 = LKR 5,400) and total; no total when a Price-on-Request line exists; PDF download; copy text; print preview without invented terms.
- Back-in-stock request confirmation states that no automatic email is sent.
- Demo assistant labelled as scripted; no live-stock, persona or response-time claims.
- Warranty lookup labelled as demo; unknown serial handled honestly.
- Server configurator shows no LKR prices; adds a price-less request marked "subject to technical and commercial confirmation".
- Staff workspace: prototype notice, "Demo session" identity (no named sign-in).
- Reorder draft copy does not change stored stock.
- Goods receipt: confirm button disabled until physical-receipt checkbox and valid cost; stock 0 → 7; follow-up list says no messages are sent; "Mark as manually notified" recorded; history shows "Goods receipt (confirmed)", "Demo session (Owner role)" and "Unknown" cost.
- Stock requests show "Manually notified"; no email-dispatch wording.
- Product editor: public toggle disabled for LKR 0; purchase cost, price and stock saved; stock change recorded in history.
- Category and brand creation.
- Legacy browser data (old image path, old quote format with hidden price, old restock log) migrates correctly; malformed stored reviews are backed up and the staff workspace shows the backup notice.
- Mobile: no horizontal page overflow (catalogue and staff workspace); filter drawer opens and closes with Escape; quotation drawer fits and works.
- Dialogs: focus stays inside (25/25 Tab presses), returns to the opener on Escape, page scroll lock released; nested dialogs close one at a time.

Screens were also inspected visually (desktop home, staff workspace with receipt dialog, mobile home); the navy/blue/white layout is unchanged apart from added demo/prototype labels.

## Not tested / limitations of this verification

- Google Fonts could not be reached from the test sandbox (the page fell back to system fonts); this network error was excluded from the error checks.
- Browsers other than Chromium (Safari, Firefox) and real mobile devices were not tested.
- Actual printing to paper/PDF via the browser print dialog was not tested (only the print preview dialog content).
- The content of the generated PDF was not visually inspected (download and filename only).
- Screen-reader behaviour was not tested; only keyboard focus handling and ARIA roles/labels used by the automated checks.
- Installing on Node < 22.12 (expected to be refused by `engine-strict`) was not tried.
- Storage quota exhaustion was tested only in unit tests (simulated), not in a real browser.
- Older dialogs listed in `PROJECT_HANDOVER.md` §8 do not yet have Escape/focus-trap behaviour; they were not part of the keyboard checks.
