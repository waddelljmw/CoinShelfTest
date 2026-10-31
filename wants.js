// Want list: coins you're looking for, with a target grade and the most you'd pay.
// Saved as "w_<id>" records next to your coins. Loaded after app.js.
"use strict";

const wants = () => [...store.docs.values()].filter((d) => d.kind === "want");
const getWant = (id) => store.docs.get("w_" + id);
const saveWant = (w) => put("w_" + w.id, w);
const findWant = (typeId, year, mint) => wants().find((w) => w.typeId === typeId && String(w.year) === String(year) && normMint(w.mint) === normMint(mint));
const wantLabel = (w) => [w.year ? String(w.year) + (w.mint ? "-" + w.mint : "") : "", w.typeName, w.denom].filter(Boolean).join(" ") + (w.variety ? " · " + w.variety : "");
// A pretend coin, so Red Book, eBay and mintage lookups work for a want.
const wantAsCoin = (w) => ({ typeId: w.typeId, typeName: w.typeName, denom: w.denom, year: w.year, mint: w.mint, variety: w.variety || "", gradeMode: "raw", grade: w.grade || "", label: "" });

function newWant(fields) {
  const t = TYPE_BY_ID[fields.typeId];
  return {
    kind: "want", id: uid(), createdAt: Date.now(), typeId: fields.typeId || "", typeName: t ? shortName(t) : fields.typeName || "",
    family: t ? t.family : fields.typeName || "Other", denom: t ? t.denom : "", year: fields.year || "", mint: fields.mint || "",
    variety: fields.variety || "", grade: fields.grade || "", maxPrice: fields.maxPrice ?? "", notes: fields.notes || "", albumId: fields.albumId || "",
  };
}

/* ---------- page ---------- */
function viewWants() {
  const list = wants().sort((a, b) => (a.family || "").localeCompare(b.family || "") || (+a.year || 0) - (+b.year || 0) || normMint(a.mint).localeCompare(normMint(b.mint)));
  const totalMax = sum(list, (w) => num(w.maxPrice));
  return `<h1>Want List</h1>
    <button class="btn primary block" data-act="wantNew">+ Add a coin you're looking for</button>
    ${list.length ? `<div class="small muted" style="margin:10px 2px">${list.length} coin${list.length === 1 ? "" : "s"}${totalMax ? " · up to " + money(totalMax) + " budgeted" : ""}</div>` : ""}
    ${list.length ? `<div class="list">${list.map(wantRow).join("")}</div>` : `<div class="card empty" style="margin-top:12px">Nothing on your want list yet. Add coins here, or tap <b>+ Want</b> on an album's missing list.</div>`}`;
}
function wantRow(w) {
  const fake = wantAsCoin(w);
  const rb = w.grade ? bookPrice(fake) : null;
  const a = w.albumId ? getAlbum(w.albumId) : null;
  const sub = [w.grade ? "Target " + w.grade : "Any grade", num(w.maxPrice) != null ? "pay up to " + money(num(w.maxPrice)) : "", a ? "for " + albumTitle(a) : ""].filter(Boolean).join(" · ");
  return `<div class="coin-row" style="display:block">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <span class="coin-main"><span class="coin-label">${esc(wantLabel(w))}</span><span class="coin-sub">${esc(sub)}</span>
        ${w.notes ? `<span class="coin-sub" style="white-space:normal">${esc(w.notes)}</span>` : ""}</span>
      <span class="coin-val">${rb != null ? money(rb) + `<div class="melt">Red Book ${esc(w.grade)}</div>` : ""}</span>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:14px">
      <a href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a>
      <button class="link-btn" data-act="wantGot" data-id="${esc(w.id)}">Got it</button>
      <button class="link-btn" data-act="wantEdit" data-id="${esc(w.id)}">Edit</button>
      <button class="link-btn" style="color:var(--bad)" data-act="wantRemove" data-id="${esc(w.id)}">Remove</button>
    </div>
  </div>`;
}

