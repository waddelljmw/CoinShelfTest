/* Step 8.2: dealer display case and shows. Only shown with Seller Mode on (the data is kept when it's off).
   Dealer case = a box with type "dealer" and forSale (default on). A coin moving in remembers where it was
   (caseFrom: album/slot, box/spot, stack, status, stage) and, in a for-sale case, switches to For sale.
   Taking it out puts it back. Show = a record "sh_<id>": { kind:"show", id, name, type, start, end, place, costs }.
   A sale points to its show with sold.showId. */

/* ---------- the dealer case ---------- */
const dealerBoxes = () => allBoxes().filter((b) => b.type === "dealer");
const caseOn = (b) => !!b && b.type === "dealer" && b.forSale !== false;

// Runs inside put() for every coin save: `prev` is the saved coin, `c` the copy being saved (changed in place).
function caseOnPut(prev, c) {
  if (!c || c.kind !== "coin") return;
  const nb = c.boxId && getBox(c.boxId), pb = prev && prev.boxId && getBox(prev.boxId);
  if (!c.boxId) { delete c.caseFrom; return; } // out of every box: no longer "in a case"
  if (!nb) return; // its box isn't loaded (yet): leave the memory alone
  if (nb.type !== "dealer") { delete c.caseFrom; return; }
  if (pb && pb.type === "dealer") return; // already inside (a move between cases keeps the first place)
  if (c.caseFrom) return; // Undo or a restore: the memory is already there
  const from = prev || {}; // a brand-new coin had no earlier place
  c.caseFrom = { albumId: from.albumId || "", slotId: from.slotId || "", boxId: from.boxId || "", boxRow: from.boxRow || "", boxSlot: from.boxSlot || "", boxTray: from.boxTray || "", stack: from.stack || "",
    status: (prev || c).status || "owned", stage: (prev || c).stage || "" };
  if (nb.forSale !== false && c.status === "owned" && !isInherited(c)) c.stage = "forsale";
}

// Puts one coin (a copy) back where it was. Returns a note when the old place couldn't be used.
function caseRestore(c) {
  const f = c.caseFrom || {};
  let note = "";
  delete c.caseFrom;
  c.boxId = ""; c.boxRow = ""; c.boxSlot = ""; delete c.boxTray; c.albumId = ""; delete c.slotId;
  c.stage = f.stage || "";
  if (f.albumId) {
    const taken = f.slotId && ownedCoins().find((o) => o.id !== c.id && o.albumId === f.albumId && o.slotId === f.slotId);
    if (taken) note = "its old album spot now holds " + labelOf(taken);
    else if (getAlbum(f.albumId) && itemOf(c) === "coin") { c.albumId = f.albumId; if (f.slotId) c.slotId = f.slotId; }
    else note = "its old album is gone";
  } else if (f.boxId) {
    const ob = getBox(f.boxId);
    if (!ob) note = "its old box is gone";
    else if (ob.type === "dealer") note = "";
    else if (hasSpots(ob) && f.boxRow && spotCoin(ob.id, f.boxRow, f.boxSlot, c.id, f.boxTray)) note = "its old spot (" + ob.name + (trayCount(ob) > 1 ? " · Tray " + (f.boxTray || 1) : "") + " · " + lineWord(ob) + " " + f.boxRow + " · Slot " + f.boxSlot + ") now holds " + labelOf(spotCoin(ob.id, f.boxRow, f.boxSlot, c.id, f.boxTray));
    else { c.boxId = ob.id; if (hasSpots(ob)) { c.boxRow = f.boxRow || ""; c.boxSlot = f.boxSlot || ""; if (f.boxTray && trayCount(ob) > 1) c.boxTray = f.boxTray; } }
  }
  if (!f.albumId && !f.boxId && f.stack) c.stack = f.stack;
  if (!c.boxId) { delete c.boxRow; delete c.boxSlot; delete c.boxTray; }
  if (!c.albumId) delete c.albumId;
  return note;
}
let caseLast = null;
function caseReturn(coins, label) {
  const before = [], notes = [];
  coins.forEach((c0) => {
    const c = JSON.parse(JSON.stringify(c0));
    const note = caseRestore(c);
    before.push(c0);
    put("c_" + c.id, c, true);
    if (note) notes.push([labelOf(c0), note]);
  });
  caseLast = { before };
  render();
  if (notes.length) {
    openSheet(`<div class="sheet-head"><h2>${label}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small">${notes.length} coin${notes.length > 1 ? "s" : ""} couldn't go back to the old place and ${notes.length > 1 ? "are" : "is"} now in <b>Nothing special</b>:</p>
      <div class="card">${notes.map(([n, w]) => `<div class="rowline"><span>${esc(n)}</span><span class="muted small">${esc(w)}</span></div>`).join("")}</div>
      <button class="btn block" data-act="caseUndo" style="margin-top:10px">Undo this</button>`);
  } else toast(label, { label: "Undo", fn: actions.caseUndo });
}

