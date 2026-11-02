/* Step 2.8: the wheat penny box organizer.
   A box is a record { kind: "box", id, name, rows, perRow }, saved under "b_<id>".
   A coin sits in a box with three fields: boxId, boxRow, boxSlot (only for coins held in a 2x2). */
const getBox = (id) => store.docs.get("b_" + id);
const allBoxes = () => [...store.docs.values()].filter((d) => d.kind === "box").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const boxCoins = (b) => ownedCoins().filter((c) => c.boxId === b.id);
const boxFind = { q: "" };
const spotCoin = (boxId, row, slot, exceptId) => ownedCoins().find((c) => c.boxId === boxId && +c.boxRow === +row && +c.boxSlot === +slot && c.id !== exceptId);
function nextFreeSpot(b, exceptId) {
  for (let r = 1; r <= b.rows; r++) for (let s = 1; s <= b.perRow; s++) if (!spotCoin(b.id, r, s, exceptId)) return { row: r, slot: s };
  return null;
}
function boxText(c) {
  const b = c.boxId && getBox(c.boxId);
  return b && c.boxRow && c.boxSlot ? b.name + " · Row " + c.boxRow + " · Slot " + c.boxSlot : "";
}
const slotDate = (c) => (c.year ? String(c.year) + (c.mint ? "-" + c.mint : "") : (c.label || "Coin").slice(0, 8));

