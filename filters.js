/* Step 4.3b: the Filter panel, saved filters, and Select / Move many for Your Coins.
   listState.f holds the extra filters: group, stack, holder, src (where from), kept ("none", "a:<albumId>", "b:<boxId>", "s:<stack>"),
   yFrom, yTo, mint, gFrom, gTo, gCustom, vFrom, vTo, probs (a list of "details", "variety", "error", "cac").
   Saved filters live in settings.savedFilters = [{ id, name, s: { family, metal, cert, status, f } }]. Old settings without it work. */

const FLT_PROBS = [["details", "Details coins"], ["variety", "Known varieties"], ["error", "Mint errors"], ["cac", "CAC sticker"]];
const FLT_MINTS = [["P", "P or no mint mark"], ["D", "D"], ["S", "S"], ["W", "W"], ["CC", "CC"], ["O", "O"], ["?", "Can't tell"]];
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
  if (f.setKind && (itemOf(c) !== "set" || setStackOf(c) !== f.setKind)) return false; // the shelf's set stacks
  if (f.holder && holderText(c) !== f.holder) return false;
  if (f.src && (c.source || "").trim().toLowerCase() !== f.src.toLowerCase()) return false; // R4-37: where it came from
  if (f.kept && !fltKept(c, f.kept)) return false;
  if (f.kf && keepForOf(c).toLowerCase() !== f.kf.toLowerCase()) return false; // step 24: Keeping for
  const y = num(c.year), yF = fltNum(f.yFrom), yT = fltNum(f.yTo);
  if ((yF != null || yT != null) && y == null) return false;
  if (yF != null && y < yF) return false;
  if (yT != null && y > yT) return false;
  if (f.mint && normMint(c.mint) !== (f.mint === "P" ? "" : f.mint)) return false;
  if (f.ng && !(itemOf(c) === "coin" && !c.grade && c.noGrade)) return false;
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
  if (f.fav && !c.fav) return false;
  if (f.inc && !isIncomplete(c)) return false;
  if (f.inc === "home" && !isCounted(c)) return false; // the Home line counts only coins in the totals; its list matches
  return true;
}


// R4-45 (idea 102): with one coin type chosen, list the album spots still empty for it, so "what am I missing?" is answered right under the coins you have.
function missingSpotsHtml() {
  if (listState.status !== "owned" || !listState.family || listState.q.trim()) return "";
  const groups = [];
  albums().forEach((a) => {
    const st = albumStats(a);
    const gaps = st.slots.filter((s) => !st.filled.has(slotKey(s)) && (TYPE_BY_ID[slotType(a, s)] || {}).family === listState.family);
    if (gaps.length) groups.push({ a, gaps });
  });
  const total = groups.reduce((n, g) => n + g.gaps.length, 0);
  if (!total) return "";
  const MAX = 40;
  let left = MAX;
  const rows = groups.map((g) => {
    const shown = g.gaps.slice(0, Math.max(left, 0)); left -= shown.length;
    if (!shown.length) return "";
    return `<div style="margin-top:6px"><button class="link-btn" data-go="album-${esc(g.a.id)}">${esc(albumTitle(g.a))}</button> <span class="small muted">(${g.gaps.length} missing)</span><div class="small">${shown.map((s) => esc(slotLabel(s) + (s.v ? " " + s.v : ""))).join(", ")}${g.gaps.length > shown.length ? ", …" : ""}</div></div>`;
  }).join("");
  return `<div class="card" style="margin-top:10px"><b>Missing from your albums: ${total}</b><div class="small muted">Empty ${esc(listState.family)} spots. Tap an album to open it.</div>${rows}</div>`;
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
  if (f.item) add("item", f.item === "roll" ? "Rolls only" : f.setKind ? (SET_STACKS.find((x) => x[0] === f.setKind) || ["", "Other"])[1] + " sets only" : "Sets only");
  if (f.holder) add("holder", "Holder: " + f.holder);
  if (f.src) add("src", "Where from: " + f.src);
  if (f.kept) add("kept", "Kept in: " + fltKeptName(f.kept));
  if (f.kf) add("kf", "Keeping for: " + f.kf);
  if (f.yFrom || f.yTo) add("year", "Year " + (f.yFrom || "…") + "–" + (f.yTo || "…"));
  if (f.mint) add("mint", "Mint: " + (f.mint === "P" ? "P / none" : f.mint === CANT_TELL ? "Can't tell" : f.mint));
  if (f.ng) add("ng", "Not graded");
  if (f.gCustom) add("grade", "Grade: " + f.gCustom);
  else if (f.gFrom || f.gTo) add("grade", "Grade " + (f.gFrom || "any") + " to " + (f.gTo || "any"));
  if (f.vFrom || f.vTo) add("value", "Value " + (f.vFrom ? "$" + f.vFrom : "…") + "–" + (f.vTo ? "$" + f.vTo : "…"));
  if (f.fav) add("fav", "Favorites only");
  if (f.inc) add("inc", f.inc === "home" ? "Needs Attention (in Home totals)" : "Needs Attention");
  if ((f.probs || []).length) add("probs", FLT_PROBS.filter(([k]) => f.probs.includes(k)).map(([, l]) => l).join(" or "));
  return out;
}
const fltDropKeys = { year: ["yFrom", "yTo"], grade: ["gFrom", "gTo", "gCustom"], ng: ["ng"], value: ["vFrom", "vTo"], probs: ["probs"], inc: ["inc"], item: ["item", "setKind"] };

