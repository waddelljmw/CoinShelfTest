/* Step 8.3: Reports (Seller Mode). Pick a month, quarter or year. Business sales, cost of coins sold, fees, shipping, show costs,
   profit, sales tax collected (kept apart), Business stock, per-platform totals for 1099-K checks, and a Schedule C style summary.
   Personal sales are listed apart. Saved as a printable page (print or save as PDF) and as a spreadsheet (CSV). Inherited coins never count. */

const repPeriod = (() => { const t = today(); return { kind: "month", y: +t.slice(0, 4), n: +t.slice(5, 7) }; })();
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad2 = (n) => String(n).padStart(2, "0");
// First and last day of the chosen period, as YYYY-MM-DD text.
function repRange(p) {
  if (p.kind === "year") return { start: `${p.y}-01-01`, end: `${p.y}-12-31`, label: String(p.y) };
  if (p.kind === "quarter") { const m1 = (p.n - 1) * 3 + 1, m3 = m1 + 2; return { start: `${p.y}-${pad2(m1)}-01`, end: `${p.y}-${pad2(m3)}-${pad2(new Date(p.y, m3, 0).getDate())}`, label: `Q${p.n} ${p.y} (${MONTH_NAMES[m1 - 1].slice(0, 3)} to ${MONTH_NAMES[m3 - 1].slice(0, 3)})` }; }
  return { start: `${p.y}-${pad2(p.n)}-01`, end: `${p.y}-${pad2(p.n)}-${pad2(new Date(p.y, p.n, 0).getDate())}`, label: `${MONTH_NAMES[p.n - 1]} ${p.y}` };
}
const REP_1099 = new Set(["Whatnot", "eBay", "eBay Live"]);
const soldTotals = (list) => {
  const t = { n: sum(list, qtyOf), sales: 0, ship: 0, tax: 0, cost: 0, fees: 0, shipPaid: 0 };
  list.forEach((c) => { const s = c.sold; t.sales += num(s.amount) || 0; t.ship += num(s.shipCharged) || 0; t.tax += num(s.salesTax) || 0; t.cost += costOf(c) || 0; t.fees += num(s.fees) || 0; t.shipPaid += (num(s.shipping) || 0) + (num(s.insurance) || 0); });
  Object.keys(t).forEach((k) => { t[k] = r2(t[k]); });
  t.receipts = r2(t.sales + t.ship);
  return t;
};

// Everything the report shows, worked out from the saved coins and shows.
function repData(p) {
  const r = repRange(p);
  const sold = soldCoins().filter((c) => c.sold && !isInherited(c) && String(c.sold.date || "").slice(0, 10) >= r.start && String(c.sold.date || "").slice(0, 10) <= r.end);
  const biz = sold.filter(isBiz), pers = sold.filter((c) => !isBiz(c));
  const shows = allShows().filter((s) => String(s.start || "").slice(0, 10) >= r.start && String(s.start || "").slice(0, 10) <= r.end);
  const showCost = {}; SHOW_COSTS.forEach(([k]) => { showCost[k] = r2(sum(shows, (s) => num(s.costs && s.costs[k]))); });
  const showTotal = r2(sum(Object.values(showCost), (x) => x));
  const t = soldTotals(biz);
  const profit = r2(t.receipts - t.cost - t.fees - t.shipPaid - showTotal);
  // Platforms (Business sales only). Gross includes shipping and sales tax, the way platforms report it on a 1099-K.
  const plat = {};
  biz.forEach((c) => { const k = c.sold.whereType || "Not recorded"; (plat[k] = plat[k] || []).push(c); });
  const platforms = Object.keys(plat).sort().map((k) => { const x = soldTotals(plat[k]); return { name: k, n: x.n, gross: r2(x.receipts + x.tax), fees: x.fees, check: REP_1099.has(k) }; });
  // Business stock at the end of the period, at cost: held then = still owned now, or sold after the period ended; bought on or before the end (no date = counted).
  const heldThen = (c) => !c.acquired || String(c.acquired).slice(0, 10) <= r.end;
  const stockCoins = [...bizCoins(), ...soldCoins().filter((c) => isBiz(c) && !isInherited(c) && c.sold && String(c.sold.date || "").slice(0, 10) > r.end)].filter(heldThen);
  const stockCost = r2(sum(stockCoins, (c) => costOf(c) || 0));
  const stockNow = r2(sum(bizCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)));
  // Schedule C style groups.
  const sc = { receipts: t.receipts, cogs: t.cost, gross: r2(t.receipts - t.cost), fees: t.fees, shipping: t.shipPaid, table: showCost.table, travel: r2(showCost.gas + showCost.hotel), meals: showCost.food, other: showCost.other };
  sc.expenses = r2(sc.fees + sc.shipping + sc.table + sc.travel + sc.meals + sc.other);
  sc.net = r2(sc.gross - sc.expenses);
  return { r, biz, pers, shows, showCost, showTotal, t, profit, platforms, stockCost, stockNow, sc, persT: soldTotals(pers) };
}

