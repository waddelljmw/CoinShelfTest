/* Steps 2.8 and 4.3: storage boxes and display boxes.
   A box is a record { kind: "box", id, name, rows, perRow, type, look, color, spots, inside }, saved under "b_<id>".
   type: "storage" | "display". look: "black" | "cardboard" | "plastic" (plastic has a color, "clear" included).
   spots: true = numbered rows and slots; false = just a list of what's inside. Old boxes read as storage, black, with spots.
   An item sits in a box with boxId (and boxRow, boxSlot when the box has numbered spots). */
function normBox(b) {
  if (b && b.kind === "box") {
    if (b.type !== "display") b.type = "storage";
    if (!["black", "cardboard", "plastic"].includes(b.look)) b.look = "black";
    if (b.look === "plastic" && !BOX_COLORS.some((x) => x[0] === b.color)) b.color = "clear";
    if (b.spots !== false) b.spots = true;
  }
  return b;
}
const hasSpots = (b) => !!b && b.spots !== false;
const getBox = (id) => normBox(store.docs.get("b_" + id));
const allBoxes = () => [...store.docs.values()].filter((d) => d.kind === "box").map(normBox).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const storageBoxes = () => allBoxes().filter((b) => b.type !== "display");
const displayBoxes = () => allBoxes().filter((b) => b.type === "display");
const boxCoins = (b) => ownedCoins().filter((c) => c.boxId === b.id);
const boxFind = { q: "" };
const spotCoin = (boxId, row, slot, exceptId) => ownedCoins().find((c) => c.boxId === boxId && +c.boxRow === +row && +c.boxSlot === +slot && c.id !== exceptId);
function nextFreeSpot(b, exceptId) {
  if (!hasSpots(b)) return null;
  for (let r = 1; r <= b.rows; r++) for (let s = 1; s <= b.perRow; s++) if (!spotCoin(b.id, r, s, exceptId)) return { row: r, slot: s };
  return null;
}
function boxText(c) {
  const b = c.boxId && getBox(c.boxId);
  if (!b) return "";
  return hasSpots(b) && c.boxRow && c.boxSlot ? b.name + " · Row " + c.boxRow + " · Slot " + c.boxSlot : b.name;
}
const slotDate = (c) => (c.year ? String(c.year) + (c.mint ? "-" + c.mint : "") : (c.label || "Coin").slice(0, 8));