/* ---------- add / edit ---------- */
function openWantForm(id) {
  const w = id ? getWant(id) : null;
  const d = w || {};
  const opts = (() => {
    const { recent, rest } = typesRecentFirst(COIN_TYPES);
    const opt = (t) => `<option value="${t.id}" ${d.typeId === t.id ? "selected" : ""}>${esc(t.name)} (${t.start}–${t.end})</option>`;
    return `<option value="">Choose…</option>` + (recent.length ? `<optgroup label="Recent">${recent.map(opt).join("")}</optgroup><optgroup label="All types">${rest.map(opt).join("")}</optgroup>` : rest.map(opt).join(""));
  })();
  openSheet(`<div class="sheet-head"><h2>${w ? "Edit want" : "Add to want list"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="wantForm" data-id="${esc(id || "")}">
    <label class="f"><span>Coin type</span><select name="typeId" required>${opts}</select></label>
    <div class="grid2">
      <label class="f"><span>Year</span><input type="number" inputmode="numeric" name="year" value="${esc(d.year || "")}" placeholder="Any"></label>
      <label class="f"><span>Mint mark</span><select name="mint">${MINTS.map((m) => `<option value="${m}" ${(d.mint || "") === m ? "selected" : ""}>${m || "None (Philadelphia)"}</option>`).join("")}</select></label>
    </div>
    <label class="f"><span>Variety (optional)</span><input type="text" name="variety" value="${esc(d.variety || "")}" placeholder="e.g. Doubled Die Obverse"></label>
    <div class="grid2">
      <label class="f"><span>Target grade (optional)</span><select name="grade"><option value="">Any grade</option>${GRADES.filter((g) => g !== "Junk").map((g) => `<option ${d.grade === g ? "selected" : ""}>${g}</option>`).join("")}</select></label>
      <label class="f"><span>Most I'd pay (optional)</span><input type="number" inputmode="decimal" step="0.01" name="maxPrice" value="${esc(d.maxPrice ?? "")}" placeholder="$"></label>
    </div>
    <label class="f"><span>Notes (optional)</span><textarea name="notes" placeholder="e.g. needs to be original toning">${esc(d.notes || "")}</textarea></label>
    <div class="btn-row"><button class="btn primary" type="submit">${w ? "Save" : "Add to want list"}</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
  </form>`);
}
function saveWantForm(form) {
  const fd = new FormData(form);
  const typeId = fd.get("typeId");
  if (!typeId) { toast("Pick a coin type."); return; }
  const fields = { typeId, year: num(fd.get("year")) ?? "", mint: fd.get("mint") || "", variety: String(fd.get("variety") || "").trim(),
    grade: fd.get("grade") || "", maxPrice: num(fd.get("maxPrice")) ?? "", notes: String(fd.get("notes") || "").trim() };
  const old = form.dataset.id ? getWant(form.dataset.id) : null;
  const w = old ? { ...newWant({ ...old, ...fields }), id: old.id, createdAt: old.createdAt, albumId: old.albumId } : newWant(fields);
  saveWant(w);
  touchType(typeId);
  closeSheet();
  toast(old ? "Saved." : "Added to your want list.");
  if (currentRoute().view !== "wants") go("wants");
}

// "Got it": open the add-coin form filled in from the want; saving the coin removes the want.
function gotWant(id) {
  const w = getWant(id);
  if (!w) return;
  openCoinForm(null);
  const t = TYPE_BY_ID[w.typeId];
  if (t) { draft.typeId = t.id; draft.typeName = shortName(t); draft.family = t.family; draft.denom = t.denom; draft.metal = t.metal; draft.oz = t.oz || ""; }
  else draft.typeName = w.typeName;
  draft.year = w.year; draft.mint = w.mint; draft.variety = w.variety; draft.grade = w.grade;
  if (w.albumId && getAlbum(w.albumId)) draft.albumId = w.albumId;
  draft._fromWant = w.id;
  renderCoinForm();
}

/* ---------- from an album's missing list ---------- */
function wantFromSlot(el) {
  const y = +el.dataset.y, m = el.dataset.m || "", typeId = el.dataset.type;
  if (findWant(typeId, y, m)) return;
  saveWant(newWant({ typeId, year: y, mint: m, albumId: el.dataset.album }));
  el.outerHTML = `<span class="small muted" style="margin-left:10px">On want list</span>`;
}
function wantAllMissing(el) {
  const a = getAlbum(el.dataset.id);
  if (!a) return;
  const st = albumStats(a);
  const missing = st.slots.filter((s) => !st.filled.has(s.y + "|" + s.m) && !findWant(a.typeId, s.y, s.m));
  missing.forEach((s) => saveWant(newWant({ typeId: a.typeId, year: s.y, mint: s.m, albumId: a.id })));
  closeSheet();
  toast(missing.length ? "Added " + missing.length + " coin" + (missing.length === 1 ? "" : "s") + " to your want list." : "They're already on your want list.");
}

