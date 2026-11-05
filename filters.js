/* Step 4.3b: the Filter panel, saved filters, and Select / Move many for Your Coins.
   listState.f holds the extra filters: group, stack, holder, kept ("none", "a:<albumId>", "b:<boxId>", "s:<stack>"),
   yFrom, yTo, mint, gFrom, gTo, gCustom, vFrom, vTo, probs (a list of "details", "variety", "error", "cac").
   Saved filters live in settings.savedFilters = [{ id, name, s: { family, metal, cert, status, f } }]. Old settings without it work. */

const FLT_PROBS = [["details", "Details coins"], ["variety", "Known varieties"], ["error", "Mint errors"], ["cac", "CAC sticker"]];
const FLT_MINTS = [["P", "P or no mint mark"], ["D", "D"], ["S", "S"], ["W", "W"], ["CC", "CC"], ["O", "O"]];
const fltProb = (c, k) => (k === "details" ? listOf(c.problems).length > 0 : k === "variety" ? !!c.knownVar : k === "error" ? listOf(c.mintErrors).length > 0 : k === "cac" ? !!cacOf(c) : false);
const fltSaved = () => settings().savedFilters || [];
const fltNum = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);

function fltKept(c, k) {
  if (k === "none") return !(c.albumId && getAlbum(c.albumId)) && !(c.boxId && getBox(c.boxId)) && !stackOf(c);
  if (k.startsWith("a:")) return c.albumId === k.slice(2);
  if (k.startsWith("b:")) return c.boxId === k.slice(2);
  return stackOf(c) === k.slice(2);
}
function fltKeptName(k) {
  if (k === "none") return "Nothing special";
  const id = k.slice(2);
  return k.startsWith("a:") ? (getAlbum(id) ? albumTitle(getAlbum(id)) : "Album") : k.startsWith("b:") ? (getBox(id) ? getBox(id).name : "Box") : id;
}

// True when the coin passes every extra filter in the panel (they combine).
function extraFilter(c) {
  const f = listState.f || {};
  if (f.group && groupOf(c) !== f.group) return false;
  if (f.stack && stackOf(c) !== f.stack) return false;
  if (f.biz === "business" && !c.biz) return false;
  if (f.biz === "personal" && c.biz) return false;
  if (f.item && itemOf(c) !== f.item) return false;
  if (f.holder && holderText(c) !== f.holder) return false;
  if (f.kept && !fltKept(c, f.kept)) return false;
  const y = num(c.year), yF = fltNum(f.yFrom), yT = fltNum(f.yTo);
  if ((yF != null || yT != null) && y == null) return false;
  if (yF != null && y < yF) return false;
  if (yT != null && y > yT) return false;
  if (f.mint && normMint(c.mint) !== (f.mint === "P" ? "" : f.mint)) return false;
  if (f.gCustom && !(c.grade === "Other" && c.customGrade === f.gCustom)) return false;
  if (f.gFrom || f.gTo) {
    const r = gradeRank(c.grade);
    if (r < 0) return false;
    if (f.gFrom && r < gradeRank(f.gFrom)) return false;
    if (f.gTo && r > gradeRank(f.gTo)) return false;
  }
  const vF = fltNum(f.vFrom), vT = fltNum(f.vTo);
  if (vF != null || vT != null) {
    const v = (bestEach(c) || 0) * qtyOf(c);
    if (vF != null && v < vF) return false;
    if (vT != null && v > vT) return false;
  }
  if ((f.probs || []).length && !f.probs.some((k) => fltProb(c, k))) return false;
  if (f.inc && !isIncomplete(c)) return false;
  if (f.inc === "home" && !isCounted(c)) return false; // the Home line counts only coins in the totals; its list matches
  return true;
}

