/* One order, several coins (Step 9.7b). Select coins → "Sell together…". One buyer, one order number, one tracking number,
   one shipping charge, one fee set. Each coin keeps its own price and is saved as an ordinary sale with a shared `orderId`.
   The order's shipping, fees, tax and insurance are shared out between the coins by price (the pennies always add back
   to exactly what you typed), so every total, report and CSV that adds up coins counts the order's fees and shipping once. */

// Share `total` between coins in proportion to `weights`. The pieces add back to the total exactly. null stays null.
function shareMoney(total, weights) {
  if (total == null) return weights.map(() => null);
  const w = weights.map((x) => Math.max(0, num(x) || 0)), sw = w.reduce((a, b) => a + b, 0);
  let left = r2(total);
  return w.map((x, i) => {
    if (i === w.length - 1) return left;
    const part = r2(total * (sw ? x / sw : 1 / w.length));
    left = r2(left - part);
    return part;
  });
}
// The coins of one order (still sold, not refunded), in date order.
const orderCoins = (orderId) => orderId ? soldCoins().filter((c) => c.sold && c.sold.orderId === orderId) : [];
const orderTotal = (cs, k) => r2(sum(cs, (c) => num(c.sold && c.sold[k])));

function openOrder(list) {
  const cs = (list || []).filter((c) => c.status === "owned" && !isInherited(c));
  if (list && cs.length < list.length) toast("Inherited coins can't be sold, so they were left out.");
  if (cs.length < 2) { toast("Pick at least two coins to sell together."); return; }
  const first = cs[0], sh0 = typeof showToday === "function" && typeof showPicker === "function" && sellerOn() ? showToday() : null;
  const date0 = sh0 ? saleDateForShow(sh0) : today();
  const chg = (settings().shipping || {}).charge;
  const sf = shipFor(first);
  const mon = (k, label, v) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="0.01" min="0" name="${k}" placeholder="$" value="${v == null ? "" : esc(v)}"></label>`;
  const rows = cs.map((c) => `<label class="f"><span>${esc(labelOf(c))}${qtyOf(c) > 1 ? ` <span class="muted small">×${qtyOf(c)} (all sold)</span>` : ""}</span><input type="number" inputmode="decimal" step="0.01" min="0" name="p_${esc(c.id)}" placeholder="$" value="${num(c.ask) != null ? r2(num(c.ask)) : ""}"></label>`).join("");
  openSheet(`<div class="sheet-head"><h2>Sell together</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <p class="small muted">${cs.length} coins, one order. Type each coin's price. Shipping and fees are for the whole order.</p>
  <form id="orderForm" data-ids="${esc(cs.map((c) => c.id).join(","))}">
    ${rows}
    <label class="f"><span>Date sold</span><input type="date" name="date" value="${date0}"></label>
    ${typeof showPicker === "function" ? showPicker(first, {}, false) : ""}
    ${whereFields(sh0 && typeof whereFromShow === "function" ? whereFromShow(sh0) : {})}
    <div class="grid2">${mon("shipCharged", "Shipping you charged", chg)}${mon("shipping", "Shipping you paid (label)", sf)}</div>
    <div class="grid2">${mon("fees", "Platform fees (whole order)")}${mon("salesTax", "Sales tax collected")}</div><div class="hint" id="oFeeHint"></div>
    <label class="f"><span>Paid with</span><select name="payMethod"><option value="">Choose…</option>${PAY_METHODS.map((x) => `<option>${x}</option>`).join("")}</select></label>
    <label class="f"><span>Buyer (optional)</span><input type="text" name="soldTo" placeholder="Name or username"></label>
    <div class="grid2"><label class="f"><span>Order number</span><input type="text" name="orderNo"></label><label class="f"><span>Tracking number</span><input type="text" name="trackNo"></label></div>
    ${mon("insurance", "Insurance")}
    <div class="hint" id="oProfit"></div>
    <div class="btn-row"><button class="btn primary" type="submit">Mark all sold</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
  orderRecalc($("#orderForm"));
}
const orderPrices = (f) => (f.dataset.ids || "").split(",").map((id) => [id, num((f.elements["p_" + id] || {}).value)]);
function orderRecalc(f, fromFees) {
  if (!f) return;
  if (fromFees) f.dataset.feeTouched = "1";
  const v = (k) => num((f.elements[k] || {}).value) || 0;
  const prices = orderPrices(f), total = r2(sum(prices, ([, p]) => p || 0));
  const where = f.elements.whereType.value, est = estimateFees(where, total, v("shipCharged"), v("salesTax"));
  if (!f.dataset.feeTouched) f.elements.fees.value = est == null ? "" : est;
  const h = $("#oFeeHint"); if (h) h.textContent = est == null ? "" : `Estimate for ${where}: ${money(est, "$0.00")} for the whole order, with the flat fee counted once. Change it to match your receipt.`;
  const cost = r2(sum(prices, ([id]) => costOf(getCoin(id)) || 0));
  const p = total + v("shipCharged") - cost - v("fees") - v("shipping") - v("insurance");
  const o = $("#oProfit"); if (o) o.innerHTML = `Order total ${money(total, "$0.00")} · Profit: <b class="${signCls(p)}">${money(r2(p), "$0.00")}</b> <span class="muted small">after what you paid (${money(cost, "$0.00")}), fees and shipping.</span>`;
}
document.addEventListener("input", (e) => { const f = e.target.closest && e.target.closest("#orderForm"); if (f) orderRecalc(f, e.target.name === "fees"); });
document.addEventListener("change", (e) => {
  const f = e.target.closest && e.target.closest("#orderForm");
  if (!f) return;
  if (e.target.id === "showId" && !f.dataset.dateTouched && typeof getShow === "function") f.elements.date.value = e.target.value ? saleDateForShow(getShow(e.target.value)) : today();
  if (e.target.name === "date") f.dataset.dateTouched = "1";
  orderRecalc(f);
});

