/* Steps 2.8 and 4.3: storage boxes and display boxes.
   A box is a record { kind: "box", id, name, rows, perRow, type, look, color, spots, inside }, saved under "b_<id>".
   type: "storage" | "display". look: "black" | "cardboard" | "plastic" | "wood" (plastic has a color, "clear" included).
   spots: true = numbered rows and slots; false = just a list of what's inside. Old boxes read as storage, black, with spots.
   An item sits in a box with boxId (and boxRow, boxSlot when the box has numbered spots). */
function normBox(b) {
  if (b && b.kind === "box") {
    if (b.type !== "display" && b.type !== "dealer") b.type = "storage";
    if (b.type === "dealer") b.forSale = b.forSale !== false; else delete b.forSale;
    if (!["black", "cardboard", "plastic", "wood"].includes(b.look)) b.look = "black";
    if (b.look === "plastic" && !BOX_COLORS.some((x) => x[0] === b.color)) b.color = "clear";
    if (b.spots !== false) b.spots = true;
    // Trays (Step 9.6b): b.trays = [{ rows, perRow }, ...]. rows/perRow always mirror tray 1, so old readers keep working.
    if (Array.isArray(b.trays) && b.trays.length > 1 && b.spots && b.type !== "dealer") {
      b.trays = b.trays.slice(0, 12).map((t) => ({ rows: Math.max(1, Math.round(+t.rows) || 1), perRow: Math.max(1, Math.round(+t.perRow) || 1) }));
      b.rows = b.trays[0].rows; b.perRow = b.trays[0].perRow;
    } else delete b.trays;
  }
  return b;
}
const hasSpots = (b) => !!b && b.spots !== false;
// A box without trays reads as one tray with its old layout; a coin without boxTray is in tray 1.
const trayList = (b) => (b && b.trays && b.trays.length > 1 ? b.trays : [{ rows: b ? b.rows : 0, perRow: b ? b.perRow : 0 }]);
const trayCount = (b) => trayList(b).length;
const trayNo = (c) => Math.max(1, Math.round(+c.boxTray) || 1);
const trayOf = (b, t) => trayList(b)[Math.max(1, Math.round(+t) || 1) - 1] || trayList(b)[0];
// Does this tray/row/slot still exist in the box? (a box can shrink while a coin is sold, deleted or in a dealer case)
const spotExists = (b, t, r, s) => { const n = Math.round(+t) || 1, L = trayList(b)[n - 1]; return !!L && n <= trayCount(b) && +r >= 1 && +r <= L.rows && +s >= 1 && +s <= L.perRow; };
const totalSlots = (b) => trayList(b).reduce((n, t) => n + t.rows * t.perRow, 0);
// Spots can run in rows (default) or in columns ("cols": true). Saved items keep boxRow = the row or column number, boxSlot = the spot in it.
const lineWord = (b) => (b && b.cols ? "Column" : "Row");
const getBox = (id) => normBox(store.docs.get("b_" + id));
const allBoxes = () => [...store.docs.values()].filter((d) => d.kind === "box").map(normBox).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const storageBoxes = () => allBoxes().filter((b) => b.type !== "display" && b.type !== "dealer");
const displayBoxes = () => allBoxes().filter((b) => b.type === "display");
const boxCoins = (b) => ownedCoins().filter((c) => c.boxId === b.id);
const boxFind = { q: "" };
const boxTab = {}; // which tray tab is open on each box page (not saved)
const spotCoin = (boxId, row, slot, exceptId, tray) => ownedCoins().find((c) => c.boxId === boxId && +c.boxRow === +row && +c.boxSlot === +slot && trayNo(c) === (Math.round(+tray) || 1) && c.id !== exceptId);
// Next empty spot, starting in tray `from` (default 1) and moving down through the later trays.
function nextFreeSpot(b, exceptId, from) {
  if (!hasSpots(b)) return null;
  for (let t = Math.max(1, Math.round(+from) || 1); t <= trayCount(b); t++) { const L = trayOf(b, t);
    for (let r = 1; r <= L.rows; r++) for (let s = 1; s <= L.perRow; s++) if (!spotCoin(b.id, r, s, exceptId, t)) return { tray: t, row: r, slot: s }; }
  return null;
}
function boxText(c) {
  const b = c.boxId && getBox(c.boxId);
  if (!b) return "";
  return hasSpots(b) && c.boxRow && c.boxSlot ? b.name + (trayCount(b) > 1 ? " · Tray " + trayNo(c) : "") + " · " + lineWord(b) + " " + c.boxRow + " · Slot " + c.boxSlot : b.name;
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
  d.albumId = ""; d.boxId = ""; d.boxRow = ""; d.boxSlot = ""; d.boxTray = ""; delete d._boxFor;
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
  const dl = (typeof dealerBoxes === "function" ? dealerBoxes() : []).filter((x) => sellerOn() || cur === "b:" + x.id).map((x) => opt("b:" + x.id, "Dealer case: " + x.name)).join("");
  const canStack = it === "coin" && isJunk(d) && d.metal === "Silver";
  const names = [...new Set([...stackNames(), String(d.stack || "").trim()].filter(Boolean))];
  const stacks = canStack ? names.map((x) => opt("s:" + x, "Stack: " + x)).join("") + opt("s:__new", "+ New stack…") : "";
  return `<label class="f"><span>Kept in ${typeof wi === "function" ? wi("keptin") : ""}</span><select data-kept data-rerender><option value="">Nothing special</option>${albumOpts}${sb}${db}${dl}${stacks}<option value="b:__add">+ Add storage…</option></select></label>
    ${canStack && d._newStack ? `<label class="f"><span>New stack name</span><input type="text" data-f="stack" value="${esc(d.stack || "")}" placeholder="e.g. Junk silver stack"></label>` : ""}
    ${!allBoxes().length ? `<div class="hint">Want to say which box this is in? Add one on the <b>Storage</b> page first.</div>` : ""}`;
}
// "Tray" dropdown, only for a box with more than one tray.
function trayPick(d, b) {
  const tn = trayCount(b);
  if (tn < 2) return "";
  return `<label class="f"><span>Tray (1–${tn})</span><select data-f="boxTray" data-rerender>${Array.from({ length: tn }, (_, i) => `<option value="${i + 1}" ${+d.boxTray === i + 1 ? "selected" : ""}>Tray ${i + 1}</option>`).join("")}</select></label>`;
}
function boxFields(d) {
  const b = d.boxId && getBox(d.boxId);
  if (!b || !hasSpots(b)) return "";
  if (typeof manyOn === "function" && manyOn(d)) return manySpots(d, b); // several coins: tap their spots
  if (d._boxFor === undefined) d._boxFor = d.boxId; else if (d._boxFor !== d.boxId) { d._boxFor = d.boxId; d.boxRow = ""; d.boxSlot = ""; d.boxTray = ""; delete d._spotAsk; } // a different box starts with a fresh spot
  const tn = trayCount(b);
  if (tn > 1 && !(+d.boxTray >= 1 && +d.boxTray <= tn)) d.boxTray = "1";
  const hasSpot = d.boxRow || d.boxSlot;
  if (!hasSpot && d._spotAsk !== "yes" && d._spotAsk !== "no") { // ask first: his coins sit in a real order, so he may want to pick the spot
    return `<div class="card" style="margin:8px 0"><b>Choose the spot yourself?</b>
      <div class="hint">Yes: you type the real row and slot. No: the next empty spot is filled in for you.</div>
      <div class="btn-row"><button class="btn" type="button" data-act="spotAsk" data-v="yes">Yes, I'll choose</button><button class="btn" type="button" data-act="spotAsk" data-v="no">No, fill it in</button></div></div>`;
  }
  if (!hasSpot && d._spotAsk === "no") { const n = nextFreeSpot(b, d.id, d.boxTray); if (n) { d.boxRow = String(n.row); d.boxSlot = String(n.slot); if (tn > 1) d.boxTray = String(n.tray); } } // suggests the next empty spot
  const L2 = trayOf(b, d.boxTray);
  return `${trayPick(d, b)}<div class="grid2"><label class="f"><span>${lineWord(b)} (1–${L2.rows})</span><input type="number" inputmode="numeric" min="1" max="${L2.rows}" data-f="boxRow" value="${esc(d.boxRow || "")}"></label>
    <label class="f"><span>Slot (1–${L2.perRow})</span><input type="number" inputmode="numeric" min="1" max="${L2.perRow}" data-f="boxSlot" value="${esc(d.boxSlot || "")}"></label></div>
    <div class="hint">${d._spotAsk === "yes" && !hasSpot ? "Type the row and slot where this really sits." : "Change the spot if this goes elsewhere."}</div>`;
}
// Called when an item is saved: tidies the box fields, and returns a message if the spot can't be used.
function boxCheck(c) {
  delete c._boxFor; delete c._spotAsk;
  const b = c.boxId && getBox(c.boxId);
  if (!b) { delete c.boxId; delete c.boxRow; delete c.boxSlot; delete c.boxTray; return ""; }
  if (typeof caseOn === "function" && caseOn(b) && isInherited(c) && c.status === "owned") return "Inherited coins can't go in a for-sale dealer case. Turn off \u201cFor sale case\u201d on the case, or pick another place.";
  if (!hasSpots(b)) { delete c.boxRow; delete c.boxSlot; delete c.boxTray; return ""; }
  const tn = trayCount(b), t = tn > 1 ? Math.round(+c.boxTray) || 1 : 1;
  if (t < 1 || t > tn) return "Pick a tray from 1 to " + tn + ", or choose Nothing special.";
  const L = trayOf(b, t), r = Math.round(+c.boxRow), s = Math.round(+c.boxSlot);
  if (!(r >= 1 && r <= L.rows) || !(s >= 1 && s <= L.perRow)) return "Pick a " + lineWord(b).toLowerCase() + " from 1 to " + L.rows + " and a slot from 1 to " + L.perRow + (tn > 1 ? " in tray " + t : "") + ", or choose Nothing special.";
  const other = spotCoin(b.id, r, s, c.id, t);
  if (other) return (tn > 1 ? "Tray " + t + ", " + lineWord(b).toLowerCase() : lineWord(b)) + " " + r + ", slot " + s + " already holds " + labelOf(other) + ". Pick another spot.";
  c.boxRow = String(r); c.boxSlot = String(s);
  if (tn > 1) c.boxTray = String(t); else delete c.boxTray;
  return "";
}

