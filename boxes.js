/* Step 2.8 / 4.3: storage boxes and display boxes.
   A box is a record { kind: "box", id, name, type, look, color, spots, rows, perRow, inside }, saved under "b_<id>".
   type: "storage" (default) or "display". look: "black" (default), "cardboard" or "plastic" (plastic has a color, "clear" by default).
   spots: true = numbered rows and slots; false = just a list of what's inside. Old boxes read as storage, black, with spots.
   An item sits in a box with boxId (and boxRow, boxSlot when the box has spots). Any item kind and any holder can go in a box. */
const normBox = (b) => b && ({ ...b, type: b.type === "display" ? "display" : "storage", look: BOX_LOOKS.some((x) => x[0] === b.look) ? b.look : "black",
  color: BOX_COLORS.some((x) => x[0] === b.color) ? b.color : "clear", spots: b.spots !== false, inside: b.inside || "" });
const getBox = (id) => normBox(store.docs.get("b_" + id));
const allBoxes = () => [...store.docs.values()].filter((d) => d.kind === "box").map(normBox).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const boxCoins = (b) => ownedCoins().filter((c) => c.boxId === b.id);
const boxFind = { q: "" };
const spotCoin = (boxId, row, slot, exceptId) => ownedCoins().find((c) => c.boxId === boxId && +c.boxRow === +row && +c.boxSlot === +slot && c.id !== exceptId);
function nextFreeSpot(b, exceptId) {
  if (!b.spots) return null;
  for (let r = 1; r <= b.rows; r++) for (let s = 1; s <= b.perRow; s++) if (!spotCoin(b.id, r, s, exceptId)) return { row: r, slot: s };
  return null;
}
function boxText(c) {
  const b = c.boxId && getBox(c.boxId);
  if (!b) return "";
  return b.spots ? (c.boxRow && c.boxSlot ? b.name + " · Row " + c.boxRow + " · Slot " + c.boxSlot : b.name) : b.name;
}
// Where an item is kept, in words: its album, box and stack (an old item can have more than one).
function keptName(c) {
  const al = c.albumId && getAlbum(c.albumId);
  return [al ? albumTitle(al) : "", boxText(c), itemOf(c) === "coin" ? String(c.stack || "").trim() : ""].filter(Boolean).join(" · ");
}
const slotDate = (c) => (c.year ? String(c.year) + (c.mint ? "-" + c.mint : "") : (c.label || "Coin").slice(0, 8));
const boxTypeName = (b) => (b.type === "display" ? "Display box" : "Storage box");