// Slot order: row, then slot; coins with no numbered spot go last.
const caseOrder = (a, b) => (+a.boxRow || 1e9) - (+b.boxRow || 1e9) || (+a.boxSlot || 1e9) - (+b.boxSlot || 1e9) || labelOf(a).localeCompare(labelOf(b));
// Coins in a case that are for sale and have no asking price yet.
const caseUnpriced = (b) => boxCoins(b).filter((c) => stageOf(c) === "forsale" && num(c.ask) == null && !isInherited(c));

// The dealer case page: how the case behaves, what's inside with Take out, and Return unsold coins.
function dealerPanel(b) {
  const inCase = boxCoins(b).sort(caseOrder); // in slot order
  const on = caseOn(b);
  const rows = inCase.map((c) => {
    const ask = num(c.ask);
    return `<div class="rowline"><button class="link-btn" data-go="coin-${esc(c.id)}">${c.boxRow && c.boxSlot ? `<span class="muted small">${esc(c.boxRow)}·${esc(c.boxSlot)}</span> ` : ""}${esc(labelOf(c))}</button><span class="muted small">${ask == null ? (stageOf(c) === "forsale" ? "No price" : "") : money(ask)}</span><button class="btn" data-act="caseOut" data-id="${esc(c.id)}">Take out</button></div>${stageOf(c) === "forsale" && typeof askRowHelp === "function" ? askRowHelp(c) : ""}`;
  }).join("");
  return `<div class="card"><div class="rowline"><b>For sale case</b><span class="muted small">${on ? "On" : "Off"}</span></div>
    <div class="small muted">${on ? "Coins you move in switch to For sale. Take them out and each goes back to where it was." : "Display only: coins keep their status. Take them out and each goes back to where it was."}</div>
    ${rows ? `<div style="margin-top:8px">${rows}</div>` : `<div class="small muted" style="margin-top:6px">Empty. Add a coin, or move coins in with Select many.</div>`}
    <div class="btn-row"><button class="btn" data-act="caseAskOpen" data-id="${esc(b.id)}" ${inCase.some((c) => stageOf(c) === "forsale") ? "" : "disabled"}>Set asking price for all</button></div>
    <div class="btn-row"><button class="btn" data-act="caseReturnAll" data-id="${esc(b.id)}" ${inCase.length ? "" : "disabled"}>Return unsold coins</button><button class="btn" data-go="shows">Shows</button></div></div>`;
}

