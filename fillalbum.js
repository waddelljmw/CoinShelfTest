// Step 9.6a: fill a full album at once. A quick list with one row per empty spot; every row starts ticked.
// Plain script, shares the page's global names. Saves one coin per ticked spot, then offers Undo for the whole batch.
const fillUi = { albumId: "", mode: "each", fresh: false }; // price mode: "each" row or one "total" for the album

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
function fillRow(a, s, i, mode) {
  const t = TYPE_BY_ID[slotType(a, s)];
  const multi = albumTypes(a).length > 1 && !s.set && t;
  return `<div class="fill-row" data-i="${i}" style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line,#ddd)">
    <input type="checkbox" class="fill-on" checked aria-label="Have ${esc(slotLabel(s))}" style="flex:none;width:22px;height:22px">
    <span style="flex:1;min-width:0"><b>${esc(slotLabel(s))}</b>${s.v ? ` <span class="small muted">${esc(s.v)}</span>` : ""}${multi ? ` <span class="small muted">${esc(shortName(t))}</span>` : ""}</span>
    <select class="fill-grade" aria-label="Grade for ${esc(slotLabel(s))}" style="flex:none;width:92px"><option value="">Grade?</option>${fillGradesFor(a, s).map((g) => `<option>${esc(g)}</option>`).join("")}</select>
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
    <p class="small muted">${esc(albumTitle(a))}: every spot starts ticked. Untick the empty holes, then pick a grade for each coin you have. Leave a grade or price blank to fill in later.</p>
    <div class="chips" style="margin:6px 0"><button type="button" class="chip ${mode === "each" ? "on" : ""}" data-act="fillMode" data-v="each" aria-pressed="${mode === "each"}">Price on each row</button>
      <button type="button" class="chip ${mode === "total" ? "on" : ""}" data-act="fillMode" data-v="total" aria-pressed="${mode === "total"}">One total for the album</button></div>
    ${mode === "total" ? `<label class="f"><span>Total paid for all the coins</span><input type="number" id="fillTotal" inputmode="decimal" min="0" step="0.01" placeholder="Split evenly across the ticked coins"></label>` : ""}
    <div class="grid2">
      <label class="f"><span>Date acquired</span><input type="date" id="fillDate"></label>
      <label class="f"><span>Where from</span><input type="text" id="fillSource" list="fillSourceList" value="${esc(a.inherited ? "Inherited" : "")}" placeholder="optional"></label>
    </div>
    <datalist id="fillSourceList">${sourceOptions().map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
    <div class="btn-row" style="margin:6px 0"><button type="button" class="btn" data-act="fillTick" data-v="1">Tick all</button><button type="button" class="btn" data-act="fillTick" data-v="0">Untick all</button></div>
    ${fillGuideLink(a, spots)}
    <div class="small muted" id="fillCount" style="margin:6px 0"></div>
    <div id="fillRows" style="max-height:50vh;overflow:auto">${spots.map((s, i) => fillRow(a, s, i, mode)).join("")}</div>
    <div class="btn-row" style="margin-top:12px"><button class="btn primary" type="button" data-act="fillGo">Save coins</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </div>`);
  if (keep) fillWrite(keep);
  fillCount();
}
// Read what is typed on the quick list.
function fillRead() {
  const rows = $$("#fillRows .fill-row").map((r) => ({ i: num(r.dataset.i), on: r.querySelector(".fill-on").checked, grade: r.querySelector(".fill-grade").value, paid: (r.querySelector(".fill-paid") || {}).value || "" }));
  const g = (id) => ($(id) ? $(id).value : "");
  return { rows, total: g("#fillTotal"), date: g("#fillDate"), source: g("#fillSource") };
}
function fillWrite(k) {
  $$("#fillRows .fill-row").forEach((r) => {
    const x = k.rows.find((y) => y.i === num(r.dataset.i));
    if (!x) return;
    r.querySelector(".fill-on").checked = x.on; r.querySelector(".fill-grade").value = x.grade;
    const p = r.querySelector(".fill-paid"); if (p) p.value = x.paid;
  });
  if ($("#fillTotal")) $("#fillTotal").value = k.total;
  if ($("#fillDate")) $("#fillDate").value = k.date;
  if ($("#fillSource")) $("#fillSource").value = k.source;
}
function fillCount() {
  const el = $("#fillCount");
  if (el) el.textContent = $$("#fillRows .fill-on").filter((c) => c.checked).length + " of " + $$("#fillRows .fill-on").length + " spots ticked.";
}
// Build the coin record for one spot. Same fields the Add coin form fills, so the coin behaves like any other.
function fillCoin(a, s, grade, paid, date, source, at) {
  const c = blankCoin();
  const t = TYPE_BY_ID[slotType(a, s)];
  if (t) Object.assign(c, { typeId: t.id, typeName: shortName(t), family: t.family, denom: t.denom, metal: t.metal, oz: t.oz || "" });
  c.year = s.set ? "" : s.y; c.mint = s.m || "";
  c.albumId = a.id; c.slotId = s.id; c.holder = "Album";
  c.grade = grade; c.paid = paid; c.acquired = date; c.createdAt = at;
  if (source) { if (source === "Inherited" || a.inherited) applySourceKind(c, "Inherited"); else c.source = source; }
  else if (a.inherited) applySourceKind(c, "Inherited");
  delete c._sourceKind; delete c._payAuto;
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
  const bad = on.find((r) => spots[r.i] && spots[r.i].pf && !isProofGrade(r.grade));
  if (bad) { toast(slotLabel(spots[bad.i]) + " is a proof spot. Pick a proof grade (PR-60 to PR-70), or untick it."); return; }
  if (k.rows.some((r) => r.on && num(r.paid) != null && num(r.paid) < 0)) { toast("A price can't be negative."); return; }
  const total = k.total === "" ? null : num(k.total);
  if (fillUi.mode === "total" && total != null && total < 0) { toast("The total can't be negative."); return; }
  const parts = fillUi.mode === "total" && total != null ? splitCents(total, on.length) : null; // to the cent, leftover on the first coin
  const base = Date.now(), ids = [];
  on.forEach((r, n) => {
    const paid = parts ? moneyStr(parts[n]) : fillUi.mode === "each" && num(r.paid) != null ? moneyStr(num(r.paid)) : "";
    const c = fillCoin(a, spots[r.i], r.grade, paid, k.date, k.source.trim(), base + n);
    saveCoin(c); ids.push(c.id);
  });
  if (typeof ensureIds === "function") ensureIds();
  albumTypes(a).forEach(touchType);
  closeSheet();
  go("album-" + a.id);
  toast("Added " + ids.length + " coin" + (ids.length === 1 ? "" : "s") + " to " + albumTitle(a) + ".", {
    label: "Undo", fn: () => { ids.forEach((id) => remove("c_" + id)); toast("Removed all " + ids.length + " coins."); render(); },
  });
}
Object.assign(actions, {
  fillSpots: (el) => { fillUi.fresh = false; fillUi.mode = "each"; openFillAlbum(el.dataset.id, false); },
  fillTick: (el) => { $$("#fillRows .fill-on").forEach((b) => { b.checked = el.dataset.v === "1"; }); fillCount(); },
  fillMode: (el) => { const id = $("#fillForm").dataset.id; fillUi.mode = el.dataset.v; openFillAlbum(id, undefined); },
  fillGo: fillSave,
});
document.addEventListener("change", (e) => { if (e.target.classList && e.target.classList.contains("fill-on")) fillCount(); });
