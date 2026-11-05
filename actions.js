// Toast, click actions, event listeners, app start (split from app.js; plain script, shares the page's global names)
/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg, action) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="toastAction">${esc(action.label)}</button>` : ""}`;
  t.hidden = false;
  t._action = action ? action.fn : null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 8000 : 2800);
}

/* ---------- events ---------- */
// Sold coin back to stock. keepRecord = Refund or cancel (sale kept as Refunded); otherwise a plain move back.
function returnToStock(el, keepRecord, collect) { // collect (optional list): used by Refund whole order; gathers what Undo must put back and shows no message
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const gone = keepRecord && c.sold ? [{ ...c.sold, refundedAt: Date.now(), biz: !!c.biz }] : []; // the sale, kept as Refunded
    const refs = (x) => [...(x.refunds || []), ...(x === c ? gone : [])];
    const lot = c.lotId || c.splitFrom;
    const same = (x) => ["typeId", "year", "mint", "grade", "gradeMode", "variety", "cert"].every((k) => String(x[k] || "") === String(c[k] || ""));
    // Another piece of the same lot still in the collection (and not changed since): rejoin it.
    const home = lot ? allCoins().find((x) => x.id !== c.id && x.status === "owned" && (x.lotId || x.id) === lot && same(x)) : null;
    const undo = (docs) => toast("Back in your collection.", { label: "Undo", fn: () => { docs.forEach((d) => put("c_" + d.id, d)); toast("Undone. The sale is back."); } });
    if (home) {
      const ask = num(home.ask) != null || num(c.ask) != null ? { ask: String(r2((num(home.ask) || 0) + (num(c.ask) || 0))) } : {};
      const all = [...refs(home), ...refs(c)];
      saveCoin({ ...home, ...joinExtras(home, c), ...ask, ...(all.length ? { refunds: all } : {}), qty: qtyOf(home) + qtyOf(c) });
      remove("c_" + c.id);
      if (collect) { collect.push(home, c); return; }
      undo([home, c]);
      go("coin-" + home.id);
      return;
    }
    const n = { ...c, status: "owned" };
    delete n.sold;
    delete n.splitFrom;
    if (refs(c).length) n.refunds = refs(c);
    const note = (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "");
    saveCoin(n);
    if (collect) { collect.push(c); return; }
    undo([c]);
    if (note) toast("Back in your collection." + note, { label: "Undo", fn: () => { put("c_" + c.id, c); toast("Undone. The sale is back."); } });
  
}

