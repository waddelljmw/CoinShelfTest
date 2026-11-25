// Want lists: named lists of coins you're looking for. Each coin has a target grade and
// the most you'd pay. Saved as "w_<id>" records (kind "want") and "wl_<id>" records
// (kind "wantlist") next to your coins. Loaded after app.js.
"use strict";

const DEFAULT_LIST_ID = "general";
const wants = () => [...store.docs.values()].filter((d) => d.kind === "want");
const getWant = (id) => store.docs.get("w_" + id);
const saveWant = (w) => put("w_" + w.id, w);
const wantsIn = (listId) => wants().filter((w) => (w.listId || DEFAULT_LIST_ID) === listId);
const wantMatch = (w, typeId, year, mint, variety, pf) => w.typeId === typeId && String(w.year) === String(year) && normMint(w.mint) === normMint(mint)
  && String(w.variety || "").toLowerCase() === String(variety || "").toLowerCase() && !!w.pf === !!pf;
const findWant = (typeId, year, mint, variety, listId, pf) => wants().find((w) => wantMatch(w, typeId, year, mint, variety, pf) && (!listId || (w.listId || DEFAULT_LIST_ID) === listId));
// Every list the same coin is on (a coin can be wanted on several lists, each with its own grade).
const wantsFor = (typeId, year, mint, variety, pf) => wants().filter((w) => wantMatch(w, typeId, year, mint, variety, pf));
const wantsOf = (w) => wantsFor(w.typeId, w.year, w.mint, w.variety, w.pf);
// An album only counts the wants made for it (their albumId), never another album's list.
const spotWants = (a, s) => wantsFor(slotType(a, s), s.set ? "" : s.y, s.m, s.v, s.pf).filter((w) => w.albumId === a.id);
const wantedTag = (n) => (n > 1 ? "wanted ×" + n : "wanted");
// An upgrade want is one made with "Want an upgrade" (notes say "Upgrade"). A spot shows "upgrade wanted" when all its wants are upgrades, else "wanted".
const isUpgradeWant = (w) => w.notes === "Upgrade";
const spotTag = (ws) => (ws.length && ws.every(isUpgradeWant) ? "upgrade wanted" + (ws.length > 1 ? " ×" + ws.length : "") : wantedTag(ws.length));
const listNameOf = (w) => { const l = getWantList(w.listId || DEFAULT_LIST_ID); return l ? l.name : "General"; };
// The spot's want for one list (proof spots have their own wants).
const spotFindWant = (a, s, listId) => (listId ? findWant(slotType(a, s), s.set ? "" : s.y, s.m, s.v, listId, s.pf) : spotWants(a, s)[0]);
// Filling a spot (Fill spots, "Put a coin I already have here") crosses it off this album's own want list. Returns the removed wants, for Undo.
function dropSpotWants(a, spots) {
  const gone = [];
  spots.forEach((s) => spotWants(a, s).forEach((w) => { if (!gone.includes(w)) { remove("w_" + w.id); gone.push(w); } }));
  return gone;
}
const wantLabel = (w) => [w.year ? String(w.year) + (w.mint ? "-" + w.mint : "") : "", w.typeName, w.denom, w.pf ? "Proof" : ""].filter(Boolean).join(" ") + (w.variety ? " · " + w.variety : "");
// A pretend coin, so Red Book, eBay and mintage lookups work for a want.
const wantAsCoin = (w) => ({ typeId: w.typeId, typeName: w.typeName, denom: w.denom, year: w.year, mint: w.mint, variety: w.variety || "", gradeMode: "raw", grade: w.grade || "", label: "", snapBook: w.snapBook });

function newWant(fields) {
  const t = TYPE_BY_ID[fields.typeId];
  return {
    kind: "want", id: uid(), createdAt: Date.now(), typeId: fields.typeId || "", typeName: t ? shortName(t) : fields.typeName || "",
    family: t ? t.family : fields.typeName || "Other", denom: t ? t.denom : "", year: fields.year || "", mint: fields.mint || "",
    variety: fields.variety || "", grade: fields.grade || "", maxPrice: fields.maxPrice ?? "", notes: fields.notes || "",
    albumId: fields.albumId || "", listId: fields.listId || DEFAULT_LIST_ID, ...(fields.pf ? { pf: true } : {}),
  };
}

/* ---------- want lists (collections) ---------- */
const wantLists = () => [...store.docs.values()].filter((d) => d.kind === "wantlist").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const getWantList = (id) => store.docs.get("wl_" + id);
const saveWantList = (wl) => put("wl_" + wl.id, wl);
// The General list always exists, even before it's been saved.
function ensureDefaultList() {
  if (!getWantList(DEFAULT_LIST_ID)) saveWantList({ kind: "wantlist", id: DEFAULT_LIST_ID, name: "General", scope: "any", createdAt: 0 });
}
function listSubtitle(wl) {
  if (wl.scope === "type") return TYPE_BY_ID[wl.typeId] ? TYPE_BY_ID[wl.typeId].name + " only" : "";
  if (wl.scope === "type-grade") return (TYPE_BY_ID[wl.typeId] ? TYPE_BY_ID[wl.typeId].name : "") + " · " + (wl.grade || "any grade") + " only";
  return "";
}
const wantsView = { listId: DEFAULT_LIST_ID };

