/* Step 4.6: add many identical coins at once.
   On Add coin, "How many separate coins?" (1 to 100). Everything filled in is copied to each coin; each saves as its own coin
   with its own ID. Price is per coin or a group total (split to the cent, any leftover on the first coin). Tax, shipping and
   fees are for the whole group, so they are split the same way. One photo is shared. Not offered for albums (each spot differs). */
const MANY_MAX = 100;
const canMany = (d) => !!d && d._isNew && itemOf(d) === "coin" && !d._stay && !d._replaces && !d.albumId;
function manyCount(d) {
  if (!canMany(d)) return 1;
  const n = Math.floor(num(d._many) || 1);
  return Math.max(1, Math.min(MANY_MAX, n));
}
const manyOn = (d) => manyCount(d) > 1;

// The "How many?" box in Quantity, value and metal.
function manyField(d) {
  if (!canMany(d)) return "";
  const n = manyCount(d);
  return `<label class="f"><span>How many separate coins?</span><input type="number" inputmode="numeric" min="1" max="${MANY_MAX}" data-f="_many" data-rerender value="${esc(n)}"></label>
    <div class="hint">${n > 1 ? "Each of the " + n + " coins is saved on its own, with its own ID, so Quantity stays 1. They all share this form and photo." : "Have lots of the same coin? Enter how many and they are all added at once (up to " + MANY_MAX + ")."}</div>`;
}
// Price: per coin or one total for the group.
// One coin entry with Quantity above 1 (not "many separate coins"): is the price each, or for the whole lot?
const lotTotal = (d) => !manyOn(d) && qtyOf(d) > 1 && d._payMode === "total";
const lotEach = (d) => { const p = num(d.paid); return p == null ? "" : String(Math.round(p / qtyOf(d) * 10000) / 10000); }; // saved as price each
function lotPayFields(d) {
  if (manyOn(d)) return "";
  const t = lotTotal(d); // always drawn, hidden until Quantity is above 1, so typing the quantity never redraws the form
  return `<div id="lotBox" ${qtyOf(d) > 1 ? "" : "hidden"}><label class="f"><span>Price is</span><select data-f="_payMode" data-rerender><option value="each" ${t ? "" : "selected"}>Each</option><option value="total" ${t ? "selected" : ""}>For the whole lot</option></select></label>
    <div class="hint" id="lotHint">${lotHintText(d)}</div></div>`;
}
function lotHintText(d) {
  const p = num(d.paid), q = qtyOf(d);
  if (p == null || !(q > 1) || manyOn(d)) return "";
  return "Total: " + money(lotTotal(d) ? p : r2(p * q)) + " for " + q;
}
function manyPayFields(d) {
  if (!manyOn(d)) return lotPayFields(d);
  const total = d._payMode === "total";
  return `<label class="f"><span>The price I entered is</span><select data-f="_payMode" data-rerender><option value="each" ${total ? "" : "selected"}>Per coin</option><option value="total" ${total ? "selected" : ""}>Total for the group</option></select></label>`;
}
const paidLabel = (d) => (manyOn(d) && d._payMode === "total" ? "Paid, total for all " + manyCount(d) : lotTotal(d) ? "Paid, total for the whole lot" : "Paid each");

// Box spots: tap the spots in order. A tap on a placed coin takes it back out.
const spotKey = (r, s) => r + "-" + s;
function manySpots(d, b) {
  const n = manyCount(d);
  const tn = trayCount(b);
  if (tn > 1 && !(+d.boxTray >= 1 && +d.boxTray <= tn)) d.boxTray = "1";
  const tray = tn > 1 ? +d.boxTray : 1, L = trayOf(b, tray);
  const sig = d.boxId + "/" + tray; // a different box or tray starts with no spots picked
  if (d._spotsFor !== sig) { d._spotsFor = sig; d._spots = []; }
  d._spots = (d._spots || []).slice(0, n);
  const chosen = d._spots, free = [];
  for (let r = 1; r <= L.rows; r++) for (let s = 1; s <= L.perRow; s++) if (!spotCoin(b.id, r, s, undefined, tray)) free.push(spotKey(r, s));
  const cells = [];
  for (let r = 1; r <= L.rows; r++) for (let s = 1; s <= L.perRow; s++) {
    const k = spotKey(r, s), taken = spotCoin(b.id, r, s, undefined, tray), at = chosen.indexOf(k);
    cells.push(`<button type="button" class="btn" data-act="manySpot" data-r="${r}" data-s="${s}" ${taken ? "disabled" : ""}
      style="padding:4px 0;font-size:11px;min-height:34px;overflow:hidden;${at >= 0 ? "background:#2f6f3e;color:#fff;font-weight:700" : ""}${taken ? "opacity:.45" : ""}"
      title="${lineWord(b)} ${r}, slot ${s}">${at >= 0 ? at + 1 : taken ? esc(slotDate(taken)) : s}</button>`);
  }
  const short = free.length < n;
  return `<div class="card" style="margin:8px 0"><b>Place the coins in ${esc(b.name)}</b>${trayPick(d, b)}
    <div class="hint">Tap spots in the order the coins sit. Tap a green spot to take it back out. Gray spots are already used. ${lineWord(b)}s run top to bottom, slots left to right.</div>
    ${short ? `<div class="hint"><b>This box has only ${free.length} free spot${free.length === 1 ? "" : "s"}.</b> Lower the number, or pick another box.</div>` : ""}
    <div class="small" style="margin:6px 0"><b>${chosen.length} of ${n}</b> placed</div>
    <div style="display:grid;grid-template-columns:repeat(${L.perRow},minmax(0,1fr));gap:3px">${cells.join("")}</div>
    <div class="btn-row" style="margin-top:8px"><button type="button" class="btn" data-act="manyFill" ${short || chosen.length >= n ? "disabled" : ""}>Fill the rest for me</button>
      <button type="button" class="btn" data-act="manyClearSpots" ${chosen.length ? "" : "disabled"}>Clear spots</button></div></div>`;
}
function manyRedraw() { const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; }
Object.assign(actions, {
  manySpot: (el) => {
    const b = getBox(draft.boxId), n = manyCount(draft);
    if (!b) return;
    const k = spotKey(+el.dataset.r, +el.dataset.s), at = (draft._spots || []).indexOf(k);
    draft._spots = draft._spots || [];
    if (at < 0 && spotCoin(b.id, +el.dataset.r, +el.dataset.s, undefined, +draft.boxTray || 1)) { toast("That spot already holds a coin."); return; }
    if (at >= 0) draft._spots.splice(at, 1);
    else if (draft._spots.length >= n) { toast("All " + n + " spots are picked. Tap a green spot to take it back out."); return; }
    else draft._spots.push(k);
    manyRedraw();
  },
  manyFill: () => {
    const b = getBox(draft.boxId), n = manyCount(draft);
    if (!b) return;
    const have = new Set(draft._spots || []);
    const tr = trayCount(b) > 1 ? +draft.boxTray || 1 : 1, L = trayOf(b, tr);
    for (let r = 1; r <= L.rows && have.size < n; r++) for (let s = 1; s <= L.perRow && have.size < n; s++) {
      const k = spotKey(r, s);
      if (!have.has(k) && !spotCoin(b.id, r, s, undefined, tr)) { have.add(k); draft._spots.push(k); }
    }
    if (have.size < n) toast("Not enough free spots in this box.");
    manyRedraw();
  },
  manyClearSpots: () => { draft._spots = []; manyRedraw(); },
});