// --- "Kept in" in the coin form (top of the Holder section) ---
const keptVal = (d) => (d.albumId ? "a:" + d.albumId : d.boxId ? "b:" + d.boxId : itemOf(d) === "coin" && d._stackNew ? "s:__new" : itemOf(d) === "coin" && d.stack ? "s:" + d.stack : "");
function keptInFields(d) {
  const coin = itemOf(d) === "coin", bs = allBoxes(), v = keptVal(d);
  const stackOk = coin && isJunk(d) && d.metal === "Silver";
  const opt = (val, label) => `<option value="${esc(val)}" ${v === val ? "selected" : ""}>${esc(label)}</option>`;
  const boxOpts = (t) => bs.filter((b) => b.type === t).map((b) => opt("b:" + b.id, b.name)).join("");
  const b = d.boxId && getBox(d.boxId);
  if (b && b.spots && !d.boxRow && !d.boxSlot) { const n = nextFreeSpot(b, d.id); if (n) { d.boxRow = String(n.row); d.boxSlot = String(n.slot); } } // suggests the next empty spot
  const stacks = stackOk || v.startsWith("s:") ? stackNames() : [];
  return `<label class="f"><span>Kept in <span class="muted small">(optional)</span></span><select data-kept data-rerender><option value="">Nothing special</option>
      ${coin ? `<optgroup label="Albums">${albumsForCoin(d).map((a) => opt("a:" + a.id, albumTitle(a))).join("")}${opt("a:__new", "+ New album…")}</optgroup>` : ""}
      ${bs.some((x) => x.type === "storage") ? `<optgroup label="Storage boxes">${boxOpts("storage")}</optgroup>` : ""}
      ${bs.some((x) => x.type === "display") ? `<optgroup label="Display boxes">${boxOpts("display")}</optgroup>` : ""}
      ${stacks.length ? `<optgroup label="Stacks">${stacks.map((n) => opt("s:" + n, n)).join("")}${opt("s:__new", "+ New stack…")}</optgroup>` : ""}</select></label>
    ${!bs.length ? `<div class="hint">To keep this in a box, make one on the <b>Storage</b> page first.</div>` : ""}
    ${b && b.spots ? `<div class="grid2"><label class="f"><span>Row (1–${b.rows})</span><input type="number" inputmode="numeric" min="1" max="${b.rows}" data-f="boxRow" value="${esc(d.boxRow || "")}"></label>
    <label class="f"><span>Slot (1–${b.perRow})</span><input type="number" inputmode="numeric" min="1" max="${b.perRow}" data-f="boxSlot" value="${esc(d.boxSlot || "")}"></label></div>
    <div class="hint">The next empty spot is filled in for you. Change it if this goes elsewhere.</div>` : ""}
    ${coin && d._stackNew ? `<label class="f"><span>New stack name</span><input type="text" data-f="stack" value="${esc(d.stack || "")}" placeholder="e.g. My Junk Silver"></label>` : ""}
    ${coin && d.albumId === "__new" ? `<div class="grid2">
      <label class="f"><span>Brand</span><select data-na="brand">${ALBUM_BRANDS.map((x) => `<option ${d._newAlbum.brand === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="f"><span>${d._newAlbum.brand === "Other" ? "Album name" : "Album number"}</span><input type="text" data-na="number" value="${esc(d._newAlbum.number)}" placeholder="${d._newAlbum.brand === "Dansco" ? "7070" : d._newAlbum.brand === "Whitman" ? "9128" : "My Morgans"}"></label></div>
      ${d._newAlbum.brand === "Other" ? spineColorField(d._newAlbum.color, "data-na=\"color\"") : ""}
      <div class="hint">Makes a virtual album for this coin type with every date and mint mark. Change its name or date range later with Edit album on the album's page.</div>` : ""}`;
}
// Picking a Kept in place: one place only, so the others are cleared.
function keptPick(val) {
  const kind = val.slice(0, 1), id = val.slice(2);
  const coin = itemOf(draft) === "coin";
  if (kind !== "a") { draft.albumId = ""; delete draft.slotId; }
  if (kind !== "b") { draft.boxId = ""; draft.boxRow = ""; draft.boxSlot = ""; }
  if (kind !== "s" && coin) { draft.stack = ""; }
  draft._stackNew = false;
  if (kind === "a") draft.albumId = id;
  else if (kind === "b") { draft.boxId = id; draft.boxRow = ""; draft.boxSlot = ""; }
  else if (kind === "s") { if (id === "__new") { draft._stackNew = true; draft.stack = ""; } else draft.stack = id; }
  if (kind === "a" && draft._isNew && !draft.typeId) { const al = getAlbum(id); if (al && albumTypes(al).length === 1) { pickType(albumTypes(al)[0]); return; } }
  const y = $(".sheet").scrollTop; renderCoinForm(); $(".sheet").scrollTop = y;
}
// Spine color pick for "Other" albums.
const albumColors = () => BOX_COLORS.filter((x) => x[0] !== "clear");
function spineColorField(cur, attr) {
  return `<label class="f" id="spineColorRow"><span>Spine color</span><select ${attr || 'name="color"'}>${albumColors().map((x) => `<option value="${x[0]}" ${(cur || "red") === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>`;
}
// Called when an item is saved: tidies the box fields, and returns a message if the spot can't be used.
function boxCheck(c) {
  delete c._boxFor; delete c._stackNew;
  const b = c.boxId && getBox(c.boxId);
  if (!b) { delete c.boxId; delete c.boxRow; delete c.boxSlot; return ""; }
  if (!b.spots) { delete c.boxRow; delete c.boxSlot; return ""; }
  const r = Math.round(+c.boxRow), s = Math.round(+c.boxSlot);
  if (!(r >= 1 && r <= b.rows) || !(s >= 1 && s <= b.perRow)) return "Pick a row from 1 to " + b.rows + " and a slot from 1 to " + b.perRow + ", or choose Nothing special.";
  const other = spotCoin(b.id, r, s, c.id);
  if (other) return "Row " + r + ", slot " + s + " already holds " + labelOf(other) + ". Pick another spot.";
  c.boxRow = String(r); c.boxSlot = String(s);
  return "";
}

// A coin coming back (Undo, Restore, Move back) whose box spot was filled meanwhile leaves the box. Returns a note for the toast.
function freeSpotOnReturn(c) {
  if (!c.boxId || !getBox(c.boxId) || !getBox(c.boxId).spots) return "";
  const other = spotCoin(c.boxId, c.boxRow, c.boxSlot, c.id);
  if (!other) return "";
  const where = boxText(c);
  delete c.boxId; delete c.boxRow; delete c.boxSlot;
  return " Its box spot (" + where + ") now holds " + labelOf(other) + ", so it's set to Nothing special.";
}

// --- pages ---
const boxStats = (b) => { const n = boxCoins(b).length; return { filled: n, total: b.spots ? b.rows * b.perRow : 0 }; };
const boxCount = (b) => { const st = boxStats(b); return b.spots ? st.filled + "/" + st.total : st.filled + (st.filled === 1 ? " item" : " items"); };
function boxCard(b) {
  const st = boxStats(b);
  return `<button class="card" style="display:block;width:100%;text-align:left" data-go="box-${esc(b.id)}">
        <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(b.name)}</b><span class="num">${boxCount(b)}</span></div>
        <div class="small muted">${boxTypeName(b)}${b.spots ? " · " + b.rows + " rows of " + b.perRow + " slots" : ""}</div>${b.spots ? `<div class="bar"><i style="width:${st.total ? (st.filled / st.total) * 100 : 0}%"></i></div>` : ""}</button>`;
}
function viewBoxes() {
  const bs = allBoxes();
  const q = boxFind.q.trim();
  const nq = q.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hits = nq ? ownedCoins().filter((c) => c.boxId && getBox(c.boxId) && labelOf(c).toLowerCase().replace(/[^a-z0-9]/g, "").includes(nq)) : [];
  const stor = bs.filter((b) => b.type === "storage"), disp = bs.filter((b) => b.type === "display");
  return `<h1>Storage</h1>
    <div class="small muted" style="margin-bottom:10px">Storage boxes and display boxes. Coins can sit in numbered spots, or you can just list what's inside.</div>
    <button class="btn primary block" data-act="boxNew">+ New box</button>
    ${bs.length ? `<form id="boxFind" style="margin-top:12px"><div class="grid2" style="grid-template-columns:1fr auto"><input type="search" id="boxQ" value="${esc(boxFind.q)}" placeholder="Find a coin, e.g. 1909-S" aria-label="Find a coin in your boxes"><button class="btn" type="submit">Find</button></div></form>` : ""}
    ${q ? `<div class="card" style="margin-top:10px"><b>${hits.length} found for "${esc(q)}"</b>${hits.slice(0, 30).map((c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(boxText(c))}</span></span></button>`).join("") || `<div class="small muted">Nothing in your boxes matches. Only coins kept in a box are searched.</div>`}</div>` : ""}
    <div style="margin-top:12px">${bs.length ? (stor.length ? `<h2 style="margin:6px 0">Storage boxes</h2>` + stor.map(boxCard).join("") : "") + (disp.length ? `<h2 style="margin:10px 0 6px">Display boxes</h2>` + disp.map(boxCard).join("") : "")
      : `<div class="card empty">No boxes yet. Tap <b>+ New box</b>, name it (like "Black box 1") and say how it looks.</div>`}</div>
    ${bs.some((b) => b.spots) ? `<button class="btn block" data-act="boxMissing">Which Lincoln wheat dates am I missing?</button>` : ""}`;
}
function viewBox(r) {
  const b = getBox(r.id);
  if (!b) return `<div class="card empty">That box isn't here. <button class="link-btn" data-go="boxes">Back to Storage</button></div>`;
  const st = boxStats(b), inBox = boxCoins(b);
  let body;
  if (b.spots) {
    body = Array.from({ length: b.rows }, (_, i) => {
      const row = i + 1;
      const cells = Array.from({ length: b.perRow }, (_, j) => {
        const slot = j + 1, c = spotCoin(b.id, row, slot);
        return c ? `<button class="slot full" data-go="coin-${esc(c.id)}" title="${esc(labelOf(c))}"><span class="sn">${slot}</span>${esc(slotDate(c))}</button>`
          : `<button class="slot" data-act="boxAdd" data-box="${esc(b.id)}" data-row="${row}" data-slot="${slot}" aria-label="Add a coin to row ${row}, slot ${slot}"><span class="sn">${slot}</span>+</button>`;
      }).join("");
      return `<h2 style="margin:14px 0 6px">Row ${row} <span class="muted small">· ${inBox.filter((c) => +c.boxRow === row).length}/${b.perRow}</span></h2><div class="slots">${cells}</div>`;
    }).join("");
    const loose = inBox.filter((c) => !(+c.boxRow >= 1 && +c.boxSlot >= 1));
    if (loose.length) body += `<h2 style="margin:14px 0 6px">No numbered spot</h2>` + loose.map(boxItemRow).join("");
  } else {
    body = `<button class="btn primary block" data-act="boxAdd" data-box="${esc(b.id)}">+ Add a coin to this box</button><div style="margin-top:10px">${inBox.map(boxItemRow).join("") || `<div class="card empty">Nothing in this box yet. Pick it under <b>Kept in</b> when you add or edit a coin.</div>`}</div>`;
  }
  return `<button class="link-btn" data-go="boxes">← Storage</button>
    <h1 style="margin-top:10px">${esc(b.name)}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${boxTypeName(b)} · ${b.spots ? st.filled + " of " + st.total + " slots filled · " + b.rows + " rows of " + b.perRow : st.filled + (st.filled === 1 ? " item" : " items")}</div>
    ${b.inside ? `<div class="card"><div class="small muted">What's inside</div>${esc(b.inside)}</div>` : ""}
    ${body}
    <div class="btn-row"><button class="btn" data-act="boxEdit" data-id="${esc(b.id)}">Edit box</button><button class="btn danger" data-act="boxDelete" data-id="${esc(b.id)}">Delete box</button></div>`;
}
const boxItemRow = (c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(holderText(c))}</span></span></button>`;
function boxForm(b) {
  const nb = b || { type: "storage", look: "black", color: "clear", spots: true };
  openSheet(`<div class="sheet-head"><h2>${b ? "Edit box" : "New box"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="boxForm" data-id="${b ? esc(b.id) : ""}" autocomplete="off">
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(b ? b.name : "")}" placeholder="e.g. Black box 1" maxlength="40" required></label>
    <div class="grid2"><label class="f"><span>Kind</span><select name="type"><option value="storage" ${nb.type === "storage" ? "selected" : ""}>Storage box</option><option value="display" ${nb.type === "display" ? "selected" : ""}>Display box</option></select></label>
    <label class="f"><span>Look</span><select name="look">${BOX_LOOKS.map((x) => `<option value="${x[0]}" ${nb.look === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label></div>
    <label class="f" id="boxColorRow" ${nb.look === "plastic" ? "" : "hidden"}><span>Container color</span><select name="color">${BOX_COLORS.map((x) => `<option value="${x[0]}" ${nb.color === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>
    <label class="switch"><span>Numbered spots<div class="small muted">Rows and slots, one item each. Off = just a list of what's inside.</div></span><input type="checkbox" name="spots" ${nb.spots ? "checked" : ""}></label>
    <div class="grid2" id="boxSpotRows" ${nb.spots ? "" : "hidden"}><label class="f"><span>Rows</span><input type="number" inputmode="numeric" name="rows" min="1" max="50" value="${b && b.rows ? b.rows : ""}" placeholder="e.g. 5"></label>
    <label class="f"><span>Slots per row</span><input type="number" inputmode="numeric" name="perRow" min="1" max="100" value="${b && b.perRow ? b.perRow : ""}" placeholder="e.g. 20"></label></div>
    <label class="f"><span>What's inside <span class="muted small">(optional)</span></span><textarea name="inside" rows="2" maxlength="300" placeholder="e.g. ziplock of Bicentennial quarters, pill bottle of halves">${esc(b ? b.inside : "")}</textarea></label>
    <div class="btn-row"><button type="submit" class="btn primary">${b ? "Save" : "Add box"}</button><button type="button" class="btn" data-act="closeSheet">Cancel</button></div></form>`, "sheet-75");
}
function saveBoxForm(form) {
  const f = new FormData(form); let id = form.dataset.id;
  const name = String(f.get("name") || "").trim(), spots = !!f.get("spots");
  const old = id && getBox(id);
  let rows = Math.round(+f.get("rows")), perRow = Math.round(+f.get("perRow"));
  if (!spots) { rows = old ? old.rows || 0 : 0; perRow = old ? old.perRow || 0 : 0; }
  if (!name || (spots && (!(rows >= 1 && rows <= 50) || !(perRow >= 1 && perRow <= 100)))) { toast("Add a name" + (spots ? ", 1–50 rows and 1–100 slots per row." : ".")); return; }
  if (old && spots && old.spots) {
    const stuck = boxCoins(old).filter((c) => +c.boxRow > rows || +c.boxSlot > perRow);
    if (stuck.length) { toast("That box would be too small. " + stuck.length + " item" + (stuck.length > 1 ? "s sit" : " sits") + " beyond row " + rows + " / slot " + perRow + ". Move " + (stuck.length > 1 ? "them" : "it") + " first."); return; }
  }
  const look = BOX_LOOKS.some((x) => x[0] === f.get("look")) ? f.get("look") : "black";
  const color = BOX_COLORS.some((x) => x[0] === f.get("color")) ? f.get("color") : "clear";
  const rec = { name, type: f.get("type") === "display" ? "display" : "storage", look, spots, rows, perRow, inside: String(f.get("inside") || "").trim() };
  if (look === "plastic") rec.color = color;
  const before = old ? JSON.parse(JSON.stringify(store.docs.get("b_" + old.id))) : null;
  const base = old ? { ...store.docs.get("b_" + old.id) } : { kind: "box", id: (id = uid()), createdAt: Date.now() };
  if (look !== "plastic") delete base.color;
  put("b_" + (old ? old.id : id), { ...base, ...rec });
  closeSheet();
  toast(old ? "Box saved." : "Box added.", old ? { label: "Undo", fn: () => put("b_" + before.id, before) } : undefined);
  if (!old) go("box-" + id);
}
function missingWheat() {
  const have = new Set(ownedCoins().filter((c) => c.boxId && getBox(c.boxId) && c.typeId === "lincoln-wheat").map((c) => num(c.year) + "|" + normMint(c.mint)));
  const seen = new Set(), all = [];
  buildSlots("lincoln-wheat", 1909, 1958).forEach((s) => { const k = s.y + "|" + s.m; if (!seen.has(k)) { seen.add(k); all.push(s); } });
  return { total: all.length, missing: all.filter((s) => !have.has(s.y + "|" + s.m)) };
}
Object.assign(actions, {
  boxNew: () => boxForm(null),
  boxEdit: (el) => { const b = getBox(el.dataset.id); if (b) boxForm(b); },
  boxAdd: (el) => {
    openCoinForm(null);
    Object.assign(draft, { _what: "us", boxId: el.dataset.box, boxRow: el.dataset.row || "", boxSlot: el.dataset.slot || "" });
    renderCoinForm();
  },
  boxDelete: (el) => {
    const b = getBox(el.dataset.id);
    if (!b) return;
    const n = boxCoins(b).length;
    confirmSheet("Delete " + b.name + "?", n ? "Its " + n + " item" + (n > 1 ? "s stay" : " stays") + " in your collection. They just leave the box." : "This box is empty.", "Delete box", () => {
      const coins = boxCoins(b).map((c) => JSON.parse(JSON.stringify(c)));
      const box = JSON.parse(JSON.stringify(b));
      coins.forEach((c) => { const x = { ...c }; delete x.boxId; delete x.boxRow; delete x.boxSlot; put("c_" + c.id, x); });
      remove("b_" + b.id);
      go("boxes");
      toast("Box deleted.", { label: "Undo", fn: () => { put("b_" + box.id, box); coins.forEach((c) => put("c_" + c.id, c)); toast("Restored."); } });
    });
  },
  boxMissing: () => {
    const m = missingWheat();
    const list = m.missing.map((s) => s.y + "-" + (s.m || "P"));
    openSheet(`<div class="sheet-head"><h2>Lincoln wheat dates missing</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p>${m.total - m.missing.length} of ${m.total} dates are in your boxes. ${list.length ? list.length + " missing:" : "You have them all."}</p>
      ${list.length ? `<p style="line-height:1.7">${list.join(", ")}</p>` : ""}
      <div class="hint">Only coins kept in a box with numbered spots are counted. Varieties like the 1909 VDB don't count as a separate date.</div>`, "sheet-75");
  },
});
document.addEventListener("change", (e) => {
  const el = e.target, f = el.form;
  if (!f || f.id !== "boxForm") return;
  if (el.name === "look") $("#boxColorRow").hidden = el.value !== "plastic";
  if (el.name === "spots") $("#boxSpotRows").hidden = !el.checked;
  if (el.name === "type" && !f.dataset.id) { const sp = f.elements.spots; sp.checked = el.value === "storage"; $("#boxSpotRows").hidden = !sp.checked; }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "boxForm") saveBoxForm(e.target);
  else if (e.target.id === "boxFind") { boxFind.q = ($("#boxQ") || {}).value || ""; render(); }
});
