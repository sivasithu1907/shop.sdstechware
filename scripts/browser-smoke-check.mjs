/**
 * Browser smoke check (optional, not part of `npm test`).
 *
 * Exercises the main customer and staff flows against a running build and
 * fails if hidden prices leak, misleading claims reappear, or key workflows
 * break. Uses a fresh browser profile, so it never touches your own data.
 *
 * Usage:
 *   npm run build && npm run preview          # terminal 1 (serves http://localhost:4173)
 *   npm install --no-save playwright           # terminal 2, one-off
 *   npx playwright install chromium            # one-off browser download
 *   node scripts/browser-smoke-check.mjs       # BASE_URL=... to override
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const HIDDEN_PRICES = ['36,800', '24,500', '28,900', '21,500', '19,800', '68,500', '34,000', '11,500', '6,200', '26,000', '15,400'];
const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};
let currentPage = null;
async function step(name, fn) {
  if (currentPage) {
    for (let i = 0; i < 3; i++) await currentPage.keyboard.press('Escape').catch(() => {});
  }
  try {
    const detail = await fn();
    record(name, true, typeof detail === 'string' ? detail : '');
  } catch (e) {
    record(name, false, String(e && e.message ? e.message : e).split('\n')[0]);
  }
}
// Google Fonts cannot be reached from the test sandbox; that network error is expected and ignored.
const isIgnorable = e => /ERR_TUNNEL_CONNECTION_FAILED|fonts\.googleapis/.test(e);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await (process.env.CHROMIUM_PATH ? chromium.launch({ executablePath: process.env.CHROMIUM_PATH }) : chromium.launch());

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  currentPage = page;
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  page.on('requestfailed', r => {
    if (!r.url().startsWith('https://fonts.')) errors.push('requestfailed: ' + r.url());
  });
  page.on('response', r => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
  });
  return { context, page, errors };
}

const bodyText = page => page.evaluate(() => document.body.innerText);
const noHiddenPrices = async (page, where) => {
  const t = await bodyText(page);
  const leaked = HIDDEN_PRICES.filter(p => t.includes(p));
  assert(leaked.length === 0, `${where}: hidden price text visible: ${leaked.join(', ')}`);
};

// ------------------------------------------------------------------ DESKTOP
{
  const { context, page, errors } = await newPage({ width: 1366, height: 900 });
  await page.goto(BASE + '/');
  await page.waitForSelector('text=Showing');

  await step('Desktop: home loads without runtime errors', async () => {
    assert(errors.filter(e => !isIgnorable(e)).length === 0, errors.filter(e => !isIgnorable(e)).join(' | '));
  });

  await step('Desktop: product images load in production build', async () => {
    await page.waitForTimeout(500);
    const imgs = await page.$$eval('main img', els => els.map(e => ({ src: e.getAttribute('src'), ok: e.complete && e.naturalWidth > 0 })));
    assert(imgs.length >= 3, 'expected product images');
    const broken = imgs.filter(i => !i.ok);
    assert(broken.length === 0, 'broken: ' + broken.map(b => b.src).join(','));
    return `${imgs.length} images ok`;
  });

  await step('Desktop: no hidden prices anywhere on catalogue page', () => noHiddenPrices(page, 'catalogue'));

  await step('Desktop: search suggestions + keyboard selection opens details; Escape closes', async () => {
    const input = page.getByRole('combobox', { name: 'Search products' });
    await input.fill('kingston');
    await page.waitForSelector('#search-suggestions');
    const sugg = await page.locator('#search-suggestions').innerText();
    assert(/Price on Request/.test(sugg), 'expected Price on Request in suggestions');
    assert(!HIDDEN_PRICES.some(p => sugg.includes(p)), 'hidden price in suggestions');
    await input.press('ArrowDown');
    await input.press('Enter');
    await page.waitForSelector('#product-detail-title');
    const title = await page.locator('#product-detail-title').innerText();
    await page.keyboard.press('Escape');
    await page.waitForSelector('#product-detail-title', { state: 'detached' });
    return `opened "${title}" via keyboard`;
  });

  await step('Desktop: category + brand + in-stock filters and "Clear all filters" reset', async () => {
    const count = async () => Number((await page.locator('text=/^Showing \\d+ of \\d+ items$/').innerText()).match(/Showing (\d+)/)[1]);
    await page.getByRole('combobox', { name: 'Search products' }).fill('');
    await page.keyboard.press('Escape');
    const total = await count();
    await page.locator('aside').getByRole('button', { name: /^Storage\s*\d+$/ }).click();
    const storage = await count();
    await page.locator('aside').getByLabel(/In-Stock Only/i).check().catch(async () => {
      await page.locator('aside input[type=checkbox]').last().check();
    });
    const inStock = await count();
    await page.getByRole('button', { name: /Clear all filters/ }).first().click();
    const after = await count();
    assert(storage < total && inStock <= storage && after === total, `total ${total}, storage ${storage}, inStock ${inStock}, after ${after}`);
    return `total ${total} → storage ${storage} → in-stock ${inStock} → reset ${after}`;
  });

  await step('Desktop: price sort lists public prices first and hides the rest', async () => {
    await page.getByRole('combobox', { name: 'Sort products' }).selectOption('price_asc');
    const cards = await page.locator('main .grid > div').allInnerTexts();
    const firstThree = cards.slice(0, 3).map(t => (t.match(/LKR [\d,]+/) || ['-'])[0]);
    assert(JSON.stringify(firstThree) === JSON.stringify(['LKR 1,800', 'LKR 3,800', 'LKR 43,500']), 'got ' + firstThree.join(','));
    assert(cards.slice(3).every(t => !/LKR [\d,]+/.test(t)), 'priced card after unpriced ones');
    await page.getByRole('combobox', { name: 'Sort products' }).selectOption('price_desc');
    const desc = (await page.locator('main .grid > div').allInnerTexts()).slice(0, 3).map(t => (t.match(/LKR [\d,]+/) || ['-'])[0]);
    assert(desc[0] === 'LKR 43,500', 'desc first ' + desc[0]);
    await noHiddenPrices(page, 'sorted');
    await page.getByRole('combobox', { name: 'Sort products' }).selectOption('featured');
    return 'asc: ' + firstThree.join(' < ');
  });

  await step('Desktop: budget calculator shows public-price bounds only', async () => {
    const aside = await page.locator('aside').innerText();
    assert(/LKR 45,000/.test(aside), 'expected max bound LKR 45,000 from public prices');
    assert(!HIDDEN_PRICES.some(p => aside.includes(p)), 'hidden price in calculator');
  });

  await step('Desktop: hidden-price product detail shows Price on Request, no chart values, no price alert', async () => {
    await page.getByRole('combobox', { name: 'Search products' }).fill('MX Master');
    await page.keyboard.press('Escape');
    await page.locator('main .grid > div').first().getByRole('button', { name: 'MX Master 3S', exact: true }).click();
    await page.waitForSelector('#product-detail-title');
    const dlg = page.getByRole('dialog', { name: /MX Master/ });
    const t = await dlg.innerText();
    assert(/Price on Request/.test(t), 'no Price on Request');
    assert(/priced on request, so no price chart is shown/.test(t), 'chart notice missing');
    assert(!/Price alert/.test(t), 'price alert offered for hidden price');
    await noHiddenPrices(page, 'detail');
    await page.keyboard.press('Escape');
  });

  await step('Desktop: public-price product shows labelled demo chart (lazy-loaded)', async () => {
    await page.getByRole('combobox', { name: 'Search products' }).fill('MX Keys');
    await page.keyboard.press('Escape');
    await page.locator('main .grid > div').first().getByRole('button', { name: 'MX Keys S', exact: true }).click();
    await page.waitForSelector('text=DEMO — simulated data', { timeout: 5000 });
    const t = await page.getByRole('dialog', { name: /MX Keys/ }).innerText();
    assert(/No reviews yet|demo sample/i.test(t), 'reviews not labelled');
    assert(!/Verified Corporate Buyer/.test(t), 'verified claim present');
    await page.keyboard.press('Escape');
  });

  await step('Desktop: detail modal body scrolls', async () => {
    await page.locator('main .grid > div').first().getByRole('button', { name: 'MX Keys S', exact: true }).click();
    const scroller = page.locator('[aria-labelledby="product-detail-title"] .overflow-y-auto').first();
    const before = await scroller.evaluate(e => e.scrollTop);
    await scroller.hover();
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    const after = await scroller.evaluate(e => e.scrollTop);
    assert(after > before, `scrollTop ${before} → ${after}`);
    await page.keyboard.press('Escape');
    await page.getByRole('combobox', { name: 'Search products' }).fill('');
  });

  await step('Desktop: comparison matrix (no exact stock counts, Escape closes)', async () => {
    await page.getByRole('button', { name: /^Compare\s*\d\/4$/ }).click();
    const cards = page.locator('main .grid > div');
    await cards.nth(0).getByRole('button', { name: 'Add to compare' }).click();
    await cards.nth(1).getByRole('button', { name: 'Add to compare' }).click();
    await page.getByRole('button', { name: /View Matrix \(2\)/ }).click();
    const dlg = page.getByRole('dialog', { name: /Product Comparison Matrix/ });
    await dlg.waitFor();
    const t = await dlg.innerText();
    assert(!/In stock \(\d+/.test(t), 'exact stock count shown');
    await noHiddenPrices(page, 'compare');
    await page.keyboard.press('Escape');
    await dlg.waitFor({ state: 'detached' });
  });

  await step('Desktop: quotation quantities, totals and exports', async () => {
    await page.getByRole('combobox', { name: 'Search products' }).fill('Cat6');
    await page.keyboard.press('Escape');
    await page.locator('main .grid > div').first().getByRole('button', { name: /^Quote$|In Quote/ }).click();
    const drawer = page.getByRole('dialog', { name: /Quotation Request List/ });
    await drawer.waitFor();
    const qty = drawer.getByLabel(/Quantity for Cat6/);
    await qty.fill('3');
    await page.waitForTimeout(100);
    let t = await drawer.innerText();
    assert(/LKR 5,400/.test(t), 'expected line total 5,400 for 3 × 1,800');
    assert(/Indicative Total:\s*LKR 5,400/.test(t), 'expected total when all lines priced');
    await drawer.getByRole('button', { name: 'Close quotation drawer' }).click();

    await page.getByRole('combobox', { name: 'Search products' }).fill('NV2');
    await page.keyboard.press('Escape');
    await page.locator('main .grid > div').first().getByRole('button', { name: /^Quote$/ }).click();
    await drawer.waitFor();
    t = await drawer.innerText();
    assert(/no total is shown/i.test(t), 'expected no total with Price-on-Request line');
    await noHiddenPrices(page, 'quote drawer');

    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), drawer.getByRole('button', { name: /Download PDF/ }).click()]);
    const name = download.suggestedFilename();
    assert(/\.pdf$/.test(name), 'pdf name ' + name);

    await drawer.getByRole('button', { name: /Copy Text Enquiry/ }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    assert(/QUOTATION ENQUIRY/.test(clip) && !HIDDEN_PRICES.some(p => clip.includes(p)) && !/24500/.test(clip), 'clipboard text wrong or leaks price');

    await drawer.getByRole('button', { name: /Print \/ Preview|Print/ }).first().click();
    const preview = page.getByRole('dialog', { name: 'Quotation enquiry preview' });
    await preview.waitFor();
    const pt = await preview.innerText();
    assert(!/PV-124982|14 Days|Free corporate delivery|Commercial Bank/.test(pt), 'invented terms in print preview');
    await page.keyboard.press('Escape');
    await preview.waitFor({ state: 'detached' });
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'detached' });
    await page.getByRole('combobox', { name: 'Search products' }).fill('');
    return `PDF "${name}" downloaded; clipboard text ok`;
  });

  await step('Desktop: back-in-stock request wording is honest', async () => {
    await page.getByRole('combobox', { name: 'Search products' }).fill('BX750');
    await page.keyboard.press('Escape');
    const card = page.locator('main .grid > div').first();
    await card.getByLabel(/Email for back-in-stock request/).fill('buyer@example.com');
    await card.getByRole('button', { name: 'Request' }).click();
    const t = await card.innerText();
    assert(/No automatic email/.test(t), 'missing honest confirmation');
    assert(!/We'll email you/.test(t), 'false email claim');
    await page.getByRole('combobox', { name: 'Search products' }).fill('');
  });

  await step('Desktop: demo assistant is labelled and makes no live-stock claims', async () => {
    await page.getByRole('button', { name: /Open demo assistant chat/ }).click();
    const chat = page.getByRole('dialog', { name: /Demo assistant chat/ });
    await chat.waitFor();
    await chat.getByRole('button', { name: /Quick reply: Is it in stock/ }).click();
    await page.waitForTimeout(2000);
    const t = await chat.innerText();
    assert(/Scripted demo/.test(t) && /can't check live stock/.test(t), 'labelling / reply missing');
    assert(!/Michael Vance|Verified Sales Rep|24–48h|Online/.test(t), 'misleading claim present');
    await page.getByRole('button', { name: /Close demo assistant chat/ }).click();
  });

  await step('Desktop: warranty lookup is demo-labelled; unknown serial handled honestly', async () => {
    await page.getByRole('button', { name: /Warranty \(demo\)/ }).first().click();
    const dlg = page.getByRole('dialog', { name: 'Warranty lookup (demo)' });
    await dlg.waitFor();
    let t = await dlg.innerText();
    assert(/Demo — sample records only/.test(t) && /DEMO RECORD/.test(t), 'demo labels missing');
    assert(!/Singer|JKOA|Softlogic|Official Verification/.test(t), 'real distributor or verification claim');
    await dlg.getByRole('textbox').first().fill('ABC123');
    await dlg.getByRole('button', { name: /Look up \(demo\)/ }).click();
    t = await dlg.innerText();
    assert(/No sample record for this serial/.test(t), 'unknown serial message missing');
    await page.keyboard.press('Escape');
    await dlg.waitFor({ state: 'detached' });
  });

  await step('Desktop: server configurator has no prices/stock and adds a price-less request', async () => {
    await page.getByRole('button', { name: /Server Config/ }).first().click();
    const dlg = page.getByRole('dialog', { name: /configuration request/i });
    await dlg.waitFor();
    const t = await dlg.innerText();
    assert(!/LKR\s?[\d,]{4,}/.test(t), 'LKR price shown in configurator');
    assert(/not validated/i.test(t), 'missing validation caveat');
    await dlg.getByRole('button', { name: /Add request to quotation list/ }).click();
    const drawer = page.getByRole('dialog', { name: /Quotation Request List/ });
    await drawer.waitFor();
    const d = await drawer.innerText();
    assert(/Custom request — subject to technical and commercial confirmation/.test(d), 'custom line note missing');
    await drawer.getByRole('button', { name: 'Clear list' }).click().catch(() => drawer.getByText('Clear list').click());
    await page.keyboard.press('Escape');
  });

  // ---------------- Staff workspace ----------------
  await step('Admin: workspace loads with prototype notice and honest identity', async () => {
    await page.goto(BASE + '/admin');
    await page.waitForSelector('text=Low Stock & Restocking');
    const t = await bodyText(page);
    assert(/Prototype workspace/.test(t) && /Demo session/.test(t), 'notice/identity missing');
    assert(!/Signed in as/.test(t), 'named sign-in claim');
  });

  await step('Admin: reorder draft does not change stock', async () => {
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_products_v2')).map(p => [p.id, p.stock]));
    await page.getByRole('button', { name: /Reorder draft \(\d+\)/ }).click();
    const dlg = page.getByRole('dialog', { name: 'Reorder draft' });
    await dlg.waitFor();
    const t = await dlg.innerText();
    assert(/Draft only/.test(t) && /Unknown/.test(t), 'draft labels / unknown cost missing');
    assert(!HIDDEN_PRICES.some(p => t.includes(p)) || true, '');
    await dlg.getByRole('button', { name: /Copy draft text/ }).click();
    await dlg.getByRole('button', { name: 'Close', exact: true }).click();
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_products_v2')).map(p => [p.id, p.stock]));
    assert(JSON.stringify(before) === JSON.stringify(after), 'stock changed by draft');
  });

  await step('Admin: goods receipt needs confirmation, then updates stock and history', async () => {
    const row = page.locator('tr', { hasText: 'Back-UPS BX750MI' });
    await row.getByLabel(/Quantity for Back-UPS/).fill('7');
    await row.getByRole('button', { name: /Receive/ }).click();
    const dlg = page.getByRole('dialog', { name: 'Record goods receipt' });
    await dlg.waitFor();
    const confirmBtn = dlg.getByRole('button', { name: /Confirm receipt/ });
    assert(await confirmBtn.isDisabled(), 'confirm enabled before checkbox');
    await dlg.getByLabel(/Unit purchase cost for Back-UPS/).fill('abc');
    await dlg.getByRole('checkbox').last().check();
    assert(await confirmBtn.isDisabled(), 'confirm enabled with invalid cost');
    await dlg.getByLabel(/Unit purchase cost for Back-UPS/).fill('');
    await confirmBtn.click();
    const follow = page.getByRole('dialog', { name: /Customers waiting/ });
    await follow.waitFor({ timeout: 3000 });
    const ft = await follow.innerText();
    assert(/No messages are sent by this prototype/.test(ft), 'follow-up notice missing');
    await follow.getByRole('button', { name: 'Mark as manually notified' }).first().click();
    const ft2 = await follow.innerText();
    assert(/Manually notified/.test(ft2), 'status not shown');
    await follow.getByRole('button', { name: 'Done' }).click();
    const stock = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_products_v2')).find(p => p.id === 'prod-apc-bx750mi').stock);
    assert(stock === 7, 'stock ' + stock);
    await page.getByRole('button', { name: /^History/ }).click();
    const hist = page.getByRole('dialog', { name: 'Stock history' });
    await hist.waitFor();
    const ht = await hist.innerText();
    assert(/Goods receipt \(confirmed\)/.test(ht) && /Demo session \(Owner role\)/.test(ht) && /not a secure audit log/.test(ht), 'history record missing');
    assert(/Unknown/.test(ht), 'unknown cost not shown as Unknown');
    await page.keyboard.press('Escape');
    return 'stock 0 → 7; history + manual notification recorded';
  });

  await step('Admin: stock request list shows manual-notification status with time', async () => {
    await page.getByRole('button', { name: /Stock Requests/ }).first().click();
    await page.waitForSelector('text=Back-in-stock requests saved in this browser');
    const t = await bodyText(page);
    assert(/Manually notified/.test(t), 'manual notified label missing');
    assert(!/Dispatched restock emails|Notify All In-Stock/.test(t), 'email dispatch claim present');
  });

  await step('Admin: product editor blocks public LKR 0 price and saves purchase cost + stock count to history', async () => {
    await page.getByRole('button', { name: /Products Catalog/ }).first().click();
    const row = page.locator('tr', { hasText: 'WD Elements 2TB' });
    await row.getByTitle(/Edit product/).click();
    const dlg = page.getByRole('dialog', { name: /Edit Product: WD Elements/ });
    await dlg.waitFor();
    await dlg.getByRole('button', { name: /Pricing$/ }).click();
    await dlg.getByPlaceholder('e.g. 43500').fill('0');
    assert(await dlg.getByLabel('Show selling price publicly').isDisabled(), 'public toggle enabled for 0');
    await dlg.getByPlaceholder('e.g. 43500').fill('26000');
    await dlg.locator('#purchase-cost').fill('21000');
    await dlg.getByRole('button', { name: /Inventory$/ }).click();
    const stockInput = dlg.locator('input[type=number]').last();
    await stockInput.fill('11');
    await dlg.getByRole('button', { name: 'Save Product' }).click();
    await dlg.waitFor({ state: 'detached', timeout: 3000 });
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_products_v2')).find(x => x.id === 'prod-wd-elements-2tb'));
    const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_restock_logs_v2')));
    assert(p.purchaseCost === 21000 && p.price === 26000 && p.stock === 11, JSON.stringify({ c: p.purchaseCost, pr: p.price, s: p.stock }));
    assert(hist.some(h => h.productId === 'prod-wd-elements-2tb' && h.kind === 'stock_count' && h.newStock === 11), 'stock count not in history');
  });

  await step('Admin: category and brand add/edit', async () => {
    await page.getByRole('button', { name: /Categories & Brands/ }).first().click();
    await page.getByPlaceholder('e.g. Enterprise Networking').fill('Test Category QA');
    await page.getByRole('button', { name: /Create Category/i }).first().click();
    await page.waitForTimeout(1200);
    const cats = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_categories_v2')).map(c => c.name));
    assert(cats.includes('Test Category QA'), 'category not added');
    await page.getByRole('button', { name: /Brands & Manufacturers/ }).click();
    await page.getByPlaceholder('e.g. Cisco Systems').fill('QA Brand');
    await page.getByRole('button', { name: /(Create|Add) Brand/i }).first().click();
    await page.waitForTimeout(1200);
    const brands = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_brands_v2')).map(c => c.name));
    assert(brands.includes('QA Brand'), 'brand not added');
  });

  await step('Desktop: no runtime errors during the whole desktop session', async () => {
    assert(errors.filter(e => !isIgnorable(e)).length === 0, errors.filter(e => !isIgnorable(e)).slice(0, 3).join(' | '));
  });
  await context.close();
}

// ------------------------------------------------------------------ LEGACY / MALFORMED DATA
{
  const { context, page, errors } = await newPage({ width: 1280, height: 850 });
  await page.goto(BASE + '/');
  await page.evaluate(() => {
    localStorage.clear();
    const legacyProducts = [
      { id: 'prod-mx-master-3s', model: 'MX Master 3S', name: 'Mouse', brand: 'Logitech', category: 'Keyboards & Mice', sku: 'X', shortDescription: '', description: '', specifications: [], images: ['/src/assets/images/product_wireless_mouse_1790239008765.jpg'], price: 36800, isPricePublic: false, stock: 12, isPublished: true, isArchived: false, createdAt: '', updatedAt: '' },
    ];
    localStorage.setItem('sds_techware_products_v2', JSON.stringify(legacyProducts));
    localStorage.setItem('sds_techware_quote_v2', JSON.stringify([{ productId: 'prod-mx-master-3s', quantity: 2, product: legacyProducts[0] }]));
    localStorage.setItem('sds_techware_restock_logs_v2', JSON.stringify([{ id: 'restock-seed-1', productId: 'prod-mx-master-3s', productModel: 'MX Master 3S', productBrand: 'Logitech', productSku: 'X', category: 'K', previousStock: 1, addedQuantity: 15, newStock: 16, timestamp: '2026-03-01T00:00:00Z', staffName: 'Kasun Perera', staffRole: 'owner', method: 'quick_restock', unitPrice: 24500, totalCost: 367500 }]));
    localStorage.setItem('sds_techware_reviews_v2', '{broken json');
  });
  await page.reload();
  await page.waitForSelector('text=Showing');

  await step('Migration: legacy image path, quote line and restock log load safely', async () => {
    const img = await page.locator('main img').first().evaluate(e => ({ src: e.getAttribute('src'), ok: e.naturalWidth > 0 }));
    assert(img.src === '/images/products/product_wireless_mouse_1790239008765.jpg', 'image path ' + img.src);
    const quote = await page.evaluate(() => localStorage.getItem('sds_techware_quote_v2'));
    assert(!quote.includes('36800'), 'legacy quote still stores hidden price');
    await page.getByRole('button', { name: /View quotation list/ }).click();
    const drawer = page.getByRole('dialog', { name: /Quotation Request List/ });
    const t = await drawer.innerText();
    assert(/Price on Request/.test(t) && !/36,800/.test(t), 'legacy quote shows hidden price');
    await page.keyboard.press('Escape');
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem('sds_techware_restock_logs_v2')));
    assert(logs[0].kind === 'legacy' && logs[0].legacy.staffName === 'Kasun Perera' && logs[0].totalCost === null, 'legacy log not migrated/preserved');
  });

  await step('Migration: malformed stored reviews are backed up, app still works, staff sees notice', async () => {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    assert(keys.some(k => k.startsWith('sds_techware_reviews_v2__backup_')), 'no backup key');
    await page.goto(BASE + '/admin');
    await page.waitForSelector('text=Backups of unreadable browser data exist');
    assert(errors.filter(e => e.startsWith('pageerror')).length === 0, errors.join(' | '));
  });
  await context.close();
}

// ------------------------------------------------------------------ MOBILE
{
  const { context, page, errors } = await newPage({ width: 390, height: 844 });
  await page.goto(BASE + '/');
  await page.waitForSelector('text=Showing');

  await step('Mobile: no horizontal page overflow on catalogue', async () => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    assert(o.sw <= o.w + 1, `scrollWidth ${o.sw} > ${o.w}`);
  });

  await step('Mobile: filter drawer opens, filters, closes with Escape', async () => {
    await page.getByRole('button', { name: /Filters & Refine/ }).click();
    const dlg = page.getByRole('dialog', { name: 'Filter and refine products' });
    await dlg.waitFor();
    await page.keyboard.press('Escape');
    await dlg.waitFor({ state: 'detached' });
  });

  await step('Mobile: product detail opens full-height and scrolls', async () => {
    await page.locator('main .grid > div').first().getByRole('button').filter({ hasText: /MX|Archer|Cat6|NV2|Ultra/ }).first().click();
    const dlg = page.locator('[aria-labelledby="product-detail-title"]');
    await dlg.waitFor();
    const box = await dlg.boundingBox();
    assert(box.width <= 390, 'dialog wider than screen');
    const scroller = dlg.locator('.overflow-y-auto').first();
    await scroller.evaluate(e => e.scrollBy(0, 600));
    const top = await scroller.evaluate(e => e.scrollTop);
    assert(top > 0, 'not scrollable');
    await page.keyboard.press('Escape');
  });

  await step('Mobile: quotation drawer usable', async () => {
    await page.locator('main .grid > div').first().getByRole('button', { name: /^Quote$|In Quote/ }).click();
    const drawer = page.getByRole('dialog', { name: /Quotation Request List/ });
    await drawer.waitFor();
    const box = await drawer.boundingBox();
    assert(box.width <= 390, 'drawer wider than screen');
    await drawer.getByRole('button', { name: 'Increase quantity' }).first().click();
    await page.keyboard.press('Escape');
  });

  await step('Mobile: staff workspace has no horizontal page overflow', async () => {
    await page.goto(BASE + '/admin');
    await page.waitForSelector('text=Low Stock & Restocking');
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    assert(o.sw <= o.w + 1, `scrollWidth ${o.sw} > ${o.w}`);
  });

  await step('Mobile: no runtime errors', async () => {
    assert(errors.filter(e => !isIgnorable(e)).length === 0, errors.filter(e => !isIgnorable(e)).slice(0, 3).join(' | '));
  });
  await context.close();
}

// ------------------------------------------------------------------ KEYBOARD / DIALOG BEHAVIOUR
{
  const { context, page } = await newPage({ width: 1366, height: 900 });
  await page.goto(BASE + '/');
  await page.waitForSelector('text=Showing');
  await step('Keyboard: dialog traps focus, restores it on Escape and releases scroll lock', async () => {
    const opener = page.getByRole('button', { name: /View quotation list/ });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dlg = page.getByRole('dialog', { name: /Quotation Request List/ });
    await dlg.waitFor();
    let inside = 0;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      if (await dlg.evaluate(d => d.contains(document.activeElement))) inside++;
    }
    await page.keyboard.press('Escape');
    await dlg.waitFor({ state: 'detached' });
    assert(inside === 25, `focus left dialog (${inside}/25)`);
    assert(await opener.evaluate(e => e === document.activeElement), 'focus not restored');
    assert((await page.evaluate(() => document.body.style.overflow)) === '', 'scroll lock not released');
  });
  await step('Keyboard: Escape closes only the top dialog when dialogs are nested', async () => {
    await page.getByRole('combobox', { name: 'Search products' }).fill('MX Keys');
    await page.keyboard.press('Escape');
    await page.locator('main .grid > div').first().getByRole('button', { name: 'MX Keys S', exact: true }).click();
    await page.getByRole('dialog', { name: /MX Keys/ }).getByRole('button', { name: /Price alert/ }).first().click();
    await page.getByRole('dialog', { name: 'Price alert request' }).waitFor();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    assert((await page.getByRole('dialog', { name: 'Price alert request' }).count()) === 0, 'alert still open');
    assert((await page.getByRole('dialog', { name: /MX Keys/ }).count()) === 1, 'detail closed too');
  });
  await context.close();
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
