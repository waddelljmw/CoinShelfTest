// Step 26 (idea 138): Purchases. One receipt, many coins.
// A purchase is a record "pu_<id>": { kind:"purchase", id, createdAt, date, source, seller, total, tax, ship, payMethod, receiptNo, notes, receiptPhotos }.
// A coin points to it with purchaseId. The coin keeps its own price, date, store and costs (all reports read those),
// so the purchase fills them in on save; the coin's price row is the coin's own "Paid each".
// receiptPhotos uses the same name as on coins, so backup, restore and the photo clean-up see it (R9 rule, report 30).
// Snapshots leave purchases out (snapshot.js keeps only the record kinds it needs).

const getPurchase = (id) => (id ? store.docs.get("pu_" + id) : null);
const allPurchases = () => [...store.docs.values()].filter((d) => d && d.kind === "purchase").sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || (b.createdAt || 0) - (a.createdAt || 0));
const purchaseCoins = (p) => (p ? allCoins().filter((c) => c.status !== "deleted" && c.purchaseId === p.id && !(typeof isBrokenSet === "function" && isBrokenSet(c))) : []);
const purchaseCoinTotal = (cs) => r2(sum(cs, (c) => (num(c.paid) || 0) * qtyOf(c)));
// Plain date ("Nov 24, 2026"). A receipt with no store is named "Receipt, <date>".
const plainDate = (v) => { if (!v) return ""; const d = new Date(/^\d{4}-\d\d-\d\d$/.test(v) ? v + "T12:00:00" : v); return isNaN(d) ? String(v) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
const purchaseName = (p) => [p.seller || "Receipt", plainDate(p.date) || "No date"].join(", ");
const noPriceCount = (cs) => cs.filter((c) => num(c.paid) == null).length;
const noPriceText = (n) => (n ? n + (n === 1 ? " coin has" : " coins have") + " no price yet" : "");
// Coins that were not bought can't go on a receipt: Inherited, Gift, Pocket change, Coin roll hunting.
const purchaseOk = (c) => c && c.status !== "deleted" && !isInherited(c) && String(c.source || "").trim().toLowerCase() !== "gift" && !(typeof isFaceSource === "function" && isFaceSource(c));
const PURCHASE_SOURCES = () => (typeof sourceOptions === "function" ? sourceOptions() : SOURCE_DEFAULTS).filter((s) => !["inherited", "gift", "pocket change", "coin roll hunting", "bank roll"].includes(String(s).toLowerCase()));

// Tax splits by price (a $38 coin carries more than a $7 one); shipping splits evenly. Pennies go to the last coin so it adds up exactly.
function splitTax(total, weights) {
  const t = num(total); if (t == null || !weights.length) return weights.map(() => null);
  const all = sum(weights, (w) => w);
  const out = weights.map((w) => (all > 0 ? Math.floor((t * w / all) * 100) / 100 : Math.floor((t / weights.length) * 100) / 100));
  out[out.length - 1] = r2(t - sum(out.slice(0, -1), (x) => x));
  return out;
}
function splitEven(total, n) {
  const t = num(total); if (t == null || !n) return Array(n).fill(null);
  const each = Math.floor((t / n) * 100) / 100, out = Array(n).fill(each);
  out[n - 1] = r2(t - each * (n - 1));
  return out;
}

/* ---------- pages ---------- */
function viewPurchases() {
  const ps = allPurchases();
  return `<h1>Purchases</h1>
    <p class="small muted" style="margin-top:-4px">One receipt, many coins. Enter it once, tick the coins.</p>
    <button class="btn primary block" data-act="purchaseNew">+ New purchase</button>
    ${ps.length ? ps.map((p) => { const cs = purchaseCoins(p); return `<button class="card" style="display:block;width:100%;text-align:left;margin-top:10px" data-go="purchase-${esc(p.id)}">
      <div class="rowline"><b>${esc(purchaseName(p))}</b><span class="num">${money(purchaseCoinTotal(cs))}</span></div>
      <div class="small muted">${cs.length} coin${cs.length === 1 ? "" : "s"}${(p.receiptPhotos || []).length ? " · receipt photo" : ""}${noPriceCount(cs) ? ` · <span style="color:var(--bad)">${esc(noPriceText(noPriceCount(cs)))}</span>` : ""}</div></button>`; }).join("")
    : `<div class="card empty" style="margin-top:10px">No purchases yet. Tap + New purchase and start with your newest receipt.</div>`}`;
}
function viewPurchase(r) {
  const p = getPurchase(r.id);
  if (!p) return `<div class="card empty">That purchase isn't here. <button class="link-btn" data-go="purchases">Back to Purchases</button></div>`;
  const cs = purchaseCoins(p), coins = purchaseCoinTotal(cs);
  const row = (k, v) => (v == null || v === "" ? "" : `<div class="rowline"><span class="muted">${k}</span><span class="num" style="text-align:right">${v}</span></div>`);
  const tax = num(p.tax), ship = num(p.ship), total = num(p.total);
  return `<button class="link-btn" data-go="purchases">← Purchases</button>
    <h1 style="margin-top:10px">${esc(purchaseName(p))}</h1>
    ${(p.receiptPhotos || []).length ? `<div class="detail-photos">${p.receiptPhotos.map((ph) => `<img src="${esc(photoSrc(ph))}" alt="Receipt photo">`).join("")}</div>` : ""}
    <div class="card">${row("Date", esc(plainDate(p.date)))}${row("Where from", esc(p.source))}${row("Store or seller", esc(p.seller))}
      ${row("Coins", money(coins) + (noPriceCount(cs) ? `<br><span class="small" style="color:var(--bad)">${esc(noPriceText(noPriceCount(cs)))}</span>` : ""))}${row("Tax on the coins", tax == null ? null : money(tax))}${row("Shipping for the coins", ship == null ? null : money(ship))}
      ${row("Receipt total (for your records)", total == null ? null : money(total))}${row("Paid with", esc(p.payMethod))}${row("Receipt number", esc(p.receiptNo))}${row("Notes", esc(p.notes))}</div>
    <h2>Coins on this receipt (${cs.length})</h2>
    ${cs.length ? `<div class="card">${cs.map((c) => `<div class="rowline"><button class="link-btn" data-go="coin-${esc(c.id)}">${esc(labelOf(c))}${qtyOf(c) > 1 ? " ×" + qtyOf(c) : ""}</button><span class="num">${money(num(c.paid))}</span></div>`).join("")}</div>` : `<div class="card empty">No coins yet. Tap Edit to tick the coins on this receipt.</div>`}
    <div class="btn-row" style="margin-top:12px"><button class="btn primary" data-act="purchaseEdit" data-id="${esc(p.id)}">Edit</button><button class="btn danger" data-act="purchaseDelete" data-id="${esc(p.id)}">Delete</button></div>`;
}
// The Receipt row inside the coin page's Purchase box: plain date, link to the receipt.
function coinReceiptRow(c, row) {
  const p = c && getPurchase(c.purchaseId);
  if (!p) return "";
  const n = purchaseCoins(p).length;
  return row("Receipt", `<button class="link-btn" data-go="purchase-${esc(p.id)}">${esc(plainDate(p.date) || "No date")}${p.seller ? " · " + esc(p.seller) : ""}${n > 1 ? " · " + n + " coins" : ""} ›</button>`);
}
// In the coin form's Purchase details.
function coinPurchaseField(d) {
  const p = getPurchase(d.purchaseId);
  if (p) return `<div class="hint">🧾 Part of purchase <b>${esc(purchaseName(p))}</b>. Change the receipt in Menu › Purchases.</div>`;
  if (d._isNew || !purchaseOk(d)) return "";
  return `<button type="button" class="link-btn" data-act="purchasePickForCoin">🧾 Add to a purchase</button>`;
}

// E1-11: pick coins straight from an album's pages. Ticks wait until "Add ticked coins" (or Save), so the list never jumps.
const purchaseAlbums = () => albums().filter((a) => ownedCoins().some((c) => c.albumId === a.id));
function purchaseAlbumCoins(aid) {
  const al = getAlbum(aid); if (!al) return [];
  const st = albumStats(al), out = [];
  st.all.forEach((s) => { const c = st.filled.get(slotKey(s)); if (c) out.push({ c, spot: s.blank ? blankCoinLabel(c) : slotLabel(s) + (s.v ? " " + s.v : "") }); });
  st.coins.filter((c) => !out.some((o) => o.c.id === c.id)).forEach((c) => out.push({ c, spot: labelOf(c) }));
  return out;
}
function purchaseAlbumHtml() {
  const have = new Set(pd.items.map((x) => x.id));
  return purchaseAlbumCoins(pd._album).map(({ c, spot }) => {
    const other = c.purchaseId && c.purchaseId !== pd.id && getPurchase(c.purchaseId);
    const why = have.has(c.id) ? "On this receipt" : other ? "On " + purchaseName(other) : !purchaseOk(c) ? "Not bought (inherited, gift or pocket change)" : "";
    return `<label class="chk" style="min-height:44px;border-bottom:1px solid var(--line)"><input type="checkbox" data-pa="${esc(c.id)}" ${have.has(c.id) || pd._ticked.has(c.id) ? "checked" : ""} ${why ? "disabled" : ""}><span style="flex:1"><b>${esc(spot)}</b> <span class="small muted">${esc([gradeText(c), why].filter(Boolean).join(" · "))}</span></span></label>`;
  }).join("") || `<div class="small muted">No coins in that album.</div>`;
}
const purchaseTickText = () => (pd._ticked && pd._ticked.size ? "Add " + pd._ticked.size + " ticked coin" + (pd._ticked.size === 1 ? "" : "s") : "Done adding");
function purchaseTakeTicked() {
  (pd._ticked || new Set()).forEach((id) => { const c = store.docs.get("c_" + id); if (c && !pd.items.some((x) => x.id === id)) { pd.items.push({ id, price: c.paid == null ? "" : String(c.paid) }); formTouched = true; } });
  pd._ticked = new Set();
}

/* ---------- the form ---------- */
let pd = null; // the purchase being entered
function purchaseFormOpen(p, firstCoin) {
  pd = p ? { ...JSON.parse(JSON.stringify(p)), items: purchaseCoins(p).map((c) => ({ id: c.id, price: c.paid == null ? "" : String(c.paid) })) }
    : { date: today(), source: "", seller: "", total: "", tax: "", ship: "", payMethod: "", receiptNo: "", notes: "", receiptPhotos: [], items: [] };
  if (firstCoin && !pd.items.some((x) => x.id === firstCoin.id)) pd.items.push({ id: firstCoin.id, price: firstCoin.paid == null ? "" : String(firstCoin.paid) });
  pd._q = ""; pd._pick = false; pd._album = ""; pd._ticked = new Set();
  renderPurchaseForm();
}
function purchaseSummary() {
  const items = pd.items.map((x) => ({ x, c: store.docs.get("c_" + x.id) })).filter((o) => o.c);
  const coins = r2(sum(items, (o) => (num(o.x.price) || 0) * qtyOf(o.c)));
  const tax = num(pd.tax) || 0, ship = num(pd.ship) || 0, all = r2(coins + tax + ship), total = num(pd.total);
  const np = noPriceCount(items.map((o) => ({ paid: o.x.price })));
  let s = `Coins on this receipt: <b>${money(coins)}</b>${np ? ` <span style="color:var(--bad)">· ${esc(noPriceText(np))}</span>` : ""}`;
  if (tax || ship) s += ` + ${[tax ? "tax " + money(tax) : "", ship ? "shipping " + money(ship) : ""].filter(Boolean).join(" + ")} = <b>${money(all)}</b>`;
  if (total != null && total > all) s += `<br><span class="muted">Other items on the receipt: ${money(r2(total - all))} (not counted)</span>`;
  return s;
}
function purchasePickerHtml() {
  const q = String(pd._q || "").trim().toLowerCase();
  const have = new Set(pd.items.map((x) => x.id));
  const list = allCoins().filter((c) => purchaseOk(c) && !have.has(c.id) && (!q || [labelOf(c), c.cid, c.year].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => (!!a.purchaseId - !!b.purchaseId) || (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 30);
  return list.length ? list.map((c) => { const other = c.purchaseId && c.purchaseId !== pd.id && getPurchase(c.purchaseId);
    return `<div class="rowline"><span>${esc(labelOf(c))}${c.cid ? ` <span class="muted small">${esc(c.cid)}</span>` : ""}${other ? `<br><span class="muted small">On ${esc(purchaseName(other))}</span>` : ""}</span>${other ? "" : `<button type="button" class="btn" data-act="purchaseAddCoin" data-id="${esc(c.id)}">Add</button>`}</div>`; }).join("")
    : `<div class="small muted">${q ? "No coin matches. Try fewer letters." : "No coins to add."}</div>`;
}
function renderPurchaseForm() {
  if (!pd) return;
  const keep = $("#sheet").hidden ? 0 : ($(".sheet") || {}).scrollTop || 0;
  const v = (k) => esc(pd[k] == null ? "" : String(pd[k]));
  const money$ = (k, label) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="0.01" min="0" data-pf="${k}" value="${v(k)}" placeholder="$"></label>`;
  const srcs = PURCHASE_SOURCES();
  const items = pd.items.map((x, i) => ({ x, i, c: store.docs.get("c_" + x.id) })).filter((o) => o.c);
  openSheet(`<div class="sheet-head"><h2>${pd.id ? "Edit purchase" : "New purchase"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="purchaseForm" autocomplete="off" onsubmit="return false">
    <div class="photos">${(pd.receiptPhotos || []).map((ph, i) => `<div class="ph"><img src="${esc(photoSrc(ph))}" alt=""><button type="button" class="rm" data-act="purchaseRmPhoto" data-i="${i}" aria-label="Remove receipt photo">✕</button></div>`).join("")}</div>
    <label class="btn file-btn" style="display:inline-block;margin-bottom:8px">${(pd.receiptPhotos || []).length ? "Add another receipt photo" : "📷 Receipt photo"}<input type="file" accept="image/*" id="purchaseReceipt"></label>
    <div class="grid2"><label class="f"><span>Date</span><input type="date" data-pf="date" value="${v("date")}" max="${today()}"></label>
    <label class="f"><span>Receipt total <span class="muted small">(optional)</span></span><input type="number" inputmode="decimal" step="0.01" min="0" data-pf="total" value="${v("total")}" placeholder="$"></label></div>
    <div class="grid2"><label class="f"><span>Where from</span><select data-pf="source"><option value="">Choose…</option>${srcs.concat(pd.source && !srcs.includes(pd.source) ? [pd.source] : []).map((s) => `<option ${pd.source === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
    <label class="f"><span>Store or seller <span class="muted small">(optional)</span></span><input type="text" data-pf="seller" data-suggest="seller" value="${v("seller")}" placeholder="Main Street Coins" maxlength="60"></label></div>
    <div class="hint" style="margin-top:-4px">Each coin keeps its own Where from. The receipt fills it in only where a coin has none, and asks before changing one.</div>
    <details open><summary class="small">Tax, shipping, paid with, receipt number</summary>
      <div class="grid2">${money$("tax", "Tax on the coins")}${money$("ship", "Shipping for the coins")}</div>
      <div class="hint">Only the coins' part. Leave tax blank if there was none. Tax splits by price, shipping splits evenly.</div>
      <div class="grid2"><label class="f"><span>Paid with</span><select data-pf="payMethod"><option value="">Choose…</option>${PAY_METHODS.concat(pd.payMethod && !PAY_METHODS.includes(pd.payMethod) ? [pd.payMethod] : []).map((x) => `<option ${pd.payMethod === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      <label class="f"><span>Receipt number</span><input type="text" data-pf="receiptNo" value="${v("receiptNo")}" maxlength="60"></label></div>
      <label class="f"><span>Notes</span><input type="text" data-pf="notes" value="${v("notes")}" maxlength="200"></label>
    </details>
    <h3 style="margin:14px 0 4px">Coins on this receipt</h3>
    ${items.length ? `<div class="card">${items.map(({ x, i, c }) => `<div class="rowline" style="gap:8px"><span style="flex:1">${esc(labelOf(c))}${qtyOf(c) > 1 ? ` <span class="muted small">×${qtyOf(c)}, price each</span>` : ""}</span>
      <input type="number" inputmode="decimal" step="0.01" min="0" data-pi="${i}" value="${esc(x.price)}" placeholder="$" style="width:6.5em" aria-label="Price for ${esc(labelOf(c))}">
      <button type="button" class="x" data-act="purchaseRmCoin" data-i="${i}" aria-label="Take ${esc(labelOf(c))} off this receipt">✕</button></div>`).join("")}</div>` : `<div class="small muted">No coins yet.</div>`}
    <button type="button" class="btn block" style="margin-top:8px" data-act="purchaseNewCoin">+ New coin on this receipt</button>
    ${pd._pick ? `<div class="card" style="margin-top:8px">${purchaseAlbums().length ? `<label class="f"><span>Look in</span><select id="purchaseAlbum"><option value="">All coins (search)</option>${purchaseAlbums().map((a) => `<option value="${esc(a.id)}" ${pd._album === a.id ? "selected" : ""}>Album: ${esc(albumTitle(a))}</option>`).join("")}</select></label>` : ""}${pd._album ? `<div id="purchasePick">${purchaseAlbumHtml()}</div>` : `<label class="f"><span>Find coins you already entered</span><input type="search" id="purchaseQ" value="${esc(pd._q)}" placeholder="1921 Morgan"></label><div id="purchasePick">${purchasePickerHtml()}</div>`}
      <button type="button" class="btn block" style="margin-top:6px" data-act="purchasePickDone">${purchaseTickText()}</button></div>`
      : `<button type="button" class="btn block" style="margin-top:8px" data-act="purchasePickOpen">🔍 Find coins I have</button>`}
    <div class="hint" id="purchaseSum" style="margin-top:10px">${purchaseSummary()}</div>
    <div class="btn-row sticky-save"><button type="button" class="btn primary" data-act="purchaseSave">Save</button>${pd.id ? "" : `<button type="button" class="btn" data-act="purchaseSave" data-next="1">Save + next receipt</button>`}</div>
  </form>`, "sheet-75");
  const sh = $(".sheet"); if (sh) sh.scrollTop = keep;
  if (pd._pick && pd._focusQ) { const q = $("#purchaseQ"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } pd._focusQ = false; }
}
// Typing updates the working copy without redrawing (the keyboard stays up).
document.addEventListener("input", (e) => {
  if (!pd || !e.target.closest || !e.target.closest("#purchaseForm")) return;
  const t = e.target;
  if (t.dataset.pf) pd[t.dataset.pf] = t.value;
  else if (t.dataset.pi != null) { const x = pd.items[+t.dataset.pi]; if (x) x.price = t.value; }
  else if (t.id === "purchaseQ") { pd._q = t.value; const box = $("#purchasePick"); if (box) box.innerHTML = purchasePickerHtml(); return; }
  const s = $("#purchaseSum"); if (s) s.innerHTML = purchaseSummary();
});
document.addEventListener("change", (e) => {
  if (!pd || !e.target.closest || !e.target.closest("#purchaseForm")) return;
  if (e.target.dataset.pf) pd[e.target.dataset.pf] = e.target.value;
  if (e.target.id === "purchaseAlbum") { pd._album = e.target.value; pd._q = ""; renderPurchaseForm(); }
  if (e.target.dataset.pa) {
    if (e.target.checked) pd._ticked.add(e.target.dataset.pa); else pd._ticked.delete(e.target.dataset.pa);
    formTouched = true; const b = $("[data-act=purchasePickDone]"); if (b) b.textContent = purchaseTickText();
  }
  if (e.target.id === "purchaseReceipt") purchaseAddPhoto([...e.target.files]);
});
// Receipts are kept small (about 100 KB): a receipt only has to be readable.
async function shrinkReceipt(file) {
  try {
    const bmp = await decodeImage(file);
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    let max = 1400, q = 0.7, blob = null;
    for (let i = 0; i < 4; i++) {
      const scale = Math.min(1, max / Math.max(w, h)), cv = document.createElement("canvas");
      cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      blob = await new Promise((res) => cv.toBlob((b) => res(b), "image/jpeg", q));
      if (!blob || blob.size <= 120000) break;
      max = Math.round(max * 0.8); q = Math.max(0.5, q - 0.05);
    }
    return blob || file;
  } catch (e) { return file; }
}
async function purchaseAddPhoto(files) {
  for (const f of files) {
    const blob = await shrinkReceipt(f);
    let ref = null;
    try {
      if (store.mode === "local") ref = { lid: await localAddPhoto(blob) };
      else if (store.mode === "db") { if (!assetsApi) { toast("Photos can't be saved from this view."); break; } ref = { id: (await assetsApi.upload(blob)).id }; }
      else ref = { url: URL.createObjectURL(blob) };
    } catch (e) { toast(e && e.name === "QuotaExceededError" ? "This device is out of space for photos." : "Couldn't save that photo."); }
    if (ref && pd) { pd.receiptPhotos = [...(pd.receiptPhotos || []), ref]; formTouched = true; }
  }
  renderPurchaseForm();
}

/* ---------- saving ---------- */
const PURCHASE_FIELDS = [["acquired", "Date"], ["source", "Where from"], ["seller", "Store"], ["paid", "Price each"], ["buyTax", "Tax"], ["buyShip", "Shipping"], ["payMethod", "Paid with"], ["receiptNo", "Receipt number"]];
const blankish = (v) => v == null || String(v).trim() === "";
const showVal = (k, v) => (blankish(v) ? "(empty)" : ["paid", "buyTax", "buyShip"].includes(k) ? money(num(v)) : k === "acquired" ? stampText(v).replace(/ @.*$/, "") : String(v));
// What the receipt would put on each coin: only boxes the purchase has a value for.
function purchasePlan() {
  const items = pd.items.map((x) => ({ x, c: store.docs.get("c_" + x.id) })).filter((o) => o.c);
  const taxes = splitTax(pd.tax, items.map((o) => (num(o.x.price) || 0) * qtyOf(o.c)));
  const ships = splitEven(pd.ship, items.length);
  return items.map((o, i) => {
    const want = { acquired: pd.date, source: pd.source, seller: String(pd.seller || "").trim(), paid: o.x.price, buyTax: taxes[i] == null ? "" : String(taxes[i]), buyShip: ships[i] == null ? "" : String(ships[i]), payMethod: pd.payMethod, receiptNo: String(pd.receiptNo || "").trim() };
    const changes = [], fills = {};
    PURCHASE_FIELDS.forEach(([k]) => {
      const nv = want[k]; if (blankish(nv)) return;
      const ov = o.c[k];
      if (blankish(ov)) fills[k] = String(nv);
      else if (String(ov) !== String(nv) && !(num(ov) != null && num(nv) != null && ["paid", "buyTax", "buyShip"].includes(k) && r2(num(ov)) === r2(num(nv)))) changes.push(k);
    });
    return { c: o.c, want, fills, changes, keep: false };
  });
}
let purchaseReview = null;
function purchaseSave(next) {
  if (!pd) return;
  purchaseTakeTicked();
  if (!pd.date) { toast("Add the date from the receipt."); return; }
  const plan = purchasePlan();
  if (plan.some((x) => x.changes.length)) { purchaseReview = { plan, next }; renderPurchaseReview(); return; }
  purchaseCommit(plan, next);
}
function renderPurchaseReview() {
  const { plan } = purchaseReview;
  const rows = plan.filter((x) => x.changes.length);
  openSheet(`<div class="sheet-head"><h2>These details will change</h2></div>
    <p class="small">${rows.length} coin${rows.length === 1 ? " already has" : "s already have"} different details. Pick for each coin. Empty boxes are filled in either way.</p>
    ${rows.map((x) => { const i = plan.indexOf(x); return `<div class="card" style="margin-top:8px"><b>${esc(labelOf(x.c))}</b>
      ${x.changes.map((k) => `<div class="small">${esc(PURCHASE_FIELDS.find((f) => f[0] === k)[1])}: <span class="muted">${esc(showVal(k, x.c[k]))}</span> → <b>${esc(showVal(k, x.want[k]))}</b></div>`).join("")}
      <div class="btn-row" role="radiogroup" style="margin-top:6px"><button type="button" class="btn ${x.keep ? "" : "primary"}" role="radio" aria-checked="${!x.keep}" data-act="purchaseKeep" data-i="${i}" data-keep="0">Use receipt info</button><button type="button" class="btn ${x.keep ? "primary" : ""}" role="radio" aria-checked="${x.keep}" data-act="purchaseKeep" data-i="${i}" data-keep="1">Keep coin's info</button></div></div>`; }).join("")}
    <div class="btn-row sticky-save"><button type="button" class="btn primary" data-act="purchaseCommit">Save purchase</button><button type="button" class="btn" data-act="purchaseBack">Back</button></div>`, "sheet-75");
}
function purchaseCommit(plan, next) {
  const old = pd.id ? getPurchase(pd.id) : null;
  const id = old ? old.id : uid();
  const rec = { ...(old || { kind: "purchase", id, createdAt: Date.now() }) };
  ["date", "source", "seller", "total", "tax", "ship", "payMethod", "receiptNo", "notes"].forEach((k) => { const v = String(pd[k] == null ? "" : pd[k]).trim(); if (v) rec[k] = v; else delete rec[k]; });
  rec.receiptPhotos = [...(pd.receiptPhotos || [])];
  const undo = { rec: old ? JSON.parse(JSON.stringify(old)) : null, id, coins: [] };
  const keepIds = new Set(plan.map((x) => x.c.id));
  // Coins taken off this receipt keep their details; only the link goes.
  purchaseCoins(old).filter((c) => !keepIds.has(c.id)).forEach((c) => { undo.coins.push(JSON.parse(JSON.stringify(c))); const n = JSON.parse(JSON.stringify(c)); delete n.purchaseId; put("c_" + c.id, n, true); });
  put("pu_" + id, rec, true);
  plan.forEach((x) => {
    undo.coins.push(JSON.parse(JSON.stringify(x.c)));
    const n = { ...JSON.parse(JSON.stringify(x.c)), ...x.fills, purchaseId: id };
    if (!x.keep) x.changes.forEach((k) => { n[k] = String(x.want[k]); });
    put("c_" + x.c.id, n, true);
  });
  const kept = { date: pd.date, source: pd.source, seller: pd.seller, _album: pd._album };
  formTouched = false; pd = null; purchaseReview = null;
  closeSheet();
  const n = plan.length;
  toast((old ? "Purchase saved" : "Purchase added") + (n ? " with " + n + " coin" + (n === 1 ? "" : "s") : "") + ".", { label: "Undo", fn: () => purchaseUndo(undo) });
  if (next) { purchaseFormOpen(null); Object.assign(pd, kept); renderPurchaseForm(); } // E1-11: the next receipt keeps date and store
  else go("purchase-" + id);
}
function purchaseUndo(u) {
  u.coins.forEach((c) => put("c_" + c.id, c, true));
  if (u.rec) put("pu_" + u.id, u.rec, true); else remove("pu_" + u.id);
  render(); toast("Put back.");
}

Object.assign(actions, {
  purchaseNew: () => purchaseFormOpen(null),
  purchaseEdit: (el) => { const p = getPurchase(el.dataset.id); if (p) purchaseFormOpen(p); },
  purchasePickOpen: () => { pd._pick = true; pd._focusQ = true; renderPurchaseForm(); },
  purchasePickDone: () => { purchaseTakeTicked(); pd._pick = false; pd._q = ""; renderPurchaseForm(); },
  // E1-11: Select › Put on a receipt. Nothing is saved until the receipt itself is saved.
  receiptOpen: () => {
    if (!pickedCoins().length) return;
    const ps = allPurchases().slice(0, 20);
    openSheet(`<div class="sheet-head"><h2>Put ${pickedCoins().length} on a receipt</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <button class="btn primary block" data-act="receiptPick" data-id="">+ New receipt</button>
      ${ps.length ? `<h3 style="margin:14px 0 4px">Or add to one you have</h3><div class="card">${ps.map((p) => `<div class="rowline"><span>${esc(purchaseName(p))}</span><button class="btn" data-act="receiptPick" data-id="${esc(p.id)}">Pick</button></div>`).join("")}</div>` : ""}`);
  },
  receiptPick: (el) => {
    const p = el.dataset.id ? getPurchase(el.dataset.id) : null;
    const picked = pickedCoins(), ok = picked.filter((c) => purchaseOk(c) && !(c.purchaseId && getPurchase(c.purchaseId) && !(p && c.purchaseId === p.id)));
    const out = picked.length - ok.length;
    const why = " left out: already on a receipt, or not bought (inherited, gift, pocket change).";
    if (!ok.length) { toast("All " + out + why); return; }
    listState.sel = null; render();
    purchaseFormOpen(p);
    ok.forEach((c) => { if (!pd.items.some((x) => x.id === c.id)) pd.items.push({ id: c.id, price: c.paid == null ? "" : String(c.paid) }); });
    formTouched = true; renderPurchaseForm();
    if (out) toast(out + why);
  },
  purchaseAddCoin: (el) => { const c = store.docs.get("c_" + el.dataset.id); if (!c || !pd) return; pd.items.push({ id: c.id, price: c.paid == null ? "" : String(c.paid) }); formTouched = true; const box = $("#purchasePick"); renderPurchaseForm(); if (box) { const q = $("#purchaseQ"); if (q) q.focus(); } },
  // A new coin on this receipt: Add coin opens with date, where from, store and paid with filled in. After Save you are back here with it on the list.
  purchaseNewCoin: () => {
    if (!pd) return;
    openCoinForm(null);
    if (pd.source) applySourceKind(draft, pd.source);
    Object.assign(draft, { acquired: pd.date || draft.acquired, _forPurchase: true });
    if (String(pd.seller || "").trim()) draft.seller = String(pd.seller).trim();
    if (pd.payMethod) draft.payMethod = pd.payMethod;
    draft._carry = {};
    formTouched = false; renderCoinForm();
  },
  purchaseRmCoin: (el) => { pd.items.splice(+el.dataset.i, 1); formTouched = true; renderPurchaseForm(); },
  purchaseRmPhoto: (el) => { pd.receiptPhotos.splice(+el.dataset.i, 1); formTouched = true; renderPurchaseForm(); },
  purchaseSave: (el) => purchaseSave(!!el.dataset.next),
  purchaseKeep: (el) => { const x = purchaseReview && purchaseReview.plan[+el.dataset.i]; if (x) { x.keep = el.dataset.keep === "1"; renderPurchaseReview(); } },
  purchaseBack: () => { purchaseReview = null; renderPurchaseForm(); },
  purchaseCommit: () => { if (purchaseReview) purchaseCommit(purchaseReview.plan, purchaseReview.next); },
  purchaseDelete: (el) => {
    const p = getPurchase(el.dataset.id); if (!p) return;
    const cs = purchaseCoins(p);
    confirmSheet("Delete this purchase?", (cs.length ? "Its " + cs.length + " coin" + (cs.length === 1 ? " keeps its" : "s keep their") + " price, date and store. They just aren't tied to this receipt." : "No coins are tied to it.") + ((p.receiptPhotos || []).length ? " The receipt photo goes with it." : ""), "Delete purchase", () => {
      const undo = { rec: JSON.parse(JSON.stringify(p)), id: p.id, coins: cs.map((c) => JSON.parse(JSON.stringify(c))), deleted: true };
      cs.forEach((c) => { const n = JSON.parse(JSON.stringify(c)); delete n.purchaseId; put("c_" + c.id, n, true); });
      remove("pu_" + p.id);
      go("purchases");
      toast("Purchase deleted.", { label: "Undo", fn: () => purchaseUndo(undo) });
    });
  },
  // From the coin form: link this coin to a purchase (saved with the coin), or start a new purchase with it.
  purchasePickForCoin: () => {
    const ps = allPurchases().slice(0, 20);
    openSheetOver(`<div class="sheet-head"><h2>Add to a purchase</h2><button class="x" data-act="wordBack" aria-label="Close">✕</button></div>
      ${ps.length ? `<div class="card">${ps.map((p) => `<div class="rowline"><span>${esc(purchaseName(p))}</span><button class="btn" data-act="purchaseLinkDraft" data-id="${esc(p.id)}">Pick</button></div>`).join("")}</div>` : `<p class="small muted">No purchases yet.</p>`}
      <button class="btn block" style="margin-top:8px" data-act="purchaseNewFromCoin">+ New purchase with this coin</button>`);
  },
  purchaseLinkDraft: (el) => { if (!draft) return; draft.purchaseId = el.dataset.id; formTouched = true; actions.wordBack(); renderCoinForm(); toast("Added. It's saved when you save the coin."); },
  purchaseNewFromCoin: () => {
    if (!draft) return;
    if (formTouched) { hideTopSheet(); toast("Save the coin first, then add it to a new purchase."); return; }
    const c = store.docs.get("c_" + draft.id); closeSheet(); purchaseFormOpen(null, c);
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["receiptOpen", "receiptPick", "purchaseNew", "purchaseEdit", "purchaseDelete", "purchasePickForCoin"].forEach((a) => SNAPSHOT_BLOCK.add(a));