/* ---- the numbers as label/value lists (shared by the screen and the printable page) ---- */
function repSections(d, fm) {
  const { t, sc } = d;
  return [
    ["Summary", [["Items sold", String(t.n)], ["Sales", fm(t.sales)], ["Shipping charged", fm(t.ship)], ["Cost of coins sold", fm(t.cost)], ["Platform fees", fm(t.fees)],
      ["Shipping and insurance paid", fm(t.shipPaid)], ["Show costs", fm(d.showTotal)], ["Profit", fm(d.profit), "b"]]],
    ["Sales tax collected (not income; kept apart)", [["Sales tax collected", fm(t.tax)]]],
    ["Business stock", [["At cost, at the end of the period", fm(d.stockCost)], ["Value today (Red Book, melt or your value)", fm(d.stockNow)]]],
    ["Schedule C style summary", [["Gross receipts (sales + shipping charged)", fm(sc.receipts)], ["Cost of goods sold", fm(sc.cogs)], ["Gross profit", fm(sc.gross), "b"],
      ["Commissions and fees", fm(sc.fees)], ["Shipping and insurance", fm(sc.shipping)], ["Show table fees", fm(sc.table)], ["Travel (gas, mileage, hotel)", fm(sc.travel)],
      ["Meals", fm(sc.meals)], ["Other show costs", fm(sc.other)], ["Total expenses", fm(sc.expenses)], ["Net profit", fm(sc.net), "b"]]],
  ];
}
const REP_NOTES = ["Figures come from the sales you recorded in Coin Cabinet. This is a summary for your records, not tax advice; check it with your accountant.",
  "Platform gross includes shipping charged and sales tax, the way platforms usually report on a 1099-K. Compare with the form from the platform; small differences (refunds, timing) are normal.",
  "Show costs count in the period the show started. Meals are shown in full here; ask your accountant how much counts. Mileage is only what you typed in as Gas / mileage.",
  "Business stock at cost counts coins you still own plus coins sold after the period ended, bought on or before its last day (coins with no date acquired are counted)."];