/* ---------- page ---------- */
function viewWants() {
  ensureDefaultList();
  const lists = wantLists();
  if (!lists.find((l) => l.id === wantsView.listId)) wantsView.listId = DEFAULT_LIST_ID;
  const active = getWantList(wantsView.listId);
  const list = wantsIn(wantsView.listId).sort((a, b) => (a.family || "").localeCompare(b.family || "") || (+a.year || 0) - (+b.year || 0) || normMint(a.mint).localeCompare(normMint(b.mint)));
  const totalMax = sum(list, (w) => num(w.maxPrice));
  const counts = Object.fromEntries(lists.map((l) => [l.id, wantsIn(l.id).length]));
  return `<h1>Want List</h1>
    <div class="chips" style="margin-bottom:10px">
      ${lists.map((l) => `<button class="chip ${wantsView.listId === l.id ? "on" : ""}" data-act="wantsPickList" data-id="${esc(l.id)}">${esc(l.name)}${counts[l.id] ? " · " + counts[l.id] : ""}</button>`).join("")}
      <button class="chip" data-act="wlNew">+ New list</button>
    </div>
    ${listSubtitle(active) ? `<div class="small muted" style="margin:-4px 0 10px">${esc(listSubtitle(active))}</div>` : ""}
    <button class="btn primary block" data-act="wantNew">+ Add a coin you're looking for</button>
    ${list.length ? `<div class="small muted" style="margin:10px 2px">${list.length} coin${list.length === 1 ? "" : "s"}${totalMax ? " · up to " + money(totalMax) + " budgeted" : ""}</div>` : ""}
    ${list.length ? `<div class="list">${list.map(wantRow).join("")}</div>` : `<div class="card empty" style="margin-top:12px">Nothing on this list yet. Add a coin here, or select missing coins from an album's "Show missing" list.</div>`}
    ${albumWishHtml()}
    ${active ? `<button class="btn block" style="margin-top:16px" data-act="wlRename" data-id="${esc(active.id)}">Rename this list</button>` : ""}
    ${active && active.id !== DEFAULT_LIST_ID ? `<button class="btn danger block" style="margin-top:8px" data-act="wlDelete" data-id="${esc(active.id)}">Delete this list</button>` : ""}`;
}
function wantRow(w) {
  const fake = wantAsCoin(w);
  const rb = w.grade ? bookPrice(fake) : null;
  const a = w.albumId ? getAlbum(w.albumId) : null;
  const n = wantsOf(w).length;
  const sub = [isUpgradeWant(w) ? "Upgrade" : "", w.grade ? "Target " + w.grade : "Any grade", num(w.maxPrice) != null ? "pay up to " + money(num(w.maxPrice)) : "", a ? "for " + albumLabel(a) : ""].filter(Boolean).join(" · ");
  return `<div class="coin-row" style="display:block">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <span class="coin-main"><span class="coin-label">${esc(wantLabel(w))}${n > 1 ? ` <button class="link-btn small" data-act="wantWhere" data-id="${esc(w.id)}" title="Tap to see which lists">${wantedTag(n)}</button>` : ""}</span><span class="coin-sub">${esc(sub)}</span>
        ${w.notes ? `<span class="coin-sub" style="white-space:normal">${esc(w.notes)}</span>` : ""}</span>
      <span class="coin-val">${rb != null ? money(rb) + `<div class="melt">${esc(bookName())} ${esc(w.grade)}</div>` : ""}</span>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:14px">
      <a href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a>
      <button class="link-btn" data-act="wantGot" data-id="${esc(w.id)}">Got it</button>
      <button class="link-btn" data-act="wantEdit" data-id="${esc(w.id)}">Edit</button>
      <button class="link-btn" style="color:var(--bad)" data-act="wantRemove" data-id="${esc(w.id)}">Remove</button>
    </div>
  </div>`;
}

/* ---------- album wish list: albums you want to buy ---------- */
const albumWants = () => [...store.docs.values()].filter((d) => d.kind === "albumwant").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const getAlbumWant = (id) => store.docs.get("aw_" + id);
const awLabel = (x) => [x.brand, x.number && "No. " + x.number, x.name].filter(Boolean).join(" ") || "Album";
function albumWishHtml() {
  const list = albumWants();
  return `<h2 style="margin-top:22px;padding-top:14px;border-top:1px solid var(--line)">Albums you want to buy</h2>
    ${list.length ? `<div class="list">${list.map((x) => `<div class="coin-row" style="display:block">
      <span class="coin-main"><span class="coin-label">${esc(awLabel(x))}</span>${x.notes ? `<span class="coin-sub" style="white-space:normal">${esc(x.notes)}</span>` : ""}</span>
      <div style="display:flex;gap:14px;margin-top:8px;font-size:14px">
        <button class="link-btn" data-act="awGot" data-id="${esc(x.id)}">Got it</button>
        <button class="link-btn" data-act="awEdit" data-id="${esc(x.id)}">Edit</button>
        <button class="link-btn" style="color:var(--bad)" data-act="awRemove" data-id="${esc(x.id)}">Remove</button></div></div>`).join("")}</div>` : `<div class="small muted" style="margin:4px 2px 8px">This is a shopping list for physical albums (brand, number, name). It is separate from the coins above.</div>`}
    <button class="btn block" data-act="awNew">+ Add an album to buy</button>`;
}
function openAlbumWantForm(id) {
  const x = id ? getAlbumWant(id) : null;
  openSheet(`<div class="sheet-head"><h2>${x ? "Edit album" : "Album you want"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="awForm" data-id="${esc(id || "")}">
    <div class="grid2">
      <label class="f"><span>Brand</span><select name="brand">${ALBUM_BRANDS.map((b) => `<option ${x && x.brand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <label class="f"><span>Album number</span><input type="text" name="number" value="${esc(x ? x.number : "")}" placeholder="9128"></label>
    </div>
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(x ? x.name : "")}" placeholder="e.g. Franklin Half Dollars 1948-1963"></label>
    <label class="f"><span>Notes (optional)</span><textarea name="notes" placeholder="e.g. watch for the older cover">${esc(x ? x.notes : "")}</textarea></label>
    <div class="btn-row"><button class="btn primary" type="submit">${x ? "Save" : "Add to wish list"}</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function saveAlbumWantForm(form) {
  const fd = new FormData(form);
  const f = { brand: fd.get("brand") || "", number: String(fd.get("number") || "").trim(), name: String(fd.get("name") || "").trim(), notes: String(fd.get("notes") || "").trim() };
  if (!f.number && !f.name) { toast("Add an album number or a name."); return; }
  const old = form.dataset.id ? getAlbumWant(form.dataset.id) : null;
  const x = { kind: "albumwant", id: old ? old.id : uid(), createdAt: old ? old.createdAt : Date.now(), ...f };
  put("aw_" + x.id, x);
  closeSheet();
  toast(old ? "Saved." : "Added to your album wish list.");
  if (currentRoute().view !== "wants") go("wants");
}
// "Got it": opens New album with the brand and number filled in, and takes it off the wish list (Undo brings it back).
function gotAlbumWant(id) {
  const x = getAlbumWant(id);
  if (!x) return;
  openNewAlbum();
  const f = $("#albumForm");
  if (f) { if (f.elements.brand) f.elements.brand.value = x.brand || f.elements.brand.value; if (f.elements.number) f.elements.number.value = x.number || ""; if (f.elements.name) f.elements.name.value = x.name || ""; }
  remove("aw_" + x.id);
  toast("Taken off your wish list.", { label: "Undo", fn: () => put("aw_" + x.id, x) });
}

/* ---------- creating a list ---------- */
function sheetDismiss() {
  if (!$("#wlForm") || !wlReturn) return false;
  actions.wlCancel();
  return true;
}
let wlReturn = null; // null | { kind: "want", prefill } | { kind: "missing" } | { kind: "quick", albumId }
function openNewListForm() {
  ensureDefaultList();
  const typeOpts = (() => {
    const { recent, rest } = typesRecentFirst(COIN_TYPES);
    const opt = (t) => `<option value="${t.id}">${esc(t.name)} (${t.start}–${t.end})</option>`;
    return `<option value="">Choose…</option>` + (recent.length ? `<optgroup label="Recent">${recent.map(opt).join("")}</optgroup><optgroup label="All types">${rest.map(opt).join("")}</optgroup>` : rest.map(opt).join(""));
  })();
  openSheet(`<div class="sheet-head"><h2>New want list</h2><button class="x" data-act="wlCancel" aria-label="Close">✕</button></div>
  <form id="wlForm">
    <label class="f"><span>List name</span><input type="text" name="name" required placeholder="e.g. Morgan dollars, Birthday ideas"></label>
    <label class="f"><span>What goes on this list</span>
      <select name="scope" id="wlScope"><option value="any">Any coins</option><option value="type">One coin type only</option><option value="type-grade">One coin type and grade only</option></select></label>
    <div id="wlScopeFields"></div>
    <div class="hint">A scoped list pre-fills the type (and grade) when you add a coin, so you don't retype it each time.</div>
    <div class="btn-row"><button class="btn primary" type="submit">Create list</button><button class="btn" type="button" data-act="wlCancel">Cancel</button></div>
  </form>
  <template id="wlTypeOpts">${typeOpts}</template>`);
}
function renderWlScopeFields() {
  const sel = $("#wlScope"), box = $("#wlScopeFields");
  if (!sel || !box) return;
  const tpl = $("#wlTypeOpts");
  const typeOpts = tpl ? tpl.innerHTML : "";
  if (sel.value === "any") { box.innerHTML = ""; return; }
  box.innerHTML = `<div class="f"><span>Coin type</span>${typeSelect("typeId", "")}</div>`
    + (sel.value === "type-grade" ? `<label class="f"><span>Grade</span><select name="grade" required><option value="">Choose…</option>${GRADES.filter((g) => g !== "Junk").map((g) => `<option>${g}</option>`).join("")}</select></label>` : "");
}
function saveNewList(form) {
  const fd = new FormData(form);
  const name = String(fd.get("name") || "").trim();
  if (!name) { toast("Give the list a name."); return; }
  const scope = fd.get("scope") || "any";
  if (scope !== "any" && !fd.get("typeId")) { toast("Pick a coin type for this list."); return; }
  if (scope === "type-grade" && !fd.get("grade")) { toast("Pick a grade for this list."); return; }
  const wl = { kind: "wantlist", id: uid(), name, scope, typeId: fd.get("typeId") || "", grade: fd.get("grade") || "", createdAt: Date.now() };
  saveWantList(wl);
  wantsView.listId = wl.id;
  toast("List created.");
  const ret = wlReturn;
  wlReturn = null;
  if (ret && ret.kind === "want") {
    const ow = ret.editId && getWant(ret.editId);
    if (ow && !listAccepts(wl, ow.typeId)) { toast("List created, but it's for a different coin type, so this want stays where it is."); openWantForm(ret.editId, ret.prefill); return; }
    openWantForm(ret.editId || null, scopedPrefill({ ...ret.prefill, listId: wl.id }));
    return;
  }
  if (ret && ret.kind === "missing") { renderMissingPicker(wl.id); return; }
  if (ret && ret.kind === "quick") {
    // Made from the "Add missing to…" sheet: add the missing coins to the new list right away.
    const qa = getAlbum(ret.albumId);
    if (qa && albumTypes(qa).every((id) => listAccepts(wl, id))) { addMissingTo(qa, wl.id); return; }
    openMissingQuick(ret.albumId);
    return;
  }
  if (ret && ret.kind === "slot") { openSlotWantPicker(ret.el, wl.id); return; }
  closeSheet();
  go("wants");
}

/* ---------- list scope ---------- */
// Does this list accept a coin of this type (and grade)?
function listAccepts(wl, typeId) { return !wl || wl.scope === "any" || !wl.scope || wl.typeId === typeId; }
// Apply a scoped list's fixed type (and grade) to form values.
function scopedPrefill(f) {
  const wl = getWantList(f.listId);
  if (wl && wl.scope !== "any") { f.typeId = wl.typeId; if (wl.scope === "type-grade") f.grade = wl.grade; }
  return f;
}
function readWantForm(form) {
  const fd = new FormData(form);
  const out = {};
  ["listId", "typeId", "year", "mint", "variety", "grade", "maxPrice", "notes"].forEach((k) => { if (fd.has(k)) out[k] = fd.get(k) || ""; });
  return out;
}

/* ---------- add / edit a want ---------- */
function openWantForm(id, prefill) {
  const w = id ? getWant(id) : null;
  ensureDefaultList();
  // A saved want's coin type never changes, so it can only be on lists that accept that type.
  const fits = (l) => l && (!w || listAccepts(l, w.typeId));
  let curList = getWantList((prefill && prefill.listId) || (w && w.listId) || wantsView.listId);
  if (!fits(curList)) curList = getWantList(w && w.listId);
  if (!fits(curList)) curList = getWantList(DEFAULT_LIST_ID);
  const lists = wantLists().filter(fits);
  // Typed-but-unsaved values (prefill) always win over the saved want, except its type.
  const d = { ...(w || {}), ...(prefill || {}), listId: curList.id };
  if (w) d.typeId = w.typeId;
  scopedPrefill(d);
  const lockType = !!w || curList.scope === "type" || curList.scope === "type-grade";
  const lockGrade = curList.scope === "type-grade";
  const opts = (() => {
    const { recent, rest } = typesRecentFirst(COIN_TYPES);
    const opt = (t) => `<option value="${t.id}" ${d.typeId === t.id ? "selected" : ""}>${esc(t.name)} (${t.start}–${t.end})</option>`;
    return `<option value="">Choose…</option>` + (recent.length ? `<optgroup label="Recent">${recent.map(opt).join("")}</optgroup><optgroup label="All types">${rest.map(opt).join("")}</optgroup>` : rest.map(opt).join(""));
  })();
  openSheet(`<div class="sheet-head"><h2>${w ? "Edit want" : "Add to want list"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="wantForm" data-id="${esc(id || "")}">
    ${w && w.pf ? `<div class="banner" style="margin:0 0 8px">This want is for a <b>proof</b> coin.</div>` : ""}
    <label class="f"><span>List</span><select name="listId" id="wantListPick" data-prev="${esc(curList.id)}">${lists.map((l) => `<option value="${esc(l.id)}" ${(d.listId || curList.id) === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}<option value="__new">+ New list…</option></select></label>
    <div class="f"><span>Coin type</span>${lockType ? `<input type="text" disabled value="${esc(TYPE_BY_ID[d.typeId] ? TYPE_BY_ID[d.typeId].name : "")}">` : typeSelect("typeId", d.typeId)}</div>
    ${lockType ? `<input type="hidden" name="typeId" value="${esc(d.typeId)}"><div class="hint">${w ? "The coin type can't change once it's on your want list. Remove it and add a new one if it's wrong." : "This list is for " + esc(TYPE_BY_ID[d.typeId] ? TYPE_BY_ID[d.typeId].name : "one coin type") + (lockGrade ? " in " + esc(d.grade) : "") + " only."}</div>` : ""}
    <div class="grid2">
      <label class="f"><span>Year</span><input type="number" inputmode="numeric" name="year" value="${esc(d.year || "")}" placeholder="Any"></label>
      <label class="f"><span>Mint mark</span><select name="mint">${MINTS.map((m) => `<option value="${m}" ${(d.mint || "") === m ? "selected" : ""}>${m || "None (Philadelphia)"}</option>`).join("")}</select></label>
    </div>
    <label class="f"><span>Variety (optional)</span><input type="text" name="variety" value="${esc(d.variety || "")}" placeholder="e.g. Doubled Die Obverse"></label>
    <div class="grid2">
      <label class="f"><span>Target grade (optional)</span>${lockGrade ? `<input type="hidden" name="grade" value="${esc(d.grade)}">` : ""}<select name="grade" ${lockGrade ? "disabled" : ""}><option value="">Any grade</option>${GRADES.filter((g) => g !== "Junk").map((g) => `<option ${d.grade === g ? "selected" : ""}>${g}</option>`).join("")}</select></label>
      <label class="f"><span>Most I'd pay (optional)</span><input type="number" inputmode="decimal" step="0.01" name="maxPrice" value="${esc(d.maxPrice ?? "")}" placeholder="$"></label>
    </div>
    <label class="f"><span>Notes (optional)</span><textarea name="notes" placeholder="e.g. needs to be original toning">${esc(d.notes || "")}</textarea></label>
    <div class="btn-row"><button class="btn primary" type="submit">${w ? "Save" : "Add to want list"}</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function saveWantForm(form) {
  const fd = new FormData(form);
  if (fd.get("listId") === "__new") { toast("Pick or create a list first."); return; }
  const typeId = fd.get("typeId");
  if (!typeId) { toast("Pick a coin type."); return; }

  const fields = { typeId, year: num(fd.get("year")) ?? "", mint: fd.get("mint") || "", variety: String(fd.get("variety") || "").trim(),
    grade: fd.get("grade") || "", maxPrice: num(fd.get("maxPrice")) ?? "", notes: String(fd.get("notes") || "").trim(), listId: fd.get("listId") || DEFAULT_LIST_ID };
  const old = form.dataset.id ? getWant(form.dataset.id) : null;
  if (old) {
    fields.typeId = old.typeId; // a saved want's type never changes
    if (!listAccepts(getWantList(fields.listId), old.typeId)) { toast("That list is for a different coin type."); return; }
  }
  scopedPrefill(fields); // a scoped list always gets its own type (and grade)
  const yp = yearProblem(fields.typeId, fields.year, "want"); // checked against the type the want will really have
  if (yp) { toast(yp); return; }
  const w = old ? { ...newWant({ ...old, ...fields }), id: old.id, createdAt: old.createdAt, albumId: old.albumId } : newWant(fields);
  saveWant(w);
  touchType(typeId);
  wantsView.listId = w.listId;
  closeSheet();
  toast(old ? "Saved." : "Added to your want list.");
  if (currentRoute().view !== "wants") go("wants");
}

// A coin added the normal way that matches something on a want list: ask before taking it off.
function askWantRemove(c) {
  if (!c || !c.typeId || itemOf(c) !== "coin") return;
  const hits = wants().filter((w) => w.typeId === c.typeId && String(w.year) === String(c.year) && normMint(w.mint) === normMint(c.mint)
    && (!w.albumId || w.albumId === c.albumId) && !!w.pf === isProofGrade(c.grade) && (!w.variety || varietyFits(c.variety, w.variety) || varietyFits(c.spotVariety, w.variety)));
  if (!hits.length) return;
  confirmSheet("This is on your want list", wantLabel(hits[0]) + " is on your want list. Remove it?", "Remove from list", () => { hits.forEach((w) => remove("w_" + w.id)); toast("Removed from your want list."); });
}
// A new coin that fits a spot another coin already holds, and is better (or the old one was marked Upgrade wanted): offer the swap.
function swapCandidate(c) {
  const a = c.albumId && getAlbum(c.albumId);
  if (!a || itemOf(c) !== "coin" || c.status !== "owned" || qtyOf(c) !== 1) return null;
  const st = albumStats(a);
  if ([...st.filled.values()].some((h) => h.id === c.id)) return null; // it found its own spot
  for (const s of st.slots) {
    const old = st.filled.get(slotKey(s));
    if (!old || old.id === c.id || s.set || qtyOf(old) !== 1) continue;
    const fits = num(c.year) === s.y && normMint(c.mint) === s.m && c.typeId === slotType(a, s) && !!s.pf === isProofGrade(c.grade) && (!s.v || varietyFits(c.variety, s.v) || varietyFits(c.spotVariety, s.v));
    if (!fits) continue;
    const gi = GRADES.indexOf(c.grade), oi = GRADES.indexOf(old.grade);
    if (old.upgrade || (gi > 0 && oi > 0 && gi > oi)) return { slot: s, old };
  }
  return null;
}
const swapGrade = (x) => (x.gradeMode === "cert" ? gradeText(x) : x.grade || "coin");
function openSwapSheet(c, sw) {
  const boxes = allBoxes();
  const idAttr = `data-id="${esc(c.id)}" data-old="${esc(sw.old.id)}"`;
  openSheet(`<div class="sheet-head"><h2>Put the ${esc(swapGrade(c))} in the spot?</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p><b>${esc(slotLabel(sw.slot))}</b> already holds your ${esc(swapGrade(sw.old))}. Where should that one go?</p>
    <div class="btn-row"><button class="btn primary" data-act="swapGo" ${idAttr} data-to="loose">Swap · old one loose</button></div>
    ${boxes.length ? `<label class="f"><span>Or into a box</span><select id="swapBox">${boxes.map((b) => `<option value="${esc(b.id)}">${esc(b.name || "Box")}</option>`).join("")}</select></label><div class="btn-row"><button class="btn" data-act="swapGo" ${idAttr} data-to="box">Swap · old one to the box</button></div>` : ""}
    ${isInherited(sw.old) ? "" : `<div class="btn-row"><button class="btn" data-act="swapGo" ${idAttr} data-to="forsale">Swap · old one for sale</button></div>`}
    <div class="btn-row"><button class="btn" data-act="closeSheet">Keep both for now</button></div>
    <div class="hint">Nothing is deleted. The better coin takes the spot, and the old one stays in your collection.</div>`);
}
function swapGo(el) {
  const n = getCoin(el.dataset.id), o = getCoin(el.dataset.old), a = n && getAlbum(n.albumId);
  if (!n || !o || !a) { closeSheet(); return; }
  const st = albumStats(a);
  const s = st.slots.find((x) => { const h = st.filled.get(slotKey(x)); return h && h.id === o.id; });
  if (!s) { closeSheet(); return; }
  const to = el.dataset.to, boxId = ($("#swapBox") || {}).value || "";
  const ups = spotWants(a, s).filter(isUpgradeWant);
  const nn = { ...n, ...(s.id ? { slotId: s.id } : {}) };
  const oo = { ...o, upgrade: false };
  applyKept(oo, to === "box" && boxId ? "b:" + boxId : "", true);
  if (to === "forsale" && !isInherited(o)) oo.stage = "forsale";
  saveCoin(nn); saveCoin(oo);
  ups.forEach((w) => remove("w_" + w.id));
  closeSheet(); render();
  toast("Swapped. The " + swapGrade(n) + " is in the spot.", { label: "Undo", fn: () => { saveCoin(n); saveCoin(o); ups.forEach((w) => saveWant(w)); render(); } });
}
// "Got it": open the add-coin form filled in from the want; saving the coin removes the want.
function gotWant(id) {
  const w = getWant(id);
  if (!w) return;
  openCoinForm(null);
  const t = TYPE_BY_ID[w.typeId];
  if (t) { draft.typeId = t.id; draft.typeName = shortName(t); draft.family = t.family; draft.denom = t.denom; draft.metal = t.metal; draft.oz = t.oz || ""; }
  else draft.typeName = w.typeName;
  draft.year = w.year; draft.mint = w.mint; draft.grade = w.grade;
  if (w.variety) { const known = bookVarieties(draft).find((x) => x && varietyFits(x, w.variety)); draft.variety = known || ""; draft.spotVariety = w.variety; }
  if (w.albumId && getAlbum(w.albumId)) draft.albumId = w.albumId;
  draft._fromWant = w.id;
  if (w.pf) draft._proof = true;
  renderCoinForm();
  if (w.pf) toast("This want is a proof. Pick a proof grade (PR-60 to PR-70).");
}

/* ---------- from an album's missing list ---------- */
// Checkbox picker over missing slots, with a list to add them all to at once.
const missingPick = { albumId: null, chosen: new Set(), listId: "" };
// Suggested list for an album: the list already made for this album, else a new one named "<Type> – Missing from <album>" (never another album's list).
function missingSuggest(a) {
  const types = albumTypes(a), t = types.length === 1 ? TYPE_BY_ID[types[0]] : null;
  const name = (t ? shortName(t) + " – " : "") + "Missing from " + albumLabel(a);
  const lists = wantLists();
  const same = lists.find((l) => l.name === name);
  if (same) return { id: same.id, name };
  return { id: "__auto", name };
}
function openMissingPicker(albumId) {
  ensureDefaultList();
  const a = getAlbum(albumId);
  if (!a) return;
  const st = albumStats(a);
  const missing = st.slots.filter((s) => !st.filled.has(slotKey(s)));
  missingPick.albumId = albumId;
  missingPick.chosen = new Set();
  missingPick.listId = missingSuggest(a).id;
  renderMissingPicker();
}
// Item 7: both add-missing paths end here, with an Undo that takes back the wants (and a list made just for them).
function finishMissingAdd(made, newListId, listId) {
  wantsView.listId = listId;
  closeSheet();
  const undo = made.length || newListId ? { label: "Undo", fn: () => { made.forEach((x) => remove("w_" + x.id)); if (newListId) remove("wl_" + newListId); render(); } } : undefined;
  toast("Added " + made.length + " coin" + (made.length === 1 ? "" : "s") + " to " + (getWantList(listId) || {}).name + ".", undo);
}
const listScopeText = (l) => (l.scope === "type" || l.scope === "type-grade") && TYPE_BY_ID[l.typeId] ? shortName(TYPE_BY_ID[l.typeId]) + (l.scope === "type-grade" && l.grade ? " " + l.grade : "") + " only" : "any coin";
// Quick add (item 70): one sheet asks which list, one tap adds every missing coin not already on it.
function addMissingTo(a, listId) {
  let newListId = "";
  if (listId === "__auto") {
    const types = albumTypes(a), sug = missingSuggest(a);
    const nl = { kind: "wantlist", id: uid(), name: sug.name, scope: types.length === 1 ? "type" : "any", typeId: types.length === 1 ? types[0] : "", grade: "", createdAt: Date.now() };
    saveWantList(nl);
    listId = newListId = nl.id;
  }
  const st = albumStats(a), wl = getWantList(listId);
  const slots = st.slots.filter((s) => !st.filled.has(slotKey(s)) && !spotFindWant(a, s, listId));
  if (slots.some((s) => !listAccepts(wl, slotType(a, s)))) { toast("That list is for a different coin type."); return; }
  const made = slots.map((s) => { const tid = slotType(a, s), y = s.set ? "" : s.y; const x = newWant({ typeId: tid, year: y, mint: s.m, pf: s.pf, variety: s.v || "", albumId: a.id, listId, grade: wl && wl.scope === "type-grade" ? wl.grade : "" }); saveWant(x); return x; });
  finishMissingAdd(made, newListId, listId);
}
function openMissingQuick(albumId) {
  ensureDefaultList();
  const a = getAlbum(albumId);
  if (!a) return;
  const st = albumStats(a), n = st.slots.filter((s) => !st.filled.has(slotKey(s))).length;
  const sug = missingSuggest(a);
  const lists = wantLists().filter((l) => albumTypes(a).some((id) => listAccepts(l, id)));
  const btn = (id, label, primary) => `<button class="btn ${primary ? "primary " : ""}block" style="margin-top:8px" data-act="missQuickAdd" data-id="${esc(albumId)}" data-list="${esc(id)}">${esc(label)}</button>`;
  openSheet(`<div class="sheet-head"><h2>Add ${n} missing to…</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    ${n ? `${sug.id === "__auto" ? btn("__auto", "New list: " + sug.name, true) : ""}
    ${lists.map((l) => btn(l.id, l.name + " (" + listScopeText(l) + ")", sug.id !== "__auto" && l.id === sug.id)).join("")}
    <button class="btn block" style="margin-top:8px" data-act="wlNewQuick" data-id="${esc(albumId)}">+ New list…</button>
    <div class="small muted" style="margin-top:12px">Coins already on a list are skipped. <button type="button" class="link-btn" data-act="missing" data-id="${esc(albumId)}">Pick which ones</button></div>`
    : `<div class="card empty">Nothing missing. Album complete <span class="check">✓</span></div>`}`);
}
function renderMissingPicker(preselect) {
  const a = getAlbum(missingPick.albumId);
  if (!a) return;
  const st = albumStats(a);
  const missing = st.slots.filter((s) => !st.filled.has(slotKey(s)));
  if (preselect) missingPick.listId = preselect;
  const sug = missingSuggest(a);
  const lists = wantLists().filter((l) => albumTypes(a).some((id) => listAccepts(l, id)));
  if (!missingPick.listId || (missingPick.listId !== "__auto" && !lists.some((l) => l.id === missingPick.listId))) missingPick.listId = sug.id;
  const spotWant = (s) => (missingPick.listId === "__auto" ? null : spotFindWant(a, s, missingPick.listId));
  const missBar = (first) => `<div class="small muted" style="display:flex;justify-content:space-between;margin:10px 2px"><span class="missCount"${first ? ' id="missCount"' : ""}>${missingPick.chosen.size} selected</span>
      <span><button type="button" class="link-btn" data-act="missAll">Select all</button> · <button type="button" class="link-btn" data-act="missNone">Clear</button></span></div>`;
  openSheet(`<div class="sheet-head"><h2>Missing (${missing.length})</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    ${missing.some((s) => !spotWant(s)) ? missBar(true) : ""}
    ${missing.length ? `<div class="card">${missing.map((s, i) => {
      const t = TYPE_BY_ID[slotType(a, s)];
      const fake = { typeId: t ? t.id : "", year: s.set ? "" : s.y, mint: s.m, typeName: t ? shortName(t) : "", denom: t ? t.denom : "", gradeMode: "raw" };
      if (s.v) fake.label = autoLabel(fake) + " " + s.v;
      const onAny = spotWant(s);
      const k = slotKey(s);
      return `<div class="rowline"><label style="display:flex;align-items:center;gap:10px;flex:1;cursor:${onAny ? "default" : "pointer"}">
          ${onAny ? "" : `<input type="checkbox" data-missck="${esc(k)}" ${missingPick.chosen.has(k) ? "checked" : ""} style="width:19px;height:19px;accent-color:var(--accent)">`}
          <span>${esc(slotLabel(s))}${s.v ? ` <span class="small muted">${esc(s.v)}</span>` : ""}${albumTypes(a).length > 1 && !s.set && t ? ` <span class="small muted">${esc(shortName(t))}</span>` : ""}</span></label>
        <span style="white-space:nowrap"><a class="small" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a>
          ${onAny ? `<span class="small muted" style="margin-left:10px">On this list</span>` : ""}</span></div>`;
    }).join("")}</div>
    ${missing.some((s) => !spotWant(s)) ? `
    ${missBar(false)}
    <label class="f"><span>Add selected to</span><select id="missListPick">${lists.map((l) => `<option value="${esc(l.id)}" ${missingPick.listId === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}${sug.id === "__auto" ? `<option value="__auto" ${missingPick.listId === "__auto" ? "selected" : ""}>New: ${esc(sug.name)}</option>` : ""}<option value="__new">+ New list…</option></select></label>
    <button class="btn primary block" data-act="missAdd" ${missingPick.chosen.size ? "" : "disabled"}>Add to want list</button>` : ""}`
    : `<div class="card empty">Nothing missing. Album complete <span class="check">✓</span></div>`}`);
}
/* ---------- tapping a coin card in an album ---------- */
function openSlotMenu(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const s = spotFromEl(a, el);
  const y = s.set ? "" : s.y, m = s.m || "", v = s.v || "";
  const t = TYPE_BY_ID[slotType(a, s)];
  const coin = el.dataset.coin ? getCoin(el.dataset.coin) : null;
  const fake = { typeId: t ? t.id : "", typeName: t ? shortName(t) : "", denom: t ? t.denom : "", year: y, mint: m, variety: v, gradeMode: "raw", grade: "" };
  const label = (s.set ? [t ? t.name : "Coin"] : [y + (m ? "-" + m : ""), fake.typeName, fake.denom, s.pf ? "Proof" : ""]).filter(Boolean).join(" ") + (v ? " · " + v : "") + (proofOnlySpot(a, s) ? " · Proof only" : "");
  if (v || s.pf) fake.label = autoLabel(fake) + (s.pf ? " Proof" : "") + (v ? " " + v : "");
  const ws = spotWants(a, s);
  const mt = s.set ? null : mintageInfo({ ...fake, grade: s.pf ? "PR-65" : "VF-20" });
  const sd = `data-album="${esc(a.id)}" data-sid="${esc(s.id || "")}" data-y="${y}" data-m="${esc(m)}" data-v="${esc(v)}"`;
  const upG = coin ? upgradeGrade(coin) : "";
  const moreLists = wantLists().some((l) => listAccepts(l, slotType(a, s)) && !ws.some((w) => (w.listId || DEFAULT_LIST_ID) === l.id));
  openSheet(`<div class="sheet-head"><h2>${esc(label)}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="small muted" style="margin:-4px 0 12px">${coin ? "In this album · " + esc(gradeText(coin)) : "Not in this album yet"}${mt ? " · Mintage " + esc(mt.text) + (mt.note ? " (" + esc(mt.note) + ")" : "") : ""}</div>
    ${coinCardHtml({ ...fake, grade: s.pf ? "PR-65" : "VF-20" }, { spot: !s.set, inAlbum: !!coin })}
    ${coin ? "" : `<button class="btn block btn-addcoin" data-act="slotHave" ${sd}>＋ Add coin to this spot</button>`}
    ${!coin && spotCandidates(a, { y, m, v, pf: s.pf, set: s.set, t: s.t, id: s.id }).length ? `<button class="btn block" data-act="slotUseList" ${sd}>Put a coin I already have here</button>` : ""}
    ${ws.length ? `<div class="card small">${ws.map((w) => `<div class="rowline"><span>★ ${esc(listNameOf(w))}${w.grade ? " · target " + esc(w.grade) : ""}${num(w.maxPrice) != null ? " · up to " + money(num(w.maxPrice)) : ""}</span><button class="link-btn" style="color:var(--bad)" data-act="slotUnwant" data-id="${esc(w.id)}">Remove</button></div>`).join("")}</div>
         <div class="btn-row"><button class="btn" data-go="wants">View want list</button></div>` : ""}
    ${coin && upG ? `<button class="btn block btn-want" data-act="slotWant" data-upgrade="1" ${sd}>★ Want an upgrade (above ${esc(coin.grade)})</button>` : ""}
    ${!coin && (!ws.length || moreLists) ? `<button class="btn block btn-want" data-act="${ws.length ? "slotWant" : "slotWantQuick"}" ${sd}>★ ${ws.length ? "Add to another want list" : "Add to want list"}</button>
         ${ws.length ? "" : `<div class="hint">One tap: adds ${esc(label)} to "${esc(missingSuggest(a).name)}". You can set a target grade and price on the Want List later.</div>`}` : ""}
    <div class="btn-row">
      ${coin ? `<button class="btn" data-go="coin-${esc(coin.id)}">View coin</button><button class="btn" data-act="slotTakeOut" data-id="${esc(coin.id)}">Take out of album</button>` : ""}
      ${coin && albumMoveTargets(coin, a).length ? `<button class="btn" data-act="slotMoveList" data-id="${esc(coin.id)}" data-album="${esc(a.id)}">Move to another album</button>` : ""}
      <a class="btn" style="text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a>
    </div>`);
}
// "Add to want list" from an album spot: pick which list (only lists that fit this coin type).
function slotWant(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const s = spotFromEl(a, el);
  const own = el.dataset.upgrade ? (el.dataset.coin ? getCoin(el.dataset.coin) : albumSpotCoin(a, s)) : null;
  const up = own ? upgradeGrade(own) : "";
  openSlotWantPicker({ album: a.id, y: s.set ? "" : s.y, m: s.m || "", v: s.v || "", typeId: slotType(a, s), pf: !!s.pf, ...(up ? { upgrade: up, coinId: own.id } : {}) });
}
// The next grade up from a coin's grade; "" if there isn't one. Circulated grades run on into MS-60 (AU-58 goes to MS-60); MS stays MS, PR stays PR.
function upgradeGrade(c) {
  if (!c || !c.grade) return "";
  const i = GRADES.indexOf(c.grade), g = GRADES[i + 1];
  if (i < 1 || !g) return "";
  const fam = (x) => (/^(MS|PR)/.test(x) ? x.slice(0, 2) : "C");
  return fam(g) === fam(c.grade) || (fam(c.grade) === "C" && g === "MS-60") ? g : "";
}
// The coin sitting in the spot a want was made for (null if none). Used to keep the coin's "Upgrade wanted" tick and the spot's upgrade want as one mark.
function coinForWant(w) {
  const a = w.albumId && getAlbum(w.albumId);
  if (!a) return null;
  const st = albumStats(a);
  const s = st.slots.find((x) => slotType(a, x) === w.typeId && String(x.set ? "" : x.y) === String(w.year) && normMint(x.m) === normMint(w.mint) && (x.v || "") === (w.variety || "") && !!x.pf === !!w.pf);
  return s ? st.filled.get(slotKey(s)) || null : null;
}
// After an upgrade want goes away: clear the coin's tick unless another upgrade want still holds the spot.
function untickForWant(w) {
  if (!isUpgradeWant(w)) return;
  const c = coinForWant(w);
  if (c && c.upgrade && !wantsOf(w).some((x) => x.id !== w.id && x.albumId === w.albumId && isUpgradeWant(x))) saveCoin({ ...c, upgrade: false });
}
// Saving a coin: ticking "Upgrade wanted" on a coin in an album spot makes the spot's upgrade want; unticking removes it.
function syncUpgradeMark(c, prev) {
  const a = c.albumId && getAlbum(c.albumId);
  if (!a || itemOf(c) !== "coin" || !!c.upgrade === !!(prev && prev.upgrade)) return;
  const st = albumStats(a);
  const s = st.slots.find((x) => { const h = st.filled.get(slotKey(x)); return h && h.id === c.id; });
  if (!s) return;
  const mine = spotWants(a, s).filter(isUpgradeWant);
  if (c.upgrade && !mine.length) {
    ensureDefaultList();
    saveWant(newWant({ typeId: slotType(a, s), year: s.set ? "" : s.y, mint: s.m, variety: s.v || "", pf: !!s.pf, albumId: a.id, listId: DEFAULT_LIST_ID, grade: upgradeGrade(c), notes: "Upgrade" }));
  } else if (!c.upgrade) mine.forEach((w) => remove("w_" + w.id));
}
const albumSpotCoin = (a, s) => { const st = albumStats(a); return st.filled.get(slotKey(s)) || null; };
function openSlotWantPicker(d, preselect) {
  const a = getAlbum(d.album);
  if (!a) return;
  ensureDefaultList();
  const tid = d.typeId || slotType(a, { y: num(d.y), m: d.m });
  d.typeId = tid;
  const t = TYPE_BY_ID[tid];
  const already = (l) => !!findWant(tid, d.y === "" ? "" : +d.y, d.m, d.v, l.id, d.pf);
  const lists = wantLists().filter((l) => listAccepts(l, tid) && !already(l));
  const pre = preselect || (lists.some((l) => l.id === wantsView.listId) ? wantsView.listId : DEFAULT_LIST_ID);
  slotWantCtx = d;
  openSheet(`<div class="sheet-head"><h2>${d.upgrade ? "Want an upgrade" : "Add to want list"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p><b>${esc((d.y ? d.y + (d.m ? "-" + d.m : "") + " " : "") + (t ? shortName(t) : "") + (d.pf ? " Proof" : "") + (d.v ? " · " + d.v : ""))}</b>${d.upgrade ? `<br><span class="small muted">Target grade ${esc(d.upgrade)}</span>` : ""}</p>
    <label class="f"><span>Which list</span><select id="slotListPick">${lists.map((l) => `<option value="${esc(l.id)}" ${pre === l.id ? "selected" : ""}>${esc(l.name)}${l.scope === "type-grade" ? " (" + esc(l.grade) + ")" : ""}</option>`).join("")}<option value="__new">+ New list…</option></select></label>
    <div class="btn-row"><button class="btn primary" data-act="slotWantAdd">Add</button><button class="btn" data-act="closeSheet">Cancel</button></div>`);
}
let slotWantCtx = null;
function slotWantAdd() {
  const d = slotWantCtx;
  const a = d && getAlbum(d.album);
  if (!a) return;
  const listId = ($("#slotListPick") || {}).value || DEFAULT_LIST_ID;
  const wl = getWantList(listId);
  const y = d.y === "" ? "" : +d.y;
  const tid = d.typeId || slotType(a, { y, m: d.m });
  if (!listAccepts(wl, tid)) { toast("That list is for a different coin type."); return; }
  if (!findWant(tid, y, d.m, d.v, listId, d.pf)) saveWant(newWant({ typeId: tid, year: y, mint: d.m, variety: d.v, pf: d.pf, albumId: a.id, listId, grade: wl && wl.scope === "type-grade" ? wl.grade : d.upgrade || "", notes: d.upgrade ? "Upgrade" : "" }));
  if (d.upgrade && d.coinId) { const oc = getCoin(d.coinId); if (oc && !oc.upgrade) saveCoin({ ...oc, upgrade: true }); }
  closeSheet();
  toast("Added to " + ((wl && wl.name) || "your want list") + ".");
}
// Owned single coins of this spot's type, year and mint that are not in any album yet (groups of more than one are left out).
function spotCandidates(a, s0) {
  const tid = slotType(a, s0);
  const pfOk = (c) => (s0.pf ? isProofGrade(c.grade) : !(a.proofs && isProofGrade(c.grade)));
  return ownedCoins().filter((c) => !c.albumId && qtyOf(c) === 1 && c.typeId === tid && pfOk(c) && (s0.set || (num(c.year) === s0.y && normMint(c.mint) === s0.m)));
}
// R5-15: other albums that have an empty spot this coin fits (same rules as albumStats: type sets by type, date spots by date and mint, proofs only in proof spots).
function albumMoveTargets(c, from) {
  const out = [];
  albums().filter((al) => !from || al.id !== from.id).forEach((al) => {
    if (!albumHasType(al, c.typeId)) return;
    const aa = withSlotIds(al), st = albumStats(al), multi = albumTypes(al).length > 1 || isSetAlbum(al);
    const pfOk = (s) => (s.pf ? isProofGrade(c.grade) : !(al.proofs && isProofGrade(c.grade)));
    const spot = (aa.slots || []).find((s) => !st.filled.has(slotKey(s)) && (s.set ? c.typeId === s.t : num(c.year) === s.y && normMint(c.mint) === s.m && (!multi || c.typeId === slotType(al, s)) && pfOk(s)) && !(s.v && !(varietyFits(c.variety, s.v) || varietyFits(c.spotVariety, s.v))));
    if (spot) out.push({ album: aa, spot });
  });
  return out;
}
// Add another like this: after Save, offer every album with an open spot for the coin. Never placed by itself.
function askAlbumSpot(c) {
  const list = albumMoveTargets(c, null);
  if (!list.length) return;
  openSheet(`<div class="sheet-head"><h2>Put it in an album spot?</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="list">${list.map((t) => `<button class="coin-row" style="width:100%;text-align:left" data-act="anotherPlace" data-id="${esc(c.id)}" data-album="${esc(t.album.id)}" data-sid="${esc(t.spot.id || "")}" data-key="${esc(slotKey(t.spot))}"><span class="coin-main"><span class="coin-label">${esc(albumTitle(t.album))}</span><span class="coin-sub">${esc(t.spot.set ? "Set spot" : t.spot.y + (t.spot.m ? "-" + t.spot.m : "") + (t.spot.v ? " · " + t.spot.v : ""))}</span></span></button>`).join("")}</div>
    <button class="btn block" style="margin-top:8px" data-act="closeSheet">Not now (stays loose)</button>`);
}
function anotherPlace(el) {
  const c = getCoin(el.dataset.id), al = getAlbum(el.dataset.album);
  if (!c || !al) return;
  const aa = withSlotIds(al);
  const spot = (el.dataset.sid && (aa.slots || []).find((x) => x.id === el.dataset.sid)) || (aa.slots || []).find((x) => slotKey(x) === el.dataset.key);
  if (albumStats(al).filled.has(el.dataset.key)) { toast("That spot just got filled."); return; }
  const before = { ...c }, next = { ...c };
  applyKept(next, "a:" + al.id, true);
  if (spot) next.slotId = spot.id;
  saveCoin(next);
  const gone = spot ? dropSpotWants(aa, [spot]) : [];
  closeSheet(); render();
  toast("Placed in " + albumTitle(al) + (gone.length ? " and crossed off its want list" : "") + ".", { label: "Undo", fn: () => { saveCoin(before); gone.forEach(saveWant); render(); } });
}
function slotMoveList(el) {
  const c = getCoin(el.dataset.id);
  if (!c) return;
  const list = albumMoveTargets(c, getAlbum(el.dataset.album));
  openSheet(`<div class="sheet-head"><h2>Move to which album?</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="list">${list.map((t) => `<button class="coin-row" style="width:100%;text-align:left" data-act="slotMoveGo" data-id="${esc(c.id)}" data-album="${esc(t.album.id)}" data-sid="${esc(t.spot.id || "")}" data-key="${esc(slotKey(t.spot))}"><span class="coin-main"><span class="coin-label">${esc(albumTitle(t.album))}</span><span class="coin-sub">${esc(t.spot.set ? "Set spot" : t.spot.y + (t.spot.m ? "-" + t.spot.m : "") + (t.spot.v ? " · " + t.spot.v : ""))}</span></span></button>`).join("")}</div>
    <div class="hint">Only albums with an empty spot for this coin. It leaves its old spot; nothing else about the coin changes. One Undo.</div>`);
}
function slotMoveGo(el) {
  const c = getCoin(el.dataset.id), al = getAlbum(el.dataset.album);
  if (!c || !al) return;
  const aa = withSlotIds(al);
  const spot = (el.dataset.sid && (aa.slots || []).find((x) => x.id === el.dataset.sid)) || (aa.slots || []).find((x) => slotKey(x) === el.dataset.key);
  if (albumStats(al).filled.has(el.dataset.key)) { toast("That spot just got filled."); return; }
  const before = { ...c }, next = { ...c };
  applyKept(next, "a:" + al.id, true); // leaves the old album's spot
  if (spot) next.slotId = spot.id;
  saveCoin(next);
  const gone = spot ? dropSpotWants(aa, [spot]) : [];
  closeSheet(); render();
  toast("Moved to " + albumTitle(al) + (gone.length ? " and crossed off its want list" : "") + ".", { label: "Undo", fn: () => { saveCoin(before); gone.forEach(saveWant); render(); } });
}
function slotUseList(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const s0 = spotFromEl(a, el);
  const list = spotCandidates(withSlotIds(a), s0);
  const sd = `data-album="${esc(a.id)}" data-sid="${esc(s0.id || "")}" data-y="${esc(el.dataset.y)}" data-m="${esc(el.dataset.m)}" data-v="${esc(el.dataset.v)}"`;
  openSheet(`<div class="sheet-head"><h2>Pick a coin for this spot</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="list">${list.map((c) => `<button class="coin-row" style="width:100%;text-align:left" data-act="slotUse" data-cid="${esc(c.id)}" ${sd}>${thumbHtml(c)}<span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(gradeText(c))}</span></span></button>`).join("")}</div>
    <div class="hint">Only coins of this type, year and mint that are not in an album yet. Nothing else about the coin changes.</div>`);
}
function slotUse(el) {
  const a = getAlbum(el.dataset.album);
  const c = getCoin(el.dataset.cid);
  if (!a || !c) return;
  const aa = withSlotIds(a);
  const s0 = spotFromEl(a, el);
  const spot = (s0.id && (aa.slots || []).find((x) => x.id === s0.id)) || (aa.slots || []).find((x) => slotKey(x) === slotKey(s0));
  const before = { ...c };
  const next = { ...c };
  applyKept(next, "a:" + a.id, true); // also leaves its box slot, so a coin is in one place at a time
  if (spot) next.slotId = spot.id;
  saveCoin(next);
  const gone = spot ? dropSpotWants(aa, [spot]) : [];
  closeSheet();
  render();
  toast("Placed in " + albumTitle(a) + (gone.length ? " and crossed off its want list" : "") + ".", { label: "Undo", fn: () => { saveCoin(before); gone.forEach(saveWant); render(); } });
}
// Open slot: add the coin you already have, filled in and placed in this album.
function slotHave(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const aa = withSlotIds(a);
  const s0 = spotFromEl(a, el);
  const spot = (s0.id && (aa.slots || []).find((x) => x.id === s0.id)) || (aa.slots || []).find((x) => slotKey(x) === slotKey(s0));
  const t = TYPE_BY_ID[slotType(aa, s0)];
  openCoinForm(null);
  if (t) { draft.typeId = t.id; draft.typeName = shortName(t); draft.family = t.family; draft.denom = t.denom; draft.metal = t.metal; draft.oz = t.oz || ""; }
  draft.year = s0.set ? "" : s0.y; draft.mint = s0.m || ""; draft.albumId = a.id;
  if (a.inherited) applySourceKind(draft, "Inherited"); // an inherited album: its coins start as Inherited
  const proofOnly = proofOnlySpot(a, s0);
  if (s0.pf || proofOnly) draft._proof = true;
  applyYearMetal(draft);
  const v = s0.v || "";
  // Remember the exact spot, so renaming or moving the spot never moves the coin.
  if (spot) draft.slotId = spot.id;
  if (v && !s0.set) {
    // Use the Red Book variety only when exactly one matches the spot's label; otherwise leave it blank.
    const known = bookVarieties(draft).filter((x) => x && varietyFits(x, v));
    const exact = known.find((x) => x.toLowerCase().trim() === v.toLowerCase().trim());
    if (exact) draft.variety = exact;
    else if (known.length === 1) draft.variety = known[0];
    else draft.spotVariety = v; // several book names fit (or none): keep the spot's name so the coin stays in this spot
  }
  const w = spotFindWant(aa, s0);
  if (w) draft._fromWant = w.id;
  draft._stay = true;   // after saving, stay on this album
  draft._short = true;  // three-quarter-height window over the album
  renderCoinForm();
  if (s0.pf) toast("Proof spot: pick a proof grade (PR-60 to PR-70).");
  else if (proofOnly) toast("This date was only made as a proof. Pick a proof grade (PR-60 to PR-70).");
}

/* ---------- wiring ---------- */
Object.assign(actions, {
  wantNew: () => openWantForm(null),
  wantEdit: (el) => openWantForm(el.dataset.id),
  wantRemove: (el) => {
    const w = getWant(el.dataset.id);
    if (!w) return;
    const c = coinForWant(w);
    remove("w_" + w.id);
    untickForWant(w);
    toast("Removed from your want list.", { label: "Undo", fn: () => { saveWant(w); if (c && isUpgradeWant(w)) saveCoin(c); } });
  },
  wantGot: (el) => gotWant(el.dataset.id),
  slotMenu: openSlotMenu,
  slotWant,
  slotHave,
  slotUseList, anotherPlace,
  slotUse,
  slotMoveList,
  slotMoveGo,
  slotUnwant: (el) => { const w = getWant(el.dataset.id); if (w) { const c = coinForWant(w); remove("w_" + w.id); untickForWant(w); closeSheet(); toast("Removed from your want list.", { label: "Undo", fn: () => { saveWant(w); if (c && isUpgradeWant(w)) saveCoin(c); } }); } },
  wantWhere: (el) => {
    const w = getWant(el.dataset.id);
    if (!w) return;
    openSheet(`<div class="sheet-head"><h2>${esc(wantLabel(w))}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <div class="card small">${wantsOf(w).map((x) => `<div class="rowline"><span>★ ${esc(listNameOf(x))}</span><span class="muted">${x.grade ? "target " + esc(x.grade) : "any grade"}</span></div>`).join("")}</div>`);
  },
  awNew: () => openAlbumWantForm(null),
  awEdit: (el) => openAlbumWantForm(el.dataset.id),
  awGot: (el) => gotAlbumWant(el.dataset.id),
  awRemove: (el) => { const x = getAlbumWant(el.dataset.id); if (!x) return; remove("aw_" + x.id); toast("Removed from your album wish list.", { label: "Undo", fn: () => put("aw_" + x.id, x) }); },
  wantsPickList: (el) => { wantsView.listId = el.dataset.id; render(); },
  wlNew: () => { wlReturn = null; openNewListForm(); },
  wlRename: (el) => {
    const wl = getWantList(el.dataset.id);
    if (!wl) return;
    openSheet(`<div class="sheet-head"><h2>Rename list</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <form id="wlRenameForm" data-id="${esc(wl.id)}"><label class="f"><span>List name</span><input type="text" name="name" required maxlength="60" value="${esc(wl.name)}"></label>
      <div class="btn-row"><button class="btn primary" type="submit">Save name</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div></form>`);
  },
  wlNewQuick: (el) => { wlReturn = { kind: "quick", albumId: el.dataset.id }; openNewListForm(); },
  slotWantAdd: () => slotWantAdd(),
  // One tap from an empty spot: add it to this album's own list ("Missing from <album>"), making the list the first time.
  slotWantQuick: (el) => {
    const a = getAlbum(el.dataset.album);
    if (!a) return;
    const s = spotFromEl(a, el), tid = slotType(a, s), y = s.set ? "" : s.y;
    const sug = missingSuggest(a);
    let listId = sug.id, newListId = "";
    if (listId === "__auto") {
      const types = albumTypes(a);
      const nl = { kind: "wantlist", id: uid(), name: sug.name, scope: types.length === 1 ? "type" : "any", typeId: types.length === 1 ? types[0] : "", grade: "", createdAt: Date.now() };
      saveWantList(nl);
      listId = newListId = nl.id;
    }
    const wl = getWantList(listId);
    if (!listAccepts(wl, tid)) { if (newListId) remove("wl_" + newListId); return actions.slotWant(el); }
    if (spotFindWant(a, s, listId)) { closeSheet(); toast("Already on " + wl.name + "."); return; }
    const x = newWant({ typeId: tid, year: y, mint: s.m, pf: s.pf, variety: s.v || "", albumId: a.id, listId, grade: wl.scope === "type-grade" ? wl.grade : "" });
    saveWant(x);
    closeSheet();
    toast("Added to " + wl.name + ".", { label: "Undo", fn: () => { remove("w_" + x.id); if (newListId) remove("wl_" + newListId); render(); } });
  },
  swapGo: (el) => swapGo(el),
  slotTakeOut: (el) => {
    const c = getCoin(el.dataset.id);
    if (!c) return;
    const x = { ...c };
    applyKept(x, "");
    saveCoin(x);
    closeSheet(); render();
    toast("Taken out of the album. The coin is still in your collection.", { label: "Undo", fn: () => { saveCoin(c); render(); } });
  },
  delAlbumGo: (el) => deleteAlbumNow(getAlbum(el.dataset.id), el.dataset.w === "1"),
  // Cancelling a new list goes back to the form you came from, with nothing lost.
  wlCancel: () => {
    const ret = wlReturn;
    wlReturn = null;
    if (ret && ret.kind === "want") return openWantForm(ret.editId || null, ret.prefill);
    if (ret && ret.kind === "missing") return renderMissingPicker();
    if (ret && ret.kind === "quick") return openMissingQuick(ret.albumId);
    if (ret && ret.kind === "slot") return openSlotWantPicker(ret.el);
    closeSheet();
  },
  wlDelete: (el) => {
    const wl = getWantList(el.dataset.id);
    if (!wl) return;
    if (wantsIn(wl.id).length) { toast("Remove or move its coins first."); return; }
    remove("wl_" + wl.id);
    wantsView.listId = DEFAULT_LIST_ID;
    toast("List deleted.");
    go("wants");
  },
  missAll: () => { const a = getAlbum(missingPick.albumId); const st = albumStats(a); st.slots.filter((s) => !st.filled.has(slotKey(s)) && (missingPick.listId === "__auto" || !spotFindWant(a, s, missingPick.listId))).forEach((s) => missingPick.chosen.add(slotKey(s))); renderMissingPicker(); },
  missNone: () => { missingPick.chosen.clear(); renderMissingPicker(); },
  missingQuick: (el) => openMissingQuick(el.dataset.id),
  missQuickAdd: (el) => { const a = getAlbum(el.dataset.id); if (a) addMissingTo(a, el.dataset.list); },
  missAdd: () => {
    const a = getAlbum(missingPick.albumId);
    if (!a) return;
    let listId = ($("#missListPick") || {}).value || missingPick.listId || DEFAULT_LIST_ID, newListId = "";
    const st = albumStats(a);
    if (listId === "__auto") {
      const types = albumTypes(a), sug = missingSuggest(a);
      const nl = { kind: "wantlist", id: uid(), name: sug.name, scope: types.length === 1 ? "type" : "any", typeId: types.length === 1 ? types[0] : "", grade: "", createdAt: Date.now() };
      saveWantList(nl);
      listId = newListId = nl.id;
    }
    const slots = st.slots.filter((s) => missingPick.chosen.has(slotKey(s)) && !spotFindWant(a, s, listId));
    const wl = getWantList(listId);
    if (slots.some((s) => !listAccepts(wl, slotType(a, s)))) { toast("That list is for a different coin type."); return; }
    const made = slots.map((s) => { const tid = slotType(a, s), y = s.set ? "" : s.y; const x = newWant({ typeId: tid, year: y, mint: s.m, pf: s.pf, variety: s.v || "", albumId: a.id, listId, grade: wl && wl.scope === "type-grade" ? wl.grade : "" }); saveWant(x); return x; });
    finishMissingAdd(made, newListId, listId);
  },
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "wantForm") { e.preventDefault(); saveWantForm(e.target); }
  else if (e.target.id === "awForm") { e.preventDefault(); saveAlbumWantForm(e.target); }
  else if (e.target.id === "wlForm") { e.preventDefault(); saveNewList(e.target); }
  else if (e.target.id === "wlRenameForm") {
    e.preventDefault();
    const wl = getWantList(e.target.dataset.id), name = String(new FormData(e.target).get("name") || "").trim();
    if (!wl || !name) return;
    saveWantList({ ...wl, name });
    closeSheet(); go("wants"); toast("List renamed.");
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "wlScope") renderWlScopeFields();
  if (e.target.id === "wantListPick") {
    const form = e.target.form;
    const typed = readWantForm(form);
    const editId = form.dataset.id || null;
    if (e.target.value === "__new") {
      typed.listId = e.target.dataset.prev || wantsView.listId; // the list chosen before "+ New list"
      wlReturn = { kind: "want", editId, prefill: typed };
      openNewListForm();
    } else {
      openWantForm(editId, scopedPrefill(typed)); // switching lists applies that list's type/grade
    }
    return;
  }
  if (e.target.id === "slotListPick" && e.target.value === "__new") {
    wlReturn = { kind: "slot", el: slotWantCtx };
    openNewListForm();
    return;
  }
  if (e.target.id === "missListPick") {
    if (e.target.value === "__new") { wlReturn = { kind: "missing" }; openNewListForm(); return; }
    missingPick.listId = e.target.value;
    // Spots already on the newly chosen list can't be ticked.
    const a = getAlbum(missingPick.albumId);
    if (a) [...missingPick.chosen].forEach((k) => { const sp = albumStats(a).slots.find((x) => slotKey(x) === k); if (sp && missingPick.listId !== "__auto" && spotFindWant(a, sp, missingPick.listId)) missingPick.chosen.delete(k); });
    renderMissingPicker();
    return;
  }
  if (e.target.dataset && e.target.dataset.missck != null) {
    e.target.checked ? missingPick.chosen.add(e.target.dataset.missck) : missingPick.chosen.delete(e.target.dataset.missck);
    document.querySelectorAll(".missCount").forEach((c) => { c.textContent = missingPick.chosen.size + " selected"; });
    const b = $("[data-act=missAdd]"); if (b) b.disabled = !missingPick.chosen.size;
  }
});
// The wants made for one album (each carries its albumId).
const wantsMadeFor = (a) => [...store.docs.values()].filter((d) => d.kind === "want" && d.albumId === a.id);
