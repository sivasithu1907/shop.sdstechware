# Changelog

## Baseline v1 — 2026-09-27

First organised, reproducible baseline, built from `shop.sdstechware-main.zip` (the earlier AI Studio prototype). No payment, backend, database, authentication or hosting integration was added.

### Setup and build
- Fixed the failing fresh install: Vite 8 needs esbuild ^0.27/^0.28, but `esbuild ^0.25` was pinned. The unused esbuild pin was removed.
- Removed unused packages (verified by searching the source): `esbuild`, `express`, `@types/express`, `dotenv`, `tsx`, `@google/genai`, `autoprefixer`.
- Chose **npm** as the only package manager: added `package-lock.json`, removed `bun.lock`, added `.nvmrc` (Node 22), `engines` and `engine-strict`.
- Added `typecheck`, `test`, `verify` scripts; `build` now type-checks first. Enabled TypeScript `strict`.
- Moved product images from `src/assets/images` to `public/images/products` (the old `/src/assets/...` URLs broke in production). Stored product data is migrated automatically.
- Loaded jsPDF and the chart library on demand (main bundle ~1.66 MB → ~0.9 MB).
- Removed the unused Gemini capability from `metadata.json` and the Gemini key from `.env.example`; hardened `.gitignore`. Added a favicon.

### Structure
- Split `src/context/StoreContext.tsx` (1,532 lines) into focused hooks in `src/store/` plus pure logic in `src/features/`.
- Split `src/components/admin/LowStockReorderWidget.tsx` (2,330 lines) into a container plus `admin/restock/` components (threshold controls, table, reorder draft, goods receipt, customer follow-up, stock history).
- Centralised browser storage in `src/lib/storage.ts`: existing keys kept, malformed data is backed up (never silently discarded), and storage failures are reported.
- Centralised business details in `src/config/business.ts`, with unconfirmed values flagged.
- Added a shared accessible dialog behaviour (`useDialog`: Escape, focus trap, focus return, scroll lock).

### Correctness fixes
- **Public price rule** applied everywhere; hidden prices no longer leak through the budget slider and statistics, price sorting, the price-history chart, the price-alert dialog, quotation storage or exports. LKR 0 is never published.
- **Restocking:** reorder drafts are separate from confirmed goods receipts; drafts never change stock; receipts need explicit confirmation, validate quantities, handle unconfirmed starting stock explicitly, and are applied atomically. Purchase cost is separate from selling price; unknown cost stays unknown (the old tool multiplied the *selling* price as "procurement cost").
- **History and identity:** actions are recorded against "Demo session (<role> role)" instead of the first staff member with that role or the invented fallback name "Kasun Perera". Records are written only after a successful update. Direct stock edits (inventory sheet, product editor, stock requests) are now recorded too.
- **Notifications:** removed claims that emails/notifications were sent. Staff "Mark as manually notified", with time and demo role recorded.
- **Support chat:** now an explicitly labelled scripted demo assistant; removed the invented persona, fake Online/Away status, response-time promises, "live warehouse" stock claims, "logged tickets", attachment review claims and the fake "email transcript" feature.
- **Simulated content:** price chart labelled as simulated and only shown for public prices; price-lock guarantee removed; warranty records and reviews labelled as demo samples (real company and distributor names removed); invented stock and prices removed from custom builds; configurator is a request tool with no compatibility claims.
- Removed unconfirmed commitments from quotation documents (14-day validity, free delivery, warranty periods, bank names, VAT statements, registration number) and the conflicting phone/email used by the chat and configurator.
- Customers no longer see exact stock counts (only in stock / out of stock / not confirmed), consistent with the stated rule.
- Quotation quantities are validated; lines are stored without prices and re-priced from the live catalogue.
- Rating summaries no longer show a default "5.0" when there are no reviews.
- "Reset demo data" in the footer now asks for confirmation.

### Data migration (automatic, on first load)
See `docs/PROJECT_HANDOVER.md` → "Browser data migration". Nothing is deleted without a backup.

### Tests
- Added 44 unit tests (Vitest) for the public price rule, restocking/receipts, batch failure handling, purchase cost vs selling price, notification status changes, quotation handling, storage failure handling and data migration.
- Added an optional Playwright browser smoke check (`scripts/browser-smoke-check.mjs`, 33 checks).