/* ---------- shows ---------- */
const SHOW_KINDS = [["coinshow", "Coin show"], ["whatnot", "Whatnot live"], ["ebaylive", "eBay Live"], ["other", "Other"]];
const SHOW_COSTS = [["table", "Table fee"], ["gas", "Gas / mileage"], ["hotel", "Hotel"], ["food", "Food"], ["other", "Other"]];
const showKindText = (k) => (SHOW_KINDS.find((x) => x[0] === k) || SHOW_KINDS[0])[1];
const getShow = (id) => (id ? store.docs.get("sh_" + id) : null);
const allShows = () => [...store.docs.values()].filter((d) => d.kind === "show").sort((a, b) => String(b.start || "").localeCompare(String(a.start || "")) || (b.createdAt || 0) - (a.createdAt || 0));
const showCostTotal = (s) => r2(sum(SHOW_COSTS, ([k]) => num(s.costs && s.costs[k])));
const showDates = (s) => (s.end && s.end !== s.start ? stampText(s.start).replace(/ @.*$/, "") + " to " + stampText(s.end).replace(/ @.*$/, "") : s.start ? stampText(s.start).replace(/ @.*$/, "") : "No date");
// A show happening today (latest start first), if there is one.
function showToday() {
  const t = today();
  return allShows().find((s) => s.start && s.start <= t && t <= (s.end || s.start)) || null;
}
// What "Where" a show suggests for a sale.
function whereFromShow(s) {
  if (!s) return null;
  const w = { coinshow: { whereType: "Coin show", whereDetail: s.name }, whatnot: { whereType: "Whatnot", whereDetail: "" }, ebaylive: { whereType: "eBay Live", whereDetail: "" }, other: { whereType: "Other", whereDetail: s.name } }[s.type];
  return w || null;
}
// Sales made at a show. Inherited coins are never counted in sold results.
const showSales = (s) => soldCoins().filter((c) => c.sold && c.sold.showId === s.id && !isInherited(c));
const isAttendee = (s) => s.role === "attendee";
function showStats(s) {
  const cs = showSales(s);
  const sales = r2(sum(cs, saleMoneyIn)), cost = r2(sum(cs, (c) => costOf(c) || 0));
  const fees = r2(sum(cs, (c) => num(c.sold.fees))), ship = r2(sum(cs, (c) => (num(c.sold.shipping) || 0) + (num(c.sold.insurance) || 0)));
  const tax = r2(sum(cs, (c) => num(c.sold.salesTax))), costs = showCostTotal(s);
  return { att: isAttendee(s), n: sum(cs, qtyOf), cs, sales, cost, fees, ship, tax, costs, profit: r2(sales - cost - fees - ship - costs) };
}

// In the Mark as sold form (Seller Mode only, and only once a show exists).
function showPicker(c, sv, edit) {
  if (!sellerOn() || isInherited(c)) return "";
  const shows = allShows();
  if (!shows.length) return "";
  const cur = edit ? sv.showId || "" : (showToday() || {}).id || "";
  return `<label class="f"><span>Show</span><select name="showId" id="showId"><option value="">No show</option>${shows.map((s) => `<option value="${esc(s.id)}" ${cur === s.id ? "selected" : ""}>${esc(s.name)} · ${esc(showDates(s))}</option>`).join("")}</select></label>`;
}
// The "Where" a new sale starts with when a show is happening today.
const showSaleDefault = (c) => (sellerOn() && !isInherited(c) ? whereFromShow(showToday()) : null);
document.addEventListener("change", (e) => {
  if (e.target.id !== "showId") return;
  const f = e.target.closest("#sellForm"), s = getShow(e.target.value), w = whereFromShow(s);
  if (!f || !w || f.elements.whereType.value) return; // never change a "Where" already picked
  f.elements.whereType.value = w.whereType;
  f.elements.whereType.dispatchEvent(new Event("change", { bubbles: true }));
  if (f.elements.whereDetail && w.whereDetail) f.elements.whereDetail.value = w.whereDetail;
});