// --- in the coin form (Holder section): the "Kept in" dropdown, and a row/slot when the box has numbered spots ---
// One place per item: picking one clears the others. Old items that already have two keep both until edited.
function keptValue(d) {
  if (d.albumId === "__new") return "__new";
  if (d.albumId && itemOf(d) === "coin" && getAlbum(d.albumId)) return "a:" + d.albumId;
  if (d.boxId && getBox(d.boxId)) return "b:" + d.boxId;
  if (itemOf(d) !== "bullion" && String(d.stack || "").trim()) return "s:" + String(d.stack).trim();
  if (d._newStack) return "s:__new";
  return "";
}
function applyKept(d, v) {
  const was = keptValue(d);
  if (v === was) return;
  if (itemOf(d) !== "bullion") d.stack = ""; // bullion always belongs to a stack
  if (d.albumId) delete d.slotId;
  delete d._newStack;
  d.albumId = ""; d.boxId = ""; d.boxRow = ""; d.boxSlot = ""; delete d._boxFor;
  if (v === "__new") d.albumId = "__new";
  else if (v.startsWith("a:")) d.albumId = v.slice(2);
  else if (v.startsWith("b:")) d.boxId = v.slice(2);
  else if (v === "s:__new") d._newStack = true; // typed in the box below
  else if (v.startsWith("s:")) d.stack = v.slice(2);
}
function keptInFields(d) {
  const it = itemOf(d), cur = keptValue(d);
  const opt = (v, label) => `<option value="${esc(v)}" ${cur === v ? "selected" : ""}>${esc(label)}</option>`;
  const albumOpts = it === "coin" ? albumsForCoin(d).map((a) => opt("a:" + a.id, "Album: " + albumTitle(a))).join("") + opt("__new", "+ New album…") : "";
  const sb = storageBoxes().map((x) => opt("b:" + x.id, "Storage box: " + x.name)).join("");
  const db = displayBoxes().map((x) => opt("b:" + x.id, "Display box: " + x.name)).join("");
  const canStack = it === "coin" && isJunk(d) && d.metal === "Silver";
  const names = [...new Set([...stackNames(), String(d.stack || "").trim()].filter(Boolean))];
  const stacks = canStack ? names.map((x) => opt("s:" + x, "Stack: " + x)).join("") + opt("s:__new", "+ New stack…") : "";
  return `<label class="f"><span>Kept in</span><select data-kept data-rerender><option value="">Nothing special</option>${albumOpts}${sb}${db}${stacks}</select></label>
    ${canStack && d._newStack ? `<label class="f"><span>New stack name</span><input type="text" data-f="stack" value="${esc(d.stack || "")}" placeholder="e.g. Junk silver stack"></label>` : ""}
    ${!allBoxes().length ? `<div class="hint">Want to say which box this is in? Add one on the <b>Storage</b> page first.</div>` : ""}`;
}
function boxFields(d) {
  const b = d.boxId && getBox(d.boxId);
  if (!b || !hasSpots(b)) return "";
  if (d._boxFor === undefined) d._boxFor = d.boxId; else if (d._boxFor !== d.boxId) { d._boxFor = d.boxId; d.boxRow = ""; d.boxSlot = ""; } // a different box starts with a fresh spot
  if (!d.boxRow && !d.boxSlot) { const n = nextFreeSpot(b, d.id); if (n) { d.boxRow = String(n.row); d.boxSlot = String(n.slot); } } // suggests the next empty spot
  return `<div class="grid2"><label class="f"><span>Row (1–${b.rows})</span><input type="number" inputmode="numeric" min="1" max="${b.rows}" data-f="boxRow" value="${esc(d.boxRow || "")}"></label>
    <label class="f"><span>Slot (1–${b.perRow})</span><input type="number" inputmode="numeric" min="1" max="${b.perRow}" data-f="boxSlot" value="${esc(d.boxSlot || "")}"></label></div>
    <div class="hint">The next empty spot is filled in for you. Change it if this goes elsewhere.</div>`;
}
// Called when an item is saved: tidies the box fields, and returns a message if the spot can't be used.
function boxCheck(c) {
  delete c._boxFor;
  const b = c.boxId && getBox(c.boxId);
  if (!b) { delete c.boxId; delete c.boxRow; delete c.boxSlot; return ""; }
  if (!hasSpots(b)) { delete c.boxRow; delete c.boxSlot; return ""; }
  const r = Math.round(+c.boxRow), s = Math.round(+c.boxSlot);
  if (!(r >= 1 && r <= b.rows) || !(s >= 1 && s <= b.perRow)) return "Pick a row from 1 to " + b.rows + " and a slot from 1 to " + b.perRow + ", or choose Nothing special.";
  const other = spotCoin(b.id, r, s, c.id);
  if (other) return "Row " + r + ", slot " + s + " already holds " + labelOf(other) + ". Pick another spot.";
  c.boxRow = String(r); c.boxSlot = String(s);
  return "";
}

// A coin coming back (Undo, Restore, Move back) whose box spot was filled meanwhile leaves the box. Returns a note for the toast.
function freeSpotOnReturn(c) {
  if (!c.boxId || !hasSpots(getBox(c.boxId)) || !c.boxRow) return "";
  const other = spotCoin(c.boxId, c.boxRow, c.boxSlot, c.id);
  if (!other) return "";
  const where = boxText(c);
  delete c.boxId; delete c.boxRow; delete c.boxSlot;
  return " Its box spot (" + where + ") now holds " + labelOf(other) + ", so it's set to Nothing special.";
}

