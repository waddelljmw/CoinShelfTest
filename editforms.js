// Change coin ID, new / edit album forms (split from app.js; plain script, shares the page's global names)
/* --- Change a coin's ID (Step 7.0) --- */
function openEditId(id, msg) {
  const c = getCoin(id);
  if (!c) return;
  openSheet(`<div class="sheet-head"><h2>Coin ID</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <p class="small muted">The ID is what you write on the flip. Two coins can't share one.</p>
  <form id="idForm" data-id="${esc(c.id)}"><label class="f"><span>ID</span><input type="text" name="cid" value="${esc(c.cid || "")}" autocapitalize="characters"></label>
  ${msg ? `<div class="hint" style="color:var(--bad)">${esc(msg)}</div>` : ""}
  <div class="btn-row"><button class="btn primary" type="submit">Save ID</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div></form>`);
}

/* --- New album --- */
function openNewAlbum() {
  openSheet(`<div class="sheet-head"><h2>New album</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="albumForm">
    <div class="grid2">
      <label class="f"><span>Brand</span><select name="brand">${ALBUM_BRANDS.map((b) => `<option>${b}</option>`).join("")}</select></label>
      <label class="f"><span>Album number</span><input type="text" name="number" placeholder="9128"></label>
    </div>
    <div class="hint" id="albumLookupHint"></div>
    <label class="f"><span>Name (optional)</span><input type="text" name="name" placeholder="Grandpa's Morgans"></label>
    ${albumColorField("red")}
    <label class="f"><span>Kind of album</span><select name="layout" id="albumLayout">
      <option value="dates">Dates and mint marks (most albums)</option><option value="set">Type set (one coin of each type)</option></select></label>
    ${albumTypeRows([firstAlbumType().id])}
    ${proofSelect("")}
    <div class="grid2">
      <label class="f"><span>From year</span><input type="number" name="start" id="albumStart" value="${firstAlbumType().start}"></label>
      <label class="f"><span>To year</span><input type="number" name="end" id="albumEnd" value="${typeLastYear(firstAlbumType())}"></label>
    </div>
    <div class="hint" id="albumHint">Use the years printed on your album. Each coin type gets spots for the dates and mint marks struck in those years. You can add, hide or reorder spots later.</div>
    <div class="btn-row"><button class="btn primary" type="submit">Create album</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
// One coin-type picker per type in the album, with "+ Add another coin type".
function albumTypeRow(id, i) {
  return `<div class="type-row"><select name="typeId" data-albumtype>${typeOptions(id)}</select>${i ? `<button type="button" class="type-del" data-act="albumDelType" aria-label="Remove this type">✕</button>` : ""}</div>`;
}
function albumTypeRows(ids) {
  return `<div class="f"><span>Coin types in this album</span><div id="albumTypes">${ids.map(albumTypeRow).join("")}</div>
    <button type="button" class="link-btn" data-act="albumAddType">+ Add another coin type</button></div>`;
}
function proofSelect(cur) {
  cur = cur === true ? "all" : cur || "";
  const o = (v, l) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`;
  return `<label class="f"><span>Proof spots</span><select name="proofs">${o("", "None")}${o("s", "S proofs only (1968 on)")}${o("all", "All proofs")}</select></label>`;
}
function readAlbumTypes(form) { return [...new Set(new FormData(form).getAll("typeId").filter((id) => TYPE_BY_ID[id]))]; }
// Check the album's types and years. Returns a message, or "" when it's fine.
function albumProblem(types, layout, start, end) {
  if (!types.length) return "Pick at least one coin type.";
  if (layout === "set") return "";
  const off = types.find((id) => { const t = TYPE_BY_ID[id]; return t.start > end || typeLastYear(t) < start; });
  if (off) return TYPE_BY_ID[off].name + " wasn't made in " + start + "–" + end + ".";
  const lo = Math.min(...types.map((id) => TYPE_BY_ID[id].start)), hi = Math.max(...types.map((id) => typeLastYear(TYPE_BY_ID[id])));
  if (start < lo || end > hi) return "These coin types cover " + lo + "–" + hi + ".";
  return "";
}
function typeOptions(sel) {
  const { recent, rest } = typesRecentFirst(COIN_TYPES);
  const opt = (t) => `<option value="${t.id}" ${sel === t.id ? "selected" : ""}>${esc(t.name)} (${t.start}–${t.end})</option>`;
  return recent.length ? `<optgroup label="Recent">${recent.map(opt).join("")}</optgroup><optgroup label="All types">${rest.map(opt).join("")}</optgroup>` : rest.map(opt).join("");
}
const firstAlbumType = () => TYPE_BY_ID[recentTypeIds()[0]] || COIN_TYPES[0];
function doNewAlbum(form) {
  const fd = new FormData(form);
  const types = readAlbumTypes(form);
  const layout = fd.get("layout") === "set" ? "set" : "dates";
  const info0 = typeof lookupAlbum === "function" ? lookupAlbum(fd.get("brand"), fd.get("number")) : null;
  const t = TYPE_BY_ID[types[0]];
  let start = num(fd.get("start")) ?? (t ? t.start : 0), end = num(fd.get("end")) ?? (t ? t.end : 0);
  if (start > end) [start, end] = [end, start];
  const prob = albumProblem(types, layout, start, end);
  if (prob) { toast(prob); return; }
  const proofs = (layout !== "set" && fd.get("proofs")) || "";
  if (proofs && !hasProofs(types)) { toast("The app doesn't have proof dates for these coin types yet. Add proof spots with + Add a spot."); return; }
  const a = { kind: "album", id: uid(), brand: fd.get("brand"), number: info0 ? info0.number : (fd.get("number") || "").trim(), name: (fd.get("name") || "").trim(), typeId: types[0], typeIds: types, layout, start, end, proofs, removed: [], createdAt: Date.now() };
  if (fd.get("brand") === "Other") a.color = String(fd.get("color") || "red");
  a.slots = buildAlbumSlots(types, layout, start, end, proofs);
  put("a_" + a.id, a);
  types.forEach(touchType);
  closeSheet();
  go("album-" + a.id);
}
// "Part of a series" in Edit album: link this album with another, or unlink it.
function seriesField(a) {
  const cur = albumSeriesOf(a);
  const others = albums().filter((x) => x.id !== a.id);
  if (!others.length) return "";
  const withMe = cur ? others.filter((x) => albumSeriesOf(x) === cur) : [];
  return `<label class="f"><span>Part of a series</span><select name="series">
      <option value="" ${!cur ? "selected" : ""}>Not linked</option>
      ${others.map((x) => `<option value="${esc(x.id)}" ${withMe[0] === x ? "selected" : ""}>Keep with ${esc(albumTitle(x))}</option>`).join("")}
    </select></label>
    <div class="hint">Albums in a series (like Morgan Vol. 1, 2 and 3) stay together on the Albums page and move together.${cur && !a.seriesId ? " This one was linked automatically because the album numbers follow each other." : ""}</div>`;
}
// The seriesId to save for this album; may also link the album it was joined to.
function seriesFromForm(a, fd) {
  if (!fd.has("series")) return {};
  const pick = fd.get("series");
  const cur = albumSeriesOf(a);
  if (!pick) return cur ? { seriesId: "solo" } : (a.seriesId === "solo" ? { seriesId: "solo" } : {});
  const other = getAlbum(pick);
  if (!other) return {};
  const theirs = albumSeriesOf(other);
  if (theirs && theirs === cur) return {}; // already together
  let sid = other.seriesId && other.seriesId !== "solo" ? other.seriesId : "s" + uid();
  if (!other.seriesId || other.seriesId === "solo" || String(theirs || "").startsWith("auto:")) {
    // Make the other album's series (including automatic links) a saved one.
    const mates = theirs ? albums().filter((x) => albumSeriesOf(x) === theirs) : [other];
    mates.forEach((m) => { if (m.id !== a.id) put("a_" + m.id, { ...m, seriesId: sid }); });
  }
  return { seriesId: sid };
}
// Edit an album's details. Changing the date range keeps your own spots, hidden spots,
// order and spot names inside the range; it only adds or drops the standard dates.
function openEditAlbum(id) {
  const a = getAlbum(id);
  if (!a) return;
  openSheet(`<div class="sheet-head"><h2>Edit album</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="editAlbumForm" data-id="${esc(a.id)}">
    <div class="grid2">
      <label class="f"><span>Brand</span><select name="brand">${ALBUM_BRANDS.map((b) => `<option ${a.brand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <label class="f"><span>Album number</span><input type="text" name="number" value="${esc(a.number || "")}"></label>
    </div>
    <div class="hint" id="albumLookupHint"></div>
    <label class="f"><span>Name (optional)</span><input type="text" name="name" value="${esc(a.name || "")}"></label>
    ${albumColorField(a.color)}
    ${seriesField(a)}
    <div class="small muted" style="margin-top:10px">${isSetAlbum(a) ? "Type set (one coin of each type)" : "Dates and mint marks"}</div>
    ${albumTypeRows(albumTypes(a).length ? albumTypes(a) : [COIN_TYPES[0].id])}
    ${isSetAlbum(a) ? "" : proofSelect(a.proofs)}
    <div class="grid2">
      <label class="f"><span>From year</span><input type="number" name="start" value="${a.start}"></label>
      <label class="f"><span>To year</span><input type="number" name="end" value="${a.end}"></label>
    </div>
    <div class="hint">Adding a coin type adds its spots. Changing the years or removing a type keeps the spots you added or hid; standard spots that no longer fit are dropped and come back if you add them again.</div>
    <div class="btn-row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function saveEditAlbum(form) {
  const a = withSlotIds(getAlbum(form.dataset.id));
  if (!a) return;
  const fd = new FormData(form);
  let start = num(fd.get("start")) ?? a.start, end = num(fd.get("end")) ?? a.end;
  if (start > end) [start, end] = [end, start];
  const layout = isSetAlbum(a) ? "set" : "dates";
  const set = layout === "set";
  const oldTypes = albumTypes(a), types = readAlbumTypes(form);
  const oldPf = a.proofs === true ? "all" : a.proofs || "";
  const proofs = (!set && fd.get("proofs")) || "";
  if (proofs && !oldPf && !hasProofs(types)) { toast("The app doesn't have proof dates for these coin types yet. Add proof spots with + Add a spot."); return; }
  const unchanged = types.join() === oldTypes.join() && start === a.start && end === a.end && proofs === oldPf;
  // Years already allowed for an unchanged album, so older albums with odd ranges can still be renamed.
  const prob = unchanged ? "" : albumProblem(types, layout, start, end);
  if (prob) { toast(prob); return; }
  let slots = a.slots || [];
  if (!unchanged) {
    const fits = (x, ts, s0, e0, pf) => ts.includes(x.t) && (set || (x.y >= s0 && x.y <= e0)) && (!x.pf || pf === "all" || (pf === "s" && x.m === "S"));
    // Keep your own spots, and standard spots that still fit (with their ids, names and order).
    const kept = slots.map((x) => (x.t || x.custom ? x : { ...x, t: slotType(a, x) })).filter((x) => (x.custom && (!x.t || types.includes(x.t))) || fits(x, types, start, end, proofs));
    const have = new Set(kept.map(slotKey));
    // Add standard spots for new types and new years only (spots you removed before stay removed).
    const added = buildAlbumSlots(types, layout, start, end, proofs).filter((x) => !have.has(slotKey(x)) && !fits(x, oldTypes, a.start, a.end, oldPf));
    slots = set ? [...kept, ...added] : sortSlots([...kept, ...added]);
  }
  const removed = a.removed || [];
  put("a_" + a.id, { ...a, color: String(fd.get("color") || a.color || "red"), brand: fd.get("brand"), number: String(fd.get("number") || "").trim(), name: String(fd.get("name") || "").trim(), start, end, typeId: types[0] || a.typeId, typeIds: types, proofs, slots, removed, ...seriesFromForm(a, fd) });
  closeSheet();
  toast("Album saved.");
}

// New album: the years follow the coin types picked (earliest start to latest end).
function albumYearsFromTypes() {
  const f = $("#albumForm");
  if (!f || !$("#albumStart")) return;
  const ts = readAlbumTypes(f).map((id) => TYPE_BY_ID[id]);
  if (!ts.length) return;
  $("#albumStart").value = Math.min(...ts.map((t) => t.start));
  $("#albumEnd").value = Math.max(...ts.map(typeLastYear));
}

// Delegates to wants.js, which knows about want lists.
function openMissing(id) { openMissingPicker(id); }

/* CSV import and export live in sheets.js */