// The Select bar (shared by My Coins, album pages and box pages): count, Select all / Clear, and the bulk buttons.
function selBarHtml(picked, shown, onAlbum) {
  const dis = picked.length ? "" : "disabled";
  return `<div class="selstick"><div class="card selbar"><div class="selrow"><b>${picked.length} selected</b><button class="btn" data-act="selAll">Select all (${shown})</button><button class="btn" data-act="selNone">Clear</button></div></div>
      <div class="card selacts"><div class="btn-row">${onAlbum ? `<button class="btn" data-act="selGradeOpen">Select by grade…</button>` : ""}<button class="btn" data-act="saOpen" ${dis}>Set for all…</button><button class="btn" data-act="mvOpen" ${dis}>Move to…</button><button class="btn" data-act="editEach" ${dis}>Edit one by one</button>${onAlbum ? `<button class="btn" data-act="toOpen" ${dis}>Take out of album…</button>` : ""}<button class="btn" data-act="receiptOpen" ${dis}>Put on a receipt…</button>${sellerOn() ? `<button class="btn" data-act="orderOpen" ${dis}>Sell together…</button>` : ""}</div></div></div>
      ${sellerOn() ? `<div class="card selacts"><div class="btn-row" style="margin-top:0"><button class="btn" data-act="bizBulk" ${dis}>Move to Business</button><button class="btn" data-act="bizBulkBack" ${dis}>Move to Personal</button><button class="btn" data-act="selAsk" ${dis}>Suggested asking price</button></div></div>` : ""}`;
}
const selGradeKey = (c) => (c.grade === "Other" ? c.customGrade || "Other" : c.grade || "No grade");
// Bottom copy of Select all · Clear for long lists.
const selFootHtml = () => listState.sel ? `<div class="small muted" style="text-align:center;margin:10px 0"><button type="button" class="link-btn" data-act="selAll">Select all</button> · <button type="button" class="link-btn" data-act="selNone">Clear</button></div>` : "";
/* Long-press (38, 132): hold a coin on any page that has a Select button to start Select with it ticked. A shortcut only. */
const LP_MS = 500, LP_SEL = '[data-go^="coin-"], .slot.have[data-coin]';
let lpTimer = null, lpAt = null, lpFired = false;
// The coin under a finger, only where Select is offered and not already on.
function lpTarget(t) {
  const el = t && t.closest && t.closest(LP_SEL);
  if (!el || el.closest("#sheet") || !document.querySelector("[data-act=selStart]")) return null;
  const id = el.dataset.coin || el.dataset.go.slice(5);
  return (listState._shown || []).some((c) => c.id === id && c.status === "owned") ? { el, id } : null;
}
const lpCancel = () => { clearTimeout(lpTimer); lpTimer = null; };
function lpStart(id, el) {
  lpCancel(); lpFired = true;
  const top = el.getBoundingClientRect().top;
  listState.sel = new Set([id]); render();
  // The Select bar appears above the list: scroll so the held coin stays under the finger.
  const now = document.querySelector(`[data-act=selToggle][data-id="${CSS.escape(id)}"]`);
  if (now) window.scrollBy(0, now.getBoundingClientRect().top - top);
  if (navigator.vibrate) navigator.vibrate(15);
}
document.addEventListener("pointerdown", (e) => {
  lpCancel(); lpFired = false;
  if (e.button || !e.isPrimary || e.target.closest("[data-act=favToggle]")) return;
  const hit = lpTarget(e.target);
  if (!hit) return;
  lpAt = { x: e.clientX, y: e.clientY };
  lpTimer = setTimeout(() => lpStart(hit.id, hit.el), LP_MS);
});
document.addEventListener("pointermove", (e) => { if (lpTimer && Math.hypot(e.clientX - lpAt.x, e.clientY - lpAt.y) > 10) lpCancel(); });
["pointerup", "pointercancel", "hashchange"].forEach((n) => window.addEventListener(n, lpCancel));
window.addEventListener("scroll", lpCancel, { passive: true });
// Letting go must not also count as a tap (it would open the coin, or untick it).
window.addEventListener("click", (e) => { if (lpFired && e.detail) { lpFired = false; e.preventDefault(); e.stopPropagation(); } }, true);
// Stop the phone's own long-press menu on those coins.
document.addEventListener("contextmenu", (e) => { if (lpFired || lpTarget(e.target) || (listState.sel && e.target.closest("[data-act=selToggle]"))) e.preventDefault(); });