// --- in the coin form (Holder section, when the holder is a 2x2) ---
function boxFields(d) {
  if (itemOf(d) !== "coin" || formHolder(d) !== "2x2") return "";
  const bs = allBoxes();
  if (!bs.length) return `<div class="hint">Want to track which storage box this 2x2 is in? Make one on the <b>2x2 Storage Boxes</b> page first.</div>`;
  if (d._boxFor === undefined) d._boxFor = d.boxId; else if (d._boxFor !== d.boxId) { d._boxFor = d.boxId; d.boxRow = ""; d.boxSlot = ""; } // a different box starts with a fresh spot
  const b = d.boxId && getBox(d.boxId);
  if (b && !d.boxRow && !d.boxSlot) { const n = nextFreeSpot(b, d.id); if (n) { d.boxRow = String(n.row); d.boxSlot = String(n.slot); } } // suggests the next empty spot
  return `<label class="f"><span>2x2 storage box <span class="muted small">(optional)</span></span><select data-f="boxId" data-rerender><option value="">Not in a box</option>${bs.map((x) => `<option value="${esc(x.id)}" ${d.boxId === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
    ${b ? `<div class="grid2"><label class="f"><span>Row (1–${b.rows})</span><input type="number" inputmode="numeric" min="1" max="${b.rows}" data-f="boxRow" value="${esc(d.boxRow || "")}"></label>
    <label class="f"><span>Slot (1–${b.perRow})</span><input type="number" inputmode="numeric" min="1" max="${b.perRow}" data-f="boxSlot" value="${esc(d.boxSlot || "")}"></label></div>
    <div class="hint">The next empty spot is filled in for you. Change it if this coin goes elsewhere.</div>` : ""}`;
}
// Called when a coin is saved: tidies the box fields, and returns a message if the spot can't be used.
function boxCheck(c) {
  delete c._boxFor;
  const b = itemOf(c) === "coin" && c.holder === "2x2" && c.boxId && getBox(c.boxId);
  if (!b) { delete c.boxId; delete c.boxRow; delete c.boxSlot; return ""; }
  const r = Math.round(+c.boxRow), s = Math.round(+c.boxSlot);
  if (!(r >= 1 && r <= b.rows) || !(s >= 1 && s <= b.perRow)) return "Pick a row from 1 to " + b.rows + " and a slot from 1 to " + b.perRow + ", or choose Not in a box.";
  const other = spotCoin(b.id, r, s, c.id);
  if (other) return "Row " + r + ", slot " + s + " already holds " + labelOf(other) + ". Pick another spot.";
  c.boxRow = String(r); c.boxSlot = String(s);
  return "";
}

// A coin coming back (Undo, Restore, Move back) whose box spot was filled meanwhile leaves the box. Returns a note for the toast.
function freeSpotOnReturn(c) {
  if (!c.boxId || !getBox(c.boxId)) return "";
  const other = spotCoin(c.boxId, c.boxRow, c.boxSlot, c.id);
  if (!other) return "";
  const where = boxText(c);
  delete c.boxId; delete c.boxRow; delete c.boxSlot;
  return " Its box spot (" + where + ") now holds " + labelOf(other) + ", so it's set to Not in a box.";
}

// --- pages ---
const boxStats = (b) => { const n = boxCoins(b).length; return { filled: n, total: b.rows * b.perRow }; };
function viewBoxes() {
  const bs = allBoxes();
  const q = boxFind.q.trim();
  const nq = q.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hits = nq ? ownedCoins().filter((c) => c.boxId && getBox(c.boxId) && labelOf(c).toLowerCase().replace(/[^a-z0-9]/g, "").includes(nq)) : [];
  return `<h1>2x2 Storage Boxes</h1>
    <div class="small muted" style="margin-bottom:10px">Storage boxes that hold coins in 2x2 holders. Each coin gets a row and slot.</div>
    <button class="btn primary block" data-act="boxNew">+ New 2x2 storage box</button>
    ${bs.length ? `<form id="boxFind" style="margin-top:12px"><div class="grid2" style="grid-template-columns:1fr auto"><input type="search" id="boxQ" value="${esc(boxFind.q)}" placeholder="Find a coin, e.g. 1909-S" aria-label="Find a coin in your storage boxes"><button class="btn" type="submit">Find</button></div></form>` : ""}
    ${q ? `<div class="card" style="margin-top:10px"><b>${hits.length} found for "${esc(q)}"</b>${hits.slice(0, 30).map((c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(boxText(c))}</span></span></button>`).join("") || `<div class="small muted">Nothing in your storage boxes matches. Only coins placed in a box are searched.</div>`}</div>` : ""}
    <div style="margin-top:12px">${bs.length ? bs.map((b) => { const st = boxStats(b); return `<button class="card" style="display:block;width:100%;text-align:left" data-go="box-${esc(b.id)}">
        <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(b.name)}</b><span class="num">${st.filled}/${st.total}</span></div>
        <div class="small muted">${b.rows} rows of ${b.perRow} slots</div><div class="bar"><i style="width:${st.total ? (st.filled / st.total) * 100 : 0}%"></i></div></button>`; }).join("")
      : `<div class="card empty">No 2x2 storage boxes yet. Tap <b>+ New 2x2 storage box</b>, name it (like "Black box 1") and say how many rows and slots it has.</div>`}</div>
    ${bs.length ? `<button class="btn block" data-act="boxMissing">Which Lincoln wheat dates am I missing?</button>` : ""}`;
}
function viewBox(r) {
  const b = getBox(r.id);
  if (!b) return `<div class="card empty">That storage box isn't here. <button class="link-btn" data-go="boxes">Back to 2x2 Storage Boxes</button></div>`;
  const st = boxStats(b);
  const rowsHtml = Array.from({ length: b.rows }, (_, i) => {
    const row = i + 1;
    const cells = Array.from({ length: b.perRow }, (_, j) => {
      const slot = j + 1, c = spotCoin(b.id, row, slot);
      return c ? `<button class="slot full" data-go="coin-${esc(c.id)}" title="${esc(labelOf(c))}"><span class="sn">${slot}</span>${esc(slotDate(c))}</button>`
        : `<button class="slot" data-act="boxAdd" data-box="${esc(b.id)}" data-row="${row}" data-slot="${slot}" aria-label="Add a coin to row ${row}, slot ${slot}"><span class="sn">${slot}</span>+</button>`;
    }).join("");
    return `<h2 style="margin:14px 0 6px">Row ${row} <span class="muted small">· ${boxCoins(b).filter((c) => +c.boxRow === row).length}/${b.perRow}</span></h2><div class="slots">${cells}</div>`;
  }).join("");
  return `<button class="link-btn" data-go="boxes">← 2x2 Storage Boxes</button>
    <h1 style="margin-top:10px">${esc(b.name)}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${st.filled} of ${st.total} slots filled · ${b.rows} rows of ${b.perRow}</div>
    ${rowsHtml}
    <div class="btn-row"><button class="btn" data-act="boxEdit" data-id="${esc(b.id)}">Edit storage box</button><button class="btn danger" data-act="boxDelete" data-id="${esc(b.id)}">Delete storage box</button></div>`;
}
function boxForm(b) {
  openSheet(`<div class="sheet-head"><h2>${b ? "Edit 2x2 storage box" : "New 2x2 storage box"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="boxForm" data-id="${b ? esc(b.id) : ""}" autocomplete="off">
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(b ? b.name : "")}" placeholder="e.g. Black box 1" maxlength="40" required></label>
    <div class="grid2"><label class="f"><span>Rows</span><input type="number" inputmode="numeric" name="rows" min="1" max="50" value="${b ? b.rows : ""}" placeholder="e.g. 5" required></label>
    <label class="f"><span>Slots per row</span><input type="number" inputmode="numeric" name="perRow" min="1" max="100" value="${b ? b.perRow : ""}" placeholder="e.g. 20" required></label></div>
    <div class="hint">Each slot holds one 2x2.</div>
    <div class="btn-row"><button type="submit" class="btn primary">${b ? "Save" : "Add storage box"}</button><button type="button" class="btn" data-act="closeSheet">Cancel</button></div></form>`, "sheet-75");
}
function saveBoxForm(form) {
  const f = new FormData(form); let id = form.dataset.id;
  const name = String(f.get("name") || "").trim(), rows = Math.round(+f.get("rows")), perRow = Math.round(+f.get("perRow"));
  if (!name || !(rows >= 1 && rows <= 50) || !(perRow >= 1 && perRow <= 100)) { toast("Add a name, 1–50 rows and 1–100 slots per row."); return; }
  const old = id && getBox(id);
  if (old) {
    const stuck = boxCoins(old).filter((c) => +c.boxRow > rows || +c.boxSlot > perRow);
    if (stuck.length) { toast("That storage box would be too small. " + stuck.length + " coin" + (stuck.length > 1 ? "s sit" : " sits") + " beyond row " + rows + " / slot " + perRow + ". Move " + (stuck.length > 1 ? "them" : "it") + " first."); return; }
  }
  const before = old ? JSON.parse(JSON.stringify(old)) : null;
  put("b_" + (old ? old.id : (id = uid())), { ...(old || { kind: "box", id, createdAt: Date.now() }), name, rows, perRow });
  closeSheet();
  toast(old ? "Storage box saved." : "Storage box added.", old ? { label: "Undo", fn: () => put("b_" + before.id, before) } : undefined);
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
    Object.assign(draft, { _what: "us", holder: "2x2", boxId: el.dataset.box, boxRow: el.dataset.row, boxSlot: el.dataset.slot });
    renderCoinForm();
  },
  boxDelete: (el) => {
    const b = getBox(el.dataset.id);
    if (!b) return;
    const n = boxCoins(b).length;
    confirmSheet("Delete " + b.name + "?", n ? "Its " + n + " coin" + (n > 1 ? "s stay" : " stays") + " in your collection. They just lose their row and slot." : "This storage box is empty.", "Delete storage box", () => {
      const coins = boxCoins(b).map((c) => JSON.parse(JSON.stringify(c)));
      const box = JSON.parse(JSON.stringify(b));
      coins.forEach((c) => { const x = { ...c }; delete x.boxId; delete x.boxRow; delete x.boxSlot; put("c_" + c.id, x); });
      remove("b_" + b.id);
      go("boxes");
      toast("Storage box deleted.", { label: "Undo", fn: () => { put("b_" + box.id, box); coins.forEach((c) => put("c_" + c.id, c)); toast("Restored."); } });
    });
  },
  boxMissing: () => {
    const m = missingWheat();
    const list = m.missing.map((s) => s.y + "-" + (s.m || "P"));
    openSheet(`<div class="sheet-head"><h2>Lincoln wheat dates missing</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p>${m.total - m.missing.length} of ${m.total} dates are in your boxes. ${list.length ? list.length + " missing:" : "You have them all."}</p>
      ${list.length ? `<p style="line-height:1.7">${list.join(", ")}</p>` : ""}
      <div class="hint">Only coins placed in a storage box are counted. Varieties like the 1909 VDB don't count as a separate date.</div>`, "sheet-75");
  },
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "boxForm") saveBoxForm(e.target);
  else if (e.target.id === "boxFind") { boxFind.q = ($("#boxQ") || {}).value || ""; render(); }
});