// The chips above the list: one per filter in use.
function fltChips() {
  const f = listState.f || {}, out = [];
  const add = (k, label) => out.push([k, label]);
  if (listState.metal) add("metal", listState.metal);
  if (listState.cert) add("cert", listState.cert === "raw" ? "Raw" : "Certified");
  if (f.group) add("group", "Group: " + f.group);
  if (f.stack) add("stack", "Stack: " + f.stack);
  if (f.biz) add("biz", f.biz === "business" ? "Business stock" : "Personal");
  if (f.item) add("item", f.item === "roll" ? "Rolls only" : "Sets only");
  if (f.holder) add("holder", "Holder: " + f.holder);
  if (f.kept) add("kept", "Kept in: " + fltKeptName(f.kept));
  if (f.yFrom || f.yTo) add("year", "Year " + (f.yFrom || "…") + "–" + (f.yTo || "…"));
  if (f.mint) add("mint", "Mint: " + (f.mint === "P" ? "P / none" : f.mint));
  if (f.gCustom) add("grade", "Grade: " + f.gCustom);
  else if (f.gFrom || f.gTo) add("grade", "Grade " + (f.gFrom || "any") + " to " + (f.gTo || "any"));
  if (f.vFrom || f.vTo) add("value", "Value " + (f.vFrom ? "$" + f.vFrom : "…") + "–" + (f.vTo ? "$" + f.vTo : "…"));
  if (f.inc) add("inc", f.inc === "home" ? "Needs info (in Home totals)" : "Needs info");
  if ((f.probs || []).length) add("probs", FLT_PROBS.filter(([k]) => f.probs.includes(k)).map(([, l]) => l).join(" or "));
  return out;
}
const fltDropKeys = { year: ["yFrom", "yTo"], grade: ["gFrom", "gTo", "gCustom"], value: ["vFrom", "vTo"], probs: ["probs"], inc: ["inc"] };

// The Select bar (shared by My Coins, album pages and box pages): count, Select all / Clear, and the bulk buttons.
function selBarHtml(picked, shown) {
  const dis = picked.length ? "" : "disabled";
  return `<div class="card selbar"><div class="selrow"><b>${picked.length} selected</b><button class="btn" data-act="selAll">Select all (${shown})</button><button class="btn" data-act="selNone">Clear</button></div></div>
      <div class="card selacts"><div class="btn-row" style="margin-top:8px"><button class="btn" data-act="mvOpen" ${dis}>Move to…</button><button class="btn" data-act="hdOpen" ${dis}>Set holder…</button><button class="btn" data-act="inhMark" ${dis}>Mark inherited…</button><button class="btn" data-act="pcOpen" ${dis}>Set purchase info…</button><button class="btn" data-act="orderOpen" ${dis}>Sell together…</button></div>
      ${sellerOn() ? `<div class="btn-row" style="margin-top:8px"><button class="btn" data-act="bizBulk" ${dis}>Move to Business</button><button class="btn" data-act="bizBulkBack" ${dis}>Move to Personal</button><button class="btn" data-act="selAsk" ${dis}>Suggested asking price</button></div>` : ""}</div>`;
}
// Bottom copy of Select all · Clear for long lists.
const selFootHtml = () => listState.sel ? `<div class="small muted" style="text-align:center;margin:10px 0"><button type="button" class="link-btn" data-act="selAll">Select all</button> · <button type="button" class="link-btn" data-act="selNone">Clear</button></div>` : "";
// Select button + bar for album and box pages. "coins" = the owned coins on that page.
function pageSelHtml(coins) {
  coins = coins.filter((c) => c.status === "owned");
  listState._shown = coins;
  if (!coins.length) return "";
  const picked = listState.sel ? coins.filter((c) => listState.sel.has(c.id)) : [];
  return `<div class="toolbar"><button class="btn ${listState.sel ? "on-btn" : ""}" data-act="${listState.sel ? "selDone" : "selStart"}" style="flex:1">${listState.sel ? "Done selecting" : "Select coins"}</button></div>${listState.sel ? selBarHtml(picked, coins.length) : ""}`;
}