function doOrder(form) {
  const prices = orderPrices(form), coins = prices.map(([id]) => getCoin(id));
  if (coins.some((c) => !c || c.status !== "owned")) { toast("One of those coins changed. Pick them again."); closeSheet(); return; }
  const fd = new FormData(form), m = (k) => num(fd.get(k));
  const w = prices.map(([, p]) => p || 0);
  const parts = { shipCharged: shareMoney(m("shipCharged"), w), fees: shareMoney(m("fees"), w), shipping: shareMoney(m("shipping"), w), insurance: shareMoney(m("insurance"), w), salesTax: shareMoney(m("salesTax"), w) };
  const orderId = uid(), at = Date.now();
  const base = { at, date: fd.get("date") || today(), payMethod: String(fd.get("payMethod") || ""), orderNo: String(fd.get("orderNo") || "").trim(),
    trackNo: String(fd.get("trackNo") || "").replace(/\s+/g, ""), to: String(fd.get("soldTo") || "").trim(), orderId, ...readWhere(fd) };
  const showId = String(fd.get("showId") || "");
  if (showId && typeof getShow === "function" && getShow(showId)) {
    base.showId = showId;
    const wh = !base.whereType && typeof whereFromShow === "function" ? whereFromShow(getShow(showId)) : null;
    if (wh) { Object.assign(base, wh); base.where = whereText(base); }
  }
  if (base.payMethod) saveSettings({ lastPay: base.payMethod, lastPayShow: base.showId || "" }, true);
  const before = coins.map((c) => JSON.parse(JSON.stringify(c)));
  coins.forEach((c, i) => {
    const sold = { ...base, amount: prices[i][1], shipCharged: parts.shipCharged[i], fees: parts.fees[i], shipping: parts.shipping[i], insurance: parts.insurance[i], salesTax: parts.salesTax[i] };
    const was = wasKeptIn(c); if (was) sold.keptIn = was;
    saveCoin({ ...c, status: "sold", stage: "", sold });
  });
  const s = settings();
  if (!s.soldAutoDone) saveSettings({ showSold: true, soldAutoDone: true });
  listState.sel = null;
  closeSheet();
  toast("Sold " + coins.length + " coins as one order.", { label: "Undo", fn: () => { before.forEach((d) => put("c_" + d.id, d)); toast("Undone. They are back in your collection."); } });
  render();
}
document.addEventListener("submit", (e) => { if (e.target.id === "orderForm") { e.preventDefault(); doOrder(e.target); } });

// On a sold coin's page: which order it is part of, and Refund whole order.
function orderCard(c) {
  const id = c.sold && c.sold.orderId;
  if (!id) return "";
  const cs = orderCoins(id);
  if (cs.length < 2) return "";
  const total = r2(sum(cs, (x) => num(x.sold.amount)));
  return `<div class="card"><b>Part of an order</b><div class="small muted">${cs.length} coins${c.sold.to ? " · " + esc(c.sold.to) : ""}${c.sold.orderNo ? " · #" + esc(c.sold.orderNo) : ""} · ${money(total, "$0.00")} in all. Shipping and fees on this page are this coin's share of the order.</div>
    ${cs.filter((x) => x.id !== c.id).map((x) => `<button class="link-btn" data-go="coin-${esc(x.id)}" style="display:block;margin-top:4px">${esc(labelOf(x))}</button>`).join("")}
    <div class="btn-row"><button class="btn" data-act="refundOrder" data-id="${esc(c.id)}">Refund whole order</button></div></div>`;
}
Object.assign(actions, {
  orderOpen: () => openOrder(pickedCoins()),
  refundOrder: (el) => {
    const c = getCoin(el.dataset.id), cs = c && c.sold ? orderCoins(c.sold.orderId) : [];
    if (!cs.length) return;
    confirmSheet("Refund the whole order?", `All ${cs.length} coins go back in your collection. The sales stay on record as Refunded, and the fees and shipping you paid still count.`, "Refund whole order", () => {
      const docs = [];
      cs.forEach((x) => returnToStock({ dataset: { id: x.id } }, true, docs));
      go("coins");
      toast("Order refunded.", { label: "Undo", fn: () => { docs.forEach((d) => put("c_" + d.id, d)); toast("Undone. The sale is back."); } });
    });
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["orderOpen", "refundOrder"].forEach((a) => SNAPSHOT_BLOCK.add(a));