// Checked when the form is saved. Returns a plain-words problem, or "" if fine. Also puts the first spot on `c` so the usual box check can run.
function manyPrep(c, d) {
  const n = manyCount(d), b = c.boxId && getBox(c.boxId);
  if (!b || !hasSpots(b)) return "";
  const spots = (d._spots || []).slice(0, n);
  if (spots.length < n) return "Tap " + (n - spots.length) + " more spot" + (n - spots.length === 1 ? "" : "s") + " in " + b.name + ", or press Fill the rest for me.";
  const seen = new Set(), tn = trayCount(b), tr = tn > 1 ? +d.boxTray || 1 : 1, L = trayOf(b, tr);
  for (const k of spots) {
    const [r, s] = k.split("-").map(Number);
    if (!(r >= 1 && r <= L.rows && s >= 1 && s <= L.perRow)) return "One of the chosen spots is outside the box. Clear the spots and pick again.";
    if (seen.has(k)) return "A spot was picked twice. Clear the spots and pick again.";
    seen.add(k);
    const o = spotCoin(b.id, r, s, undefined, tr);
    if (o) return lineWord(b) + " " + r + ", slot " + s + " already holds " + labelOf(o) + ". Pick another spot.";
  }
  const [r0, s0] = spots[0].split("-");
  c.boxRow = r0; c.boxSlot = s0;
  if (tn > 1) c.boxTray = String(tr);
  return "";
}
// Split an amount (dollars) into n parts to the cent. Any leftover cents go on the first part.
function splitCents(amount, n) {
  const total = Math.round(amount * 100), base = Math.floor(total / n), rem = total - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + rem : base) / 100);
}
const moneyStr = (x) => String(Math.round(x * 100) / 100);

// Save n coins from the finished form record `c`.
async function manySave(c, d) {
  const n = manyCount(d), b = c.boxId && getBox(c.boxId);
  const spots = b && hasSpots(b) ? (d._spots || []).slice(0, n) : [];
  const paid = num(c.paid), total = d._payMode === "total";
  const paidParts = paid == null ? null : splitCents(paid, n);
  const extra = {};
  BUY_EXTRAS.forEach((k) => { const v = num(c[k]); extra[k] = v == null ? null : splitCents(v, n); });
  const base = Date.now(), ids = [];
  for (let i = 0; i < n; i++) {
    const x = JSON.parse(JSON.stringify(c)); // its own copy of every list, so editing one coin never changes another
    x.id = uid(); delete x.cid; x.qty = 1; x.createdAt = base + i;
    if (paidParts) x.paid = total ? moneyStr(paidParts[i]) : moneyStr(paid);
    BUY_EXTRAS.forEach((k) => { if (extra[k]) x[k] = moneyStr(extra[k][i]); });
    if (spots[i]) { const [r, s] = spots[i].split("-"); x.boxRow = r; x.boxSlot = s; }
    await saveCoin(x);
    ids.push(x.id);
  }
  if (typeof ensureIds === "function") ensureIds();
  const first = getCoin(ids[0]), last = getCoin(ids[n - 1]);
  toast("Added " + n + " coins" + (first && last && first.cid ? " (" + first.cid + " to " + last.cid + ")" : "") + ".", {
    label: "Undo", fn: () => { ids.forEach((id) => remove("c_" + id)); toast("Removed all " + n + " coins."); go("coins"); },
  });
  go("coins");
}