// Everything between the search box and the sort line: Filter / Select buttons, chips, the count, and the Select bar.
function coinsControls(base, list) {
  listState._base = base; listState._shown = list;
  const chips = fltChips();
  const total = sum(base, qtyOf), n = sum(list, qtyOf);
  const sel = listState.sel;
  const picked = sel ? list.filter((c) => sel.has(c.id)) : [];
  const meltN = sum(list, (c) => (meltEach(c) || 0) * qtyOf(c));
  const sold = listState.status === "sold";
  const val = sold ? sum(list, (c) => num(c.sold && c.sold.amount)) : sum(list, (c) => (bestEach(c) || 0) * qtyOf(c));
  const showCount = chips.length || listState.q.trim() || listState.family || listState.stage;
  return `<div class="toolbar">
      <button class="btn" data-act="fltOpen" style="flex:1">Filter${chips.length ? " (" + chips.length + ")" : ""}</button>
      ${listState.status === "owned" ? `<button class="btn ${sel ? "on-btn" : ""}" data-act="${sel ? "selDone" : "selStart"}" style="flex:1">${sel ? "Done selecting" : "Select"}</button>` : ""}
    </div>
    ${chips.length ? `<div class="chips" style="margin-bottom:6px">${chips.map(([k, l]) => `<button class="chip on" data-act="fltDrop" data-k="${k}" aria-label="Remove filter ${esc(l)}">${esc(l)} ✕</button>`).join("")}<button class="chip" data-act="fltClear">Clear all</button></div>` : ""}
    ${showCount ? `<div class="small muted" style="margin:0 2px 10px">${n} of ${total} coin${total === 1 ? "" : "s"} · ${sold ? "Sold for" : "Value"} ${money(val, "$0.00")} · Melt ${money(meltN, "$0.00")}</div>` : ""}
    ${sel ? selBarHtml(picked, list.length) : ""}`;
}
function selRow(c) {
  const on = listState.sel.has(c.id);
  return coinRow(c, { miss: true })
    .replace(/data-go="coin-[^"]*"/, `data-act="selToggle" data-id="${esc(c.id)}" aria-pressed="${on}"`)
    .replace('<button class="coin-row"', `<button class="coin-row sel ${on ? "on" : ""}"`)
    .replace(/^(<button[^>]*>)/, `$1<span class="selbox">${on ? "✓" : ""}</span>`);
}

