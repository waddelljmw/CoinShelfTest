/* Step 9.7d: pocket albums (flips or capsules in rows and columns, any coin in any pocket).
   A pocket album is saved like a box ("b_<id>", type "pocket"): its pages are the box's trays, each page has the same
   pockets (rows = pockets down, perRow = pockets across). A coin's pocket is boxId + boxTray (page) + boxRow + boxSlot,
   so the box page, spot pickers, next free pocket, Move many, Backup and CSV all work as they do for boxes.
   Also keeps Kept in (keptBox / keptPlace) and a spine color (color), black included. */
const POCKET_MAX = { pages: 40, across: 10, down: 10 };
const pocketSub = (b) => trayCount(b) + " page" + (trayCount(b) === 1 ? "" : "s") + " · " + b.perRow + " across, " + b.rows + " down";
function pocketForm(b) {
  const cur = b || { color: "black", rows: 3, perRow: 2 };
  const kept = albumKeptField(b).replace(/<option value="__add">[^<]*<\/option>/, "");
  openSheet(`<div class="sheet-head"><h2>${b ? "Edit pocket album" : "New pocket album"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  <form id="pocketForm" data-id="${b ? esc(b.id) : ""}" autocomplete="off">
    <div class="hint">For an album with plastic pockets or flips. Any coin can go in any pocket.</div>
    <label class="f"><span>Name</span><input type="text" name="name" value="${esc(b ? b.name : "")}" placeholder="e.g. Silver Eagles album" maxlength="40" required></label>
    <div class="grid2"><label class="f"><span>Pages</span><input type="number" inputmode="numeric" name="pages" min="1" max="${POCKET_MAX.pages}" value="${b ? trayCount(b) : 1}" required></label>
    <label class="f"><span>Spine color</span><select name="color">${BOX_COLORS.filter((x) => x[0] !== "clear").map((x) => `<option value="${x[0]}" ${(cur.color || "black") === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label></div>
    <div class="grid2"><label class="f"><span>Pockets across</span><input type="number" inputmode="numeric" name="across" min="1" max="${POCKET_MAX.across}" value="${cur.perRow}" required></label>
    <label class="f"><span>Pockets down</span><input type="number" inputmode="numeric" name="down" min="1" max="${POCKET_MAX.down}" value="${cur.rows}" required></label></div>
    <div class="small muted" style="margin:-4px 0 8px">Every page has the same pockets.</div>
    ${kept}
    <div class="btn-row"><button type="submit" class="btn primary">${b ? "Save" : "Add album"}</button><button type="button" class="btn" data-act="closeSheet">Cancel</button></div></form>`, "sheet-75");
}
function savePocketForm(form) {
  const f = new FormData(form); let id = form.dataset.id;
  const name = String(f.get("name") || "").trim(), pages = Math.round(+f.get("pages")), across = Math.round(+f.get("across")), down = Math.round(+f.get("down"));
  if (!name || !(pages >= 1 && pages <= POCKET_MAX.pages) || !(across >= 1 && across <= POCKET_MAX.across) || !(down >= 1 && down <= POCKET_MAX.down)) { toast("Add a name, 1–" + POCKET_MAX.pages + " pages, and 1–" + POCKET_MAX.across + " pockets across and 1–" + POCKET_MAX.down + " down."); return; }
  const old = id && getBox(id), before = old ? JSON.parse(JSON.stringify(old)) : null;
  if (old) { // never hide a coin: it can't be saved smaller than where coins already sit
    const stuck = boxCoins(old).filter((c) => trayNo(c) > pages || +c.boxRow > down || +c.boxSlot > across);
    if (stuck.length) { toast("That would be too small. " + stuck.length + " coin" + (stuck.length > 1 ? "s sit" : " sits") + " outside the new size. Move " + (stuck.length > 1 ? "them" : "it") + " first."); return; }
  } else id = uid();
  const rec = { ...(old || { kind: "box", id, createdAt: Date.now() }), name, type: "pocket", look: "black", spots: true, rows: down, perRow: across, color: BOX_COLORS.some((x) => x[0] === f.get("color")) ? f.get("color") : "black" };
  delete rec.cols;
  if (pages > 1) rec.trays = Array.from({ length: pages }, () => ({ rows: down, perRow: across })); else delete rec.trays;
  applyAlbumKept(rec, f);
  put("b_" + rec.id, rec);
  closeSheet();
  toast(old ? "Album saved." : "Pocket album added.", old ? { label: "Undo", fn: () => put("b_" + before.id, before) } : undefined);
  if (!old) go("box-" + id);
}
// Albums page: a card for each pocket album.
function pocketCards() {
  return pocketAlbums().map((b) => { const st = boxStats(b); return `<button class="card" style="display:block;width:100%;text-align:left" data-go="box-${esc(b.id)}">
    <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(b.name)}</b><span class="num">${st.filled}/${st.total}</span></div>
    <div class="small muted">Pocket album · ${esc(pocketSub(b))}</div><div class="bar"><i style="width:${st.total ? (st.filled / st.total) * 100 : 0}%"></i></div></button>`; }).join("");
}
// Home shelf: a spine for a pocket album (its own spine color).
function pocketSpine(b) {
  const st = boxStats(b), k = BOX_COLORS.some((x) => x[0] === b.color) && b.color !== "clear" ? b.color : "black", hex = colorHex(k, "black");
  return `<button class="sh-spine so ${st.total > 120 ? "tall" : st.total < 40 ? "short" : ""}" style="background:${hex};box-shadow:inset 0 0 0 99px rgba(0,0,0,.08);color:${LIGHT_COLORS.includes(k) ? "#2a2218" : "#e8d29a"}" data-go="box-${esc(b.id)}" aria-label="${esc(b.name)}, pocket album, ${st.filled} of ${st.total} pockets"><span>${esc(b.name.length > 16 ? b.name.slice(0, 15) + "…" : b.name)}</span></button>`;
}
// Where a pocket album is kept shows on its page.
const pocketKeptHtml = (b) => (albumKeptText(b) ? `<div class="small" style="margin:-6px 0 10px">Kept in: ${esc(albumKeptText(b))}</div>` : "");
Object.assign(actions, { pocketNew: () => pocketForm(null) });
document.addEventListener("submit", (e) => { if (e.target.id === "pocketForm") { e.preventDefault(); savePocketForm(e.target); } });
