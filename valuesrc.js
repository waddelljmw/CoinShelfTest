/* Step 44b: value sources (plan: reviews/41).
   - His own named sources: settings.valueSources [{id, name}]. A coin's valueFrom is "s:<id>" for one of them,
     so a rename shows on every coin and no coin is rewritten. The app ships no source names.
   - valueFrom "melt": the Value box stays empty and the coin follows the live metal price.
   - Compare-only values: coin.compare [{from, value}]. Never in totals.
   - Up to 3 price lists: records "pricebook" (list 1, as before), "pricebook2", "pricebook3".
     settings.fillFrom says which one fills coins with no value. PRICE_BOOK is always that list,
     so a coin never borrows a price from another list. */
const BOOK_KEYS = ["pricebook", "pricebook2", "pricebook3"];
const valueSources = () => (Array.isArray(settings().valueSources) ? settings().valueSources : []).filter((s) => s && s.id && s.name);
const srcById = (id) => valueSources().find((s) => s.id === id);
// Called by valueFromText (catalog/varieties.js) for the words it doesn't know.
function srcText(k) {
  if (k === "melt") return "Melt";
  if (typeof k === "string" && k.startsWith("s:")) { const s = srcById(k.slice(2)); return s ? s.name : ""; }
  return "";
}
const hasPrices = (r) => usableBook(r) && Object.keys(r.series || {}).length > 0;
const loadedBooks = () => BOOK_KEYS.filter((k) => hasPrices(store.docs.get(k)));
function activeBookKey() {
  const f = settings().fillFrom;
  return f && f !== "pricebook" && BOOK_KEYS.includes(f) && hasPrices(store.docs.get(f)) ? f : "pricebook";
}
const listName = (k) => { const r = store.docs.get(k); return (r && r.source) || (k === "pricebook" ? bookName() : "Price list " + (BOOK_KEYS.indexOf(k) + 1)); };
// Look a coin up in another loaded list (for compare lines only).
function withBook(rec, fn) {
  const keep = PRICE_BOOK;
  PRICE_BOOK = { ...emptyBook(), ...rec };
  try { return fn(); } finally { PRICE_BOOK = keep; }
}
// The metal word for "Melt (follows silver)".
const meltWord = (d) => { const k = meltKey(d); return k ? k : ""; };
const meltPossible = (d) => itemOf(d) !== "set" && !!meltKey(d) && !!num(d.oz);