// --- pages ---
const boxStats = (b) => { const n = boxCoins(b).length; return { filled: n, total: hasSpots(b) ? b.rows * b.perRow : n }; };
const boxLookText = (b) => (b.look === "plastic" ? (b.color === "clear" ? "Clear plastic" : "Plastic · " + b.color) : b.look === "cardboard" ? "Cardboard" : "Black");
function boxCard(b) {
  const st = boxStats(b);
  return `<button class="card" style="display:block;width:100%;text-align:left" data-go="box-${esc(b.id)}">
    <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(b.name)}</b><span class="num">${hasSpots(b) ? st.filled + "/" + st.total : st.filled + " item" + (st.filled === 1 ? "" : "s")}</span></div>
    <div class="small muted">${hasSpots(b) ? b.rows + " rows of " + b.perRow + " slots · " : ""}${esc(boxLookText(b))}</div>${hasSpots(b) ? `<div class="bar"><i style="width:${st.total ? (st.filled / st.total) * 100 : 0}%"></i></div>` : ""}</button>`;
}
function viewBoxes() {
  const bs = allBoxes(), sb = storageBoxes(), db = displayBoxes();
  const q = boxFind.q.trim();
  const nq = q.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hits = nq ? ownedCoins().filter((c) => c.boxId && getBox(c.boxId) && labelOf(c).toLowerCase().replace(/[^a-z0-9]/g, "").includes(nq)) : [];
  return `<h1>Storage</h1>
    <div class="small muted" style="margin-bottom:10px">Your storage boxes and display boxes. Boxes with numbered spots give each item a row and slot; the others just list what's inside.</div>
    <button class="btn primary block" data-act="boxNew">+ New box</button>
    ${bs.length ? `<form id="boxFind" style="margin-top:12px"><div class="grid2" style="grid-template-columns:1fr auto"><input type="search" id="boxQ" value="${esc(boxFind.q)}" placeholder="Find a coin, e.g. 1909-S" aria-label="Find a coin in your boxes"><button class="btn" type="submit">Find</button></div></form>` : ""}
    ${q ? `<div class="card" style="margin-top:10px"><b>${hits.length} found for "${esc(q)}"</b>${hits.slice(0, 30).map((c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(boxText(c))}</span></span></button>`).join("") || `<div class="small muted">Nothing in your boxes matches. Only items placed in a box are searched.</div>`}</div>` : ""}
    <div style="margin-top:12px">${bs.length ? (sb.length ? `<h2 style="margin:6px 0">Storage boxes</h2>${sb.map(boxCard).join("")}` : "") + (db.length ? `<h2 style="margin:10px 0 6px">Display boxes</h2>${db.map(boxCard).join("")}` : "")
      : `<div class="card empty">No boxes yet. Tap <b>+ New box</b>, name it (like "Black box 1") and choose storage or display.</div>`}</div>
    ${storageBoxes().some(hasSpots) ? `<button class="btn block" data-act="boxMissing">Which Lincoln wheat dates am I missing?</button>` : ""}`;
}
function viewBox(r) {
  const b = getBox(r.id);
  if (!b) return `<div class="card empty">That box isn't here. <button class="link-btn" data-go="boxes">Back to Storage</button></div>`;
  const st = boxStats(b), inBox = boxCoins(b);
  const itemRow = (c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(holderText(c) || "")}</span></span></button>`;
  let body;
  if (hasSpots(b)) {
    const rowsHtml = Array.from({ length: b.rows }, (_, i) => {
      const row = i + 1;
      const cells = Array.from({ length: b.perRow }, (_, j) => {
        const slot = j + 1, c = spotCoin(b.id, row, slot);
        return c ? `<button class="slot full" data-go="coin-${esc(c.id)}" title="${esc(labelOf(c))}"><span class="sn">${slot}</span>${esc(slotDate(c))}</button>`
          : `<button class="slot" data-act="boxAdd" data-box="${esc(b.id)}" data-row="${row}" data-slot="${slot}" aria-label="Add a coin to row ${row}, slot ${slot}"><span class="sn">${slot}</span>+</button>`;
      }).join("");
      return `<h2 style="margin:14px 0 6px">Row ${row} <span class="muted small">· ${inBox.filter((c) => +c.boxRow === row).length}/${b.perRow}</span></h2><div class="slots">${cells}</div>`;
    }).join("");
    const loose = inBox.filter((c) => !spotCoin(b.id, c.boxRow, c.boxSlot) || spotCoin(b.id, c.boxRow, c.boxSlot).id !== c.id);
    body = rowsHtml + (loose.length ? `<h2 style="margin:14px 0 6px">No numbered spot</h2><div class="card">${loose.map(itemRow).join("")}</div>` : "");
  } else {
    body = `<div class="card">${inBox.length ? inBox.map(itemRow).join("") : `<div class="small muted">Nothing here yet. When you add a coin, pick <b>Kept in</b> and choose this box.</div>`}</div>
      <button class="btn block" style="margin-top:8px" data-act="boxAdd" data-box="${esc(b.id)}">+ Add a coin to this box</button>`;
  }
  return `<button class="link-btn" data-go="boxes">← Storage</button>
    <h1 style="margin-top:10px">${esc(b.name)}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${b.type === "display" ? "Display box" : "Storage box"} · ${esc(boxLookText(b))} · ${hasSpots(b) ? st.filled + " of " + st.total + " slots filled · " + b.rows + " rows of " + b.perRow : st.filled + " item" + (st.filled === 1 ? "" : "s")}</div>
    ${b.inside ? `<div class="card"><div class="muted small">What's inside</div><div style="white-space:pre-wrap">${esc(b.inside)}</div></div>` : ""}
    ${body}
    <div class="btn-row"><button class="btn" data-act="boxEdit" data-id="${esc(b.id)}">Edit box</button><button class="btn danger" data-act="boxDelete" data-id="${esc(b.id)}">Delete box</button></div>`;
}
function boxForm(b) {
  const cur = b ? b : { type: "storage", look: "black", color: "clear", spots: true };
  openSheet(`<div class="sheet-head"><h2>${b ? "Edit box" : "New box"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="boxForm" data-id="${b ? esc(b.id) : ""}" autocomplete="off">
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(b ? b.name : "")}" placeholder="e.g. Black box 1" maxlength="40" required></label>
    <div class="grid2"><label class="f"><span>Kind</span><select name="type"><option value="storage" ${cur.type === "storage" ? "selected" : ""}>Storage box</option><option value="display" ${cur.type === "display" ? "selected" : ""}>Display box</option></select></label>
    <label class="f"><span>Look</span><select name="look" id="boxLook"><option value="black" ${cur.look === "black" ? "selected" : ""}>Black box</option><option value="cardboard" ${cur.look === "cardboard" ? "selected" : ""}>Cardboard box</option><option value="plastic" ${cur.look === "plastic" ? "selected" : ""}>Plastic container</option></select></label></div>
    <label class="f"><span>Plastic color <span class="muted small">(plastic only)</span></span><select name="color">${BOX_COLORS.map((x) => `<option value="${x[0]}" ${cur.color === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>
    <label class="switch"><span>Numbered spots<div class="small muted">Rows and slots, one per coin. Turn off to just list what's inside.</div></span><input type="checkbox" name="spots" id="boxSpots" ${cur.spots !== false ? "checked" : ""}></label>
    <div class="grid2" id="boxGrid"><label class="f"><span>Rows</span><input type="number" inputmode="numeric" name="rows" min="1" max="50" value="${b && hasSpots(b) ? b.rows : ""}" placeholder="e.g. 5"></label>
    <label class="f"><span>Slots per row</span><input type="number" inputmode="numeric" name="perRow" min="1" max="100" value="${b && hasSpots(b) ? b.perRow : ""}" placeholder="e.g. 20"></label></div>
    <label class="f"><span>What's inside <span class="muted small">(optional)</span></span><textarea name="inside" rows="3" maxlength="500" placeholder="e.g. ziplock of Bicentennial quarters, pill bottle of halves">${esc(b ? b.inside || "" : "")}</textarea></label>
    <div class="btn-row"><button type="submit" class="btn primary">${b ? "Save" : "Add box"}</button><button type="button" class="btn" data-act="closeSheet">Cancel</button></div></form>`, "sheet-75");
}
function saveBoxForm(form) {
  const f = new FormData(form); let id = form.dataset.id;
  const name = String(f.get("name") || "").trim();
  const spots = f.get("spots") === "on";
  const rows = spots ? Math.round(+f.get("rows")) : 0, perRow = spots ? Math.round(+f.get("perRow")) : 0;
  if (!name || (spots && (!(rows >= 1 && rows <= 50) || !(perRow >= 1 && perRow <= 100)))) { toast(spots ? "Add a name, 1–50 rows and 1–100 slots per row." : "Add a name."); return; }
  const old = id && getBox(id);
  const before = old ? JSON.parse(JSON.stringify(old)) : null;
  let coinsBefore = [];
  if (old && spots) {
    const stuck = boxCoins(old).filter((c) => +c.boxRow > rows || +c.boxSlot > perRow);
    if (stuck.length) { toast("That box would be too small. " + stuck.length + " item" + (stuck.length > 1 ? "s sit" : " sits") + " beyond row " + rows + " / slot " + perRow + ". Move " + (stuck.length > 1 ? "them" : "it") + " first."); return; }
  }
  if (old && !spots && hasSpots(old)) { // turning numbered spots off: items stay in the box and just lose their row and slot (Undo brings them back)
    coinsBefore = boxCoins(old).map((c) => JSON.parse(JSON.stringify(c)));
    coinsBefore.forEach((c) => { const x = { ...c }; delete x.boxRow; delete x.boxSlot; put("c_" + c.id, x); });
  }
  if (!old) id = uid();
  const look = ["black", "cardboard", "plastic"].includes(f.get("look")) ? f.get("look") : "black";
  const rec = { ...(old || { kind: "box", id, createdAt: Date.now() }), name, rows, perRow, type: f.get("type") === "display" ? "display" : "storage", look, spots, inside: String(f.get("inside") || "").trim() };
  if (look === "plastic") rec.color = BOX_COLORS.some((x) => x[0] === f.get("color")) ? f.get("color") : "clear"; else delete rec.color;
  if (!rec.inside) delete rec.inside;
  put("b_" + rec.id, rec);
  closeSheet();
  toast(old ? "Box saved." : "Box added.", old ? { label: "Undo", fn: () => { put("b_" + before.id, before); coinsBefore.forEach((c) => put("c_" + c.id, c)); } } : undefined);
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
    Object.assign(draft, { _what: "us", holder: "2x2 cardboard flip", boxId: el.dataset.box, boxRow: el.dataset.row || "", boxSlot: el.dataset.slot || "" });
    renderCoinForm();
  },
  boxDelete: (el) => {
    const b = getBox(el.dataset.id);
    if (!b) return;
    const n = boxCoins(b).length;
    confirmSheet("Delete " + b.name + "?", n ? "Its " + n + " item" + (n > 1 ? "s stay" : " stays") + " in your collection. They just lose their box." : "This box is empty.", "Delete box", () => {
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
      <div class="hint">Only coins placed in a box are counted. Varieties like the 1909 VDB don't count as a separate date.</div>`, "sheet-75");
  },
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "boxForm") saveBoxForm(e.target);
  else if (e.target.id === "boxFind") { boxFind.q = ($("#boxQ") || {}).value || ""; render(); }
});