/* ---- in the app ---- */
function viewReports() {
  if (!sellerOn()) return `<h1>Reports</h1><div class="card empty">Reports are part of Seller Mode. Turn it on in <button class="link-btn" data-go="options">Options</button>.</div>`;
  const d = repData(repPeriod), p = repPeriod;
  const sec = ([title, rows]) => `<div class="card"><b>${esc(title)}</b>${rows.map(([k, v, b]) => `<div class="rowline"><span>${esc(k)}</span><span class="num">${b ? `<b>${v}</b>` : v}</span></div>`).join("")}</div>`;
  const kinds = [["month", "Month"], ["quarter", "Quarter"], ["year", "Year"]];
  const plat = d.platforms.length ? `<div class="card"><b>By platform</b><div class="small muted">Gross includes shipping and sales tax. For 1099-K checks.</div>
      ${d.platforms.map((x) => `<div class="rowline"><span>${esc(x.name)} <span class="muted small">${x.n} sold${x.check ? " · check 1099-K" : ""}</span></span><span class="num">${money(x.gross)} <span class="muted small">fees ${money(x.fees)}</span></span></div>`).join("")}</div>` : "";
  const pers = d.pers.length ? `<div class="card"><b>Personal sales (not business)</b><div class="small muted">Kept apart; not in the totals above.</div>
      <div class="rowline"><span>${d.persT.n} sold for</span><span class="num">${money(d.persT.sales)}</span></div><div class="rowline"><span>What you paid</span><span class="num">${money(d.persT.cost)}</span></div>
      <div class="rowline"><span>Fees and shipping paid</span><span class="num">${money(r2(d.persT.fees + d.persT.shipPaid))}</span></div></div>` : "";
  return `<h1>Reports</h1>
    <div class="btn-row">${kinds.map(([k, l]) => `<button class="btn ${p.kind === k ? "on-btn" : ""}" data-act="repKind" data-v="${k}">${l}</button>`).join("")}</div>
    <div class="rowline" style="margin:10px 0"><button class="btn" data-act="repShift" data-v="-1" aria-label="Earlier">◀</button><b>${esc(d.r.label)}</b><button class="btn" data-act="repShift" data-v="1" aria-label="Later">▶</button></div>
    ${d.t.n || d.showTotal ? "" : `<div class="card empty">No Business sales in this period.</div>`}
    ${repSections(d, money).map(sec).join("").replace(/<div class="card"><b>Schedule C/, (m) => plat + m)}
    ${pers}
    <div class="btn-row"><button class="btn primary" data-act="repPrint">Printable page</button><button class="btn" data-act="repCsv">Spreadsheet (CSV)</button></div>
    ${REP_NOTES.map((n) => `<p class="small muted">${esc(n)}</p>`).join("")}`;
}

