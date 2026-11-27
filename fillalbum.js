// Step 9.6a: fill a full album at once. A quick list with one row per empty spot; every row starts ticked.
// Plain script, shares the page's global names. Saves one coin per ticked spot, then offers Undo for the whole batch.
const fillUi = { albumId: "", mode: "each", fresh: false, armed: false }; // price mode: "each" row or one "total" for the album

// Empty spots of an album (spots with no coin yet), with ids on every spot.
function fillSpotsOf(album) {
  const a = withSlotIds(album);
  const st = albumStats(a);
  return { a, spots: st.slots.filter((s) => !st.filled.has(slotKey(s))) };
}
// Grades a spot can take: proof spots take only proof grades, normal spots in an album with proofs take none.
function fillGradesFor(a, s) {
  const proofOk = (g) => (s.pf ? isProofGrade(g) : !(a.proofs && isProofGrade(g)));
  return GRADES.filter(proofOk);
}
// A loose coin you already own that fits this spot (R4-7): offered instead of making a second coin.
function fillLooseFor(a, s, taken) {
  if (s.set) return null;
  const pfOk = (c) => (s.pf ? isProofGrade(c.grade) : !(a.proofs && isProofGrade(c.grade)));
  return ownedCoins().find((c) => itemOf(c) === "coin" && !c.albumId && !(taken && taken.has(c.id)) && c.typeId === slotType(a, s) && num(c.year) === s.y && normMint(c.mint) === s.m && pfOk(c) && (!s.v || varietyFits(c.variety, s.v) || varietyFits(c.spotVariety, s.v))) || null;
}
function fillRow(a, s, i, mode) {
  const t = TYPE_BY_ID[slotType(a, s)];
  const multi = albumTypes(a).length > 1 && !s.set && t;
  const loose = fillLooseFor(a, s);
  return `<div class="fill-row" data-i="${i}" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line,#ddd)">
    <input type="checkbox" class="fill-on" aria-label="Have ${esc(slotLabel(s))}" style="flex:none;width:22px;height:22px">
    <span class="fill-name" style="flex:1;min-width:0"><b>${esc(slotLabel(s))}</b>${s.v ? ` <span class="small muted">${esc(s.v)}</span>` : ""}${multi ? ` <span class="small muted">${esc(shortName(t))}</span>` : ""}${loose ? `<label class="small fill-loose"><input type="checkbox" class="fill-use" checked> Use my loose coin (${esc(gradeText(loose) || "no grade")})</label>` : ""}</span>
    <select class="fill-grade" aria-label="Grade for ${esc(slotLabel(s))}" style="flex:none;width:92px"><option value="">Grade?</option>${quickAddOk(a, s) ? `<option value="__circ">Circulated (not graded)</option>` : ""}${fillGradesFor(a, s).map((g) => `<option value="${esc(g)}">${esc(gradeWord(g))}</option>`).join("")}</select>
    ${mode === "each" ? `<input type="number" class="fill-paid" inputmode="decimal" min="0" step="0.01" placeholder="$ paid" aria-label="Price paid for ${esc(slotLabel(s))}" style="flex:none;width:76px">` : ""}
  </div>`;
}
// One Photograde link for the whole list, only when every spot is the same coin type.
function fillGuideLink(a, spots) {
  const ids = [...new Set(spots.map((s) => slotType(a, s)))];
  if (ids.length !== 1 || !TYPE_BY_ID[ids[0]]) return "";
  const c = { typeId: ids[0], typeName: shortName(TYPE_BY_ID[ids[0]]), year: spots[0].y };
  return `<div class="hint"><a href="${esc(photoGuideUrl(c))}" target="_blank" rel="noopener">${esc(photoGuideText(c))} ↗</a></div>`;
}
// Open the quick list for an album (or just its empty spots). `fresh` = a brand-new album that already has coins.
function openFillAlbum(albumId, fresh) {
  const al = getAlbum(albumId);
  if (!al) return;
  const { a, spots } = fillSpotsOf(al);
  if (!spots.length) { toast("Every spot in this album already has a coin."); return; }
  if (fillUi.albumId !== a.id) { fillUi.albumId = a.id; fillUi.mode = "each"; }
  const mode = fillUi.mode;
  const keep = $("#fillForm") ? fillRead() : null; // keep what was typed when the price switch redraws
  if (fresh === false) fillUi.fresh = false;
  openSheet(`<div class="sheet-head"><h2>${fillUi.fresh ? "Add the coins you have" : "Fill spots"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <div id="fillForm" data-id="${esc(a.id)}">
    <p class="small muted">${esc(albumTitle(a))}: tick only the coins you have, then pick a grade for each. Leave a grade or price blank to fill in later.</p>
    <div class="chips" style="margin:6px 0"><button type="button" class="chip ${mode === "each" ? "on" : ""}" data-act="fillMode" data-v="each" aria-pressed="${mode === "each"}">Price on each row</button>
      <button type="button" class="chip ${mode === "total" ? "on" : ""}" data-act="fillMode" data-v="total" aria-pressed="${mode === "total"}">One total for the album</button></div>
    ${mode === "total" ? `<label class="f"><span>Total paid for all the coins</span><input type="number" id="fillTotal" inputmode="decimal" min="0" step="0.01" placeholder="Split evenly across the ticked coins"></label>` : ""}
    <div class="grid2">
      <label class="f"><span>Date acquired</span><input type="date" id="fillDate"></label>
      <label class="f"><span>Where from</span><input type="text" id="fillSource" list="fillSourceList" value="${esc(a.inherited ? "Inherited" : settings().lastFillSource && !isFaceSource({ source: settings().lastFillSource }) ? settings().lastFillSource : "")}" placeholder="optional"></label>
    </div>
    <div class="chips" style="margin:0 0 6px">${["Pocket change", "Coin roll hunting"].map((x) => `<button type="button" class="chip" data-act="fillSrc" data-v="${x}">${x}</button>`).join("")}</div>
    <datalist id="fillSourceList">${sourceOptions().map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
    <div class="btn-row" style="margin:6px 0"><button type="button" class="btn" data-act="fillTick" data-v="1">Tick all</button><button type="button" class="btn" data-act="fillTick" data-v="0">Untick all</button></div>
    ${fillGuideLink(a, spots)}
    <div class="small muted" id="fillCount" style="margin:6px 0"></div>
    <div id="fillRows">${spots.map((s, i) => fillRow(a, s, i, mode)).join("")}</div>
    <div class="btn-row fill-save" style="margin-top:12px"><button class="btn primary" type="button" data-act="fillGo">Save coins</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </div>`);
  if (keep) fillWrite(keep);
  fillCount();
}
// Read what is typed on the quick list.
function fillRead() {
  const rows = $$("#fillRows .fill-row").map((r) => ({ i: num(r.dataset.i), on: r.querySelector(".fill-on").checked, grade: r.querySelector(".fill-grade").value, use: !!(r.querySelector(".fill-use") || {}).checked, paid: (r.querySelector(".fill-paid") || {}).value || "" }));
  const g = (id) => ($(id) ? $(id).value : "");
  return { rows, total: g("#fillTotal"), date: g("#fillDate"), source: g("#fillSource") };
}
function fillWrite(k) {
  $$("#fillRows .fill-row").forEach((r) => {
    const x = k.rows.find((y) => y.i === num(r.dataset.i));
    if (!x) return;
    r.querySelector(".fill-on").checked = x.on; r.querySelector(".fill-grade").value = x.grade; { const u = r.querySelector(".fill-use"); if (u) u.checked = x.use; }
    const p = r.querySelector(".fill-paid"); if (p) p.value = x.paid;
  });
  if ($("#fillTotal")) $("#fillTotal").value = k.total;
  if ($("#fillDate")) $("#fillDate").value = k.date;
  if ($("#fillSource")) $("#fillSource").value = k.source;
}
function fillCount() {
  fillUi.armed = false; const gb = $("[data-act=fillGo]"); if (gb) gb.textContent = "Save coins"; // any change cancels the "Add N coins?" ask
  const el = $("#fillCount");
  if (el) el.textContent = $$("#fillRows .fill-on").filter((c) => c.checked).length + " of " + $$("#fillRows .fill-on").length + " spots ticked.";
}
// Build the coin record for one spot. Same fields the Add coin form fills, so the coin behaves like any other.
function fillCoin(a, s, grade0, paid, date, source, at) {
  const circ = grade0 === "__circ", grade = circ ? "" : grade0;
  const c = blankCoin();
  const t = TYPE_BY_ID[slotType(a, s)];
  if (t) Object.assign(c, { typeId: t.id, typeName: shortName(t), family: t.family, denom: t.denom, metal: t.metal, oz: t.oz || "" });
  c.year = s.set ? "" : s.y; c.mint = s.m || "";
  c.albumId = a.id; c.slotId = s.id; c.holder = "Album";
  c.grade = grade; c.paid = paid; c.acquired = date; c.createdAt = at;
  if (circ) c.noGrade = true; // Circulated (not graded) reuses the "can't grade" flag: no new saved field
  if (circ && !source) source = "Pocket change"; // the label needs a face-value source
  if (source) { if (source === "Inherited" || a.inherited) applySourceKind(c, "Inherited"); else c.source = source; }
  else if (a.inherited) applySourceKind(c, "Inherited");
  delete c._sourceKind; delete c._payAuto; delete c._paidAuto;
  applyYearMetal(c);
  if (typeof inhPrepSave === "function") inhPrepSave(c);
  c.label = autoLabel(c);
  return c;
}
function fillSave() {
  const al = getAlbum($("#fillForm").dataset.id);
  if (!al) return;
  const { a, spots } = fillSpotsOf(al);
  const k = fillRead();
  const on = k.rows.filter((r) => r.on);
  if (!on.length) { toast("Tick at least one spot, or Cancel."); return; }
  const bad = on.find((r) => spots[r.i] && spots[r.i].pf && r.grade && !isProofGrade(r.grade));
  if (on.some((r) => r.grade === "__circ" && !quickAddOk(a, spots[r.i]))) { toast("Circulated isn't allowed on that spot. Pick a grade."); return; }
  if (bad) { toast(slotLabel(spots[bad.i]) + " is a proof spot. Pick a proof grade (PR-60 to PR-70), or untick it."); return; }
  if (k.rows.some((r) => r.on && num(r.paid) != null && num(r.paid) < 0)) { toast("A price can't be negative."); return; }
  const total = k.total === "" ? null : num(k.total);
  if (fillUi.mode === "total" && total != null && total < 0) { toast("The total can't be negative."); return; }
  const parts = fillUi.mode === "total" && total != null ? splitCents(total, on.length) : null; // to the cent, leftover on the first coin
  const goBtn = $("[data-act=fillGo]");
  if (goBtn && !fillUi.armed) { // first tap asks "Add N coins?" in place (the form and what was typed stay); the second tap saves
    fillUi.armed = true; goBtn.textContent = "Add " + on.length + " coin" + (on.length === 1 ? "" : "s") + "? Tap again";
    return;
  }
  fillUi.armed = false;
  const base = Date.now(), ids = [], taken = new Set(), undo = [];
  on.forEach((r, n) => {
    const src = k.source.trim() || (r.grade === "__circ" ? "Pocket change" : ""), t0 = TYPE_BY_ID[slotType(a, spots[r.i])];
    const paid = parts ? moneyStr(parts[n]) : fillUi.mode === "each" && num(r.paid) != null ? moneyStr(num(r.paid)) : fillUi.mode === "each" && isFaceSource({ source: src }) && t0 && t0.face ? moneyStr(t0.face) : ""; // you paid face for pocket change, roll hunting and bank rolls
    const loose = r.use ? fillLooseFor(a, spots[r.i], taken) : null;
    if (loose) { taken.add(loose.id); undo.push({ ...loose }); saveCoin({ ...loose, albumId: a.id, slotId: spots[r.i].id }); return; } // the coin you already have goes in the spot
    const c = fillCoin(a, spots[r.i], r.grade, paid, k.date, k.source.trim(), base + n);
    saveCoin(c); ids.push(c.id);
  });
  if (typeof ensureIds === "function") ensureIds();
  if (k.source.trim() && k.source.trim() !== "Inherited" && !isFaceSource({ source: k.source.trim() }) && settings().lastFillSource !== k.source.trim()) saveSettings({ lastFillSource: k.source.trim() }, true); // quick-add remembers your last source
  albumTypes(a).forEach(touchType);
  const gone = typeof dropSpotWants === "function" ? dropSpotWants(a, on.map((r) => spots[r.i])) : [];
  closeSheet();
  go("album-" + a.id);
  toast((ids.length ? "Added " + ids.length + " coin" + (ids.length === 1 ? "" : "s") : "Placed") + (undo.length ? (ids.length ? " and placed " : " ") + undo.length + " you already had" : "") + " in " + albumTitle(a) + (gone.length ? "; " + gone.length + " crossed off its want list" : "") + ".", {
    label: "Undo", fn: () => { const added = ids.map((id) => getCoin(id)).filter(Boolean); ids.forEach((id) => remove("c_" + id)); if (typeof idGiveBack === "function") idGiveBack(added); undo.forEach((c) => saveCoin(c)); gone.forEach(saveWant); toast("Undone."); render(); },
  });
}
Object.assign(actions, {
  fillSpots: (el) => { fillUi.fresh = false; fillUi.mode = "each"; openFillAlbum(el.dataset.id, false); },
  fillTick: (el) => { $$("#fillRows .fill-on").forEach((b) => { b.checked = el.dataset.v === "1"; }); fillCount(); },
  fillMode: (el) => { const id = $("#fillForm").dataset.id; fillUi.mode = el.dataset.v; openFillAlbum(id, undefined); },
  fillGo: fillSave,
  fillSrc: (el) => { const i = $("#fillSource"); if (i) { i.value = el.dataset.v; fillCount(); } },
});
document.addEventListener("change", (e) => { if (e.target.classList && (e.target.classList.contains("fill-on") || e.target.classList.contains("fill-grade"))) fillCount(); });
// E1-6: the whole row ticks the spot, not just the small box.
document.addEventListener("click", (e) => {
  const row = e.target.closest && e.target.closest("#fillRows .fill-row");
  if (!row || e.target.closest("input, select, label, a, button")) return;
  const box = row.querySelector(".fill-on"); box.checked = !box.checked; fillCount();
});