const actions = {
  closeSheet,
  status: (el) => { listState.status = el.dataset.v; render(); },
  seeSold: () => { listState.status = "sold"; listState.family = null; go("coins"); },
  toggleStack: (el) => { const g = el.dataset.v, h = hiddenStacks(); saveSettings({ hiddenStacks: h.includes(g) ? h.filter((x) => x !== g) : [...h, g] }); },
  addBullion: () => { openCoinForm(null); actions.what({ dataset: { v: "bullion" } }); },
  toggleGroup: (el) => { const g = el.dataset.v, h = hiddenGroups(); saveSettings({ hiddenGroups: h.includes(g) ? h.filter((x) => x !== g) : [...h, g] }); },
  fam: (el) => { listState.family = el.dataset.v || null; render(); },
  dir: () => { listState.dir = listState.dir === "asc" ? "desc" : "asc"; render(); },
  edit: (el) => openCoinForm(el.dataset.id),
  sell: (el) => openSell(el.dataset.id),
  editSale: (el) => openSell(el.dataset.id, true),
  sellCount: (el) => { const f = el.closest("form"); if (f && f.elements.n) { f.elements.n.value = el.dataset.n; sellRecalc(f); } }, // quick 1 / All buttons on Mark as sold
  editId: (el) => openEditId(el.dataset.id),
  feeReset: () => { saveSettings({ feeRates: {} }); toast("Usual fee rates are back."); },
  unsell: (el) => returnToStock(el, false),
  refund: (el) => returnToStock(el, true), // Refund or cancel: back in stock, the sale stays on record as Refunded
  delete: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    confirmSheet("Delete this coin?", labelOf(c) + " leaves your lists. You can still Undo right after.", "Delete", () => {
      const prevStatus = c.status;
      saveCoin({ ...c, status: "deleted", prevStatus, deletedAt: Date.now() });
      go(coinBackTarget());
      toast("Coin deleted.", { label: "Undo", fn: () => { const x = getCoin(c.id); if (x) { const n = { ...x, status: prevStatus }; const note = n.status === "owned" ? (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "") : ""; saveCoin(n); toast("Restored." + note); } } });
    });
  },
  received: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const before = JSON.parse(JSON.stringify(c));
    saveCoin({ ...c, stage: "", receivedDate: today() });
    toast("Received. It's in your collection.", { label: "Undo", fn: () => { put("c_" + before.id, before); toast("Undone."); } });
  },
  pasteTrack: async () => {
    const inp = $("#trackNo");
    try {
      const t = (await navigator.clipboard.readText()).trim().replace(/\s+/g, "");
      if (!t) { toast("Nothing copied yet. Copy the tracking number first."); return; }
      draft.trackNo = t.slice(0, 40); if (inp) inp.value = draft.trackNo;
    } catch (e) { toast("Couldn't read the clipboard. Long-press the box and tap Paste."); if (inp) inp.focus(); }
  },
  ungone: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const before = JSON.parse(JSON.stringify(c));
    const n = { ...c, status: "owned", stage: "" };
    delete n.gone;
    const note = (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "");
    saveCoin(n);
    toast("Back in your collection." + note, { label: "Undo", fn: () => { put("c_" + before.id, before); toast("Undone."); } });
  },
  restore: (el) => { const c = getCoin(el.dataset.id); if (c) { const n = { ...c, status: c.prevStatus || "owned" }; const note = n.status === "owned" ? (typeof freeSpotOnReturn === "function" ? freeSpotOnReturn(n) : "") : ""; saveCoin(n); toast("Restored." + note); } },
  purge: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    confirmSheet("Delete forever?", labelOf(c) + " will be gone for good. This can't be undone.", "Delete forever", () => { remove("c_" + c.id); toast("Deleted forever."); });
  },
  confirmOk: () => { const fn = confirmSheet.fn; confirmSheet.fn = null; closeSheet(); if (fn) fn(); },
  toastAction: () => { const t = $("#toast"); t.hidden = true; if (t._action) t._action(); },
  hideSpot: (el) => { const s = settings(); saveSettings({ hideSpot: { ...s.hideSpot, [el.dataset.v]: !el.checked } }); },
  showSold: (el) => saveSettings({ showSold: el.checked, soldAutoDone: true }),
  idStyle: (el) => saveSettings({ idStyle: ["own", "running", "off"].includes(el.dataset.v) ? el.dataset.v : "app" }),
  idRenumber: () => idRenumberAsk(),
  idUndoRenumber: () => { undoRenumber(); render(); toast("Back to the old IDs."); },
  shelfStyle: (el) => saveSettings({ shelfStyle: el.dataset.v === "safe" ? "safe" : "bookcase" }),
  hideValues: () => saveSettings({ hideValues: !settings().hideValues }),
  optSec: (el) => { const o = { ...(settings().optOpen || {}) }; if (o[el.dataset.v]) delete o[el.dataset.v]; else o[el.dataset.v] = true; saveSettings({ optOpen: o }); },
  forSale: (el) => {
    const c = getCoin(el.dataset.id); if (!c) return;
    if (settings().skipForSaleAsk) { putForSale(c.id, true); return; }
    openSheet(`<div class="sheet-head"><h2>Put it up for sale?</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p>${esc(labelOf(c))} goes on your For sale list. You can take it off again any time.</p>
      <label class="switch"><span>Don't ask again</span><input type="checkbox" id="fsNoAsk"></label>
      <div class="btn-row"><button class="btn primary" data-act="forSaleOk" data-id="${esc(c.id)}">Yes, for sale</button><button class="btn" data-act="closeSheet">Cancel</button></div>`);
  },
  forSaleOk: (el) => { const no = $("#fsNoAsk"); if (no && no.checked) saveSettings({ skipForSaleAsk: true }, true); closeSheet(); putForSale(el.dataset.id, true); },
  sellLater: (el) => { const c = getCoin(el.dataset.id); if (!c) return; const on = !c.sellLater; saveCoin({ ...c, sellLater: on }); toast(on ? "Noted. It stays marked Inherited." : "Note removed."); go("coin-" + c.id); },
  notForSale: (el) => putForSale(el.dataset.id, false),
  homeTog: (el) => saveSettings({ [el.dataset.v]: el.checked }),
  homeSec: (el) => { const c = { ...(settings().homeClosed || {}) }; if (c[el.dataset.v]) delete c[el.dataset.v]; else c[el.dataset.v] = true; saveSettings({ homeClosed: c }); },
  shelfShow: (el) => { const L = shelfLayout(); saveLayout({ hidden: { ...L.hidden, [el.dataset.k]: !el.checked } }); },
  shelfMove: (el) => moveShelf(el.dataset.k, +el.dataset.d),
  shelfPin: (el) => { const L = shelfLayout(), pins = { ...L.pins }; if (el.dataset.v) pins[el.dataset.k] = el.dataset.v; else delete pins[el.dataset.k]; saveLayout({ pins }); },
  shelfItem: (el) => { const L = shelfLayout(), h = { ...L.hiddenItems }; if (el.checked) delete h[el.dataset.id]; else h[el.dataset.id] = true; saveLayout({ hiddenItems: h }); },
  shelfShowAll: () => saveLayout({ hiddenItems: {} }),
  newAlbum: openNewAlbum,
  missing: (el) => openMissing(el.dataset.id),
  editSlots: (el) => { albumEdit.id = albumEdit.id === el.dataset.id ? null : el.dataset.id; render(); },
  addSpot: (el) => openAddSpot(el.dataset.id),
  shareApp: () => shareAppLink(),
  sortAlbumsDate: () => { sortAlbumsByDate(); },
  reorderAlbums: () => { albumsView.reorder = !albumsView.reorder; render(); },
  moveAlbum: (el) => moveAlbum(el.dataset.id, +el.dataset.d, !!el.dataset.whole),
  albumAddType: () => {
    const box = $("#albumTypes");
    if (!box) return;
    box.insertAdjacentHTML("beforeend", `<div class="type-row"><select name="typeId" data-albumtype><option value="">Choose a coin type…</option>${typeOptions("")}</select><button type="button" class="type-del" data-act="albumDelType" aria-label="Remove this type">✕</button></div>`);
  },
  albumDelType: (el) => { const r = el.closest(".type-row"); if (r) r.remove(); albumYearsFromTypes(); },
  editAlbum: (el) => openEditAlbum(el.dataset.id),
  spotEdit: (el) => openSpotEdit(el.dataset.id, +el.dataset.i),
  moveSpot: (el) => {
    const a = withSlotIds(getAlbum(el.dataset.id));
    if (!a) return;
    const i = +el.dataset.i, j = i + (+el.dataset.d);
    const slots = (a.slots || []).slice();
    if (j < 0 || j >= slots.length || slots[i].y !== slots[j].y) return; // years stay in order
    [slots[i], slots[j]] = [slots[j], slots[i]];
    put("a_" + a.id, { ...a, slots });
  },
  pickSpotV: (el) => { const i = $("#spotV"); if (i) i.value = el.dataset.v; },
  deleteSpot: (el) => {
    const a = getAlbum(el.dataset.id);
    if (!a) return;
    const k = el.dataset.k;
    const gone = (a.slots || []).find((x) => slotKey(x) === k);
    const freed = gone && gone.id ? allCoins().filter((c) => c.slotId === gone.id) : [];
    put("a_" + a.id, { ...a, slots: (a.slots || []).filter((x) => slotKey(x) !== k) });
    freed.forEach((c) => { const x = { ...c }; delete x.slotId; saveCoin(x); }); // they fall back to their plain date spot
    if (!$("#sheet").hidden) closeSheet();
    toast("Spot removed.", { label: "Undo", fn: () => { put("a_" + a.id, a); freed.forEach((c) => saveCoin(c)); } });
  },
  toggleSlot: (el) => {
    const a = getAlbum(el.dataset.id);
    const k = el.dataset.k;
    const removed = new Set(a.removed || []);
    removed.has(k) ? removed.delete(k) : removed.add(k);
    put("a_" + a.id, { ...a, removed: [...removed] });
    if (!$("#sheet").hidden) closeSheet();
  },
  deleteAlbum: (el) => {
    const a = getAlbum(el.dataset.id);
    if (!a) return;
    const inAlbum = allCoins().filter((c) => c.albumId === a.id);
    inAlbum.forEach((c) => saveCoin({ ...c, albumId: "" }));
    remove("a_" + a.id);
    go("albums");
    toast("Album deleted. Its coins are still in your collection.", { label: "Undo", fn: () => { put("a_" + a.id, a); inAlbum.forEach((c) => { const x = getCoin(c.id); if (x) saveCoin({ ...x, albumId: a.id }); }); } });
  },
  // form
  gmode: (el) => { draft.gradeMode = el.dataset.v; if (draft.gradeMode === "raw" && draft.holder === "Slab") draft.holder = ""; if (draft.gradeMode === "cert" && draft.grade === "Junk") draft.grade = ""; renderCoinForm(); },
  pickType: (el) => pickType(el.dataset.id),
  what: (el) => {
    const junk = el.dataset.v === "junk", v = junk ? "bullion" : el.dataset.v;
    draft._what = v === "roll" ? "us" : v;
    if (v === "set" || v === "roll" || v === "bullion") { draft.item = v; draft.family = v === "set" ? "Sets" : v === "bullion" ? "Bullion" : ""; draft.typeId = ""; draft.mint = ""; }
    else delete draft.item;
    if (v === "bullion") Object.assign(draft, { bShape: "Bar", bPurity: "0.999", metal: "Silver", typeName: "Bullion" });
    if (junk) Object.assign(draft, { bShape: "Junk", bPurity: "1", bUnit: "oz", jKind: "90", jFace: "", bWeight: "" });
    if (v === "other") { draft.typeId = ""; draft.mint = ""; }
    renderCoinForm();
  },
  addToCase: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    openCoinForm(null);
    Object.assign(draft, { _what: "us", holder: c.holder, caseName: c.caseName, source: c.source || "", acquired: c.acquired || "" });
    delete draft._sourceKind;
    renderCoinForm();
  },
  addAnother: (el) => { // a fresh Add coin form with the same coin type picked
    const c = getCoin(el.dataset.id);
    openCoinForm(null);
    if (c && c.typeId && TYPE_BY_ID[c.typeId]) pickType(c.typeId);
  },
  retype: () => retypeDraft(),
  toggleProof: (el) => {
    if (!draft) return;
    const was = draft._proof;
    draft._proof = el.checked;
    const t = TYPE_BY_ID[draft.typeId];
    // Remember what was set before switching to proof, so switching back puts it back.
    if (draft._proof && !was) draft._preProof = { grade: draft.grade, mint: draft.mint };
    if (!draft._proof && draft._preProof && (!draft.grade || isProofGrade(draft.grade))) draft.grade = draft._preProof.grade; // switching back: put the old grade back
    else if (isProofGrade(draft.grade) !== draft._proof) draft.grade = "";
    if (!draft._proof && draft._preProof && !draft.mint && mintChoices(t, false).includes(draft._preProof.mint)) draft.mint = draft._preProof.mint; // switching back: put the old mint back
    else if (draft.mint && !mintChoices(t, draft._proof).includes(draft.mint)) draft.mint = "";
    if (!draft._proof) delete draft._preProof;
    const y = $(".sheet").scrollTop;
    renderCoinForm();
    $(".sheet").scrollTop = y;
  },
  rmPhoto: (el) => { (draft[el.dataset.k || "photos"] || []).splice(+el.dataset.i, 1); const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; },
  whatsNew: () => openWhatsNew(true),
  reportProblem: () => {
    const body = "What were you doing?\n\n\nWhat went wrong?\n\n\n(Please don't include private details. This page is public.)\n\n---\nApp version: " + APP_VERSION + "\nMode: " + store.mode + "\nPhone/browser: " + navigator.userAgent;
    window.open("https://github.com/waddelljmw/CoinShelfTest/issues/new?title=" + encodeURIComponent("Problem: ") + "&body=" + encodeURIComponent(body), "_blank", "noopener");
  },
  suggestIdea: () => {
    const body = "What would you like the app to do?\n\n\nWhy would it help?\n\n\n(Please don't include private details. This page is public.)\n\n---\nApp version: " + APP_VERSION;
    window.open("https://github.com/waddelljmw/CoinShelfTest/issues/new?title=" + encodeURIComponent("Idea: ") + "&body=" + encodeURIComponent(body), "_blank", "noopener");
  },
  spotAsk: (el) => { draft._spotAsk = el.dataset.v; const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; },
  srcChip: (el) => {
    const v = el.dataset.v, y = $(".sheet").scrollTop;
    if (v === "__more") (draft._open = draft._open || {}).purchase = true;
    else if (draft._sourceKind === v) { draft._sourceKind = ""; draft.source = ""; } // tap again to clear
    else applySourceKind(draft, v);
    renderCoinForm(); $(".sheet").scrollTop = y;
  },
  fetchSpot: () => fetchSpotPrices(false),
  typeInPrices: () => { closeSheet(); saveSettings({ optOpen: { ...(settings().optOpen || {}), "spot-prices": true } }); go("options"); },
  ppFetch: async (el) => { await fetchSpotPrices(false); if (spotPerOz(el.dataset.v) != null) { closeSheet(); render(); } },
  ppSave: (el) => {
    const v = num(($("#ppInput") || {}).value);
    if (v == null || v <= 0) { toast("Type the price, like 32.10."); return; }
    saveSettings({ spot: { ...settings().spot, [el.dataset.v]: v }, spotUpdated: new Date().toISOString() });
    closeSheet(); toast("Price saved."); render();
  },
  tryDemo: () => { location.href = location.pathname + "?demo"; }, // opens fresh, so the real saved coins are never touched
  exitDemo: () => { location.href = location.pathname; },
  demoFill: () => demoFillRun(),
  resetLabel: () => { draft.labelEdited = false; draft.label = ""; renderCoinForm(); },
};

