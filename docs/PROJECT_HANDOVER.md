# Project Handover — SDS Techware Shop (Baseline v1)

Status: **frontend prototype**. Not production-ready. Last updated for Baseline v1 (2026-09-27).

## 1. Architecture

Single-page React 19 app built with Vite 8, TypeScript (strict) and Tailwind CSS 4. No backend. All state persists in the visitor's browser (`localStorage`).

```
UI components (src/components)
   │  read/write through useStore()
   ▼
StoreProvider (src/store/StoreContext.tsx)
   │  composes focused hooks:
   │  useCatalogStore · useInventoryStore · useQuoteStore · useAlertsStore
   │  useBrowsingStore · useReviewsStore · useStaffStore · usePersistentState
   ▼
Pure business logic (src/features/**)  ← unit-tested, no React
   ▼
Browser storage adapter (src/lib/storage.ts)  ← the only code that touches localStorage
```

| Folder | Responsibility |
| --- | --- |
| `src/config/business.ts` | Company name, contacts, location, registration no., quotation wording. Each value has a `confirmed` flag. |
| `src/config/settings.ts` | Limits and defaults (compare max, quantity bounds, low-stock thresholds, image size limits). |
| `src/features/catalog/pricing.ts` | **Public price rule** and all price-dependent helpers (bounds, budget, sorting, statistics, storefront-safe product copies). |
| `src/features/catalog/catalogFilters.ts` | Shared filter/sort used by grid, breadcrumbs and drawer. |
| `src/features/quotation/*` | Quotation lines (stored without prices), totals, enquiry text, PDF. |
| `src/features/inventory/*` | Reorder drafts, goods receipts, stock counts, stock history + legacy migration, thresholds, CSV/text exports. |
| `src/features/alerts/notifications.ts` | Back-in-stock and price requests; manual-notification status transitions. |
| `src/features/staff/actor.ts` | Demo actor identity and role permissions. |
| `src/features/{reviews,support,warranty,configurator}` | Demo content and helpers (clearly labelled). |
| `src/lib/storage.ts` | Safe read/write, validation, backups of unreadable data, failure reporting. |
| `src/hooks/useDialog.ts` | Escape to close (top-most only), focus trap, focus return, scroll lock. |
| `src/components/admin/restock/*` | Low-stock & restocking UI split from the old 2,330-line widget. |
| `src/data/*` | Demo fixtures (sample catalogue, reviews, requests). |

Storefront components only receive **storefront-safe** products (`publishedProducts` / `getStorefrontProduct`): hidden selling prices and purchase costs are removed before they reach the UI.

## 2. Implemented features (working in the prototype)

Customer side:
- Catalogue with category, multi-brand, in-stock and budget filters; clear/reset; sorting (featured, relevance, name, brand, published price).
- Search with suggestions (brands, categories, products), keyboard navigation, recent searches, `/` shortcut.
- Product details, quick view, comparison (up to 4), saved for later.
- Quotation list: quantities, public-price totals (only when every line is priced), PDF download, print preview, copy text, WhatsApp text preview (copy only).
- Back-in-stock request and price-alert request forms (saved locally; nothing is sent).

Staff side (`/admin`, demo roles):
- Products: add/edit/archive/restore/publish, images (URL or upload ≤ 2 MB), specifications, selling price + public toggle, **purchase cost (internal)**, stock.
- Categories and brands with rename cascade and in-use protection.
- Inventory sheet (stock counts recorded in history), customer request list.
- Low stock & restocking: thresholds (global + per category), reorder drafts (copy/print/CSV), confirmed goods receipts, customer follow-up list, stock history with CSV export.
- Team records (demo only), prototype notices (storage problems, backups, unconfirmed business details).

## 3. Demo-only features (clearly labelled in the UI)

| Feature | What it is | What it is not |
| --- | --- | --- |
| Role switcher | Preview of permissions | Authentication / access control |
| Stock history | Browser log of confirmed receipts and counts | Secure audit trail |
| Back-in-stock / price alerts | Locally saved requests | Monitoring, email or SMS |
| "Mark as manually notified" | Record that staff contacted the customer | Message sending |
| Support chat | Keyword-scripted demo assistant | Live chat, AI or ticketing |
| Reviews | Demo samples + unverified browser-local reviews | Moderated / verified reviews |
| Price chart | Simulated curve for public-price items | Real price history or market data |
| Warranty lookup | Fictional sample records | Manufacturer/distributor lookup |
| Server configurator | Configuration **request** builder | Priced quote, stock or compatibility check |
| Team access | Demo staff records | User accounts or invitations |

## 4. Business details awaiting confirmation

Edit `src/config/business.ts`, then set `confirmed: true`. The Staff Workspace overview lists every unconfirmed value.

| Detail | Current value | Notes |
| --- | --- | --- |
| Legal name | SDS Techware (Pvt) Ltd. | From the prototype |
| Established | 2017 ("since 2017" in header) | From the prototype |
| Sales email | sales@sdstechware.lk | **Conflict removed:** chat/configurator used `corporate@sdstechware.com` |
| Phone | +94 75 988 8013 | **Conflict removed:** chat/configurator used `+94 (11) 234-5678` |
| Location | Dehiwala, Sri Lanka | **Conflict removed:** restock tools said "SDS Central Hub, Colombo" |
| Company registration no. | Hidden | Prototype printed `PV-124982` |
| Quotation validity | Hidden | Prototype printed "14 days" |

