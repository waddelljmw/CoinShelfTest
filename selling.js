/* Basic selling (Phase 7): asking price, For Sale list, the Mark as sold form, fee estimates and profit. */

/* ---- Fee estimates. Rates are editable in Options → Selling (platforms change them).
   Checked Nov 2026: Whatnot coins 4% on the item + 2.9% + 30¢ on the whole order; eBay Coins & Paper Money 13.25% of the whole order + 40¢ (30¢ if $10 or less). Sources vary, so these are estimates. ---- */
const FEE_DEFAULTS = { whatnotPct: 4, whatnotProcPct: 2.9, whatnotProcFlat: 0.3, ebayPct: 13.25, ebayFlat: 0.4, ebayFlatSmall: 0.3 };
const feeRates = () => ({ ...FEE_DEFAULTS, ...(settings().feeRates || {}) });
const r2 = (x) => Math.round(x * 100) / 100;
// Estimated fees for a sale, or null when the place has no fees we can work out.
function estimateFees(where, amount, shipCharged, tax) {
  const a = num(amount) || 0, sh = num(shipCharged) || 0, tx = num(tax) || 0, f = feeRates();
  const whole = a + sh + tx;
  if (!a && !sh) return null;
  if (where === "Whatnot") return r2(a * f.whatnotPct / 100 + whole * f.whatnotProcPct / 100 + f.whatnotProcFlat);
  if (where === "eBay" || where === "eBay Live") return r2(whole * f.ebayPct / 100 + (whole > 10 ? f.ebayFlat : f.ebayFlatSmall));
  return null;
}
// Profit on one sold entry: sold for + shipping charged − what you paid − fees − shipping paid − insurance. Sales tax is not profit.
function saleProfit(c) {
  const s = c.sold || {};
  return r2((num(s.amount) || 0) + (num(s.shipCharged) || 0) - (costOf(c) || 0) - (num(s.fees) || 0) - (num(s.shipping) || 0) - (num(s.insurance) || 0));
}
const saleMoneyIn = (c) => (num(c.sold && c.sold.amount) || 0) + (num(c.sold && c.sold.shipCharged) || 0);

/* ---- Asking price field (shown when status is For sale) ---- */
const askField = (d) => `<label class="f"><span>Asking price (total, optional)</span><input type="number" inputmode="decimal" step="0.01" min="0" data-f="ask" value="${esc(d.ask || "")}" placeholder="$"></label>${typeof askHelp === "function" ? askHelp(d) : ""}`;