/* ---------- the Filter panel ---------- */
const fltOpts = (list, cur) => list.map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${String(cur) === String(v) ? "selected" : ""}>${esc(l)}</option>`; }).join("");
function openFilterPanel() {
  const base = listState._base || [], f = listState.f || {};
  const fams = [...new Set([...COMMON_FAMILIES, ...base.map(familyOf)])];
  const metals = [...new Set(base.map((c) => c.metal).filter(Boolean))];
  const groups = groupsPresent(), stacks = stacksPresent();
  const customHolders = [...new Set(allCoins().filter((c) => holderOf(c) === "Other" && (c.packaging || "").trim()).map((c) => c.packaging.trim()))];
  const holders = [...new Set([...HOLDERS, ...customHolders])];
  const customGrades = [...new Set(base.filter((c) => c.grade === "Other" && c.customGrade).map((c) => c.customGrade))];
  const saved = fltSaved();
  const field = (label, inner) => `<label class="f"><span>${label}</span>${inner}</label>`;
  const sel = (k, first, list, cur) => `<select data-flt="${k}"><option value="">${first}</option>${fltOpts(list, cur)}</select>`;
  const keptList = [["none", "Nothing special"], ...albums().map((a) => ["a:" + a.id, "Album: " + albumTitle(a)]), ...storageBoxes().map((b) => ["b:" + b.id, "Storage box: " + b.name]), ...displayBoxes().map((b) => ["b:" + b.id, "Display box: " + b.name]), ...pocketAlbums().map((b) => ["b:" + b.id, "Pocket album: " + b.name]), ...(sellerOn() ? dealerBoxes() : []).map((b) => ["b:" + b.id, "Dealer case: " + b.name]), ...stacks.map((s) => ["s:" + s, "Stack: " + s])];
  openSheet(`<div class="sheet-head"><h2>Filter</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    ${saved.length ? `<div class="card"><b>Saved filters</b>${saved.map((s) => listState._ren === s.id
      ? `<div class="rowline"><input type="text" data-flt-ren value="${esc(s.name)}" maxlength="40"><button class="btn" data-act="fltRenSave" data-id="${esc(s.id)}">Save</button></div>`
      : `<div class="rowline"><button class="link-btn" data-act="fltUse" data-id="${esc(s.id)}">${esc(s.name)}</button><span><button class="link-btn" data-act="fltRen" data-id="${esc(s.id)}">Rename</button> · <button class="link-btn" data-act="fltDel" data-id="${esc(s.id)}">Delete</button></span></div>`).join("")}</div>` : ""}
    ${field("Show", `<select data-flt="status"><option value="owned" ${listState.status === "owned" ? "selected" : ""}>In collection</option><option value="sold" ${listState.status === "sold" ? "selected" : ""}>Sold</option>${goneCoins().length ? `<option value="gone" ${listState.status === "gone" ? "selected" : ""}>Gone</option>` : ""}</select>`)}
    ${field("Coin type", sel("family", "All coin types", fams, listState.family || ""))}
    <div class="grid2">${field("Metal", sel("metal", "All metals", metals, listState.metal))}
    ${field("Raw or certified", sel("cert", "Raw + certified", [["raw", "Raw"], ["cert", "Certified"]], listState.cert))}</div>
    ${field("Group", sel("group", "Any group", groups, f.group || ""))}
    ${stacks.length ? field("Stack", sel("stack", "Any stack", stacks, f.stack || "")) : ""}
    ${sellerOn() ? field("Personal or Business", sel("biz", "Both", [["personal", "Personal"], ["business", "Business stock"]], f.biz || "")) : ""}
    ${field("Holder", sel("holder", "Any holder", holders, f.holder || ""))}
    ${field("Kept in", sel("kept", "Anywhere", keptList, f.kept || ""))}
    <div class="grid2">${field("Year from", `<input type="number" inputmode="numeric" data-flt="yFrom" value="${esc(f.yFrom || "")}">`)}${field("Year to", `<input type="number" inputmode="numeric" data-flt="yTo" value="${esc(f.yTo || "")}">`)}</div>
    ${field("Mint mark", sel("mint", "Any", FLT_MINTS, f.mint || ""))}
    <div class="grid2">${field("Grade from", sel("gFrom", "Any", GRADES, f.gFrom || ""))}${field("Grade to", sel("gTo", "Any", GRADES, f.gTo || ""))}</div>
    ${customGrades.length ? field("Custom grade", sel("gCustom", "Any", customGrades, f.gCustom || "")) : ""}
    <div class="grid2">${field("Value from ($)", `<input type="number" inputmode="decimal" data-flt="vFrom" value="${esc(f.vFrom || "")}">`)}${field("Value to ($)", `<input type="number" inputmode="decimal" data-flt="vTo" value="${esc(f.vTo || "")}">`)}</div>
    ${field("Missing information", sel("inc", "Any", [["1", "Needs info (grade, cost or date)"]], f.inc || ""))}
    <div class="f"><span>Problems and errors <span class="muted small">(any of the ticked)</span></span>${FLT_PROBS.map(([k, l]) => `<label class="chk"><input type="checkbox" data-flt-prob="${k}" ${(f.probs || []).includes(k) ? "checked" : ""}> ${l}</label>`).join("")}</div>
    <div class="btn-row" style="margin-top:10px"><button class="btn primary" data-act="fltApply">Show results</button><button class="btn" data-act="fltClear">Clear all</button></div>
    <div class="card" style="margin-top:12px"><b>Save this filter</b><div class="rowline" style="gap:8px"><input type="text" data-flt-name placeholder="e.g. Inherited silver" maxlength="40"><button class="btn" data-act="fltSave">Save</button></div></div>`);
}
// Copies what's in the open panel into listState (no redraw).
function fltRead() {
  const v = (k) => { const e = document.querySelector('#sheet [data-flt="' + k + '"]'); return e ? e.value : undefined; };
  if (v("status") !== undefined) listState.status = v("status");
  if (v("family") !== undefined) listState.family = v("family") || null;
  if (v("metal") !== undefined) listState.metal = v("metal");
  if (v("cert") !== undefined) listState.cert = v("cert");
  const f = {};
  ["group", "stack", "biz", "holder", "kept", "yFrom", "yTo", "mint", "gFrom", "gTo", "gCustom", "vFrom", "vTo", "inc"].forEach((k) => { const x = v(k); if (x) f[k] = x; });
  const probs = [...document.querySelectorAll("#sheet [data-flt-prob]:checked")].map((e) => e.dataset.fltProb);
  if (probs.length) f.probs = probs;
  listState.f = f;
}
const fltSnap = () => JSON.parse(JSON.stringify({ family: listState.family, metal: listState.metal, cert: listState.cert, status: listState.status, f: listState.f || {} }));

/* ---------- Move many / Set holder ---------- */
let fltLast = null; // { before: [coin docs], msg } for the Undo of the last bulk change
const pickedCoins = () => (listState._shown || []).filter((c) => listState.sel && listState.sel.has(c.id));
function movePlace(c, dest, used) {
  const it = itemOf(c);
  if (c.status !== "owned") return "not in your collection";
  if (dest === "none") {
    if (it === "bullion") return "bars always belong to a stack";
    if (!keptValue(c) && !c.albumId && !c.boxId) return "already nowhere special";
    applyKept(c, ""); return "";
  }
  if (dest.startsWith("a:")) {
    const al = getAlbum(dest.slice(2));
    if (it !== "coin") return "only coins go in albums";
    if (!al || !albumHasType(al, c.typeId)) return "that album is for a different coin type";
    if (c.albumId === al.id) return "already in it";
    applyKept(c, dest); return "";
  }
  if (dest.startsWith("b:")) {
    const b = getBox(dest.slice(2));
    if (!b) return "box not found";
    if (caseOn(b) && isInherited(c)) return "inherited coins can't go in a for-sale case";
    if (c.boxId === b.id && (!hasSpots(b) || c.boxRow)) return "already in it";
    let spot = null;
    if (hasSpots(b)) {
      for (let t = 1; t <= trayCount(b) && !spot; t++) { const L = trayOf(b, t);
        for (let r = 1; r <= L.rows && !spot; r++) for (let s = 1; s <= L.perRow && !spot; s++) if (!spotCoin(b.id, r, s, c.id, t) && !used.has(b.id + ":" + t + ":" + r + ":" + s)) spot = { t, r, s }; }
      if (!spot) return "no free spot left in " + b.name;
    }
    applyKept(c, dest);
    if (spot) { c.boxRow = String(spot.r); c.boxSlot = String(spot.s); if (trayCount(b) > 1) c.boxTray = String(spot.t); used.add(b.id + ":" + spot.t + ":" + spot.r + ":" + spot.s); }
    return "";
  }
  // a stack: only bars and junk silver coins
  const name = dest.slice(2);
  if (!(it === "bullion" || (it === "coin" && isJunk(c) && c.metal === "Silver"))) return "only silver bars and junk silver go in stacks";
  if (stackOf(c) === name) return "already in it";
  applyKept(c, dest); return "";
}
// Applies a change to every picked coin; skipped ones are listed. One Undo puts everything back.
function bulkApply(label, fn) {
  const before = [], skipped = [], used = new Set();
  let done = 0;
  pickedCoins().forEach((c0) => {
    const c = JSON.parse(JSON.stringify(c0));
    const why = fn(c, used);
    if (why) { skipped.push([labelOf(c0), why]); return; }
    before.push(c0); put("c_" + c.id, c, true); done++;
  });
  fltLast = { before };
  closeSheet(); render();
  const undo = { label: "Undo", fn: actions.fltUndo };
  if (skipped.length) {
    openSheet(`<div class="sheet-head"><h2>${done ? label + ": " + done + " done" : "Nothing changed"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small">Skipped ${skipped.length}:</p><div class="card">${skipped.map(([n, w]) => `<div class="rowline"><span>${esc(n)}</span><span class="muted small">${esc(w)}</span></div>`).join("")}</div>
      ${done ? `<button class="btn block" data-act="fltUndo" style="margin-top:10px">Undo this</button>` : ""}`);
  } else toast(label + ": " + done + " done.", done ? undo : null);
}

/* ---------- Select > Set purchase info (date, where from, price each) ---------- */
const pcCanChange = (c) => c.status === "owned" && !isInherited(c);
function pcSources() { return [...new Set([...SOURCE_DEFAULTS.filter((x) => x !== "Inherited"), ...allCoins().map((c) => (c.source || "").trim()).filter((x) => x && x !== "Inherited" && !SOURCE_DEFAULTS.some((d) => d.toLowerCase() === x.toLowerCase()))])]; }
const pcSplit = () => (document.querySelector('#sheet input[name="pcMode"]:checked') || {}).value === "split";
// What price each coin would get, from the sheet's current entries (null = leave prices alone).
function pcEach(picks) {
  const amt = num(($("#pcAmt") || {}).value);
  if (amt == null) return null;
  const split = pcSplit();
  const qty = sum(picks, qtyOf);
  return split ? (qty ? Math.round((amt / qty) * 100) / 100 : null) : amt;
}
function pcPreview() {
  const picks = pickedCoins().filter(pcCanChange), el = $("#pcPreview");
  if (!el) return;
  const each = pcEach(picks);
  const qty = sum(picks, qtyOf), split = pcSplit(), amt = num(($("#pcAmt") || {}).value);
  const left = split && each != null && amt != null ? Math.round((amt - each * qty) * 100) / 100 : 0;
  el.innerHTML = `Changes <b>${picks.length}</b> coin${picks.length === 1 ? "" : "s"}${qty !== picks.length ? ` (${qty} pieces)` : ""}${each != null ? ` · <b>${money(each)}</b> each` : ""}${split && each != null ? ` = ${money(amt)}` : ""}${left ? `<div class="small muted">${money(Math.abs(left))} ${left > 0 ? "added to" : "taken off"} one coin so it adds up exactly.</div>` : ""}`;
}
document.addEventListener("input", (e) => { if (e.target.closest && e.target.closest("[data-pc]")) pcPreview(); });
document.addEventListener("change", (e) => {
  // "+ Add storage": put the list back as it was first, so Cancel keeps the old choice
  if (e.target.name === "keptBox" && e.target.value === "__add") { e.target.value = (e.target.querySelector("option[selected]") || { value: "" }).value; const st = stashSheet(); boxReturn = { kind: "form", stash: st }; boxForm(null); return; }
  if (e.target.dataset && e.target.dataset.flt === "mv" && e.target.value === "__add") { boxReturn = { kind: "move" }; boxForm(null); return; }
  if (!e.target.matches || !e.target.matches("[data-pc]")) return;
  const o = $("#pcOtherRow"); if (o) o.hidden = ($("#pcSrc") || {}).value !== "Other";
  pcPreview();
});
Object.assign(actions, {
  pcOpen: () => {
    const picked = pickedCoins();
    if (!picked.length) return;
    openSheet(`<div class="sheet-head"><h2>Set purchase info for ${picked.length}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <div class="hint">Only what you fill in changes. Blank boxes leave each coin as it is.</div>
      <label class="f"><span>Date acquired</span><input type="date" id="pcDate" data-pc></label>
      <label class="f"><span>Where from</span><select id="pcSrc" data-pc><option value="">Leave as is</option>${pcSources().map((x) => `<option>${esc(x)}</option>`).join("")}<option value="Other">Other…</option></select></label>
      <label class="f" id="pcOtherRow" hidden><span>Where did you get them?</span><input type="text" id="pcOther" maxlength="60" placeholder="e.g. flea market"></label>
      <label class="f"><span>Shop, show or seller name (optional)</span><input type="text" id="pcSeller" data-pc list="sellerList" maxlength="60" placeholder="e.g. Main Street Coins"></label>
      <datalist id="sellerList">${pastSellers().map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="btn-row" style="margin:8px 0"><label><input type="radio" name="pcMode" value="each" data-pc checked> Price paid each</label><label><input type="radio" name="pcMode" value="split" data-pc> Split a total evenly</label></div>
      <label class="f"><span>Amount</span><input type="number" inputmode="decimal" step="0.01" id="pcAmt" data-pc placeholder="$ (leave blank to keep prices)"></label>
      <div class="small" id="pcPreview" style="margin:6px 0"></div>
      <div class="hint">Inherited coins are skipped and listed. One Undo puts everything back.</div>
      <button class="btn primary block" data-act="pcGo" style="margin-top:10px">Save to these coins</button>`);
    pcPreview();
  },
  pcGo: () => {
    const date = ($("#pcDate") || {}).value || "", src = ($("#pcSrc") || {}).value || "";
    const other = (($("#pcOther") || {}).value || "").trim(), seller = (($("#pcSeller") || {}).value || "").trim();
    const picks = pickedCoins().filter(pcCanChange);
    const each = pcEach(picks);
    if (src === "Other" && !other) { toast("Type where you got them, or pick another source."); return; }
    if (!date && !src && !seller && each == null) { toast("Fill in at least one thing to change."); return; }
    if (each != null && each < 0) { toast("The price can't be negative."); return; }
    // Split a total: rounding to cents can leave a few cents over (3 × $3.33 = $9.99 of $10); one single coin takes them.
    const amt = num(($("#pcAmt") || {}).value), qty = sum(picks, qtyOf);
    const left = pcSplit() && each != null && amt != null ? Math.round((amt - each * qty) * 100) / 100 : 0;
    const fixId = left ? (picks.find((c) => qtyOf(c) === 1) || {}).id : null;
    bulkApply("Purchase info set", (c) => {
      if (c.status !== "owned") return "not in your collection";
      if (isInherited(c)) return "inherited coins keep their own info";
      if (date) c.acquired = date;
      if (src) c.source = src === "Other" ? other : src;
      if (seller) c.seller = seller;
      if (each != null) c.paid = String(c.id === fixId ? Math.round((each + left) * 100) / 100 : each);
      return "";
    });
    listState.sel = null; render();
  },
});

/* ---------- actions ---------- */
Object.assign(actions, {
  fltOpen: () => openFilterPanel(),
  seeItems: (el) => { Object.assign(listState, { family: null, status: "owned", metal: "", cert: "", stage: "", q: "", f: { item: el.dataset.v } }); go("coins"); }, // the shelf's Rolls and Sets open just those
  fltApply: () => { fltRead(); closeSheet(); render(); },
  fltClear: () => { listState.metal = ""; listState.cert = ""; listState.f = {}; closeSheet(); render(); },
  fltDrop: (el) => {
    const k = el.dataset.k;
    if (k === "metal" || k === "cert") listState[k] = "";
    else (fltDropKeys[k] || [k]).forEach((x) => delete listState.f[x]);
    render();
  },
  fltSave: () => {
    fltRead();
    const input = document.querySelector("#sheet [data-flt-name]");
    const name = (input ? input.value : "").trim();
    if (!name) { toast("Type a name for this filter first."); return; }
    const list = fltSaved().filter((s) => s.name.toLowerCase() !== name.toLowerCase());
    list.push({ id: "f" + Date.now().toString(36), name, s: fltSnap() });
    saveSettings({ savedFilters: list });
    openFilterPanel(); toast("Saved filter: " + name + ".");
  },
  fltUse: (el) => {
    const s = fltSaved().find((x) => x.id === el.dataset.id);
    if (!s) return;
    Object.assign(listState, { family: s.s.family || null, metal: s.s.metal || "", cert: s.s.cert || "", status: s.s.status || "owned", f: JSON.parse(JSON.stringify(s.s.f || {})) });
    closeSheet(); render();
  },
  fltRen: (el) => { fltRead(); listState._ren = el.dataset.id; openFilterPanel(); },
  fltRenSave: (el) => {
    const input = document.querySelector("#sheet [data-flt-ren]");
    const name = (input ? input.value : "").trim();
    if (!name) { toast("A saved filter needs a name."); return; }
    saveSettings({ savedFilters: fltSaved().map((s) => (s.id === el.dataset.id ? { ...s, name } : s)) });
    listState._ren = null; openFilterPanel();
  },
  fltDel: (el) => {
    fltRead();
    const before = fltSaved(), gone = before.find((s) => s.id === el.dataset.id);
    if (!gone) return;
    saveSettings({ savedFilters: before.filter((s) => s.id !== gone.id) });
    openFilterPanel();
    toast("Deleted saved filter “" + gone.name + "”.", { label: "Undo", fn: () => { saveSettings({ savedFilters: before }); toast("Back again."); } });
  },
  needInfo: () => { Object.assign(listState, { family: null, metal: "", cert: "", status: "owned", stage: "", q: "", f: { inc: "home" } }); go("coins"); },
  selStart: () => { listState.sel = new Set(); render(); },
  selDone: () => { listState.sel = null; render(); },
  selToggle: (el) => { const id = el.dataset.id; if (listState.sel.has(id)) listState.sel.delete(id); else listState.sel.add(id); render(); },
  selAll: () => { (listState._shown || []).forEach((c) => listState.sel.add(c.id)); render(); },
  selNone: () => { listState.sel = new Set(); render(); },
  mvOpen: () => {
    const picked = pickedCoins();
    if (!picked.length) return;
    const opt = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
    openSheet(`<div class="sheet-head"><h2>Move ${picked.length} to…</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <label class="f"><span>Kept in</span><select data-flt="mv"><option value="">Pick where…</option>${opt("none", "Nothing special")}
        ${albums().map((a) => opt("a:" + a.id, "Album: " + albumTitle(a))).join("")}
        ${storageBoxes().map((b) => opt("b:" + b.id, "Storage box: " + b.name)).join("")}${displayBoxes().map((b) => opt("b:" + b.id, "Display box: " + b.name)).join("")}${pocketAlbums().map((b) => opt("b:" + b.id, "Pocket album: " + b.name)).join("")}${(sellerOn() ? dealerBoxes() : []).map((b) => opt("b:" + b.id, "Dealer case: " + b.name)).join("")}
        ${stackNames().map((s) => opt("s:" + s, "Stack: " + s)).join("")}<option value="__add">+ Add storage…</option></select></label>
      <div class="hint">Boxes with numbered spots fill the next free spots. Anything that can't go there is skipped and listed. One Undo puts everything back.</div>
      <button class="btn primary block" data-act="mvGo" style="margin-top:10px">Move</button>`);
  },
  mvGo: () => {
    const e = document.querySelector('#sheet [data-flt="mv"]');
    const dest = e ? e.value : "";
    if (!dest) { toast("Pick where to move them."); return; }
    bulkApply("Moved", (c, used) => movePlace(c, dest, used));
    listState.sel = null; render(); // Select closes once the move is done
  },
  hdOpen: () => {
    const picked = pickedCoins();
    if (!picked.length) return;
    openSheet(`<div class="sheet-head"><h2>Set holder for ${picked.length}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <label class="f"><span>Holder</span><select data-flt="hd"><option value="">Pick a holder…</option>${HOLDERS.filter((h) => h !== "Album" && h !== "Other").map((h) => `<option>${esc(h)}</option>`).join("")}</select></label>
      <div class="hint">Only coins change; sets and rolls are skipped. One Undo puts everything back.</div>
      <button class="btn primary block" data-act="hdGo" style="margin-top:10px">Set holder</button>`);
  },
  hdGo: () => {
    const e = document.querySelector('#sheet [data-flt="hd"]');
    const h = e ? e.value : "";
    if (!h) { toast("Pick a holder."); return; }
    bulkApply("Holder set", (c) => {
      if (itemOf(c) !== "coin") return "only coins have this holder list";
      if (c.status !== "owned") return "not in your collection";
      if (normHolder(c.holder) === h) return "already " + h;
      c.holder = normHolder(h); return "";
    });
  },
  fltUndo: () => {
    if (!fltLast) return;
    fltLast.before.forEach((d) => put("c_" + d.id, d, true));
    fltLast = null; closeSheet(); render(); toast("Undone.");
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["mvGo", "hdGo", "pcOpen", "pcGo", "fltSave", "fltRenSave", "fltDel", "fltUndo"].forEach((a) => SNAPSHOT_BLOCK.add(a));