// Actions that change saved data; inert in a view-only snapshot. (+ Add coin stays as a try-out.)
const SNAPSHOT_BLOCK = new Set(("fillSpots fillGo sellLater edit editSale sell unsell refund selAsk delete restore purge confirmOk boxNew boxEdit boxDelete boxAdd newAlbum editAlbum deleteAlbum editSlots addSpot spotEdit moveSpot " +
  "fetchSpot hideSpot showSold homeTog optSec forSale forSaleOk notForSale shelfStyle idStyle idRenumber idUndoRenumber shelfShow shelfMove shelfPin shelfItem shelfShowAll slotWant slotWantAdd slotUnwant missing missAdd missAll wantEdit wantGot wantNew wantRemove awNew awEdit awGot awRemove wlNew wlDelete " +
  "export openImport undoImport openReport openSnapshot openBackup doBackup reorderAlbums sortAlbumsDate moveAlbum").split(" "));
document.addEventListener("click", (e) => {
  const goEl = e.target.closest("[data-go]");
  if (goEl) {
    e.preventDefault();
    // A link may name the folded Options section it lands on (data-open): open it so it is ready to use.
    if (goEl.dataset.open) saveSettings({ optOpen: { ...(settings().optOpen || {}), [goEl.dataset.open]: true } });
    go(goEl.dataset.go); return;
  }
  const actEl = e.target.closest("[data-act]");
  if (actEl && actions[actEl.dataset.act]) {
    if (store.mode === "snapshot" && SNAPSHOT_BLOCK.has(actEl.dataset.act)) { e.preventDefault(); toast("This is a view-only copy."); return; }
    if (actEl.tagName !== "INPUT") e.preventDefault();
    actions[actEl.dataset.act](actEl, e);
    return;
  }
  if (!e.target.closest("#menu") && !e.target.closest("#menuBtn")) closeMenu();
  if (!e.target.closest(".typeahead")) { const l = $("#typeList"); if (l) l.hidden = true; }
});
$("#menuBtn").addEventListener("click", () => {
  const m = $("#menu");
  m.hidden = !m.hidden;
  $("#menuBtn").setAttribute("aria-expanded", String(!m.hidden));
});
$("#fab").addEventListener("click", () => openCoinForm(null));