/* ---------- coin form ---------- */
function vfOptions(cur, withMelt, d) {
  const mine = valueSources();
  return `<option value="">Not said</option>${VALUE_FROM.map(([k, w]) => `<option value="${k}" ${cur === k ? "selected" : ""}>${esc(w)}</option>`).join("")}`
    + mine.map((s) => `<option value="s:${esc(s.id)}" ${cur === "s:" + s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")
    + (withMelt ? `<option value="melt" ${cur === "melt" ? "selected" : ""}>Melt (follows ${esc(meltWord(d) || "metal")})</option>` : "")
    + `<option value="__new">+ Name a new source…</option>`;
}
function valueFromField(d) {
  const hide = isJunk(d) || (num(d.value) == null && d.valueFrom !== "melt" && !meltPossible(d));
  return `<label class="f" id="vfRow" ${hide ? "hidden" : ""}><span>Value from</span><select data-f="valueFrom" data-prev="${esc(d.valueFrom || "")}">${vfOptions(d.valueFrom || "", meltPossible(d) || d.valueFrom === "melt", d)}</select></label>`;
}
function compareFields(d) {
  if (isJunk(d)) return "";
  const list = Array.isArray(d.compare) ? d.compare : [];
  const rows = list.map((x, i) => `<div class="grid2 cmp-row">
      <label class="f"><span>Compare: from</span><select data-cmp="${i}" data-cmpk="from" data-prev="${esc(x.from || "")}">${vfOptions(x.from || "", false, d).replace('<option value="">Not said</option>', '<option value="">Choose…</option>')}</select></label>
      <label class="f"><span>Value${eachWord(d)} <button type="button" class="link-btn" data-act="cmpRemove" data-i="${i}" aria-label="Remove this compare value">✕ Remove</button></span><input type="number" inputmode="decimal" step="0.01" min="0" data-cmp="${i}" data-cmpk="value" value="${esc(x.value || "")}" placeholder="$"></label>
    </div>`).join("");
  const link = typeof levelKey === "function" && levelKey() === "simple" ? "" : `<button type="button" class="link-btn" data-act="cmpAdd">+ Compare another value</button>`;
  return `<div id="cmpBox">${rows}${link}${rows ? `<div class="hint">Compare values are for looking only. They never count in your totals.</div>` : ""}</div>`;
}
function redrawForm() { const s = $(".sheet"), y = s ? s.scrollTop : 0; renderCoinForm(); const s2 = $(".sheet"); if (s2) s2.scrollTop = y; }
let srcFor = null; // which select asked for a new source: { main: true } or { i }
function askSourceName(target) {
  srcFor = target;
  openSheetOver(`<div class="sheet-head"><h2>Name a value source</h2></div>
    <label class="f"><span>Name (for example, a price guide you own)</span><input type="text" id="vsName" maxlength="40" autocomplete="off"></label>
    <div class="btn-row"><button class="btn primary" data-act="vsSave">Save</button><button class="btn" data-act="wordBack">Cancel</button></div>
    <div class="hint">Only you see this name. Change or remove it in Options › Value sources.</div>`);
  setTimeout(() => { const i = $("#vsName"); if (i) i.focus(); }, 50);
}
// Adds a source (or finds one with the same name) and returns its id.
function addSource(name) {
  const n = String(name || "").trim().slice(0, 40);
  if (!n) return "";
  const have = valueSources().find((s) => s.name.toLowerCase() === n.toLowerCase());
  if (have) return have.id;
  const id = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  saveSettings({ valueSources: [...valueSources(), { id, name: n }] }, true);
  return id;
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (!draft || !el.closest || !el.closest("#coinForm")) return;
  if (el.dataset.f === "valueFrom") {
    if (el.value === "__new") { draft.valueFrom = el.dataset.prev || ""; el.value = draft.valueFrom; askSourceName({ main: true }); return; }
    if (el.value === "melt") { draft.value = ""; const v = $("#coinForm [data-f=value]"); if (v) v.value = ""; }
    el.dataset.prev = el.value;
    refreshFormHints();
    return;
  }
  if (el.dataset.cmp != null) {
    const i = +el.dataset.cmp, row = (draft.compare = Array.isArray(draft.compare) ? draft.compare : [])[i];
    if (!row) return;
    if (el.dataset.cmpk === "from" && el.value === "__new") { el.value = el.dataset.prev || ""; askSourceName({ i }); return; }
    row[el.dataset.cmpk] = el.value;
    if (el.dataset.cmpk === "from") el.dataset.prev = el.value;
  }
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (!draft || !el.closest || !el.closest("#coinForm")) return;
  if (el.dataset.cmp != null && el.dataset.cmpk === "value") { const row = (draft.compare || [])[+el.dataset.cmp]; if (row) row.value = el.value; return; }
  // Typing a value while Melt is picked: the typed number wins.
  if (el.dataset.f === "value" && num(el.value) != null && draft.valueFrom === "melt") {
    draft.valueFrom = ""; const s = $("#coinForm select[data-f=valueFrom]"); if (s) { s.value = ""; s.dataset.prev = ""; }
  }
});
Object.assign(actions, {
  cmpAdd: () => { if (!draft) return; (draft.compare = Array.isArray(draft.compare) ? draft.compare : []).push({ from: "", value: "" }); redrawForm(); },
  cmpRemove: (el) => { if (!draft || !Array.isArray(draft.compare)) return; draft.compare.splice(+el.dataset.i, 1); redrawForm(); },
  vsSave: () => {
    const id = addSource(($("#vsName") || {}).value);
    if (!id) { const i = $("#vsName"); if (i) i.focus(); return; }
    const t = srcFor; srcFor = null;
    if (draft && t) {
      if (t.main) draft.valueFrom = "s:" + id;
      else if (Array.isArray(draft.compare) && draft.compare[t.i]) draft.compare[t.i].from = "s:" + id;
    }
    actions.wordBack();
    setTimeout(() => { if (draft) redrawForm(); }, 60);
  },
});
// Save: tidy what the form sends. Called from saveDraft (coinsave.js).
function tidyValueFields(c) {
  if (c.valueFrom === "melt") c.value = "";
  const keepFrom = c.valueFrom === "melt" ? !isJunk(c) : num(c.value) != null && !!valueFromText(c.valueFrom);
  if (!keepFrom) delete c.valueFrom;
  const cmp = (Array.isArray(c.compare) ? c.compare : []).filter((x) => x && x.from && x.from !== "melt" && valueFromText(x.from) && num(x.value) != null)
    .map((x) => ({ from: x.from, value: String(Math.max(0, num(x.value))) }));
  if (cmp.length) c.compare = cmp.slice(0, 5); else delete c.compare;
}

/* ---------- coin page ---------- */
// Lines under the Value row: compare values he typed, then what each other loaded list says. Never in totals.
function compareLinesHtml(c, row) {
  const out = (Array.isArray(c.compare) ? c.compare : []).filter((x) => valueFromText(x.from) && num(x.value) != null)
    .map((x) => row(esc(valueFromText(x.from)) + ` <span class="muted small">compare</span>`, money(num(x.value))));
  if (!hasProblems(c) && store.mode !== "snapshot" && store.mode !== "demo") {
    const act = activeBookKey();
    loadedBooks().filter((k) => k !== act).forEach((k) => {
      const p = withBook(store.docs.get(k), () => bookPrice(c));
      if (p != null) out.push(row(esc(listName(k)) + ` <span class="muted small">compare</span>`, money(p)));
    });
  }
  return out.join("");
}

/* ---------- Options › Value sources ---------- */
const coinsUsing = (id) => allCoins().filter((c) => c.status !== "deleted" && (c.valueFrom === "s:" + id || (Array.isArray(c.compare) && c.compare.some((x) => x.from === "s:" + id)))).length;
function valueSourcesOptionsHtml() {
  const list = valueSources();
  return `<h2 data-key="value-sources">Value sources</h2>
    <div class="card"><div class="small muted" style="margin-bottom:6px">Your own names for where a value came from. ${wi("valuesrc")}</div>${list.length ? list.map((s) => { const n = coinsUsing(s.id); return `<div class="grid2" style="align-items:end">
        <label class="f"><span>Name</span><input type="text" maxlength="40" data-vsren="${esc(s.id)}" value="${esc(s.name)}"></label>
        <div style="padding-bottom:12px">${n ? `<span class="muted small">Used by ${n} coin${n === 1 ? "" : "s"}</span>` : `<button class="btn" data-act="vsRemove" data-v="${esc(s.id)}">Remove</button>`}</div></div>`; }).join("")
      : `<div class="small muted">None yet. On a coin, open Value from and pick + Name a new source…</div>`}
      <div class="btn-row" style="margin-top:8px"><button class="btn" data-act="vsNew">+ Name a new source</button></div></div>`;
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.dataset || !el.dataset.vsren) return;
  const n = el.value.trim().slice(0, 40), id = el.dataset.vsren;
  if (!n) { el.value = (srcById(id) || {}).name || ""; return; }
  if (valueSources().some((s) => s.id !== id && s.name.toLowerCase() === n.toLowerCase())) { toast("You already have a source with that name."); el.value = (srcById(id) || {}).name || ""; return; }
  saveSettings({ valueSources: valueSources().map((s) => (s.id === id ? { ...s, name: n } : s)) }, true);
  toast("Renamed. Every coin using it shows the new name.");
});
Object.assign(actions, {
  vsNew: () => {
    openSheet(`<div class="sheet-head"><h2>Name a value source</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <label class="f"><span>Name</span><input type="text" id="vsName" maxlength="40" autocomplete="off"></label>
      <div class="btn-row"><button class="btn primary" data-act="vsSaveOpt">Save</button><button class="btn" data-act="closeSheet">Cancel</button></div>`);
  },
  vsSaveOpt: () => { if (addSource(($("#vsName") || {}).value)) { closeSheet(); render(); } },
  vsRemove: (el) => {
    const id = el.dataset.v, s = srcById(id);
    if (!s || coinsUsing(id)) return;
    const before = valueSources();
    saveSettings({ valueSources: before.filter((x) => x.id !== id) }, true); render();
    toast("Removed " + s.name + ".", { label: "Undo", fn: () => { saveSettings({ valueSources: before }, true); render(); } });
  },
});

/* ---------- Coin Value › price lists (up to 3) ---------- */
function priceListsHtml() {
  if (store.mode === "snapshot" || store.mode === "demo") return "";
  const have = loadedBooks();
  if (!have.length) return "";
  const act = activeBookKey(), free = BOOK_KEYS.slice(1).find((k) => !hasPrices(store.docs.get(k)));
  return `<div class="card"><b>Price lists</b>
    ${have.map((k) => { const r = store.docs.get(k); return `<div class="rowline"><span>${BOOK_KEYS.indexOf(k) + 1}. ${esc(listName(k))}${r.edition ? " " + esc(r.edition) : ""} <span class="muted small">· ${Object.keys(r.series).length} series${k === act && have.length > 1 ? " · fills blank coins" : ""}</span></span>${k === "pricebook" ? "" : `<button class="btn" data-act="plRemove" data-v="${k}">Remove</button>`}</div>`; }).join("")}
    ${have.length > 1 ? `<label class="f" style="margin-top:8px"><span>Fill blank coins from</span><select id="fillFrom">${have.map((k) => `<option value="${k}" ${k === act ? "selected" : ""}>${esc(listName(k))}</option>`).join("")}</select></label>
      <div class="hint">A coin with no value uses only this list, then melt, then face. The other lists show on the coin page to compare.</div>` : ""}
    ${free ? `<div class="btn-row" style="margin-top:8px"><label class="btn file-btn" style="display:inline-block;text-align:center">Load another price file<input type="file" accept=".json,application/json" id="priceFile2"></label></div>
      <div class="hint">Adds a second or third list (up to 3) without touching list 1.</div>` : ""}
    <div class="hint" id="plMsg"></div></div>`;
}
let plPending = null;
document.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.id === "fillFrom") { saveSettings({ fillFrom: el.value }, true); loadPriceBook(); render(); toast("Blank coins now use " + listName(el.value) + "."); return; }
  if (el.id !== "priceFile2" || !el.files || !el.files[0]) return;
  const file = el.files[0], say = (t) => { const m = $("#plMsg"); if (m) m.textContent = t; };
  if (file.size > PRICE_FILE_MAX) { say("That file is too big to be a price file."); return; }
  let d; try { d = JSON.parse(await file.text()); } catch (err) { say("That isn't a Coin Cabinet price file."); return; }
  const r = checkPriceFile(d);
  if (r.error) { say(r.error + " Nothing was changed."); return; }
  plPending = d;
  openSheet(`<div class="sheet-head"><h2>Add a price list</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>${r.nSeries} series, ${r.rows.toLocaleString("en-US")} rows. Your coins and list 1 are not changed.</p>
    <label class="f"><span>Name for this list</span><input type="text" id="plName" maxlength="40" value="${esc(String(d.source || ""))}"></label>
    <div class="btn-row"><button class="btn primary" data-act="plAdd">Add list</button><button class="btn" data-act="closeSheet">Cancel</button></div>`);
});
Object.assign(actions, {
  plAdd: () => {
    const d = plPending, key = BOOK_KEYS.slice(1).find((k) => !hasPrices(store.docs.get(k)));
    if (!d || !key) { closeSheet(); return; }
    const name = (($("#plName") || {}).value || "").trim().slice(0, 40) || "Price list " + (BOOK_KEYS.indexOf(key) + 1);
    plPending = null;
    put(key, { kind: "pricebook", format: 1, source: name, edition: String(d.edition || ""), series: d.series || {}, mintage: d.mintage || {}, savedAt: new Date().toISOString() });
    closeSheet(); render(); toast(name + " added as list " + (BOOK_KEYS.indexOf(key) + 1) + ".");
  },
  plRemove: (el) => {
    const k = el.dataset.v, rec = store.docs.get(k);
    if (!rec || k === "pricebook") return;
    confirmSheet("Remove " + listName(k) + "?", "Only this price list goes. Your coins and values you typed are not changed.", "Remove list", () => {
      const back = JSON.parse(JSON.stringify(rec)), wasFill = settings().fillFrom === k;
      remove(k); if (wasFill) saveSettings({ fillFrom: "" }, true); loadPriceBook(); render();
      toast("List removed.", { label: "Undo", fn: () => { put(k, back); if (wasFill) saveSettings({ fillFrom: k }, true); loadPriceBook(); render(); } });
    });
  },
});