Removed as unconfirmed commitments (re-add only if true): free Colombo delivery, 1–3 year warranty statement, bank names for payment, VAT/SVAT statements, 30-day price lock, 24/7 hotline, response-time promises, "authorised partner" claims, delivery lead times.

## 5. Decisions made for this baseline (please confirm)

1. **Zero price:** LKR 0 is stored but never shown publicly (treated as Price on Request); the editor disables the public toggle for 0.
2. **Customer stock display:** customers see only "In stock / Out of stock / Availability not confirmed", not exact counts (matches the editor's stated rule; quick view and comparison previously showed counts).
3. **Receipt cost:** when a goods receipt records a unit cost, it becomes the product's "last known purchase cost".
4. **Unconfirmed starting stock:** a receipt for a product with unconfirmed stock requires ticking "set on-hand stock to exactly the received quantity"; otherwise record a stock count first.
5. **History clearing:** only the Owner role can clear stock history, after a confirmation step.
6. **Demo team names:** fresh installs use neutral demo staff (Demo Owner, …) at `example.com`. Existing saved staff lists are kept.
7. **Category thresholds:** the prototype's default overrides (e.g. "Power & UPS", "Displays") do not match the sample category names ("UPS & Power", "Monitors"), so only "Networking" takes effect. Kept to preserve behaviour — align them with real categories.
8. **Price alerts** are offered only for products with a public price.
9. **Intake CSV** from the old toolbar is now the "Draft CSV (receiving checklist)" inside the reorder draft.

## 6. Browser data migration (automatic, on first load)

Storage keys are unchanged (`sds_techware_*_v2`, `sds_low_stock_threshold`, `sds_category_thresholds`, `sds_user_alert_email`, `sds_live_support_*`). Normalisers run on every load and are idempotent.

| Data | Migration |
| --- | --- |
| Products | Image paths `/src/assets/images/…` → `/images/products/…`. Invalid stock (negative/fractional) → unconfirmed. `purchaseCost` added as unknown. |
| Quotation list | Old entries stored a full product copy (including hidden prices). Converted to `{productId, quantity, source, snapshot}` without prices; prices come from the live catalogue. Configurator/warranty/chat lines become price-less custom requests. |
| Restock logs | Kept as "Legacy record". The original record is preserved in `legacy`; its auto-picked staff name and selling-price "cost" are not shown as fact. |
| Reviews | Prototype seed reviews (named real companies) are replaced by anonymised demo versions (helpful votes kept). Browser-written reviews are kept. |
| Stock/price requests | Prototype seed requests (real company email domains) get `@example.com` addresses. Customer-entered requests are untouched. |
| Chat history | The old persona greeting is replaced; old quick actions pointing at non-existent categories are dropped. |
| Unreadable data | Raw text is copied to `<key>__backup_<timestamp>` before defaults are used; staff see a notice listing backups. |

"Reset demo data" (confirmation required) deletes the demo data keys and restores fixtures. Threshold preferences are kept.

## 7. Security and privacy notes

- UI hiding is not a confidentiality boundary. Private prices and purchase costs are present in the browser. The backend phase must return only public prices to anonymous visitors and keep staff data behind authentication.
- Customer emails entered in request forms are stored in the visitor's own browser only.
- No secrets are needed or included. Do not add API keys as `VITE_` variables.

## 8. Known limitations and technical debt

- Several large presentational components remain (e.g. `ProductEditorModal`, `StaffWorkspace`, `CatalogLayout`, `LiveSupportWidget`, 850–1,000 lines each). Logic has been extracted; further UI splitting can be done feature by feature.
- Tailwind classes use hard-coded hex colours instead of theme tokens.
- A few older dialogs (add staff, category/brand edit, archive confirmation, WhatsApp preview) do not yet use the shared `Modal`/`useDialog` behaviour (no Escape/focus trap there yet).
- Google Fonts is loaded from the internet (falls back to system fonts offline).
- No ESLint/Prettier configuration yet; `npm run lint` is an alias of the type check.
- Only desktop Chromium and a mobile viewport were tested automatically; Safari/Firefox and real devices were not tested.

## 9. Recommended next phase

1. Confirm the business details and decisions above.
2. Backend + database (products, categories, brands, stock movements, requests, quotations) with public/private field separation for prices and costs.
3. Authentication and real roles for `/admin`; server-side audit log for stock and price changes.
4. Enquiry submission (email or CRM) with consent, spam protection and delivery tracking; then optional back-in-stock emails.
5. Real product images and catalogue data; remove demo reviews, warranty samples and the simulated chart (or replace with recorded price history).
6. Hosting with SPA fallback for `/admin`, HTTPS, and basic monitoring.
7. Add ESLint + Prettier, component tests for key flows, and CI running `npm run verify`.