function showCard(s) {
  const st = showStats(s);
  return `<button class="card" style="display:block;width:100%;text-align:left" data-go="show-${esc(s.id)}">
    <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(s.name)}</b><span class="num ${st.att ? "muted" : signCls(st.profit)}">${st.att ? "Attendee" : st.n || st.costs ? (st.profit >= 0 ? "+" : "") + money(st.profit) : ""}</span></div>
    <div class="small muted">${esc(showKindText(s.type))} · ${esc(showDates(s))}${s.place ? " · " + esc(s.place) : ""} · ${st.n} sold</div></button>`;
}
function viewShows() {
  const shows = allShows();
  return `<h1>Shows</h1>
    <div class="small muted" style="margin-bottom:10px">Coin shows, Whatnot lives and eBay Lives. Add one, then pick it when you mark a coin sold to see your profit for the show.</div>
    <div class="small" style="margin-bottom:10px"><a href="https://www.google.com/search?q=coin+shows+near+me" target="_blank" rel="noopener">Find coin shows near you</a> <span class="muted">(opens a web search; the app can't keep its own show list up to date)</span></div>
    <button class="btn primary block" data-act="showNew">+ New show</button>
    <div style="margin-top:12px">${shows.length ? shows.map(showCard).join("") : `<div class="card empty">No shows yet. Tap <b>+ New show</b>.</div>`}</div>`;
}
function viewShow(r) {
  const s = getShow(r.id);
  if (!s) return `<div class="card empty">That show isn't here. <button class="link-btn" data-go="shows">Back to Shows</button></div>`;
  const st = showStats(s);
  const line = (k, v, cls) => `<div class="rowline"><span>${k}</span><span class="${cls || ""}">${v}</span></div>`;
  const costLines = SHOW_COSTS.filter(([k]) => num(s.costs && s.costs[k])).map(([k, label]) => `<div class="rowline small muted"><span>&nbsp;&nbsp;${label}</span><span>${money(num(s.costs[k]))}</span></div>`).join("");
  return `<button class="link-btn" data-go="shows">← Shows</button>
    <h1 style="margin-top:10px">${esc(s.name)}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${esc(showKindText(s.type))} · ${esc(showDates(s))}${s.place ? " · " + esc(s.place) : ""}</div>
    ${st.att ? `<div class="card"><b>Going as an attendee</b>${line("Coins sold here", String(st.n))}${st.costs ? line("Show costs", money(st.costs, "$0.00")) : ""}${costLines}<div class="hint">No table fee or profit math for attendee shows.</div></div>` : `<div class="card"><b>Profit for the show</b>
      ${line("Sales (" + st.n + " sold)", money(st.sales, "$0.00"))}
      ${line("Coin cost", "− " + money(st.cost, "$0.00"))}
      ${line("Fees", "− " + money(st.fees, "$0.00"))}
      ${st.ship ? line("Shipping and insurance paid", "− " + money(st.ship, "$0.00")) : ""}
      ${line("Show costs", "− " + money(st.costs, "$0.00"))}${costLines}
      ${line("<b>Profit</b>", `<b>${st.profit >= 0 ? "" : "− "}${money(Math.abs(st.profit), "$0.00")}</b>`, signCls(st.profit))}
      ${st.costs ? (() => { const left = r2(-st.profit); return left > 0 ? `<div class="hint"><b>Sell ${money(left, "$0.00")} more to cover show costs.</b> That is profit after coin cost and fees.</div>` : `<div class="hint"><b class="pos">Show costs covered.</b></div>`; })() : ""}
      ${st.tax ? `<div class="hint">Sales tax collected: ${money(st.tax)}. It isn't profit.</div>` : ""}</div>`}
    <h2 style="margin:12px 0 6px">Sold here</h2>
    <div class="card">${st.cs.length ? st.cs.map((c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${qtyOf(c) > 1 ? "×" + qtyOf(c) + " · " : ""}Paid ${costOf(c) == null ? "—" : money(costOf(c))}</span></span><span class="coin-val">${money(saleMoneyIn(c))}</span></button>`).join("") : `<div class="small muted">Nothing sold here yet. When you mark a coin sold, pick this show.</div>`}</div>
    <div class="btn-row"><button class="btn" data-act="showEdit" data-id="${esc(s.id)}">Edit show</button><button class="btn danger" data-act="showDelete" data-id="${esc(s.id)}">Delete show</button></div>`;
}
function showForm(s) {
  const cur = s || { type: "coinshow", start: today(), costs: {} };
  const mon = (k, label) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="0.01" min="0" name="c_${k}" placeholder="$" value="${esc((cur.costs || {})[k] == null ? "" : cur.costs[k])}"></label>`;
  openSheet(`<div class="sheet-head"><h2>${s ? "Edit show" : "New show"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="showForm" data-id="${s ? esc(s.id) : ""}" autocomplete="off">
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(s ? s.name : "")}" placeholder="e.g. Baltimore Expo" maxlength="60" required></label>
    <label class="f"><span>Going as</span><select name="role" id="showRole"><option value="seller" ${cur.role !== "attendee" ? "selected" : ""}>Seller (I have a table or I'm live)</option><option value="attendee" ${cur.role === "attendee" ? "selected" : ""}>Attendee (just visiting)</option></select></label>
    <div class="grid2"><label class="f"><span>Kind</span><select name="type">${SHOW_KINDS.map(([k, t]) => `<option value="${k}" ${cur.type === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    <label class="f"><span>Place</span><input type="text" name="place" value="${esc(cur.place || "")}" placeholder="City, or app" maxlength="60"></label></div>
    <div class="grid2"><label class="f"><span>First day</span><input type="date" name="start" value="${esc(cur.start || "")}" required></label>
    <label class="f"><span>Last day <span class="muted small">(if more than one)</span></span><input type="date" name="end" value="${esc(cur.end || "")}"></label></div>
    <b class="small">What the show cost you</b>
    <div class="grid2"><span id="tableFeeBox" ${cur.role === "attendee" ? "hidden" : ""}>${mon("table", "Table fee")}</span>${mon("gas", "Gas / mileage")}</div>
    <div class="grid2">${mon("hotel", "Hotel")}${mon("food", "Food")}</div>${mon("other", "Other")}
    <div class="btn-row"><button type="submit" class="btn primary">${s ? "Save" : "Add show"}</button><button type="button" class="btn" data-act="closeSheet">Cancel</button></div></form>`, "sheet-75");
}
function saveShowForm(form) {
  const f = new FormData(form); let id = form.dataset.id;
  const name = String(f.get("name") || "").trim(), start = String(f.get("start") || ""), end = String(f.get("end") || "");
  if (!name || !start) { toast("Add a name and the first day."); return; }
  if (end && end < start) { toast("The last day can't be before the first day."); return; }
  const old = id && getShow(id), before = old ? JSON.parse(JSON.stringify(old)) : null;
  if (!old) id = uid();
  const costs = {};
  const role = f.get("role") === "attendee" ? "attendee" : "seller";
  SHOW_COSTS.forEach(([k]) => { const v = num(f.get("c_" + k)); if (v != null && v >= 0 && !(role === "attendee" && k === "table")) costs[k] = v; });
  const rec = { ...(old || { kind: "show", id, createdAt: Date.now() }), name, start, type: SHOW_KINDS.some((x) => x[0] === f.get("type")) ? f.get("type") : "coinshow", place: String(f.get("place") || "").trim(), role, costs };
  if (end && end !== start) rec.end = end; else delete rec.end;
  put("sh_" + rec.id, rec);
  closeSheet();
  toast(old ? "Show saved." : "Show added.", old ? { label: "Undo", fn: () => put("sh_" + before.id, before) } : undefined);
  if (!old) go("show-" + id);
}
document.addEventListener("submit", (e) => { if (e.target.id === "showForm") saveShowForm(e.target); });
document.addEventListener("change", (e) => { if (e.target.id === "showRole") { const b = document.getElementById("tableFeeBox"); if (b) b.hidden = e.target.value === "attendee"; } });

Object.assign(actions, {
  caseOut: (el) => { const c = getCoin(el.dataset.id); if (c && c.status === "owned") caseReturn([c], labelOf(c) + " taken out."); },
  caseReturnAll: (el) => {
    const b = getBox(el.dataset.id), cs = b ? boxCoins(b) : [];
    if (!cs.length) { toast("Nothing in this case."); return; }
    caseReturn(cs, "Returned " + cs.length + " coin" + (cs.length > 1 ? "s" : "") + ".");
  },
  caseUndo: () => {
    if (!caseLast) return;
    caseLast.before.forEach((c) => put("c_" + c.id, c, true));
    caseLast = null; closeSheet(); render(); toast("Undone.");
  },
  caseAskOpen: (el) => {
    const b = getBox(el.dataset.id); if (!b) return;
    const cs = caseUnpriced(b), p = pricingRates();
    const n = (k) => cs.filter((c) => suggestAsk(c)[k] != null).length;
    if (!cs.length) { toast("Every coin for sale in this case already has a price."); return; }
    const btn = (k, label) => `<button class="btn block" style="margin-top:8px" data-act="caseAskGo" data-id="${esc(b.id)}" data-pick="${k}" ${n(k) ? "" : "disabled"}>${label} (${n(k)} of ${cs.length} coins)</button>`;
    openSheet(`<div class="sheet-head"><h2>Set asking price for all</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small">Only coins <b>with no price yet</b> get one. Prices you already set stay. One Undo puts everything back.</p>
      ${btn("book", "Red Book × " + pctText(p.bookPct) + "%")}${btn("melt", "Melt + " + pctText(p.meltPct) + "%")}
      <div class="hint">A coin with no Red Book value or metal content is skipped. Change the percentages in Options → Selling.</div>`);
  },
  caseAskGo: (el) => {
    const b = getBox(el.dataset.id), k = el.dataset.pick; if (!b) return;
    const before = [], skipped = [];
    caseUnpriced(b).forEach((c0) => {
      const v = suggestAsk(c0)[k];
      if (v == null) { skipped.push(c0); return; }
      before.push(c0); put("c_" + c0.id, { ...JSON.parse(JSON.stringify(c0)), ask: String(v) }, true);
    });
    caseLast = { before };
    closeSheet(); render();
    toast("Set " + before.length + " price" + (before.length === 1 ? "" : "s") + (skipped.length ? ", skipped " + skipped.length + " with no suggestion" : "") + ".", before.length ? { label: "Undo", fn: actions.caseUndo } : undefined);
  },
  showNew: () => showForm(null),
  showEdit: (el) => { const s = getShow(el.dataset.id); if (s) showForm(s); },
  showDelete: (el) => {
    const s = getShow(el.dataset.id);
    if (!s) return;
    const n = showSales(s).length;
    confirmSheet("Delete " + s.name + "?", n ? "Its " + n + " sale" + (n > 1 ? "s stay" : " stays") + " in your records. They just aren't tied to a show." : "No sales are tied to this show.", "Delete show", () => {
      const copy = JSON.parse(JSON.stringify(s));
      remove("sh_" + s.id);
      go("shows");
      toast("Show deleted.", { label: "Undo", fn: () => { put("sh_" + copy.id, copy); toast("Restored."); } });
    });
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["caseOut", "caseReturnAll", "caseUndo", "caseAskOpen", "caseAskGo", "showNew", "showEdit", "showDelete"].forEach((a) => SNAPSHOT_BLOCK.add(a));

// The Shows item in the main menu only appears with Seller Mode on.
function syncShowsMenu() { const st = $("#menuStacks"); if (st) st.hidden = !hasStackItem(); const m = $("#menuShows"); if (m) m.hidden = !sellerOn(); const r = $("#menuReports"); if (r) r.hidden = !sellerOn(); const g = $("#menuBiz"); if (g) g.hidden = !sellerOn(); if (typeof syncLevelMenu === "function") syncLevelMenu(); }