// E1-9: after making an album, offer the loose coins that fit. Nothing moves until the button is tapped.
let looseOffer = null; // { albumId, thenFill }
function looseFits(album) {
  const { a, spots } = fillSpotsOf(album), taken = new Set(), out = [];
  spots.forEach((s) => {
    const c = s.blank ? null : fillLooseFor(a, s, taken);
    if (c) { taken.add(c.id); out.push({ c, s }); }
  });
  return out;
}
function openLooseOffer(albumId, thenFill) {
  const al = getAlbum(albumId), fits = al ? looseFits(al) : [];
  if (!fits.length) return false;
  looseOffer = { albumId, thenFill };
  const n = fits.length;
  openSheet(`<div class="sheet-head"><h2>${n} of your loose coin${n === 1 ? " fits" : "s fit"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p class="small muted">${esc(albumTitle(al))}: untick any you don't want in it. Nothing moves until you tap the button.</p>
    <div id="looseRows">${fits.map(({ c, s }) => { const where = wasKeptIn(c); return `<label class="chk" style="min-height:48px;border-bottom:1px solid var(--line)"><input type="checkbox" checked data-loose="${esc(c.id)}" data-slot="${esc(s.id)}"><span style="flex:1"><b>${esc(slotLabel(s))}</b> <span class="small muted">${esc([gradeText(c), c.cid, where && "now in " + where].filter(Boolean).join(" · "))}</span></span></label>`; }).join("")}</div>
    <div class="btn-row fill-save" style="margin-top:12px"><button class="btn primary" type="button" data-act="looseGo">Put ${n} coin${n === 1 ? "" : "s"} in</button><button class="btn" type="button" data-act="looseNo">Not now</button></div>`);
  return true;
}
function looseDone() {
  const o = looseOffer; looseOffer = null; closeSheet(); render();
  if (o && o.thenFill && fillSpotsOf(getAlbum(o.albumId)).spots.length) { fillUi.fresh = true; openFillAlbum(o.albumId, true); }
}
Object.assign(actions, {
  looseNo: () => looseDone(),
  looseGo: () => {
    if (!looseOffer) return;
    const al = getAlbum(looseOffer.albumId), before = [];
    const picks = $$("#looseRows [data-loose]").filter((x) => x.checked);
    if (!picks.length) { toast("Tick at least one coin, or tap Not now."); return; }
    picks.forEach((x) => {
      const c0 = getCoin(x.dataset.loose);
      if (!al || !c0 || c0.albumId) return;
      const c = JSON.parse(JSON.stringify(c0));
      applyKept(c, "a:" + al.id); c.slotId = x.dataset.slot;
      before.push(c0); saveCoin(c);
    });
    looseDone();
    toast("Put " + before.length + " coin" + (before.length === 1 ? "" : "s") + " in " + albumTitle(al) + ".", { label: "Undo", fn: () => { before.forEach((c) => put("c_" + c.id, c)); render(); toast("Undone."); } });
  },
});
document.addEventListener("change", (e) => {
  if (!e.target.dataset || !e.target.dataset.loose) return;
  const n = $$("#looseRows [data-loose]").filter((x) => x.checked).length, b = $("[data-act=looseGo]");
  if (b) b.textContent = "Put " + n + " coin" + (n === 1 ? "" : "s") + " in";
});
if (typeof SNAPSHOT_BLOCK !== "undefined") SNAPSHOT_BLOCK.add("looseGo");