/* ---- the printable page ---- */
const fmPlain = (n) => (n == null || isNaN(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD" }));
function buildSalesReportHtml(d) {
  const p = sellerProfile();
  const tbl = ([title, rows]) => `<h2>${esc(title)}</h2><table>${rows.map(([k, v, b]) => `<tr><td>${esc(k)}</td><td class="r">${b ? `<b>${v}</b>` : v}</td></tr>`).join("")}</table>`;
  const sections = repSections(d, fmPlain);
  const platRows = d.platforms.map((x) => `<tr><td>${esc(x.name)}${x.check ? " (compare with 1099-K)" : ""}</td><td class="r">${x.n}</td><td class="r">${fmPlain(x.gross)}</td><td class="r">${fmPlain(x.fees)}</td></tr>`).join("");
  const line = (c) => `<tr><td>${esc(c.sold.date || "")}</td><td>${esc(labelOf(c))}${qtyOf(c) > 1 ? " ×" + qtyOf(c) : ""}</td><td>${esc(whereText(c.sold))}</td><td class="r">${fmPlain(num(c.sold.amount))}</td><td class="r">${fmPlain(saleProfit(c))}</td></tr>`;
  const sortByDate = (l) => [...l].sort((a, b) => String(a.sold.date).localeCompare(String(b.sold.date)));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sales report ${esc(d.r.label)}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body { font: 14px/1.4 -apple-system, Segoe UI, Roboto, sans-serif; color: #222; max-width: 760px; margin: 16px auto; padding: 0 12px; }
  h1 { font-size: 22px; margin: 0 0 2px; } h2 { font-size: 16px; margin: 18px 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 3px 4px; border-bottom: 1px solid #eee; text-align: left; } th { font-size: 12px; color: #555; } .r { text-align: right; }
  .sub { color: #555; margin-bottom: 8px; } .note { font-size: 12px; color: #555; margin-top: 14px; }
  .print { margin: 0 0 12px; padding: 8px 14px; border: 1px solid #9a6b1f; background: #9a6b1f; color: #fff; border-radius: 8px; font-size: 14px; cursor: pointer; }
  @media print { .print { display: none; } @page { margin: 14mm; } }
</style></head><body><button class="print" onclick="window.print()">Print or save as PDF</button>
<h1>Sales report: ${esc(d.r.label)}</h1>
<div class="sub">${esc(p.name || "Coin Cabinet")}${p.ein ? " · ID " + esc(p.ein) : ""}${p.address ? " · " + esc(p.address) : ""}${p.permit ? " · Sales-tax permit " + esc(p.permit) : ""}<br>Made ${esc(today())}</div>
${sections.slice(0, 3).map(tbl).join("")}
${platRows ? `<h2>By platform</h2><table><tr><th>Platform</th><th class="r">Sold</th><th class="r">Gross</th><th class="r">Fees</th></tr>${platRows}</table>` : ""}
${tbl(sections[3])}
${d.biz.length ? `<h2>Business sales</h2><table><tr><th>Date</th><th>Item</th><th>Where</th><th class="r">Sold for</th><th class="r">Profit</th></tr>${sortByDate(d.biz).map(line).join("")}</table>` : ""}
${d.pers.length ? `<h2>Personal sales (not business, not in the totals)</h2><table><tr><th>Date</th><th>Item</th><th>Where</th><th class="r">Sold for</th><th class="r">Profit</th></tr>${sortByDate(d.pers).map(line).join("")}</table>` : ""}
<div class="note">${REP_NOTES.map((n) => `<p>${esc(n)}</p>`).join("")}</div></body></html>`;
}

/* ---- the spreadsheet: one row per sale, then the summary ---- */
function buildSalesReportCsv(d) {
  const cols = ["Type", "Date", "Item", "Qty", "Where", "Show", "Sold for", "Shipping charged", "Sales tax collected", "Platform fees", "Shipping paid", "Insurance", "Cost", "Profit"];
  const line = (type) => (c) => { const s = c.sold, sh = s.showId && typeof getShow === "function" ? getShow(s.showId) : null; return [type, s.date, labelOf(c), qtyOf(c), whereText(s), sh ? sh.name : "", num(s.amount), num(s.shipCharged), num(s.salesTax), num(s.fees), num(s.shipping), num(s.insurance), costOf(c), saleProfit(c)]; };
  const order = (l) => [...l].sort((a, b) => String(a.sold.date).localeCompare(String(b.sold.date)));
  const rows = [[`Sales report ${d.r.label}`], cols, ...order(d.biz).map(line("Business")), ...order(d.pers).map(line("Personal")), [],
    ...repSections(d, (n) => n).flatMap(([title, list]) => [[title], ...list.map(([k, v]) => [k, v])]),
    ["By platform (gross includes shipping and sales tax)"], ["Platform", "Sold", "Gross", "Fees"], ...d.platforms.map((x) => [x.name, x.n, x.gross, x.fees])];
  return rows.map((r) => r.map((v) => csvCell(v)).join(",")).join("\n");
}
async function saveRepFile(name, data) {
  if (downloadsApi) {
    try { await downloadsApi.save({ filename: name, data }); return true; } catch (e) { if (e && e.code === "declined") return false; }
  }
  toast("Saving files isn't available here. Open Coin Cabinet from Claude to save it.");
  return false;
}

Object.assign(actions, {
  repKind: (el) => { repPeriod.kind = el.dataset.v; if (repPeriod.kind === "quarter") repPeriod.n = Math.min(4, Math.ceil(repPeriod.n / 3) || 1); render(); },
  repShift: (el) => {
    const v = +el.dataset.v, p = repPeriod;
    if (p.kind === "year") p.y += v;
    else { const top = p.kind === "quarter" ? 4 : 12; p.n += v; if (p.n < 1) { p.n = top; p.y--; } else if (p.n > top) { p.n = 1; p.y++; } }
    render();
  },
  repPrint: async () => { if (await saveRepFile("coin-cabinet-sales-" + repRange(repPeriod).label.split(" (")[0].replace(/\s+/g, "-") + ".html", buildSalesReportHtml(repData(repPeriod)))) toast("Saved. Open it, then print or save as PDF."); },
  repCsv: async () => { if (await saveRepFile("coin-cabinet-sales-" + repRange(repPeriod).label.split(" (")[0].replace(/\s+/g, "-") + ".csv", buildSalesReportCsv(repData(repPeriod)))) toast("Spreadsheet saved."); },
});