/* ---- For Sale list ---- */
function viewForSale() {
  const list = ownedCoins().filter((c) => stageOf(c) === "forsale").sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
  const asked = sum(list, (c) => num(c.ask) || 0);
  const paid = sum(list, (c) => costOf(c) || 0);
  const row = (c) => {
    const ask = num(c.ask), cost = costOf(c), p = ask != null && cost != null ? r2(ask - cost) : null;
    return `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span>
      <span class="coin-sub">${qtyOf(c) > 1 ? `<span class="qty">×${qtyOf(c)}</span> ` : ""}${esc(c.cid || "")} · Paid ${cost == null ? "—" : money(cost)}</span></span>
      <span class="coin-val">${ask == null ? `<span class="muted">No price</span>` : money(ask)}${p == null ? "" : `<div class="melt ${signCls(p)}">${p >= 0 ? "+" : ""}${money(p)} before fees</div>`}</span></button>`;
  };
  return `<button class="link-btn" data-go="coins">← My Coins</button><h1 style="margin-top:10px">For sale</h1>
    ${list.length ? `<div class="small muted" style="margin:-4px 2px 10px">${list.length} listed · Asking ${money(asked, "$0.00")} · Paid ${money(paid, "$0.00")}</div><div class="list">${list.map(row).join("")}</div>
    <div class="btn-row"><button class="btn" data-act="priceListPrint">Print price list</button><button class="btn" data-act="priceListCopy">Share as text</button></div>
    <p class="small muted">Profit shown is asking price minus what you paid. Fees and shipping are worked out when you mark it sold.</p>`
      : `<div class="card empty">Nothing is for sale yet. Open a coin, tap Edit, and set its Status to <b>For sale</b>.</div>`}`;
}
/* ---- Price list: one page of what is for sale (ID, coin, grade, asking price) ---- */
const forSaleList = () => ownedCoins().filter((c) => stageOf(c) === "forsale").sort((a, b) => String(a.cid || "").localeCompare(String(b.cid || ""), undefined, { numeric: true }) || labelOf(a).localeCompare(labelOf(b)));
const plGrade = (c) => String(c.grade || "").trim();
function priceListText() {
  const list = forSaleList();
  return ["For sale · " + today(), "", ...list.map((c) => [c.cid || "", labelOf(c) + (qtyOf(c) > 1 ? " ×" + qtyOf(c) : ""), plGrade(c), num(c.ask) == null ? "ask" : fmPlain(num(c.ask))].filter(Boolean).join(" · "))].join("\n");
}
function priceListHtml() {
  const list = forSaleList(), p = typeof sellerProfile === "function" ? sellerProfile() : {};
  const row = (c) => `<tr><td>${esc(c.cid || "")}</td><td>${esc(labelOf(c))}${qtyOf(c) > 1 ? " ×" + qtyOf(c) : ""}</td><td>${esc(plGrade(c))}</td><td class="r">${num(c.ask) == null ? "ask" : fmPlain(num(c.ask))}</td></tr>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Price list ${esc(today())}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body { font: 14px/1.4 -apple-system, Segoe UI, Roboto, sans-serif; color: #222; max-width: 760px; margin: 16px auto; padding: 0 12px; }
  h1 { font-size: 22px; margin: 0 0 2px; } .sub { color: #555; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 4px; border-bottom: 1px solid #ddd; text-align: left; } th { font-size: 12px; color: #555; } .r { text-align: right; }
  .print { margin: 0 0 12px; padding: 8px 14px; border: 1px solid #9a6b1f; background: #9a6b1f; color: #fff; border-radius: 8px; font-size: 14px; cursor: pointer; }
  @media print { .print { display: none; } @page { margin: 14mm; } }
</style></head><body><button class="print" onclick="window.print()">Print or save as PDF</button>
<h1>Price list</h1><div class="sub">${esc((p && p.name) || "Coin Cabinet")} · ${esc(today())} · ${list.length} item${list.length === 1 ? "" : "s"}</div>
<table><tr><th>ID</th><th>Coin</th><th>Grade</th><th class="r">Price</th></tr>${list.map(row).join("")}</table></body></html>`;
}
Object.assign(actions, {
  priceListPrint: async () => {
    if (!forSaleList().length) { toast("Nothing is for sale yet."); return; }
    if (typeof saveRepFile === "function" && await saveRepFile("coin-cabinet-price-list-" + today() + ".html", priceListHtml())) toast("Saved. Open it, then print or save as PDF.");
  },
  priceListCopy: async () => {
    if (!forSaleList().length) { toast("Nothing is for sale yet."); return; }
    const text = priceListText();
    try { if (navigator.share) { await navigator.share({ title: "Price list", text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); toast("Copied the price list. Paste it into a message."); }
    catch (e) { toast("Couldn't copy from this view."); }
  },
});

// A small Home section pointing to the list (only once something is for sale).
function forSaleHomeHtml() {
  const n = ownedCoins().filter((c) => stageOf(c) === "forsale").length;
  return n ? `<div class="card" style="display:flex;justify-content:space-between;align-items:center"><span><b>${n}</b> for sale</span><button class="btn" data-go="forsale">For Sale list</button></div>` : "";
}

/* ---- Mark as sold ---- */
const fv = (v) => (v == null ? "" : esc(v));
function openSell(id, edit) {
  const c = getCoin(id);
  if (!c) return;
  const q = edit ? 1 : qtyOf(c); // editing a sale never splits the coin
  const sv = (edit && c.sold) || {};
  const ask = num(c.ask);
  const amount = edit ? sv.amount : ask != null ? r2(ask) : null; // asking price fills in "Sold for"
  const sf = !edit && sv.shipping == null ? shipFor(c) : null; // saved shipping cost for this coin type
  const moreOpen = edit && ["shipCharged", "orderNo", "trackNo", "shipping", "insurance", "to"].some((k) => sv[k] != null && sv[k] !== "") || sf != null;
  const mon = (k, label) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="0.01" min="0" name="${k}" placeholder="$" value="${fv(k === "shipping" && sf != null ? sf : sv[k])}"></label>`;
  const payNow = edit ? sv.payMethod : sv.payMethod || settings().lastPay || ""; // a new sale starts with the way you were paid last time
  const sh0 = !edit && typeof showToday === "function" && typeof showPicker === "function" && sellerOn() && !isInherited(c) ? showToday() : null;
  const date0 = edit ? fv(sv.date) : sh0 ? saleDateForShow(sh0) : today();
  openSheet(`<div class="sheet-head"><h2>${edit ? "Edit sale" : "Mark as sold"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <p><b>${esc(labelOf(c))}</b>${c.cid ? ` <span class="muted small">${esc(c.cid)}</span>` : ""}</p>
  ${isInherited(c) ? `<div class="banner" style="margin:0 0 8px"><span class="dns">Do not sell</span> This coin is inherited. It won't be counted in sold results.</div>` : ""}
  <form id="sellForm" data-id="${esc(c.id)}" ${edit ? 'data-edit="1"' : ""} data-ask="${ask == null ? "" : ask}" data-q="${qtyOf(c)}">
    ${q > 1 ? `<label class="f"><span>How many sold (of ${q})</span><input type="number" inputmode="numeric" name="n" min="1" max="${q}" value="" placeholder="How many?" required></label><div class="btn-row" style="margin:-4px 0 8px"><button class="btn" type="button" data-act="sellCount" data-n="1">Just 1</button><button class="btn" type="button" data-act="sellCount" data-n="${q}">All ${q}</button></div>` : ""}
    <label class="f"><span>Date sold</span><input type="date" name="date" value="${date0}"></label><div class="hint" id="dateHint"></div>
    <label class="f"><span>Sold for (total, optional)</span><input type="number" inputmode="decimal" step="0.01" name="amount" placeholder="$" value="${fv(amount)}"></label>
    ${typeof showPicker === "function" ? showPicker(c, sv, edit) : ""}
    <div class="grid2">${mon("fees", "Platform fees")}${mon("salesTax", "Sales tax collected")}</div><div class="hint" id="feeHint"></div>
    <label class="f"><span>Paid with</span><select name="payMethod"><option value="">Choose…</option>${PAY_METHODS.map((x) => `<option ${payNow === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    ${whereFields(!edit && typeof showSaleDefault === "function" && showSaleDefault(c) ? { ...sv, ...showSaleDefault(c) } : sv)}
    <details class="more" ${moreOpen ? "open" : ""}><summary>More details</summary>
      <div class="grid2">${mon("shipCharged", "Shipping you charged")}${mon("shipping", "Shipping you paid (label)")}</div>${sf != null ? `<div class="hint">Shipping paid is filled in from your saved shipping costs. Change it if this one was different.</div>` : ""}
      ${mon("insurance", "Insurance")}
      <label class="f"><span>Buyer (optional)</span><input type="text" name="soldTo" placeholder="Name or username" value="${fv(sv.to)}"></label>
      <div class="grid2"><label class="f"><span>Order number</span><input type="text" name="orderNo" value="${fv(sv.orderNo)}"></label>
      <label class="f"><span>Tracking number</span><input type="text" name="trackNo" value="${fv(sv.trackNo)}"></label></div>
      ${sv.trackNo ? `<a class="btn block" style="display:block;text-align:center;text-decoration:none;color:inherit" href="${esc(trackUrl({ trackNo: sv.trackNo, trackCarrier: sv.carrier }))}" target="_blank" rel="noopener">Track package ↗</a>` : ""}
    </details>
    <div class="hint" id="profitLine"></div>
    <div class="btn-row"><button class="btn primary" type="submit">${edit ? "Save sale" : "Mark sold"}</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
  const f = $("#sellForm");
  if (edit) f.dataset.feeTouched = "1"; // editing a sale: never change its fee by itself (the estimate shows in the hint)
  sellRecalc(f);
}
// A new sale's date at a show: today if the show is running, otherwise the show's first day.
function saleDateForShow(sh) {
  const t = today();
  return sh && sh.start && !(sh.start <= t && t <= (sh.end || sh.start)) ? sh.start : t;
}
const sellVal = (f, k) => num((f.elements[k] || {}).value);
// Re-work the fee estimate and the profit line as the form changes.
function sellRecalc(f, fromFees) {
  if (!f) return;
  const c = getCoin(f.dataset.id);
  if (!c) return;
  const where = f.elements.whereType.value;
  const feeBox = f.elements.fees;
  if (fromFees) f.dataset.feeTouched = "1";
  const dh = $("#dateHint"), dv = f.elements.date && f.elements.date.value;
  if (dh) dh.innerHTML = dv && dv > today() ? `<b class="neg">That date is in the future.</b> Is that right?` : "";
  const est = estimateFees(where, sellVal(f, "amount"), sellVal(f, "shipCharged"), sellVal(f, "salesTax"));
  if (!f.dataset.feeTouched) feeBox.value = est == null ? "" : est;
  $("#feeHint").textContent = est == null ? "" : `Estimate for ${where}: ${money(est, "$0.00")}. Change it to match your receipt.`;
  const n = f.elements.n ? Math.min(qtyOf(c), Math.max(1, num(f.elements.n.value) || qtyOf(c))) : (f.dataset.edit ? 1 : qtyOf(c));
  const cost = f.dataset.edit ? (costOf(c) || 0) : (costOf(c) || 0) * (n / qtyOf(c));
  const p = (sellVal(f, "amount") || 0) + (sellVal(f, "shipCharged") || 0) - cost - (sellVal(f, "fees") || 0) - (sellVal(f, "shipping") || 0) - (sellVal(f, "insurance") || 0);
  $("#profitLine").innerHTML = isInherited(c) ? "" : `Profit: <b class="${signCls(p)}">${money(r2(p), "$0.00")}</b> <span class="muted small">after what you paid${cost ? " (" + money(r2(cost)) + ")" : ""}, fees and shipping. Sales tax isn't profit.</span>`;
}
document.addEventListener("input", (e) => {
  const f = e.target.closest && e.target.closest("#sellForm");
  if (!f) return;
  if (e.target.name === "date") f.dataset.dateTouched = "1"; // once you pick a date yourself, a show never changes it
  if (e.target.name === "n" && f.dataset.ask) { // keep "Sold for" in step with the asking price for the number sold
    const n = Math.min(+f.dataset.q, Math.max(1, num(e.target.value) || +f.dataset.q));
    f.elements.amount.value = r2(+f.dataset.ask * n / +f.dataset.q);
  }
  sellRecalc(f, e.target.name === "fees");
});
document.addEventListener("change", (e) => {
  const f = e.target.closest && e.target.closest("#sellForm");
  if (e.target.id === "whereType") sellRecalc(f);
  if (e.target.id === "showId" && f && !f.dataset.edit && !f.dataset.dateTouched && typeof getShow === "function") { // picking a show sets the date, unless you chose one
    f.elements.date.value = e.target.value ? saleDateForShow(getShow(e.target.value)) : today();
    sellRecalc(f);
  }
});

function doSell(form) {
  const c = getCoin(form.dataset.id);
  if (!c) return;
  const fd = new FormData(form);
  const q = qtyOf(c);
  const n = Math.min(q, Math.max(1, num(fd.get("n")) || q));
  const m = (k) => num(fd.get(k));
  const sold = { at: Date.now(), date: fd.get("date") || today(), amount: m("amount"), shipping: m("shipping"), insurance: m("insurance"),
    shipCharged: m("shipCharged"), fees: m("fees"), salesTax: m("salesTax"), payMethod: String(fd.get("payMethod") || ""),
    orderNo: String(fd.get("orderNo") || "").trim(), trackNo: String(fd.get("trackNo") || "").replace(/\s+/g, ""),
    ...readWhere(fd), to: String(fd.get("soldTo") || "").trim() };
  if (!form.dataset.edit) { const was = wasKeptIn(c); if (was) sold.keptIn = was; } // where it lived before the sale
  const showId = String(fd.get("showId") || "");
  if (showId && typeof getShow === "function" && getShow(showId)) { // sold at a show: remember which, and suggest "Where" if it was left blank
    sold.showId = showId;
    const w = !sold.whereType && typeof whereFromShow === "function" ? whereFromShow(getShow(showId)) : null;
    if (w) { Object.assign(sold, w); sold.where = whereText(sold); }
  }
  if (sold.payMethod && sold.payMethod !== settings().lastPay) saveSettings({ lastPay: sold.payMethod }, true);
  if (form.dataset.edit) {
    const old = c.sold || {}; // keep what the form doesn't show: where it was kept, and its show when the Show field is hidden
    const keep = { keptIn: old.keptIn }; if (!fd.has("showId")) keep.showId = old.showId;
    Object.keys(keep).forEach((k) => { if (keep[k] == null) delete keep[k]; });
    saveCoin({ ...c, sold: { ...keep, ...sold, at: old.at || sold.at, carrier: old.carrier } });
    closeSheet();
    toast("Sale updated.");
    return;
  }
  const ask = num(c.ask);
  if (n < q) {
    // Both pieces share a lot id, so moving them back always rejoins them, whichever piece survives.
    const lotId = c.lotId || c.id;
    const ex = splitExtras(c, n); // tax, shipping and fees shared by quantity
    saveCoin({ ...c, ...ex.keep, qty: q - n, lotId, ...(ask != null ? { ask: r2(ask * (q - n) / q) } : {}) });
    saveCoin({ ...c, ...ex.part, id: uid(), cid: undefined, qty: n, status: "sold", stage: "", sold, splitFrom: c.id, lotId, ...(ask != null ? { ask: r2(ask * n / q) } : {}) });
  } else {
    saveCoin({ ...c, status: "sold", stage: "", sold });
  }
  const s = settings();
  if (!s.soldAutoDone) saveSettings({ showSold: true, soldAutoDone: true });
  closeSheet();
  toast("Marked as sold.");
  go(coinBackTarget());
}

/* ---- Options → Selling → Fee rates ---- */
function sellingOptionsHtml() {
  const f = feeRates();
  const inp = (k, label, step) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="${step || "0.01"}" min="0" data-fee="${k}" value="${esc(f[k])}"></label>`;
  return `<h2>Selling</h2><div class="card"><details class="more"><summary>Fee rates (estimates)</summary>
    <div class="hint">Used to fill in fees when you mark a coin sold. Change them when a platform changes its prices. A fee you type yourself is never replaced.</div>
    <b class="small">Whatnot (coins)</b><div class="grid3">${inp("whatnotPct", "Commission %")}${inp("whatnotProcPct", "Processing %")}${inp("whatnotProcFlat", "Processing $")}</div>
    <b class="small">eBay and eBay Live (coins)</b><div class="grid3">${inp("ebayPct", "Fee %")}${inp("ebayFlat", "Per order $")}${inp("ebayFlatSmall", "Order ≤ $10")}</div>
    <div class="btn-row"><button class="btn" data-act="feeReset">Put back the usual rates</button></div></details>${typeof pricingOptionsHtml === "function" ? pricingOptionsHtml() : ""}${shippingOptionsHtml()}</div>`;
}
document.addEventListener("input", (e) => {
  if (!e.target.dataset || !e.target.dataset.fee) return;
  const v = num(e.target.value);
  if (v != null && v >= 0) saveSettings({ feeRates: { ...(settings().feeRates || {}), [e.target.dataset.fee]: v } }, true);
});

/* ---- Was kept in: where a coin lived before it was sold (from a dealer case, its place before the case) ---- */
function wasKeptIn(c) {
  const f = c.caseFrom, box = c.boxId && getBox(c.boxId);
  if (box && box.type === "dealer" && !f) return ""; // a coin first added straight to a case has no old place
  const place = box && box.type === "dealer" ? { ...c, albumId: f.albumId || "", boxId: f.boxId || "", boxRow: f.boxRow || "", boxSlot: f.boxSlot || "", stack: f.stack || "" } : c;
  return typeof keptText === "function" ? keptText(place) : "";
}

/* ---- Options → Selling → Saved shipping costs (settings.shipping = { def, byType: { typeId: amount } }) ---- */
const shipRates = () => { const s = settings().shipping || {}; return { def: num(s.def), byType: s.byType || {} }; };
function shipFor(c) { const r = shipRates(), t = num(r.byType[c.typeId]); return t != null ? t : r.def; }
function shippingOptionsHtml() {
  const r = shipRates(), ids = Object.keys(r.byType).filter((id) => TYPE_BY_ID[id]);
  const rows = ids.map((id) => `<div class="rowline"><span>${esc(TYPE_BY_ID[id].name)}</span><span><input type="number" inputmode="decimal" step="0.01" min="0" data-shiptype="${esc(id)}" value="${esc(r.byType[id])}" style="width:90px"> <button class="btn" data-act="shipTypeDel" data-id="${esc(id)}" aria-label="Remove">✕</button></span></div>`).join("");
  return `<details class="more" ${ids.length ? "open" : ""}><summary>Shipping costs</summary>
    <div class="hint">Fills in "Shipping you paid" when you mark a coin sold. You can always change it for one sale.</div>
    <label class="f"><span>Usual shipping cost</span><input type="number" inputmode="decimal" step="0.01" min="0" data-shipdef value="${esc(r.def == null ? "" : r.def)}" placeholder="$"></label>
    <b class="small">Different for some coin types</b>${rows || `<div class="small muted">None yet.</div>`}
    <label class="f"><span>Add a coin type</span><select data-shipadd><option value="">Choose…</option>${COIN_TYPES.filter((t) => !(t.id in r.byType)).map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select></label></details>`;
}
const saveShip = (patch) => saveSettings({ shipping: { ...(settings().shipping || {}), ...patch } }, true);
document.addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (!d) return;
  const v = num(e.target.value);
  if ("shipdef" in d) saveShip({ def: v != null && v >= 0 ? v : null });
  else if (d.shiptype && v != null && v >= 0) saveShip({ byType: { ...shipRates().byType, [d.shiptype]: v } });
});
document.addEventListener("change", (e) => {
  if (!e.target.dataset || !("shipadd" in e.target.dataset) || !e.target.value) return;
  const r = shipRates();
  saveShip({ byType: { ...r.byType, [e.target.value]: r.def != null ? r.def : 0 } });
  render();
});
Object.assign(actions, {
  shipTypeDel: (el) => { const bt = { ...shipRates().byType }; delete bt[el.dataset.id]; saveShip({ byType: bt }); render(); },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") SNAPSHOT_BLOCK.add("shipTypeDel");