let spotTimer = null;
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "typeSearch") { showTypeList(el.value); return; }
  if (el.id === "spotY") { refreshSpotHints(); return; }
  if (el.dataset.list === "q") { listState.q = el.value; render(); return; }
  if (el.dataset.setting) {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => saveSettings({ [el.dataset.setting]: el.value.trim() }, true), 700);
    return;
  }
  if (el.dataset.idown || el.dataset.idrun) { // Coin ID style boxes: save quietly (a redraw would close the box you're typing in)
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => {
      if (el.dataset.idrun) { saveSettings({ idRun: { ...(settings().idRun || {}), [el.dataset.idrun]: el.value.trim() } }, true); return; }
      const own = { ...(settings().idOwn || {}) }, b = el.dataset.idown, cur = { ...(own[b] || {}) };
      cur[el.dataset.part] = el.dataset.part === "code" ? idCode(el.value) : el.value.replace(/\D/g, "");
      if (!cur.code && !cur.start) delete own[b]; else own[b] = cur;
      saveSettings({ idOwn: own }, true);
    }, 600);
    return;
  }
  if (el.dataset.spot) {
    clearTimeout(spotTimer);
    spotTimer = setTimeout(() => {
      const spot = {};
      $$("[data-spot]").forEach((i) => { spot[i.dataset.spot] = num(i.value); });
      const stamp = new Date().toISOString();
      saveSettings({ spot, spotUpdated: stamp }, true); // quiet: a redraw here would close the box you're typing in
      const u = $("#spotStamp"); if (u) u.textContent = "Last updated " + stampText(stamp) + ".";
    }, 700);
    return;
  }
  if (!draft) return;
  if (el.dataset.na) { draft._newAlbum[el.dataset.na] = el.value; return; }
  const f = el.dataset.f;
  if (!f) return;
  draft[f] = el.value;
  if (f === "label") { draft.labelEdited = true; return; }
  if (f === "source") { const h = $("#inhHint"); if (h) h.hidden = !isInherited(draft); return; }
  if (f === "year" && TYPE_BY_ID[draft.typeId] && TYPE_BY_ID[draft.typeId].metalByYear) {
    const before = draft.metal;
    applyYearMetal(draft);
    if (draft.metal !== before) { const ms = $("[data-f=metal]"), oz = $("[data-f=oz]"); if (ms) ms.value = draft.metal; if (oz) oz.value = draft.oz; toast("Metal set to " + draft.metal + " for " + draft.year + "."); }
  }
  if (f === "_grams" || f === "_purity") gramsToOz(draft);
  if (f === "typeName") { if (!OTHER_KINDS.includes(draft.family)) draft.family = ""; if (TYPE_BY_ID[draft.typeId] && shortName(TYPE_BY_ID[draft.typeId]) !== el.value) draft.typeId = ""; }
  if (!draft.labelEdited) { const li = $("#labelInput"); if (li) li.value = autoLabel(draft); }
  if (draft.bShape === "Junk" && itemOf(draft) === "bullion" && (f === "jKind" || f === "jFace" || f === "bShape")) { draft.bWeight = junkOz(draft) ? String(junkOz(draft)) : ""; draft.bPurity = "1"; draft.bUnit = "oz"; }
  if (f === "_bAmt") draft.bWeight = num(el.value) ? String(roundTo(num(el.value) / unitFactor(barUnit(draft)), 6)) : "";
  if (itemOf(draft) === "bullion" && (f === "_bAmt" || f === "bWeight" || f === "bPurity" || f === "jKind" || f === "jFace" || f === "bShape")) draft.oz = bullionOz(draft) ? String(bullionOz(draft)) : "";
  if (f === "oz" && itemOf(draft) === "set") draft._ozEdited = el.value !== "";
  if (f === "rollCount") draft._countEdited = true;
  if (itemOf(draft) === "set" && (f === "year" || f === "setKind")) { autoSetOz(draft); const oi = $("[data-f=oz]"); if (oi && !draft._ozEdited) oi.value = draft.oz; }
  refreshFormHints();
});
document.addEventListener("focusin", (e) => { if (e.target.id === "typeSearch") showTypeList(e.target.value); });
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.list) { listState[el.dataset.list] = el.value; render(); return; }
  if (el.dataset.actChange === "useOther") { const o = savedOthers()[+el.value]; if (o) { Object.assign(draft, { typeName: o.name, denom: o.denom, family: o.family, metal: o.metal, oz: o.oz }); const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; } return; }
  if (el.id === "photoInput") { addPhotos([...el.files]); return; }
  if (el.id === "receiptInput") { addPhotos([...el.files], "receiptPhotos"); return; }
  if (el.id === "spotM") { refreshSpotHints(); return; }
  if (el.id === "albumTypeFind") { // Add album: type a few letters, pick a coin type from the list
    const q = el.value.trim().toLowerCase();
    const t = COIN_TYPES.find((x) => x.name.toLowerCase() === q) || (q.length > 2 ? (COIN_TYPES.filter((x) => x.name.toLowerCase().includes(q)).length === 1 ? COIN_TYPES.find((x) => x.name.toLowerCase().includes(q)) : null) : null);
    const sel = $("#albumTypes select[data-albumtype]");
    if (t && sel) { sel.value = t.id; const f = el.form; if (f) { f.dataset.touched = "1"; const nm = f.querySelector("[name=name]"); if (nm && f.id === "albumForm") nm.placeholder = t.name; } albumYearsFromTypes(); }
    return;
  }
  if (el.dataset.albumtype != null) { albumYearsFromTypes(); return; }
  if (el.id === "albumLayout") { const h = $("#albumHint"); if (h) h.textContent = el.value === "set" ? "Add each coin type your type set holds. Each gets one spot, and any date fills it. The years are just for your reference." : "Use the years printed on your album. Each coin type gets spots for the dates and mint marks struck in those years."; return; }
  if (!draft) return;
  if (el.dataset.na) { draft._newAlbum[el.dataset.na] = el.value; if (el.dataset.na === "brand") renderCoinForm(); return; }
  if (el.dataset.flist) { // checkbox lists (mint errors, problems)
    const k = el.dataset.flist, set = new Set(listOf(draft[k]));
    if (el.checked) set.add(el.value); else set.delete(el.value);
    draft[k] = [...set];
    const sm = el.closest("details") && el.closest("details").querySelector("summary");
    if (sm && k === "problems") sm.textContent = "Errors and problems" + (set.size ? " · Details" : "");
    refreshFormHints(); return;
  }
  if (el.dataset.fcheck) {
    draft[el.dataset.fcheck] = el.checked;
    if (el.hasAttribute("data-rerender")) { const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; return; }
    refreshFormHints(); return;
  }
  if (el.hasAttribute("data-kept")) { // the "Kept in" dropdown: one place per item
    if (el.value === "b:__add") { boxReturn = { kind: "coin" }; boxForm(null); return; } // + Add storage: make a box, then come back here
    applyKept(draft, el.value);
    if (draft._isNew && !draft.typeId && el.value.startsWith("a:")) { const al = getAlbum(el.value.slice(2)); if (al && albumTypes(al).length === 1) { pickType(albumTypes(al)[0]); return; } }
    const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y; return;
  }
  if (el.dataset.f) {
    draft[el.dataset.f] = el.value;
    if (el.dataset.f === "metal" && !MELT_OF_METAL[el.value]) draft.oz = "";
    if (el.dataset.f === "_sourceKind") {
      applySourceKind(draft, el.value);
    }
    if (el.dataset.f === "albumId" && draft._isNew && !draft.source) { const al = getAlbum(el.value); if (al && al.inherited) applySourceKind(draft, "Inherited"); }
    if (el.dataset.f === "albumId" && draft._isNew && !draft.typeId) { const al = getAlbum(el.value); if (al && albumTypes(al).length === 1) { pickType(albumTypes(al)[0]); return; } }
    if (el.dataset.f === "setKind") autoSetOz(draft);
    if (el.dataset.f === "boughtShowId") { // the show day fills in Date acquired (unless you typed a date yourself)
      const sh = getShow(el.value);
      if (!el.value) delete draft.boughtShowId;
      if (sh && (!draft.acquired || draft.acquired === draft._acqAuto)) { draft.acquired = saleDateForShow(sh); draft._acqAuto = draft.acquired; }
    }
    if (el.hasAttribute("data-rerender")) {
      const y = $(".sheet").scrollTop;
      renderCoinForm();
      $(".sheet").scrollTop = y;
    }
  }
});
document.addEventListener("toggle", (e) => { // remember which sections you opened, so redrawing the form keeps them open
  const k = e.target.dataset && e.target.dataset.sec;
  if (k && draft) (draft._open = draft._open || {})[k] = e.target.open;
}, true);
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "coinForm") saveDraft();
  else if (e.target.id === "sellForm") doSell(e.target);
  else if (e.target.id === "idForm") {
    const f = e.target, bad = setCoinId(f.dataset.id, new FormData(f).get("cid"));
    if (bad) openEditId(f.dataset.id, bad); else { closeSheet(); toast("ID saved."); }
  }
  else if (e.target.id === "albumForm") doNewAlbum(e.target);
  else if (e.target.id === "spotForm") saveSpot(e.target);
  else if (e.target.id === "editAlbumForm") saveEditAlbum(e.target);
  else if (e.target.id === "spotEditForm") saveSpotEdit(e.target);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { dismissSheet(); closeMenu(); } });

// Start once every script (sheets.js, photofill.js) has loaded.
document.addEventListener("DOMContentLoaded", () => { render(); Promise.resolve(initStore()).then(() => { try { maybeShowWhatsNew(); } catch (e) { /* never block the app */ } }); });