// Select button + bar for album and box pages. "coins" = the owned coins on that page.
function pageSelHtml(coins, onAlbum) {
  coins = coins.filter((c) => c.status === "owned");
  listState._shown = coins;
  if (!coins.length) return "";
  const picked = listState.sel ? coins.filter((c) => listState.sel.has(c.id)) : [];
  return `<div class="toolbar"><button class="btn ${listState.sel ? "on-btn" : ""}" data-act="${listState.sel ? "selDone" : "selStart"}" style="flex:1">${listState.sel ? "Done selecting" : "Select coins"}</button></div>${listState.sel ? selBarHtml(picked, coins.length, onAlbum) : ""}`;
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
  const srcs = [...new Set(allCoins().map((c) => (c.source || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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
    ${srcs.length ? field("Where from", sel("src", "Any source", srcs, f.src || "")) : ""}
    ${field("Kept in", sel("kept", "Anywhere", keptList, f.kept || ""))}
    ${pastKeepFor().length ? field("Keeping for", sel("kf", "Anyone or no one", pastKeepFor(), f.kf || "")) : ""}
    <div class="grid2">${field("Year from", `<input type="number" inputmode="numeric" data-flt="yFrom" value="${esc(f.yFrom || "")}">`)}${field("Year to", `<input type="number" inputmode="numeric" data-flt="yTo" value="${esc(f.yTo || "")}">`)}</div>
    ${field("Mint mark", sel("mint", "Any", FLT_MINTS, f.mint || ""))}
    <div class="grid2">${field("Grade from", sel("gFrom", "Any", GRADES, f.gFrom || ""))}${field("Grade to", sel("gTo", "Any", GRADES, f.gTo || ""))}</div>
    ${field("Grading", sel("ng", "All coins", [["1", "Not graded only"]], f.ng || ""))}
    ${customGrades.length ? field("Custom grade", sel("gCustom", "Any", customGrades, f.gCustom || "")) : ""}
    <div class="grid2">${field("Value from ($)", `<input type="number" inputmode="decimal" data-flt="vFrom" value="${esc(f.vFrom || "")}">`)}${field("Value to ($)", `<input type="number" inputmode="decimal" data-flt="vTo" value="${esc(f.vTo || "")}">`)}</div>
    ${field("Favorites", sel("fav", "All coins", [["1", "Favorites only"]], f.fav || ""))}
    ${field("Missing information", sel("inc", "Any", [["1", "Needs Attention (grade, cost, where from or mint)"]], f.inc || ""))}
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
  ["group", "stack", "biz", "holder", "src", "kept", "kf", "yFrom", "yTo", "mint", "gFrom", "gTo", "gCustom", "ng", "vFrom", "vTo", "inc", "fav"].forEach((k) => { const x = v(k); if (x) f[k] = x; });
  const probs = [...document.querySelectorAll("#sheet [data-flt-prob]:checked")].map((e) => e.dataset.fltProb);
  if (probs.length) f.probs = probs;
  const was = listState.f || {}; // set by the shelf, with no box in the panel: keep it when the panel is applied
  if (was.item) f.item = was.item;
  if (was.setKind) f.setKind = was.setKind;
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
    if (caseOn(b) && isKeptFor(c)) return "coins you keep for someone can't go in a for-sale case";
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
    if (why === true) return; // left alone on purpose (Set for all, "Only the blank ones"): not listed
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
      <label class="f"><span>Shop, show or seller name (optional)</span><input type="text" id="pcSeller" data-pc data-suggest="seller" autocomplete="off" maxlength="60" placeholder="e.g. Main Street Coins"></label>
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
  seeSets: (el) => { Object.assign(listState, { family: null, status: "owned", metal: "", cert: "", stage: "", q: "", f: { item: "set", setKind: el.dataset.v } }); go("coins"); },
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
  quickPick: (el) => {
    if (!draft || Date.now() - quickPickAt < 500) return; // a double tap must not grade the next coin too
    quickPickAt = Date.now();
    draft.grade = el.dataset.g; delete draft.noGrade; saveDraft();
  },
  fixupStart: () => { fixup.list = null; fixup.on = true; fixup.skip = []; fixup.hist = []; fixup.album = null; fixupNext(); },
  fixupQuick: (el) => { fixup.list = null; fixup.on = true; fixup.skip = []; fixup.hist = []; fixup.album = el.dataset.id; closeSheet(); fixupNext(); }, // 140: Quick grade from an album page
  editEach: () => { // E1-12: the picked coins, one after another, in the order they are shown
    const picked = new Set(pickedCoins().map((c) => c.id));
    const ids = [...new Set([...$$("[data-act=selToggle]").map((x) => x.dataset.id).filter((id) => picked.has(id)), ...picked])];
    if (!ids.length) return;
    listState.sel = null; render();
    Object.assign(fixup, { on: true, skip: [], hist: [], album: null, list: ids });
    fixupNext();
  },
  fixupSkip: () => { if (draft && draft.id) fixup.skip.push(draft.id); closeSheet(); fixupNext(); },
  fixupBack: () => { fixupBackGo(); }, // 140: back to the coin before this one
  fixupStop: () => { const a = fixup.album; fixup.list = null; fixup.on = false; fixup.album = null; closeSheet(); if (a && getAlbum(a)) go("album-" + a); },
  fixupAlbum: (el) => { const id = el.dataset.id; closeSheet(); go("album-" + id); }, // 134: from the Needs Attention card straight to the coin's album
  needFix: () => { actions.needInfo(); actions.fixupStart(); }, // 4c: the Home button goes straight into the Needs Attention run
  needInfo: () => { Object.assign(listState, { family: null, metal: "", cert: "", status: "owned", stage: "", q: "", f: { inc: "home" } }); go("coins"); },
  selGradeOpen: () => { // E1-10: tick every coin on this page that has one of the picked grades
    const counts = new Map();
    (listState._shown || []).forEach((c) => { const g = selGradeKey(c); counts.set(g, (counts.get(g) || 0) + 1); });
    const rank = (g) => (g === "No grade" ? -1 : GRADES.indexOf(g) < 0 ? 999 : GRADES.indexOf(g));
    openSheet(`<div class="sheet-head"><h2>Select by grade</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small muted">Tick the grades you want. The coins with those grades get selected.</p>
      ${[...counts.keys()].sort((a, b) => rank(a) - rank(b)).map((g) => `<label class="chk" style="min-height:44px"><input type="checkbox" data-selg="${esc(g)}"> <span style="flex:1">${esc(g)}</span> <span class="muted small">${counts.get(g)}</span></label>`).join("")}
      <div class="btn-row" style="margin-top:10px"><button class="btn primary block" data-act="selGradeGo">Select them</button></div>`);
  },
  selGradeGo: () => {
    const want = new Set([...document.querySelectorAll("#sheet [data-selg]:checked")].map((x) => x.dataset.selg));
    if (!want.size) { toast("Tick at least one grade."); return; }
    listState.sel = new Set((listState._shown || []).filter((c) => want.has(selGradeKey(c))).map((c) => c.id));
    closeSheet(); render();
  },
  selStart: () => { listState.sel = new Set(); render(); },
  slotNoSel: () => toast("That spot is empty, so there is nothing to select. Tap Done selecting to add a coin to it."), // 122
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
  toOpen: () => { // "Take out of album": loose by default, or into a box / stack; coins are never deleted
    const picked = pickedCoins();
    if (!picked.length) return;
    const opt = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
    openSheet(`<div class="sheet-head"><h2>Take out of album</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small">${picked.length} selected. They stay in your collection.</p>
      <label class="f"><span>Where do they go?</span><select data-flt="to"><option value="none">Loose (not kept anywhere special)</option>
        ${storageBoxes().map((b) => opt("b:" + b.id, "Storage box: " + b.name)).join("")}${displayBoxes().map((b) => opt("b:" + b.id, "Display box: " + b.name)).join("")}${pocketAlbums().map((b) => opt("b:" + b.id, "Pocket album: " + b.name)).join("")}${(sellerOn() ? dealerBoxes() : []).map((b) => opt("b:" + b.id, "Dealer case: " + b.name)).join("")}
        ${stackNames().map((s) => opt("s:" + s, "Stack: " + s)).join("")}</select></label>
      <div class="hint">Coins not in an album are skipped and listed. One Undo puts everything back.</div>
      <button class="btn primary block" data-act="toGo" style="margin-top:10px">Take out</button>`);
  },
  toGo: () => {
    const e = document.querySelector('#sheet [data-flt="to"]');
    const dest = e ? e.value : "none";
    bulkApply("Taken out of album", (c, used) => (c.albumId && getAlbum(c.albumId) ? movePlace(c, dest, used) : "not in an album"));
    listState.sel = null; render();
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

/* --- Fix-up run (idea 117): one button walks through the coins that need info; Save goes to the next --- */
const fixup = { on: false, skip: [], hist: [], album: null, list: null }; // list = the picked coins of Edit one by one (E1-12)
// Step 28 (idea 140): Quick grade = the same run, limited to one album's coins that still have no grade.
const albumNoGrade = (aid) => ownedCoins().filter((c) => c.albumId === aid && missingOf(c).includes("grade")).sort((a, b) => (num(a.year) || 0) - (num(b.year) || 0) || String(a.mint || "").localeCompare(String(b.mint || "")));
const fixupStill = (c) => (fixup.list ? true : fixup.album ? missingOf(c).includes("grade") : needsOf(c).length > 0); // does this coin still need what the run is fixing?
const fixupQueue = () => fixup.list ? fixup.list.filter((id) => !fixup.skip.includes(id)).map((id) => getCoin(id)).filter((c) => c && c.status === "owned") : fixup.album ? albumNoGrade(fixup.album).filter((c) => !fixup.skip.includes(c.id)) : (listState._shown && listState.f && listState.f.inc ? listState._shown : needInfoCoins()).map((c) => getCoin(c.id)).filter((c) => c && needsOf(c).length && !fixup.skip.includes(c.id));
function fixupOpen(id) { fixup.opening = true; try { openCoinForm(id); } finally { fixup.opening = false; } fixup.hist = (fixup.hist || []).filter((x) => x !== id); fixup.hist.push(id); }
function fixupNext() {
  const q = fixupQueue();
  if (!q.length && fixup.list) { const n = fixup.list.length; fixup.on = false; fixup.list = null; toast("Done. That was all " + n + " coin" + (n === 1 ? "" : "s") + "."); render(); return; }
  if (!q.length) { const a = fixup.album; fixup.on = false; fixup.album = null; toast(a ? "All caught up. Every coin in this album has a grade." : "All caught up. Nothing left that needs attention."); if (a && getAlbum(a)) go("album-" + a); else render(); return; }
  fixupOpen(q[0].id);
}
// Back: reopen the coin before this one (undoes a Skip). The coin you leave is not marked skipped.
function fixupBackGo() {
  const cur = draft && draft.id, h = (fixup.hist || []).filter((x) => x !== cur);
  while (h.length && !getCoin(h[h.length - 1])) h.pop();
  if (!h.length) return;
  const prev = h[h.length - 1]; fixup.hist = h.slice(0, -1); fixup.skip = fixup.skip.filter((x) => x !== prev && x !== cur);
  closeSheet(); fixupOpen(prev);
}
// Small bar at the top of the edit form while a run is going.
// E1-5: in Quick grade the grades come first; tapping one saves and opens the next coin.
let quickPickAt = 0;
function quickGradeButtons(d) {
  const al = d.albumId && getAlbum(d.albumId), sl = al && (al.slots || []).find((x) => x.id === d.slotId);
  const proof = !!(d._proof || (sl && sl.pf));
  const grades = (d.gradeMode === "cert" ? CERT_GRADES : GRADES).filter((g) => isProofGrade(g) === proof);
  return `<div class="quick-grades">${grades.map((g) => `<button type="button" class="btn ${d.grade === g ? "primary" : ""}" data-act="quickPick" data-g="${esc(g)}">${esc(g)}</button>`).join("")}</div>`;
}
function fixupBar(d) {
  if (!fixup.on || d._isNew) return "";
  const left = fixupQueue().length + (fixupQueue().some((c) => c.id === d.id) ? 0 : 1), alb = d.albumId && getAlbum(d.albumId); // idea 134: say which album the coin is in; tap opens it
  const albLine = alb ? `<div class="small" style="color:#4a4130;margin-top:2px">\u{1F4D6} In <button type="button" class="link-btn" style="color:#6b4a00;text-decoration:underline" data-act="fixupAlbum" data-id="${esc(alb.id)}">${esc(albumTitle(alb))}</button></div>` : "";
  const quick = !!fixup.album, canBack = (fixup.hist || []).some((x) => x !== d.id && getCoin(x));
  const guide = `<a class="link-btn" style="color:#6b4a00;text-decoration:underline" href="${esc(photoGuideUrl(d))}" target="_blank" rel="noopener">${esc(photoGuideText(d))} \u2197</a>`;
  return `<div class="card" style="background:#fff7e0;margin-bottom:10px"><b style="color:#2a2418">${fixup.list ? "Edit one by one" : quick ? "Quick grade" : "Needs Attention"}: ${left} ${left === 1 ? "coin" : "coins"} left</b>${albLine}<div class="small" style="color:#4a4130">${fixup.list ? `<b>${esc(labelOf(d))}</b><br>Change what you need, then Save + next.` : quick ? "Tap a grade: it saves and the next coin opens." : `${esc(needsText(d) || "Nothing missing")}.${needsOf(d).includes("check mint") ? " Pick the mint: No mint mark, P only if the coin shows a P, or Can't tell." : ""} Save moves to the next coin.`}</div>${!fixup.list && (quick || needsOf(d).includes("grade")) ? `<div class="small" style="margin-top:4px">${guide}</div>` : ""}<div class="row" style="gap:8px;margin-top:6px">${canBack ? `<button type="button" class="btn" data-act="fixupBack">\u2039 Back</button>` : ""}<button type="button" class="btn" data-act="fixupSkip">Skip this one</button><button type="button" class="btn" data-act="fixupStop">Stop</button></div>${quick ? quickGradeButtons(d) : ""}</div>`;
}
// E1-7: the pinned Select bar sits right under the top bar, whatever its height is on this phone.
if (typeof ResizeObserver !== "undefined" && document.querySelector(".topbar")) new ResizeObserver(() => document.documentElement.style.setProperty("--topbar-h", document.querySelector(".topbar").offsetHeight + "px")).observe(document.querySelector(".topbar"));