/* ---------- tapping a coin card in an album ---------- */
function openSlotMenu(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const y = +el.dataset.y, m = el.dataset.m || "";
  const t = TYPE_BY_ID[a.typeId];
  const coin = el.dataset.coin ? getCoin(el.dataset.coin) : null;
  const fake = { typeId: a.typeId, typeName: t ? shortName(t) : "", denom: t ? t.denom : "", year: y, mint: m, gradeMode: "raw", grade: "" };
  const label = [y + (m ? "-" + m : ""), fake.typeName, fake.denom].filter(Boolean).join(" ");
  const w = findWant(a.typeId, y, m);
  const mt = mintageInfo({ ...fake, grade: "VF-20" });
  openSheet(`<div class="sheet-head"><h2>${esc(label)}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="small muted" style="margin:-4px 0 12px">${coin ? "In this album · " + esc(gradeText(coin)) : "Not in this album yet"}${mt ? " · Mintage " + esc(mt.text) : ""}</div>
    ${w
      ? `<div class="card small">★ On your want list${w.grade ? " · target " + esc(w.grade) : ""}${num(w.maxPrice) != null ? " · up to " + money(num(w.maxPrice)) : ""}</div>
         <div class="btn-row"><button class="btn" data-go="wants">View want list</button><button class="btn danger" data-act="slotUnwant" data-id="${esc(w.id)}">Remove from want list</button></div>`
      : `<button class="btn primary block" data-act="slotWant" data-album="${esc(a.id)}" data-y="${y}" data-m="${esc(m)}">★ Add to want list${coin ? " (upgrade)" : ""}</button>
         <div class="hint">Adds ${esc(label)} with no typing. You can set a target grade and price on the Want List later.</div>`}
    <div class="btn-row">
      ${coin ? `<button class="btn" data-go="coin-${esc(coin.id)}">View coin</button>` : `<button class="btn" data-act="slotHave" data-album="${esc(a.id)}" data-y="${y}" data-m="${esc(m)}">I have it: add coin</button>`}
      <a class="btn" style="text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a>
    </div>`);
}
function slotWant(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const y = +el.dataset.y, m = el.dataset.m || "";
  if (!findWant(a.typeId, y, m)) saveWant(newWant({ typeId: a.typeId, year: y, mint: m, albumId: a.id }));
  closeSheet();
  toast("Added to your want list.");
}
// Open slot: add the coin you already have, filled in and placed in this album.
function slotHave(el) {
  const a = getAlbum(el.dataset.album);
  if (!a) return;
  const t = TYPE_BY_ID[a.typeId];
  openCoinForm(null);
  if (t) { draft.typeId = t.id; draft.typeName = shortName(t); draft.family = t.family; draft.denom = t.denom; draft.metal = t.metal; draft.oz = t.oz || ""; }
  draft.year = +el.dataset.y; draft.mint = el.dataset.m || ""; draft.albumId = a.id;
  const w = findWant(a.typeId, draft.year, draft.mint);
  if (w) draft._fromWant = w.id;
  renderCoinForm();
}

/* ---------- wiring ---------- */
Object.assign(actions, {
  wantNew: () => openWantForm(null),
  wantEdit: (el) => openWantForm(el.dataset.id),
  wantRemove: (el) => {
    const w = getWant(el.dataset.id);
    if (!w) return;
    remove("w_" + w.id);
    toast("Removed from your want list.", { label: "Undo", fn: () => saveWant(w) });
  },
  wantGot: (el) => gotWant(el.dataset.id),
  wantSlot: wantFromSlot,
  wantAllMissing,
  slotMenu: openSlotMenu,
  slotWant,
  slotHave,
  slotUnwant: (el) => { const w = getWant(el.dataset.id); if (w) { remove("w_" + w.id); closeSheet(); toast("Removed from your want list.", { label: "Undo", fn: () => saveWant(w) }); } },
});
document.addEventListener("submit", (e) => { if (e.target.id === "wantForm") { e.preventDefault(); saveWantForm(e.target); } });
