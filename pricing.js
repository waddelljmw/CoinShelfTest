/* Step 8.3 / 9.3d: suggested asking price. Three numbers, all for the whole lot (price each × how many):
   Red Book × your %  (start 90%),   melt + your markup %  (start 10%),   your cost + your minimum markup %  (start 10%).
   The suggested one is the highest of the three, so it is never below cost + minimum markup.
   Percentages live in Options → Selling (settings.pricing = { bookPct, meltPct, costPct }). Tap a suggestion to use it. */

const PRICING_DEFAULTS = { bookPct: 90, meltPct: 10, costPct: 10 };
const pricingRates = () => ({ ...PRICING_DEFAULTS, ...(settings().pricing || {}) });

// What the coin cost you, for the price floor: an inherited coin uses its "value when inherited" (each × quantity) if set.
function askCostBase(c) {
  if (isInherited(c) && inhValueOf(c) != null) return r2(inhValueOf(c) * (qtyOf(c) || 1));
  return costOf(c);
}
// The suggestions for a coin (or an unsaved draft). A missing one is null: no Red Book value, no metal to melt, or no cost.
// `top` names the highest one (the suggested price); ties go to book, then melt, then cost.
function suggestAsk(c) {
  const p = pricingRates(), q = qtyOf(c) || 1;
  const bp = itemOf(c) === "bullion" || isJunk(c) ? null : bookPrice(c), me = meltEach(c), co = askCostBase(c);
  const out = {
    book: bp != null ? r2(bp * q * p.bookPct / 100) : null,
    melt: me != null ? r2(me * q * (1 + p.meltPct / 100)) : null,
    cost: co != null && co > 0 ? r2(co * (1 + p.costPct / 100)) : null,
  };
  out.top = ["book", "melt", "cost"].reduce((best, k) => (out[k] != null && (best == null || out[k] > out[best]) ? k : best), null);
  return out;
}
const pctText = (n) => String(Math.round(n * 100) / 100);

// Up to three tap-to-use buttons; the suggested (highest) one is highlighted. `id` is a saved coin (it is saved straight away); without one, it fills the form's asking price.
function askButtons(c, id) {
  const s = suggestAsk(c), p = pricingRates();
  const b = (kind, label, v) => (v == null ? "" : `<button type="button" class="btn${s.top === kind ? " primary" : ""}" data-act="askUse" data-pick="${kind}" ${id ? `data-id="${esc(id)}"` : ""}>${label}: ${money(v)}</button>`);
  const html = b("book", `Red Book × ${pctText(p.bookPct)}%`, s.book) + b("melt", `Melt + ${pctText(p.meltPct)}%`, s.melt) + b("cost", `Your cost + ${pctText(p.costPct)}%`, s.cost);
  return html ? `<div class="btn-row" style="flex-wrap:wrap">${html}</div><div class="small muted">The highlighted one is suggested: the highest, so never below your cost + ${pctText(p.costPct)}%.</div>` : "";
}

// In the coin form, under the asking price box.
function askHelp(d) {
  const html = askButtons(d, "");
  return `<div class="hint">${html ? "Suggested asking price (tap one to use it):" : "No Red Book value, metal content or cost to suggest a price from. Type your own."}</div>${html}`;
}

// On a coin's page: the asking price and the suggestions. Tap-to-use only while the coin is For sale
// (an asking price on a coin that isn't for sale would be dropped the next time it is edited).
function askCard(c) {
  if (c.status !== "owned" || isInherited(c)) return "";
  const forSale = stageOf(c) === "forsale", ask = num(c.ask), s = suggestAsk(c), p = pricingRates();
  if (s.top == null && ask == null) return "";
  const plain = [s.book != null ? `Red Book × ${pctText(p.bookPct)}% = ${money(s.book)}` : "", s.melt != null ? `Melt + ${pctText(p.meltPct)}% = ${money(s.melt)}` : "", s.cost != null ? `Your cost + ${pctText(p.costPct)}% = ${money(s.cost)}` : ""].filter(Boolean).join(" · ");
  return `<div class="card"><div class="rowline"><b>Asking price</b><span class="muted small">${forSale ? (ask == null ? "Not set" : money(ask)) : "Not for sale"}</span></div>
    <div class="small muted">Suggested${qtyOf(c) > 1 ? " for all ×" + qtyOf(c) : ""}${forSale ? ". Tap one to use it." : " if you list it: " + plain}</div>${forSale ? askButtons(c, c.id) : ""}</div>`;
}

// Small version for the dealer case rows.
const askRowHelp = (c) => { const h = askButtons(c, c.id); return h ? `<div class="small" style="margin:2px 0 6px">${h}</div>` : ""; };

// Options → Selling → Asking price rules.
function pricingOptionsHtml() {
  const p = pricingRates();
  const inp = (k, label) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="1" min="0" data-price="${k}" value="${esc(p[k])}"></label>`;
  return `<details class="more"><summary>Asking price rules</summary>
    <div class="hint">Used for the suggested asking prices. You can always type your own.</div>
    <div class="grid2">${inp("bookPct", "Red Book price × this %")}${inp("meltPct", "Melt value + this %")}${inp("costPct", "Your cost + this % (the lowest you'd go)")}</div>
    <div class="btn-row"><button class="btn" data-act="priceReset">Put back 90%, 10% and 10%</button></div></details>`;
}
document.addEventListener("input", (e) => {
  const k = e.target.dataset && e.target.dataset.price;
  if (!k) return;
  const v = num(e.target.value);
  if (v != null && v >= 0) saveSettings({ pricing: { ...(settings().pricing || {}), [k]: v } }, true);
});

Object.assign(actions, {
  askUse: (el) => {
    const id = el.dataset.id;
    const c = id ? getCoin(id) : draft;
    if (!c) return;
    const v = suggestAsk(c)[el.dataset.pick];
    if (v == null) { toast("No suggestion for this one."); return; }
    if (id) { saveCoin({ ...c, ask: String(v) }); toast("Asking price set to " + money(v) + "."); return; }
    draft.ask = String(v);
    const box = document.querySelector("[data-f=ask]");
    if (box) box.value = String(v);
  },
  priceReset: () => { saveSettings({ pricing: {} }); toast("Back to 90%, 10% and 10%."); render(); },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["askUse", "priceReset"].forEach((a) => SNAPSHOT_BLOCK.add(a));