// A coin coming back (Undo, Restore, Move back) whose box spot was filled meanwhile leaves the box. Returns a note for the toast.
function freeSpotOnReturn(c) {
  if (!c.boxId || !hasSpots(getBox(c.boxId)) || !c.boxRow) return "";
  if (!spotExists(getBox(c.boxId), trayNo(c), c.boxRow, c.boxSlot)) { const where = boxText(c); delete c.boxRow; delete c.boxSlot; delete c.boxTray; return " Its box spot (" + where + ") no longer exists, so it's in the box with no numbered spot."; }
  const other = spotCoin(c.boxId, c.boxRow, c.boxSlot, c.id, trayNo(c));
  if (!other) return "";
  const where = boxText(c);
  delete c.boxId; delete c.boxRow; delete c.boxSlot; delete c.boxTray;
  return " Its box spot (" + where + ") now holds " + labelOf(other) + ", so it's set to Nothing special.";
}

// --- pages ---
const boxStats = (b) => { const n = boxCoins(b).length; return { filled: n, total: hasSpots(b) ? totalSlots(b) : n }; };
const boxKindText = (b) => (b.type === "dealer" ? "Dealer case" : b.type === "display" ? "Display box" : "Storage box");
const boxLookText = (b) => (b.look === "plastic" ? (b.color === "clear" ? "Clear plastic" : "Plastic · " + b.color) : b.look === "cardboard" ? "Cardboard" : b.look === "wood" ? "Wooden" : "Black");
function boxCard(b) {
  const st = boxStats(b);
  return `<button class="card" style="display:block;width:100%;text-align:left" data-go="box-${esc(b.id)}">
    <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(b.name)}</b><span class="num">${hasSpots(b) ? st.filled + "/" + st.total : st.filled + " item" + (st.filled === 1 ? "" : "s")}</span></div>
    <div class="small muted">${hasSpots(b) ? (trayCount(b) > 1 ? trayCount(b) + " trays · " : b.rows + " " + lineWord(b).toLowerCase() + "s of " + b.perRow + " slots · ") : ""}${esc(boxLookText(b))}</div>${hasSpots(b) ? `<div class="bar"><i style="width:${st.total ? (st.filled / st.total) * 100 : 0}%"></i></div>` : ""}</button>`;
}
function viewBoxes() {
  const sellOn = sellerOn(), dl = sellOn && typeof dealerBoxes === "function" ? dealerBoxes() : [];
  const bs = allBoxes().filter((b) => b.type !== "dealer" || sellOn), sb = storageBoxes(), db = displayBoxes();
  const q = boxFind.q.trim();
  const nq = q.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hits = nq ? ownedCoins().filter((c) => c.boxId && getBox(c.boxId) && labelOf(c).toLowerCase().replace(/[^a-z0-9]/g, "").includes(nq)) : [];
  return `<h1>Storage</h1>
    <div class="small muted" style="margin-bottom:10px">Your storage boxes and display boxes. Boxes with numbered spots give each item a row and slot; the others just list what's inside.</div>
    <button class="btn primary block" data-act="boxNew">+ New box</button>
    ${bs.length ? `<form id="boxFind" style="margin-top:12px"><div class="grid2" style="grid-template-columns:1fr auto"><input type="search" id="boxQ" value="${esc(boxFind.q)}" placeholder="Find a coin, e.g. 1909-S" aria-label="Find a coin in your boxes"><button class="btn" type="submit">Find</button></div></form>` : ""}
    ${q ? `<div class="card" style="margin-top:10px"><b>${hits.length} found for "${esc(q)}"</b>${hits.slice(0, 30).map((c) => `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(boxText(c))}</span></span></button>`).join("") || `<div class="small muted">Nothing in your boxes matches. Only items placed in a box are searched.</div>`}</div>` : ""}
    <div style="margin-top:12px">${bs.length ? (sb.length ? `<h2 style="margin:6px 0">Storage boxes</h2>${sb.map(boxCard).join("")}` : "") + (db.length ? `<h2 style="margin:10px 0 6px">Display boxes</h2>${db.map(boxCard).join("")}` : "") + (dl.length ? `<h2 style="margin:10px 0 6px">Dealer cases</h2>${dl.map(boxCard).join("")}` : "")
      : `<div class="card empty">No boxes yet. Tap <b>+ New box</b>, name it (like "Black box 1") and choose storage or display.</div>`}</div>
    ${storageBoxes().some(hasSpots) ? `<button class="btn block" data-act="boxMissing">Which Lincoln wheat dates am I missing?</button>` : ""}`;
}
function viewBox(r) {
  const b = getBox(r.id);
  if (!b) return `<div class="card empty">That box isn't here. <button class="link-btn" data-go="boxes">Back to Storage</button></div>`;
  const st = boxStats(b), inBox = boxCoins(b);
  const tn = trayCount(b), tray = hasSpots(b) ? Math.min(tn, Math.max(1, boxTab[b.id] || 1)) : 1, L = trayOf(b, tray);
  const inTray = inBox.filter((c) => trayNo(c) === tray);
  const here = (row, slot) => spotCoin(b.id, row, slot, undefined, tray);
  const trayTabs = tn > 1 && hasSpots(b) ? `<div class="seg" role="tablist" style="margin:0 0 10px;overflow-x:auto">${Array.from({ length: tn }, (_, i) => `<button type="button" class="${i + 1 === tray ? "on" : ""}" data-act="boxTray" data-id="${esc(b.id)}" data-v="${i + 1}" role="tab" aria-selected="${i + 1 === tray}" style="white-space:nowrap;min-width:64px">Tray ${i + 1}<span class="small"> ${inBox.filter((c) => trayNo(c) === i + 1).length}</span></button>`).join("")}</div>` : "";
  const sel = listState.sel;
  const itemRow = (c) => sel ? selRow(c) : `<button class="coin-row" data-go="coin-${esc(c.id)}"><span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${esc(holderText(c) || "")}</span></span></button>`;
  let body;
  const cell = (row, slot) => { const c = here(row, slot);
    return c ? `<button class="slot full${sel && sel.has(c.id) ? " on" : ""}" ${sel ? `data-act="selToggle" data-id="${esc(c.id)}" aria-pressed="${sel.has(c.id)}"` : `data-go="coin-${esc(c.id)}"`} title="${esc(labelOf(c))}"><span class="sn">${slot}</span>${esc(slotDate(c))}</button>`
      : `<button class="slot" data-act="boxAdd" data-box="${esc(b.id)}" data-row="${row}" data-slot="${slot}" data-tray="${tray}" aria-label="Add a coin to ${lineWord(b).toLowerCase()} ${row}, slot ${slot}"><span class="sn">${slot}</span>+</button>`; };
  if (hasSpots(b) && b.cols) { // columns side by side, like the real box seen from above; scrolls sideways when there are many
    const heads = Array.from({ length: L.rows }, (_, i) => `<div class="col-head">Col ${i + 1}<span class="muted small"> · ${inTray.filter((c) => +c.boxRow === i + 1).length}/${L.perRow}</span></div>`).join("");
    const cells = Array.from({ length: L.perRow }, (_, j) => Array.from({ length: L.rows }, (_, i) => cell(i + 1, j + 1)).join("")).join("");
    const loose = inBox.filter((c) => { if (!spotExists(b, trayNo(c), c.boxRow, c.boxSlot)) return true; const o = spotCoin(b.id, c.boxRow, c.boxSlot, undefined, trayNo(c)); return !o || o.id !== c.id; });
    body = `<div class="slots-scroll"><div class="slots cols" style="grid-template-columns:repeat(${L.rows},minmax(64px,1fr))">${heads}${cells}</div></div>` + (loose.length ? `<h2 style="margin:14px 0 6px">No numbered spot</h2><div class="card">${loose.map(itemRow).join("")}</div>` : "");
  } else if (hasSpots(b)) {
    const rowsHtml = Array.from({ length: L.rows }, (_, i) => {
      const row = i + 1;
      const cells = Array.from({ length: L.perRow }, (_, j) => {
        const slot = j + 1, c = here(row, slot);
        return c ? `<button class="slot full${sel && sel.has(c.id) ? " on" : ""}" ${sel ? `data-act="selToggle" data-id="${esc(c.id)}" aria-pressed="${sel.has(c.id)}"` : `data-go="coin-${esc(c.id)}"`} title="${esc(labelOf(c))}"><span class="sn">${slot}</span>${esc(slotDate(c))}</button>`
          : `<button class="slot" data-act="boxAdd" data-box="${esc(b.id)}" data-row="${row}" data-slot="${slot}" data-tray="${tray}" aria-label="Add a coin to row ${row}, slot ${slot}"><span class="sn">${slot}</span>+</button>`;
      }).join("");
      return `<h2 style="margin:14px 0 6px">Row ${row} <span class="muted small">· ${inTray.filter((c) => +c.boxRow === row).length}/${L.perRow}</span></h2><div class="slots">${cells}</div>`;
    }).join("");
    const loose = inBox.filter((c) => { if (!spotExists(b, trayNo(c), c.boxRow, c.boxSlot)) return true; const o = spotCoin(b.id, c.boxRow, c.boxSlot, undefined, trayNo(c)); return !o || o.id !== c.id; });
    body = rowsHtml + (loose.length ? `<h2 style="margin:14px 0 6px">No numbered spot</h2><div class="card">${loose.map(itemRow).join("")}</div>` : "");
  } else {
    body = b.type === "dealer" ? `<button class="btn block" style="margin-top:8px" data-act="boxAdd" data-box="${esc(b.id)}">+ Add a coin to this case</button>` : `<div class="card">${inBox.length ? inBox.map(itemRow).join("") : `<div class="small muted">Nothing here yet. When you add a coin, pick <b>Kept in</b> and choose this box.</div>`}</div>
      <button class="btn block" style="margin-top:8px" data-act="boxAdd" data-box="${esc(b.id)}">+ Add a coin to this box</button>`;
  }
  return `<button class="link-btn" data-go="boxes">← Storage</button>
    <h1 style="margin-top:10px">${esc(b.name)}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${boxKindText(b)} · ${esc(boxLookText(b))} · ${hasSpots(b) ? st.filled + " of " + st.total + " slots filled · " + (tn > 1 ? tn + " trays" : b.rows + " " + lineWord(b).toLowerCase() + "s of " + b.perRow) : st.filled + " item" + (st.filled === 1 ? "" : "s")}</div>
    ${b.inside ? `<div class="card"><div class="muted small">What's inside</div><div style="white-space:pre-wrap">${esc(b.inside)}</div></div>` : ""}
    ${typeof shelfItemSwitch === "function" ? shelfItemSwitch(b.id) : ""}
    ${typeof pageSelHtml === "function" ? pageSelHtml(inBox) : ""}
    ${b.type === "dealer" && typeof dealerPanel === "function" ? dealerPanel(b) : ""}
    ${keptAlbumsHtml(b)}${trayTabs}${tn > 1 && hasSpots(b) ? `<div class="small muted" style="margin:-4px 0 4px">Tray ${tray}: ${L.rows} ${lineWord(b).toLowerCase()}${L.rows === 1 ? "" : "s"} of ${L.perRow} slots</div>` : ""}${body}${typeof selFootHtml === "function" ? selFootHtml() : ""}
    <div class="btn-row"><button class="btn" data-act="boxEdit" data-id="${esc(b.id)}">Edit box</button><button class="btn danger" data-act="boxDelete" data-id="${esc(b.id)}">Delete box</button></div>`;
}
// "+ Add storage" on a Kept in list sends you here and brings you back: { kind: "coin" | "form" | "move", stash }.
let boxReturn = null;
const stashSheet = () => { const f = $("#sheet form"); return { html: $("#sheet .sheet").innerHTML, vals: f ? [...f.elements].map((e) => (e.type === "checkbox" || e.type === "radio" ? e.checked : e.value)) : [] }; };
function backFromBox(ret, id) {
  if (ret.kind === "coin") { applyKept(draft, "b:" + id); renderCoinForm(); return; }
  if (ret.kind === "move") { actions.mvOpen(); const m = $("[data-flt=mv]"); if (m) m.value = "b:" + id; return; }
  openSheet(ret.stash.html); // same page, same fields: put back what was typed, then pick the new box
  const f = $("#sheet form");
  if (f) [...f.elements].forEach((e, i) => { const v = ret.stash.vals[i]; if (v === undefined) return; if (e.type === "checkbox" || e.type === "radio") e.checked = v; else e.value = v; });
  const k = $("#sheet [name=keptBox]"); if (k) k.value = id;
}
function boxForm(b) {
  const back = boxReturn ? "boxBack" : "closeSheet";
  const cur = b ? b : { type: "storage", look: "black", color: "clear", spots: true };
  openSheet(`<div class="sheet-head"><h2>${b ? "Edit box" : "New box"}</h2><button class="x" data-act="${back}" aria-label="Close">✕</button></div>
  <form id="boxForm" data-id="${b ? esc(b.id) : ""}" autocomplete="off">
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(b ? b.name : "")}" placeholder="e.g. Black box 1" maxlength="40" required></label>
    <div class="grid2"><label class="f"><span>Kind</span><select name="type"><option value="storage" ${cur.type === "storage" ? "selected" : ""}>Storage box</option><option value="display" ${cur.type === "display" ? "selected" : ""}>Display box</option>${sellerOn() || cur.type === "dealer" ? `<option value="dealer" ${cur.type === "dealer" ? "selected" : ""}>Dealer case (show case)</option>` : ""}</select></label>
    <label class="f"><span>Look</span><select name="look" id="boxLook"><option value="black" ${cur.look === "black" ? "selected" : ""}>Black box</option><option value="cardboard" ${cur.look === "cardboard" ? "selected" : ""}>Cardboard box</option><option value="plastic" ${cur.look === "plastic" ? "selected" : ""}>Plastic container</option><option value="wood" ${cur.look === "wood" ? "selected" : ""}>Wooden box</option></select></label></div>
    <label class="switch" id="caseSaleRow" ${cur.type === "dealer" ? "" : "hidden"}><span>For sale case<div class="small muted">On: coins you move in switch to For sale. Turning this off later doesn't change coins already inside.</div></span><input type="checkbox" name="forSale" ${cur.forSale !== false ? "checked" : ""}></label>
    <label class="f"><span>Plastic color <span class="muted small">(plastic only)</span></span><select name="color">${BOX_COLORS.map((x) => `<option value="${x[0]}" ${cur.color === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>
    <label class="switch"><span>Numbered spots<div class="small muted">Rows and slots, one per coin. Turn off to just list what's inside.</div></span><input type="checkbox" name="spots" id="boxSpots" ${cur.spots !== false ? "checked" : ""}></label>
    <label class="f"><span>Spots run in</span><select name="dir"><option value="rows" ${!cur.cols ? "selected" : ""}>Rows (across)</option><option value="cols" ${cur.cols ? "selected" : ""}>Columns (front to back)</option></select></label>
    <label class="f" id="trayCountRow"><span>How many trays? <span class="muted small">(pullout drawers inside the box)</span></span><input type="number" inputmode="numeric" name="trays" min="1" max="12" value="${trayCount(cur.rows ? cur : { rows: 1, perRow: 1 })}"></label>
    <div class="grid2" id="boxGrid"><label class="f"><span>Rows or columns <span class="muted small">(tray 1)</span></span><input type="number" inputmode="numeric" name="rows" min="1" max="50" value="${b && hasSpots(b) ? b.rows : ""}" placeholder="e.g. 5"></label>
    <label class="f"><span>Slots in each</span><input type="number" inputmode="numeric" name="perRow" min="1" max="100" value="${b && hasSpots(b) ? b.perRow : ""}" placeholder="e.g. 20"></label></div>
    <div id="trayRows">${trayRowsHtml(b ? trayList(b).slice(1) : [], b ? trayList(b)[0] : null)}</div>
    <label class="f"><span>What's inside <span class="muted small">(optional)</span></span><textarea name="inside" rows="3" maxlength="500" placeholder="e.g. ziplock of Bicentennial quarters, pill bottle of halves">${esc(b ? b.inside || "" : "")}</textarea></label>
    <div class="btn-row"><button type="submit" class="btn primary">${b ? "Save" : "Add box"}</button><button type="button" class="btn" data-act="${back}">Cancel</button></div></form>`, "sheet-75");
}
// Trays 2 and up: each copies the tray above unless you press Change.
function trayRowsHtml(extra, first) {
  let prev = first;
  return extra.map((t, i) => {
    const differs = prev && (t.rows !== prev.rows || t.perRow !== prev.perRow);
    prev = t;
    return `<div class="card tray-row" data-n="${i + 2}" style="margin:6px 0"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Tray ${i + 2}</b><span class="small muted" data-same ${differs ? "hidden" : ""}>Same as the tray above</span><button type="button" class="btn" data-act="trayChange" ${differs ? "hidden" : ""}>Change</button></div>
      <div class="grid2" data-fields ${differs ? "" : "hidden"}><label class="f"><span>Rows or columns</span><input type="number" inputmode="numeric" data-tr="rows" min="1" max="50" value="${t.rows}"></label><label class="f"><span>Slots in each</span><input type="number" inputmode="numeric" data-tr="perRow" min="1" max="100" value="${t.perRow}"></label></div>
      <input type="hidden" data-tr="changed" value="${differs ? 1 : 0}"></div>`;
  }).join("");
}
// Reads the tray 2+ boxes from the open form. A tray not marked Changed copies the one above it.
function readTrays(form, count, first) {
  const out = [first], rows = [...form.querySelectorAll(".tray-row")];
  for (let i = 0; i < count - 1; i++) {
    const r = rows[i], prev = out[i];
    if (r && r.querySelector("[data-tr=changed]").value === "1") out.push({ rows: Math.round(+r.querySelector("[data-tr=rows]").value), perRow: Math.round(+r.querySelector("[data-tr=perRow]").value) });
    else out.push({ rows: prev.rows, perRow: prev.perRow });
  }
  return out;
}
function saveBoxForm(form) {
  const f = new FormData(form); let id = form.dataset.id;
  const name = String(f.get("name") || "").trim();
  const spots = f.get("spots") === "on";
  const rows = spots ? Math.round(+f.get("rows")) : 0, perRow = spots ? Math.round(+f.get("perRow")) : 0;
  const isCase = f.get("type") === "dealer";
  let trays = [{ rows, perRow }];
  if (spots && !isCase) {
    const n = Math.round(+f.get("trays")) || 1;
    if (!(n >= 1 && n <= 12)) { toast("Trays: pick 1 to 12."); return; }
    trays = readTrays(form, n, { rows, perRow });
    if (trays.some((t) => !(t.rows >= 1 && t.rows <= 50) || !(t.perRow >= 1 && t.perRow <= 100))) { toast("Each tray needs 1–50 rows or columns and 1–100 slots in each."); return; }
  }
  if (!name || (spots && (!(rows >= 1 && rows <= 50) || !(perRow >= 1 && perRow <= 100)))) { toast(isCase && spots ? "Add a name, and how many rows and spots." : spots ? "Add a name, 1–50 rows or columns and 1–100 slots in each." : "Add a name."); return; }
  const old = id && getBox(id);
  const before = old ? JSON.parse(JSON.stringify(old)) : null;
  let coinsBefore = [];
  if (old && spots) {
    const stuck = boxCoins(old).filter((c) => { const t = trayNo(c), L = trays[t - 1]; return !L || +c.boxRow > L.rows || +c.boxSlot > L.perRow; });
    if (stuck.length) { toast("That box would be too small. " + stuck.length + " item" + (stuck.length > 1 ? "s sit" : " sits") + " outside the new size (" + (trays.length > 1 ? trays.length + " trays" : lineWord(old).toLowerCase() + " " + rows + " / slot " + perRow) + "). Move " + (stuck.length > 1 ? "them" : "it") + " first."); return; }
  }
  if (old && !spots && hasSpots(old)) { // turning numbered spots off: items stay in the box and just lose their row and slot (Undo brings them back)
    coinsBefore = boxCoins(old).map((c) => JSON.parse(JSON.stringify(c)));
    coinsBefore.forEach((c) => { const x = { ...c }; delete x.boxRow; delete x.boxSlot; delete x.boxTray; put("c_" + c.id, x); });
  }
  if (!old) id = uid();
  const look = ["black", "cardboard", "plastic", "wood"].includes(f.get("look")) ? f.get("look") : "black";
  const rec = { ...(old || { kind: "box", id, createdAt: Date.now() }), name, rows, perRow, type: f.get("type") === "display" ? "display" : f.get("type") === "dealer" ? "dealer" : "storage", look, spots, inside: String(f.get("inside") || "").trim() };
  if (look === "plastic") rec.color = BOX_COLORS.some((x) => x[0] === f.get("color")) ? f.get("color") : "clear"; else delete rec.color;
  if (!rec.inside) delete rec.inside;
  if (trays.length > 1) rec.trays = trays; else delete rec.trays;
  if (rec.type === "dealer") rec.forSale = f.get("forSale") === "on"; else delete rec.forSale;
  if (f.get("dir") === "cols") rec.cols = true; else delete rec.cols; // switching only relabels: items keep their numbers
  put("b_" + rec.id, rec);
  const ret = !old && boxReturn; boxReturn = null;
  if (ret) { backFromBox(ret, rec.id); toast("Box added."); return; }
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
  boxTray: (el) => { boxTab[el.dataset.id] = +el.dataset.v || 1; render(); },
  trayChange: (el) => { const r = el.closest(".tray-row"); r.querySelector("[data-tr=changed]").value = "1"; r.querySelector("[data-fields]").hidden = false; r.querySelector("[data-same]").hidden = true; el.hidden = true; },
  boxNew: () => { boxReturn = null; boxForm(null); },
  boxBack: () => { const ret = boxReturn; boxReturn = null; if (!ret) return closeSheet(); if (ret.kind === "coin") return renderCoinForm(); if (ret.kind === "move") return actions.mvOpen(); backFromBox(ret, ""); },
  boxEdit: (el) => { const b = getBox(el.dataset.id); if (b) boxForm(b); },
  boxAdd: (el) => {
    openCoinForm(null);
    Object.assign(draft, { _what: "us", holder: "2x2 cardboard flip", boxId: el.dataset.box, boxRow: el.dataset.row || "", boxSlot: el.dataset.slot || "", boxTray: el.dataset.tray || "" });
    renderCoinForm();
  },
  boxDelete: (el) => {
    const b = getBox(el.dataset.id);
    if (!b) return;
    const n = boxCoins(b).length;
    confirmSheet("Delete " + b.name + "?", n ? (b.type === "dealer" ? "Its " + n + " item" + (n > 1 ? "s go" : " goes") + " back where " + (n > 1 ? "they were" : "it was") + " before the case." : "Its " + n + " item" + (n > 1 ? "s stay" : " stays") + " in your collection. They just lose their box.") : "This box is empty.", "Delete box", () => {
      const coins = boxCoins(b).map((c) => JSON.parse(JSON.stringify(c)));
      const box = JSON.parse(JSON.stringify(b));
      coins.forEach((c) => { const x = JSON.parse(JSON.stringify(c)); if (b.type === "dealer" && x.caseFrom && typeof caseRestore === "function") caseRestore(x); /* back to its old place and status */ else { delete x.boxId; delete x.boxRow; delete x.boxSlot; delete x.boxTray; } put("c_" + c.id, x); });
      const albs = keptAlbums(b).map((a) => JSON.parse(JSON.stringify(a))); // albums kept in it just lose the box; they stay on the shelf
      albs.forEach((a) => { const x = { ...a }; delete x.keptBox; put("a_" + a.id, x); });
      remove("b_" + b.id);
      go("boxes");
      toast("Box deleted.", { label: "Undo", fn: () => { put("b_" + box.id, box); coins.forEach((c) => put("c_" + c.id, c)); albs.forEach((a) => put("a_" + a.id, a)); toast("Restored."); } });
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
document.addEventListener("change", (e) => { // more or fewer trays: keep the ones already filled in, copy the last one into new ones
  if (e.target.name === "trays" && e.target.closest("#boxForm")) {
    const form = e.target.closest("#boxForm"), n = Math.max(1, Math.min(12, Math.round(+e.target.value) || 1));
    e.target.value = n;
    if (form.querySelectorAll(".tray-row").length === n - 1) return; // same count: don't redraw (a redraw on blur would swallow the next tap)
    const first = { rows: Math.round(+form.elements.rows.value) || 1, perRow: Math.round(+form.elements.perRow.value) || 1 };
    const old = [...form.querySelectorAll(".tray-row")].map((r) => ({ changed: r.querySelector("[data-tr=changed]").value === "1", rows: Math.round(+r.querySelector("[data-tr=rows]").value), perRow: Math.round(+r.querySelector("[data-tr=perRow]").value) }));
    const list = []; let prev = first;
    for (let i = 0; i < n - 1; i++) { const o = old[i], t = o && o.changed ? { rows: o.rows, perRow: o.perRow } : { ...prev }; list.push(t); prev = t; }
    $("#trayRows").innerHTML = trayRowsHtml(list, first);
  }
  if (e.target.id === "boxSpots" && e.target.closest("#boxForm")) { const off = !e.target.checked; ["trayCountRow", "trayRows"].forEach((id) => { const x = $("#" + id); if (x) x.hidden = off; }); }
  if (e.target.name === "type" && e.target.closest("#boxForm")) {
    const r = $("#caseSaleRow"); if (r) r.hidden = e.target.value !== "dealer";
    const form = e.target.closest("#boxForm"); // a new dealer case starts as 2 rows of 6 (only fills boxes still empty)
    if (e.target.value === "dealer" && !form.dataset.id && !form.elements.rows.value && !form.elements.perRow.value) { form.elements.rows.value = 2; form.elements.perRow.value = 6; }
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "boxForm") saveBoxForm(e.target);
  else if (e.target.id === "boxFind") { boxFind.q = ($("#boxQ") || {}).value || ""; render(); }
});

// --- Albums kept in a box (Step 9.6b): an album record may have keptBox (a box id) and keptPlace (free text). The album still shows on the Home shelf. ---
const keptAlbums = (b) => albums().filter((a) => a.keptBox === b.id);
function keptAlbumsHtml(b) {
  const list = keptAlbums(b);
  if (!list.length) return "";
  return `<div class="card" style="margin:0 0 10px"><div class="muted small">Albums kept in this box</div>${list.map((a) => `<button class="coin-row" data-go="album-${esc(a.id)}"><span class="coin-main"><span class="coin-label">${esc(albumTitle(a))}</span>${a.keptPlace ? `<span class="coin-sub">${esc(a.keptPlace)}</span>` : ""}</span></button>`).join("")}</div>`;
}
// "Kept in" text for an album page, or "".
function albumKeptText(a) {
  const b = a.keptBox && getBox(a.keptBox);
  return [b && b.name, String(a.keptPlace || "").trim()].filter(Boolean).join(" · ");
}
// The "Kept in" field on New album / Edit album.
function albumKeptField(a) {
  const opts = [...storageBoxes(), ...displayBoxes()].map((b) => `<option value="${esc(b.id)}" ${a && a.keptBox === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("");
  return `<label class="f"><span>Kept in ${typeof wi === "function" ? wi("keptin") : ""}</span><select name="keptBox"><option value="">Not in a box</option>${opts}<option value="__add">+ Add storage…</option></select></label>
    <label class="f"><span>Or type a place <span class="muted small">(optional)</span></span><input type="text" name="keptPlace" maxlength="60" value="${esc(a ? a.keptPlace || "" : "")}" placeholder="e.g. safe, top shelf"></label>`;
}
// Copies the Kept in fields from a form onto an album record (before it is saved).
function applyAlbumKept(a, fd) {
  const id = String(fd.get("keptBox") || ""), place = String(fd.get("keptPlace") || "").trim();
  if (id && getBox(id)) a.keptBox = id; else delete a.keptBox;
  if (place) a.keptPlace = place; else delete a.keptPlace;
  return a;
}
