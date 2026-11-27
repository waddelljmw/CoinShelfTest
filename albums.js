// Albums: spots, stats, album pages and spot editing (split from app.js; plain script, shares the page's global names)
/* --- Albums --- */
// Spine color picker (used for "Other" brand albums; Whitman, Dansco, Harris and Littleton have their own colors).
const albumColorField = (val) => `<label class="f"><span>Spine color <span class="muted small">(used when the brand is Other)</span></span><select name="color">${BOX_COLORS.filter((x) => x[0] !== "clear").map((x) => `<option value="${x[0]}" ${(val || "red") === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>`;
const albumTitle = (a) => a.name || [a.brand, a.number].filter(Boolean).join(" ") || "Album";
// Same, with "(inherited)" added for an inherited album (My Albums cards, want-list names).
const albumLabel = (a) => albumTitle(a) + (a.inherited ? " (inherited)" : "");
// An album with no name of its own and the same brand + number as another gets "(2)", "(3)"... so two never look alike.
function uniqueAlbumName(a) {
  if (a.name) return false;
  const used = new Set(albums().filter((x) => x.id !== a.id).map(albumTitle)), base = albumTitle(a);
  if (!used.has(base)) return false;
  let n = 2; while (used.has(base + " (" + n + ")")) n++;
  a.name = base + " (" + n + ")";
  return true;
}
// A slot is one spot in an album: year, mint mark, and optionally a variety (e.g. "8 Tail Feathers").
// Type-set spots ("set") hold one coin of a type, any date. "tx" marks a date spot shared by two of the album's types.
// "pf" marks a proof spot (only a coin with a PR grade fills it).
// "blank" marks an extra blank spot (step 31): no name, any coin fits, never counted in "N of N owned".
const slotKey = (s) => s.blank ? "blank:" + s.id : (s.set ? "set:" + s.t : s.y + "|" + s.m) + (s.v ? "|" + s.v : "") + (s.pf ? "|PF" : "") + (s.tx ? "#" + s.t : "");
// Idea 106 part 1: a coin with a photo shows its first photo in its album spot (the photos the coin already has; nothing new is saved).
const slotPhotoHtml = (c) => { const p = c && (c.photos || [])[0], src = p ? photoSrc(p) : ""; return src ? `<img class="slot-photo" src="${esc(src)}" alt="" loading="lazy">` : ""; };
const slotLabel = (s) => (s.blank ? "Blank spot" : s.set ? (TYPE_BY_ID[s.t] ? shortName(TYPE_BY_ID[s.t]) : "Coin") : s.y + (s.m ? "-" + s.m : "") + (s.pf ? " Proof" : ""));
// Years Red Book lists proofs for a type. US proofs moved from Philadelphia (no mint mark) to San Francisco in 1968.
const proofYears = (typeId) => { const p = bookFactRows(typeId, "proof"); const priced = p ? p.map((k) => +k.split("|")[0].split("-")[0]) : []; return [...new Set([...priced, ...(PROOF_YEARS_NO_PRICES[typeId] || [])])].sort((x, y) => x - y); };
const proofMint = (typeId, y) => { const p = bookFactRows(typeId, "proof") || []; const k = p.find((x) => x.split("|")[0].startsWith(y + "-")); return k ? normMint(k.split("|")[0].split("-")[1]) : y >= 1968 ? "S" : ""; };
const hasProofs = (types) => types.some((id) => proofYears(id).length);
// An album can hold several coin types (e.g. Washington silver 1932–1964 and clad 1965 on, or a type set).
const albumTypes = (a) => (a && a.typeIds && a.typeIds.length ? a.typeIds : a && a.typeId ? [a.typeId] : []).filter((id) => TYPE_BY_ID[id]);
const albumHasType = (a, typeId) => albumTypes(a).includes(typeId);
const isSetAlbum = (a) => !!a && a.layout === "set";
const albumTypeText = (a) => albumTypes(a).map((id) => TYPE_BY_ID[id].name).join(", ");
// The coin type a spot is for: its own, or the album type made in that spot's year.
function slotType(a, s) {
  if (s && s.t) return s.t;
  const ts = albumTypes(a);
  if (ts.length <= 1) return ts[0] || (a && a.typeId) || "";
  const y = num(s && s.y);
  return ts.find((id) => { const t = TYPE_BY_ID[id]; return y >= t.start && y <= typeLastYear(t); }) || ts[0];
}
// The spot a tapped album card stands for (by id, or by date for older cards).
function spotFromEl(a, el) {
  const d = el.dataset || el;
  const ss = (a && a.slots) || [];
  return (d.sid && ss.find((x) => x.id === d.sid)) || ss.find((x) => String(x.y) === String(d.y) && (x.m || "") === (d.m || "") && (x.v || "") === (d.v || "")) || { y: num(d.y), m: d.m || "", v: d.v || "" };
}
// Every standard spot for these types: dates and mint marks inside the years, or one spot per type for a type set.
// extra (optional): this album's own variety spots, { typeId: { "1878|": [names] } }, from the album catalog.
function buildAlbumSlots(types, layout, start, end, proofs, extra) {
  if (layout === "set") return types.map((id) => ({ id: uid(), set: true, t: id, y: "", m: "" }));
  const out = [], seen = new Set();
  types.forEach((id) => {
    const t = TYPE_BY_ID[id];
    if (!t) return;
    buildSlots(id, Math.max(start, t.start), Math.min(end, typeLastYear(t)), extra && extra[id]).forEach((s) => {
      const k = s.y + "|" + s.m;
      out.push(seen.has(k) ? { ...s, t: id, tx: true } : { ...s, t: id });
      seen.add(k);
    });
    // Proof spots come after the regular spots for the same year.
    // proofs: "s" = San Francisco proofs only (1968 on), "all" = every proof year.
    if (proofs) proofYears(id).filter((y) => y >= Math.max(start, t.start) && y <= Math.min(end, typeLastYear(t))).forEach((y) => {
      const m = proofMint(id, y);
      if (proofs === "s" && m !== "S") return;
      const k = y + "|" + m + "|PF";
      out.push(seen.has(k) ? { id: uid(), y, m, pf: true, t: id, tx: true } : { id: uid(), y, m, pf: true, t: id });
      seen.add(k);
    });
  });
  return sortSlots(out);
}
function albumSlots(a) {
  const removed = new Set(a.removed || []);
  return (a.slots || []).filter((s) => !removed.has(slotKey(s)));
}
// Does this coin's variety fit a variety spot? "7 Over 8 Tail Feathers, Strong" fits "7 over 8 tail feathers".
function varietyFits(coinVar, slotVar) {
  const c = String(coinVar || "").toLowerCase().trim(), v = String(slotVar || "").toLowerCase().trim();
  return !!c && !!v && (c === v || c.startsWith(v) || v.startsWith(c));
}
// A date the Red Book lists only as a proof (like the 1895 Morgan from Philadelphia). Only says yes when the book data says so.
function proofOnlySpot(a, s) {
  if (!s || s.set || s.pf || !s.y) return false;
  const bf = typeof BOOK_FACTS !== "undefined" && BOOK_FACTS[slotType(a, s)];
  if (!bf || !bf.proof || !bf.circ) return false;
  const base = s.y + (s.m ? "-" + s.m : "");
  const has = (rows) => (rows || []).some((k) => k === base || k.startsWith(base + "|"));
  return has(bf.proof) && !has(bf.circ) && !has(bf.sms);
}
// Short grade for an album card: "VF-20", "PCGS MS-63", or "owned" when no grade was entered.
function slotGrade(c) {
  const g = c.grade === "Other" ? c.customGrade : c.grade;
  const tag = nifcOf(c) ? " · NIFC" : "";
  if (!g) return (c.noGrade ? noGradeWord(c) : "owned") + tag;
  return (c.gradeMode === "cert" ? [c.service === "Other" ? c.customService : c.service, g].filter(Boolean).join(" ") : g) + tag;
}
// Years always stay in order; within a year, spots keep the order you gave them. Blank spots go to the end.
// An album whose spots you moved yourself (freeOrder) keeps its own order: pass it as the second argument.
function sortSlots(slots, a) {
  if (a && a.freeOrder) return slots;
  const yk = (x) => (x.blank ? 1e9 : x.y);
  return slots.map((x, i) => [x, i]).sort((a, b) => yk(a[0]) - yk(b[0]) || a[1] - b[1]).map((p) => p[0]);
}
const newBlankSpot = () => ({ id: uid(), blank: true, custom: true, y: "", m: "" });
// The blank spot a coin sits in (null when it isn't in one).
function blankSpotOf(c) {
  const a = c && c.albumId && getAlbum(c.albumId);
  const s = a && c.slotId && (a.slots || []).find((x) => x.id === c.slotId);
  return s && s.blank ? s : null;
}
// E1q: a coin that sits in a blank spot, or in a dated spot as "something else", may be any coin type.
const anyTypeSpot = (c) => !!(c && (c.otherInSpot || blankSpotOf(c)));
// Put a dated spot next to its year in an album kept in your own order (after the last spot of that year or earlier).
function insertByYear(slots, spot) {
  let at = -1;
  slots.forEach((x, i) => { if (!x.blank && num(x.y) <= spot.y) at = i; });
  if (at < 0) { const f = slots.findIndex((x) => !x.blank); at = f < 0 ? slots.length - 1 : f - 1; }
  return [...slots.slice(0, at + 1), spot, ...slots.slice(at + 1)];
}
// Give every spot a stable id (older albums were saved without them). Returns the album, with ids.
function withSlotIds(a) {
  if (!a || (a.slots || []).every((s) => s.id)) return a;
  const b = { ...a, slots: (a.slots || []).map((s) => (s.id ? s : { ...s, id: uid() })) };
  put("a_" + b.id, b);
  return b;
}
function buildSlots(typeId, start, end, extraVarieties) {
  const t = TYPE_BY_ID[typeId];
  if (!t) return [];
  const out = [];
  if (EXACT_SLOTS[typeId]) {
    EXACT_SLOTS[typeId].forEach(([y, ms]) => {
      if (y < start || y > end) return;
      // Some dates have a spot per variety (e.g. 1909 VDB, the four 2009 designs); "" is the plain spot.
      const rows = ms.split(" ").map((m) => { const k = y + "|" + normMint(m); return [normMint(m), (extraVarieties && extraVarieties[k]) || (t.varieties && t.varieties[k]) || [""]]; });
      const add = (m, v) => out.push(v ? { id: uid(), y, m, v } : { id: uid(), y, m });
      // Same designs at every mint (state quarters, parks): one design at a time, P then D, like the real album page.
      if (rows.length > 1 && rows[0][1].length > 1 && rows.every((r) => r[1].join("|") === rows[0][1].join("|"))) rows[0][1].forEach((v) => rows.forEach((r) => add(r[0], v)));
      else rows.forEach((r) => r[1].forEach((v) => add(r[0], v)));
    });
  } else {
    for (let y = start; y <= end; y++) t.mints.forEach((m) => out.push({ id: uid(), y, m: normMint(m) }));
  }
  return out;
}
function albumStats(a) {
  const coins = ownedCoins().filter((c) => c.albumId === a.id);
  const all = albumSlots(a);
  const slots = all.filter((s) => !s.blank), blanks = all.filter((s) => s.blank);
  const filled = new Map();
  const used = new Set();
  // 0) Blank spots: only the coin you put there, any coin type.
  let blankFilled = 0;
  blanks.forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && c.slotId === s.id);
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); blankFilled++; }
  });
  // 0b) E1q: "Something else is in this spot" (a token in the 1891 spot). It sits there, but the spot still counts as missing.
  const others = new Map();
  slots.forEach((s) => {
    const hit = s.id && coins.find((c) => !used.has(c.id) && c.otherInSpot && c.slotId === s.id);
    if (hit) { others.set(slotKey(s), hit); used.add(hit.id); }
  });
  const multi = albumTypes(a).length > 1 || isSetAlbum(a);
  // Does this coin fit this spot? Type sets match by type; date spots by date (and type, if the album has several).
  const pfOk = (c, s) => (s.pf ? isProofGrade(c.grade) : !(a.proofs && isProofGrade(c.grade)));
  // loose = a coin put in this very spot stays there, even a proof in a regular spot (he knows what he holds).
  const sameDate = (c, s, loose) => (s.set ? c.typeId === s.t : num(c.year) === s.y && normMint(c.mint) === s.m && (!multi || c.typeId === slotType(a, s)) && (pfOk(c, s) || (loose && !s.pf)));
  // 1) Coins added to a specific spot stay in that spot, whatever it's renamed or moved to.
  slots.forEach((s) => {
    if (!s.id) return;
    const hit = coins.find((c) => !used.has(c.id) && c.slotId === s.id && sameDate(c, s, true));
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  // 2) Other coins: variety spots by matching variety, then plain spots by date.
  slots.filter((s) => s.v && !filled.has(slotKey(s))).forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && sameDate(c, s) && (varietyFits(c.variety, s.v) || varietyFits(c.spotVariety, s.v)));
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  slots.filter((s) => !s.v && !filled.has(slotKey(s))).forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && sameDate(c, s) && !(c.slotId && all.some((x) => x.id === c.slotId))) || null;
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  return {
    coins, slots, filled, others, all, blanks, blankFilled,
    owned: filled.size - blankFilled, total: slots.length,
    value: sum(coins.filter((c) => !c.biz), (c) => (bestEach(c) || 0) * qtyOf(c)), // Business stock is counted apart, as on Home
    melt: sum(coins.filter((c) => !c.biz), (c) => (meltEach(c) || 0) * qtyOf(c)),
    meltNeeds: SPOT_METALS.filter((m) => coins.some((c) => meltKey(c) === m.key && ozEach(c) && spotPerOz(m.key) == null)), // metals with no price yet
  };
}
const albumsView = { reorder: false };
// The albums list as units: a single album, or a whole series kept together.
function albumUnits() {
  const list = albums(), key = albumSeriesKeys(list), units = [];
  list.forEach((a) => {
    const k = key.get(a.id), last = units[units.length - 1];
    if (k && last && last.key === k) last.items.push(a); else units.push({ key: k || null, items: [a] });
  });
  return units;
}
// Step 28b: Auto order keys. Face value first (cent < nickel < ... < dollar; type sets last), then the coin's family name, then first year.
const albumAutoType = (a) => TYPE_BY_ID[albumTypes(a)[0]];
const albumAutoKey = (a) => { const t = albumAutoType(a); return isSetAlbum(a) || !t ? 9999 : t.face != null ? t.face : 9998; };
const _famStart = {};
const albumAutoName = (a) => { // the coin's family, ordered by when that family began (Flying Eagle, Indian Head, Lincoln), name breaks ties
  const t = albumAutoType(a); if (isSetAlbum(a) || !t) return "~";
  const f = t.family || t.name || "";
  if (_famStart[f] == null) _famStart[f] = Math.min(...Object.values(TYPE_BY_ID).filter((x) => (x.family || x.name) === f).map((x) => x.start || 9999));
  return String(_famStart[f]).padStart(5, "0") + f;
};
// Sort albums by date: each series (or single album) goes by its first coin's first year. Series stay together.
const albumFirstYear = (a) => { const t = TYPE_BY_ID[albumTypes(a)[0]]; const y = isSetAlbum(a) ? (t && t.start) : num(a.start) || (t && t.start); return y || 9999; };
function sortAlbumsByDate() {
  const units = albumUnits();
  const yr = (u) => Math.min(...u.items.map(albumFirstYear));
  units.forEach((u) => { if (u.key) u.items.sort((a, b) => albumFirstYear(a) - albumFirstYear(b)); });
  units.sort((x, y) => yr(x) - yr(y));
  saveSettings({ albumOrder: units.flatMap((u) => u.items.map((a) => a.id)) });
  toast("Albums sorted by date. Move any you like.");
}
// Auto order on/off. Turning it off keeps the order you see now; turning it on goes back to coin value, coin type, first year.
function autoOrderSet(on) {
  if (on) saveSettings({ autoOrder: true });
  else saveSettings({ autoOrder: false, albumOrder: albums().map((x) => x.id) });
}
// Move one album (within its series) or a whole series (d = -1 up, 1 down).
function moveAlbum(id, d, whole) {
  if (settings().autoOrder !== false) { // moving by hand turns Auto order off, so ask first
    confirmSheet("Turn off Auto order?", "Auto order keeps albums by coin value, coin type, then first year. Moving one by hand turns it off, and your order is kept until you turn it back on.", "Turn off and move", () => { autoOrderSet(false); closeSheet(); moveAlbum(id, d, whole); });
    return;
  }
  const units = albumUnits();
  const ui = units.findIndex((u) => u.items.some((a) => a.id === id));
  if (ui < 0) return;
  if (whole || units[ui].items.length === 1) {
    const uj = ui + d;
    if (uj < 0 || uj >= units.length) return;
    [units[ui], units[uj]] = [units[uj], units[ui]];
  } else {
    const it = units[ui].items, i = it.findIndex((a) => a.id === id), j = i + d;
    if (j < 0 || j >= it.length) return;
    [it[i], it[j]] = [it[j], it[i]];
  }
  saveSettings({ albumOrder: units.flatMap((u) => u.items.map((a) => a.id)) });
}
const albumSub = (a) => [a.name ? [a.brand !== "Other" ? a.brand : "", a.number].filter(Boolean).join(" ") : "", isSetAlbum(a) ? "Type set" : albumTypeText(a)].filter(Boolean).join(" · ");
// E1-7: search box on My Albums. Hides cards as you type, without redrawing the page.
const albumHit = (find) => String(albumsView.q || "").toLowerCase().split(/\s+/).every((w) => find.includes(w));
function albumFilter() {
  $$(".album-card").forEach((x) => { x.hidden = !albumHit(x.dataset.find); });
  $$(".series-box").forEach((b) => { b.hidden = !!b.querySelector(".album-card") && !b.querySelector(".album-card:not([hidden])"); });
}
document.addEventListener("input", (e) => { if (e.target.id === "albumSearch") { albumsView.q = e.target.value; albumFilter(); } });
function viewAlbums() {
  const list = albums();
  const units = albumUnits();
  const mv = (id, i, n, whole) => `<span class="slot-mv"><button data-act="moveAlbum" data-id="${esc(id)}" ${whole ? "data-whole=\"1\"" : ""} data-d="-1" ${i ? "" : "disabled"} aria-label="Move up">▲</button><button data-act="moveAlbum" data-id="${esc(id)}" ${whole ? "data-whole=\"1\"" : ""} data-d="1" ${i < n - 1 ? "" : "disabled"} aria-label="Move down">▼</button></span>`;
  if (albumsView.reorder && list.length) {
    return `<h1>My Albums</h1>
      <div class="banner" style="margin:0 0 10px">Use ▲ ▼ to put your albums in the order you want. Albums in a series move together; use the arrows inside a series to change its order.</div>
      ${units.map((u, ui) => u.key
        ? `<div class="series-box"><div class="series-head"><b>${esc(seriesTitle(u.items))}</b>${mv(u.items[0].id, ui, units.length, true)}</div>
            <div class="list">${u.items.map((a, i) => `<div class="coin-row"><span class="coin-main"><span class="coin-label">${esc(albumTitle(a))}</span><span class="coin-sub">${esc(albumSub(a))}</span></span>${mv(a.id, i, u.items.length)}</div>`).join("")}</div></div>`
        : `<div class="list" style="margin-bottom:10px"><div class="coin-row"><span class="coin-main"><span class="coin-label">${esc(albumTitle(u.items[0]))}</span><span class="coin-sub">${esc(albumSub(u.items[0]))}</span></span>${mv(u.items[0].id, ui, units.length, true)}</div></div>`).join("")}
      ${settings().autoOrder !== false ? "" : `<button class="btn block" data-act="sortAlbumsDate">Sort by date</button><button class="btn block" style="margin-top:8px" data-act="autoOrderOn">Turn Auto order back on</button>`}
      <button class="btn primary block" style="margin-top:12px" data-act="reorderAlbums">Done</button>`;
  }
  const card = (a) => {
    const st = albumStats(a);
    const done = st.total && st.owned === st.total;
    const numLine = a.name && (a.brand !== "Other" || a.number) ? [a.brand !== "Other" ? a.brand : "", a.number && "No. " + a.number].filter(Boolean).join(" ") : "";
    const find = [albumTitle(a), numLine, albumTypeText(a), a.brand, a.number].join(" ").toLowerCase();
    return `<button class="card album-card" data-find="${esc(find)}" ${albumHit(find) ? "" : "hidden"} style="display:block;width:100%;text-align:left" data-go="album-${esc(a.id)}">
        <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(albumTitle(a))}${a.inherited ? `<span class="chip" style="margin-left:6px;font-weight:normal">Inherited</span>` : ""}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</b><span class="num">${st.owned}/${st.total}</span></div>
        ${numLine ? `<div class="small">${esc(numLine)}</div>` : ""}
        <div class="small muted">${esc(isSetAlbum(a) ? "Type set · " + albumTypes(a).length + " types" : albumTypeText(a))}${a.start ? " · " + a.start + "–" + a.end : ""} · ${money(st.value, "$0.00")}</div>
        <div class="bar"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div></button>`;
  };
  return `<h1>My Albums</h1>
    <button class="btn primary block" data-act="newAlbum">+ New album</button>
    <button class="btn block" style="margin-top:8px" data-act="pocketNew">+ New pocket album (flips or capsules)</button>
    ${list.length > 3 ? `<input type="search" id="albumSearch" placeholder="Search your albums" aria-label="Search your albums" value="${esc(albumsView.q || "")}" style="width:100%;margin-top:10px">` : ""}
    ${list.length > 1 ? `<label class="switch" style="margin-top:10px"><span>Auto order (coin value, coin type, year)</span><input type="checkbox" data-act="autoOrder" ${settings().autoOrder !== false ? "checked" : ""}></label><div style="text-align:right;margin-top:4px"><button class="link-btn" data-act="reorderAlbums">Reorder albums</button></div>` : ""}
    <div style="margin-top:12px">${list.length ? units.map((u) => u.key ? `<div class="series-box"><div class="series-head"><b>${esc(seriesTitle(u.items))}</b></div>${u.items.map(card).join("")}</div>` : card(u.items[0])).join("") : pocketAlbums().length ? "" : `<div class="card empty">No albums yet. Make one here, or pick an album number when you add a coin.</div>`}${pocketCards()}</div>`;
}
const albumEdit = { id: null };
function viewAlbum(r) {
  const a = getAlbum(r.id);
  if (!a) return `<div class="card empty">That album isn't here. <button class="link-btn" data-go="albums">Back to My Albums</button></div>`;
  const st = albumStats(a);
  const done = st.total && st.owned === st.total;
  const editing = albumEdit.id === a.id;
  const extras = st.coins.filter((c) => ![...st.filled.values()].includes(c) && ![...st.others.values()].includes(c));
  return `<button class="link-btn" data-go="albums">← My Albums</button>
    <h1 style="margin-top:10px">${esc(albumTitle(a))}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${esc([a.brand, a.number && "No. " + a.number, isSetAlbum(a) ? "Type set" : albumTypeText(a)].filter(Boolean).join(" · "))}${a.start ? " · " + a.start + "–" + a.end : ""}</div>
    ${typeof albumKeptText === "function" && albumKeptText(a) ? `<div class="small" style="margin:-6px 0 10px">Kept in: ${a.keptBox && getBox(a.keptBox) ? `<button class="link-btn" data-go="box-${esc(a.keptBox)}">${esc(albumKeptText(a))}</button>` : esc(albumKeptText(a))}</div>` : ""}
    <div class="stats">
      <div class="stat"><div class="k">Owned</div><div class="v">${st.owned}/${st.total}</div>${st.blankFilled ? `<div class="small muted">+ ${st.blankFilled} in blank spot${st.blankFilled === 1 ? "" : "s"}</div>` : ""}</div>
      <div class="stat"><div class="k">Missing</div><div class="v">${st.total - st.owned}</div><button class="link-btn small" data-act="missing" data-id="${esc(a.id)}">Show missing</button></div>
      <div class="stat"><div class="k">Album value</div><div class="v">${money(st.value, "$0.00")}</div></div>
      <div class="stat"><div class="k">Album melt</div><div class="v">${st.meltNeeds.length && !st.melt ? `<span class="small">Needs ${esc(metalWords(st.meltNeeds))} price</span>` : money(st.melt, "$0.00")}</div>${st.meltNeeds.length && st.melt ? `<div class="small muted">Needs ${esc(metalWords(st.meltNeeds))} price</div>` : ""}</div>
    </div>
    ${(a.removed || []).length && !editing ? `<div class="small muted" style="margin:-4px 0 10px">${(a.removed || []).length} spot${(a.removed || []).length > 1 ? "s" : ""} hidden · <button class="link-btn" data-act="editSlots" data-id="${esc(a.id)}">Show</button></div>` : ""}
    <div class="bar" style="margin:12px 0 16px"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div>
    ${!editing && typeof pageSelHtml === "function" ? pageSelHtml([...st.filled.values(), ...st.others.values(), ...extras], true) : ""}
    <div class="btn-row" style="margin:0 0 12px">
      <button class="btn" data-act="addSpot" data-id="${esc(a.id)}">+ Add a spot</button>
      ${!editing && st.total > st.owned && typeof openFillAlbum === "function" ? `<button class="btn" data-act="fillSpots" data-id="${esc(a.id)}">Fill spots</button>` : ""}
      <button class="btn ${editing ? "primary" : ""}" data-act="editSlots" data-id="${esc(a.id)}">${editing ? "Done editing" : "Edit spots"}</button>
      ${editing && !isSetAlbum(a) && !spotPickOn(a.id) ? `<button class="btn" data-act="spotPickStart" data-id="${esc(a.id)}">Move spots</button><button class="btn" data-act="spotYearOrder" data-id="${esc(a.id)}">Put back in year order</button>` : ""}
      ${!editing && typeof albumNoGrade === "function" && albumNoGrade(a.id).length ? `<button class="btn" data-act="fixupQuick" data-id="${esc(a.id)}">Quick grade (${albumNoGrade(a.id).length})</button>` : ""}
    </div>
    ${editing ? spotPickBanner(a) : ""}
    <div class="album-grid">${spotBarAt(a, "__start")}${(editing ? a.slots || [] : st.all).map((s, i, arr) => {
      const k = slotKey(s);
      const hit = st.filled.get(k);
      const gone = (a.removed || []).includes(k);
      const lab = slotLabel(s);
      const vLine = s.v ? `<span class="g" style="font-weight:600;color:var(--ink)">${esc(s.v)}</span>` : "";
      const data = `data-album="${esc(a.id)}" data-sid="${esc(s.id || "")}" data-y="${s.y}" data-m="${esc(s.m)}" data-v="${esc(s.v || "")}"`;
      if (editing && spotPickOn(a.id)) return spotPickItem(a, s, hit, gone) + spotBarAt(a, s.id);
      if (editing) {
        const free = (x) => a.freeOrder || s.blank || x.blank || x.y === s.y; // years stay in order until you move spots yourself
        const canL = i > 0 && free(arr[i - 1]), canR = i < arr.length - 1 && free(arr[i + 1]);
        return `<div class="slot slot-edit${hit ? " have" : ""}" style="${s.custom ? "border-color:var(--accent);" : ""}${gone ? "opacity:.4;" : ""}">
          <button class="slot-name" data-act="spotEdit" data-id="${esc(a.id)}" data-i="${i}" style="${gone ? "text-decoration:line-through" : ""}">${esc(lab)}${vLine}<span class="g">${gone ? "hidden" : hit ? "✓ " + esc(slotGrade(hit)) : s.blank ? "blank" : s.custom ? "added" : "edit"}</span></button>
          ${canL || canR ? `<span class="slot-mv"><button data-act="moveSpot" data-id="${esc(a.id)}" data-i="${i}" data-d="-1" ${canL ? "" : "disabled"} aria-label="Move earlier">◀</button><button data-act="moveSpot" data-id="${esc(a.id)}" data-i="${i}" data-d="1" ${canR ? "" : "disabled"} aria-label="Move later">▶</button></span>` : ""}
        </div>`;
      }
      const sw = spotWants(a, s);
      const tag = sw.length ? `<span class="g" style="color:var(--accent)">★ ${spotTag(sw)}</span>` : "";
      if (s.blank && !hit) return `<button class="slot blank-spot${listState.sel ? " dim" : ""}" data-act="${listState.sel ? "slotNoSel" : "slotMenu"}" ${data} aria-label="Blank spot"><span class="blank-ring"></span></button>`;
      const oth = !hit && st.others.get(k);
      if (oth) return `<button class="slot other-spot${listState.sel ? " sel" + (listState.sel.has(oth.id) ? " on" : "") : ""}" ${listState.sel ? `data-act="selToggle" data-id="${esc(oth.id)}" aria-pressed="${listState.sel.has(oth.id)}"` : `data-act="slotMenu" ${data} data-coin="${esc(oth.id)}"`} aria-label="${esc(lab)}: something else is here">${esc(lab)}${vLine}<span class="g other-what">${esc(blankCoinLabel(oth))}</span>${tag}</button>`;
      const labH = s.blank ? blankCoinLabel(hit) : lab;
      return hit
        ? `<button class="slot have${listState.sel ? " sel" + (listState.sel.has(hit.id) ? " on" : "") : ""}" ${listState.sel ? `data-act="selToggle" data-id="${esc(hit.id)}" aria-pressed="${listState.sel.has(hit.id)}"` : `data-act="slotMenu" ${data} data-coin="${esc(hit.id)}"`}>${slotPhotoHtml(hit)}${esc(labH)}${vLine}<span class="g">${esc(slotGrade(hit))}</span>${hit.origAlbum ? `<span class="g" style="color:var(--accent)">original</span>` : ""}${tag}</button>`
        : `<button class="slot${listState.sel ? " dim" : ""}" data-act="${listState.sel ? "slotNoSel" : "slotMenu"}" ${data}${listState.sel ? ' aria-disabled="true"' : ""}>${esc(lab)}${vLine}${tag || `<span class="g">open</span>`}</button>`;
    }).join("")}</div>
    ${extras.length ? `<h2>Also in this album</h2><div class="list">${extras.map((c) => (listState.sel && typeof selRow === "function" ? selRow(c) : coinRow(c))).join("")}</div>` : ""}
    ${selFootHtmlSafe()}
    <div class="btn-row">
      ${st.total - st.owned > 0 ? `<button class="btn" data-act="missingQuick" data-id="${esc(a.id)}">★ Add missing to a want list</button>` : ""}
      <button class="btn" data-act="editAlbum" data-id="${esc(a.id)}">Edit album</button>
      <button class="btn danger" data-act="deleteAlbum" data-id="${esc(a.id)}">Delete album</button>
    </div>
    ${typeof shelfItemSwitch === "function" ? shelfItemSwitch(a.id) : ""}
    <p class="small muted">${isSetAlbum(a) ? "One spot per coin type. Any date fills it." : albumTypes(a).every((id) => EXACT_SLOTS[id]) ? "Spots follow the dates and mint marks this series was struck." : "Spots include every year and mint mark for this series. Use Edit spots to hide any your album doesn't have."} If your album has a spot that's missing here, like a variety, use <b>+ Add a spot</b>.</p>`;
}

/* --- Editing one spot: rename its label, hide/show, or remove --- */
function openSpotEdit(id, i) {
  const a = getAlbum(id);
  const s = a && (a.slots || [])[i];
  if (!s) return;
  const k = slotKey(s);
  const gone = (a.removed || []).includes(k);
  const opts = s.set ? [] : spotVarietyOptions(a, s.y, s.m, slotType(a, s));
  openSheet(`<div class="sheet-head"><h2>${esc(slotLabel(s))}${s.v ? " · " + esc(s.v) : ""}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <form id="spotEditForm" data-id="${esc(a.id)}" data-i="${i}">
      ${s.blank ? `<p class="small muted">A blank spot has no name. Any coin fits it.</p>` : `<label class="f"><span>Variety or label (optional)</span><input type="text" name="v" id="spotV" list="spotVList" value="${esc(s.v || "")}" placeholder="e.g. 7 Tail Feathers" maxlength="60"></label>`}
      <datalist id="spotVList">${opts.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>
      ${opts.length ? `<div class="hint">Red Book varieties for this date: ${opts.map((o) => `<button type="button" class="link-btn" data-act="pickSpotV" data-v="${esc(o)}">${esc(o)}</button>`).join(", ")}</div>` : ""}
      <div class="btn-row">${s.blank ? "" : `<button class="btn primary" type="submit">Save</button>`}
        ${s.custom
          ? `<button class="btn danger" type="button" data-act="deleteSpot" data-id="${esc(a.id)}" data-k="${esc(k)}">Remove spot</button>`
          : `<button class="btn" type="button" data-act="toggleSlot" data-id="${esc(a.id)}" data-k="${esc(k)}">${gone ? "Show spot" : "Hide spot"}</button>`}
      </div>
    </form>`);
}
function saveSpotEdit(form) {
  const a = withSlotIds(getAlbum(form.dataset.id));
  const i = +form.dataset.i;
  const s = a && (a.slots || [])[i];
  if (!s) return;
  const v = String(new FormData(form).get("v") || "").trim();
  const next = { ...s, v };
  if (!v) delete next.v;
  const oldK = slotKey(s), newK = slotKey(next);
  if (newK !== oldK && (a.slots || []).some((x, j) => j !== i && slotKey(x) === newK)) { toast("There's already a spot with that label for this date."); return; }
  const slots = (a.slots || []).slice();
  slots[i] = next;
  const removed = (a.removed || []).map((x) => (x === oldK ? newK : x));
  put("a_" + a.id, { ...a, slots, removed });
  closeSheet();
  toast("Spot saved.");
}

/* --- Adding your own spot to an album (e.g. 1878 8 Tail Feathers) --- */
function spotVarietyOptions(a, y, m, tid) {
  const s = a && BOOK_FACTS[tid || slotType(a, { y, m })];
  if (!s || !y) return [];
  const base = String(y) + (normMint(m) ? "-" + normMint(m) : "");
  const out = new Set();
  Object.values(s).forEach((rows) => rows.forEach((k) => { const [b, v] = k.split("|"); if (v && b === base) out.add(v); }));
  return [...out];
}
function openAddSpot(id) {
  const a = getAlbum(id);
  if (!a) return;
  const set = isSetAlbum(a);
  openSheet(`<div class="sheet-head"><h2>Add a spot</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <form id="spotForm" data-id="${esc(a.id)}">
      <div class="seg" role="radiogroup" style="margin-bottom:10px"><label class="inline-check"><input type="radio" name="kind" value="dated" checked> <span>${set ? "Labeled spot" : "A dated spot"}</span></label>
        <label class="inline-check"><input type="radio" name="kind" value="blank"> <span>Blank spots</span></label></div>
      <div id="spotDated">
      <p class="small muted" style="margin-top:0">For a spot your album has that isn't shown, like a variety. A coin with a matching variety fills it.</p>
      ${set || albumTypes(a).length > 1 ? `<label class="f"><span>Coin type</span><select name="t">${albumTypes(a).map((id) => `<option value="${id}">${esc(TYPE_BY_ID[id].name)}</option>`).join("")}</select></label>
      <div class="hint">To add a type that isn't in this album yet, use Edit album.</div>` : ""}${set ? "" : `<div class="grid2">
        <label class="f"><span>Year</span><input type="number" inputmode="numeric" name="y" id="spotY" placeholder="${a.start}"></label>
        <label class="f"><span>Mint mark</span><select name="m" id="spotM">${MINTS.map((m) => `<option value="${m}">${m || "None (Philadelphia)"}</option>`).join("")}</select></label>
      </div>`}
      ${set ? "" : `<label class="switch"><span>Proof spot</span><input type="checkbox" name="pf"></label>`}
      <label class="f"><span>Variety or label (optional)</span><input type="text" name="v" id="spotV" list="spotVList" placeholder="e.g. 8 Tail Feathers" maxlength="60"></label>
      <datalist id="spotVList"></datalist>
      <div class="hint" id="spotHint"></div>
      ${set ? "" : `<label class="f"><span>Where</span><select name="at"><option value="year">Next to its year</option><option value="start">At the start</option><option value="end">At the end</option></select></label>`}
      </div>
      <div id="spotBlank" hidden>
      <p class="small muted" style="margin-top:0">Empty spots with no name. Any coin fits; they never count in "owned" or Add missing.</p>
      <label class="f"><span>How many</span><input type="number" inputmode="numeric" name="n" min="1" max="200" value="1"></label>
      <label class="f"><span>Where</span><select name="bat"><option value="end">At the end</option><option value="start">At the start</option>${set ? "" : `<option value="after">After a spot (type it)</option>`}</select></label>
      <label class="f" id="spotBlankAfter" hidden><span>After which spot</span><input type="text" name="after" placeholder="e.g. 1963-D" autocomplete="off"></label>
      </div>
      <div class="btn-row"><button class="btn primary" type="submit">Add</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
    </form>`);
}
// "1963-D", "1963 D", "1963" -> the last spot with that date (not a blank, not one of skip). null if none.
function findSpotByText(a, txt, skip) {
  const mm = String(txt || "").trim().toUpperCase().match(/^(\d{4})\s*-?\s*([A-Z]{0,2})/);
  if (!mm) return null;
  const y = +mm[1], m = normMint(mm[2] || "");
  const hits = (a.slots || []).filter((x) => !x.blank && x.y === y && normMint(x.m) === m && !(skip && skip.has(x.id)));
  return hits.length ? hits[hits.length - 1] : null;
}
function refreshSpotHints() {
  const f = $("#spotForm");
  if (!f) return;
  const a = getAlbum(f.dataset.id);
  if (!$("#spotY")) return;
  const opts = spotVarietyOptions(a, num($("#spotY").value), $("#spotM").value);
  $("#spotVList").innerHTML = opts.map((o) => `<option value="${esc(o)}">`).join("");
  $("#spotHint").innerHTML = opts.length ? "Red Book varieties for this date: " + opts.map((o) => `<button type="button" class="link-btn" data-act="pickSpotV" data-v="${esc(o)}">${esc(o)}</button>`).join(", ") : "";
}
function saveSpot(form) {
  const a0 = getAlbum(form.dataset.id);
  if (!a0) return;
  const a = withSlotIds(a0);
  const fd = new FormData(form);
  if (fd.get("kind") === "blank") {
    const n = Math.round(num(fd.get("n")) || 0);
    if (n < 1 || n > 200) { toast("How many blank spots? 1 to 200."); return; }
    const add = Array.from({ length: n }, newBlankSpot);
    const at = fd.get("bat") || "end";
    let slots = (a.slots || []).slice(), free = a.freeOrder;
    if (at === "start") { slots = [...add, ...slots]; free = true; }
    else if (at === "after") {
      const t = findSpotByText(a, fd.get("after"));
      if (!t) { toast("No " + String(fd.get("after") || "").trim() + " spot in this album. Type it like 1963-D."); return; }
      let k = slots.indexOf(t) + 1;
      while (k < slots.length && slots[k].blank) k++; // E1q: a second batch of blank spots after the same date goes after the first
      slots = [...slots.slice(0, k), ...add, ...slots.slice(k)]; free = true;
    } else slots = [...slots, ...add];
    put("a_" + a.id, { ...a, slots, ...(free ? { freeOrder: true } : {}) });
    closeSheet();
    toast(n + " blank spot" + (n === 1 ? "" : "s") + " added.", { label: "Undo", fn: () => put("a_" + a.id, a) });
    return;
  }
  let spot;
  if (isSetAlbum(a)) {
    spot = { id: uid(), set: true, t: fd.get("t"), y: "", m: "", v: String(fd.get("v") || "").trim(), custom: true };
    if (!spot.v) { toast("Give the spot a label, like Bicentennial or 1909 VDB."); return; }
  } else {
    const y = num(fd.get("y"));
    if (!y || y < 1700 || y > thisYear()) { toast("Enter a year."); return; }
    spot = { id: uid(), y, m: normMint(fd.get("m") || ""), v: String(fd.get("v") || "").trim(), custom: true };
    if (fd.get("pf")) spot.pf = true;
    else {
      // Only dates and mint marks the series really had (series the app has no exact list for are not checked).
      const tid0 = albumTypes(a).length > 1 ? fd.get("t") : slotType(a, spot);
      const ex = EXACT_SLOTS[tid0], tn = TYPE_BY_ID[tid0];
      if (ex && tn) {
        const row = ex.find((r) => r[0] === y);
        if (!row) { toast("No " + tn.name + " was made in " + y + "."); return; }
        if (!row[1].split(" ").map(normMint).includes(spot.m)) { toast("No " + tn.name + " was struck " + (spot.m ? "at the " + spot.m + " mint " : "") + "in " + y + ". Mints that year: " + row[1].split(" ").join(", ") + "."); return; }
      }
    }
    if (albumTypes(a).length > 1) {
      spot.t = fd.get("t") || slotType(a, spot);
      const tt = TYPE_BY_ID[spot.t];
      if (tt && (y < tt.start || y > typeLastYear(tt))) { toast(tt.name + " was made " + tt.start + "–" + typeLastYear(tt) + "."); return; }
      // Same date as another type's spot (e.g. 1921 Morgan and 1921 Peace): keep them apart.
      if ((a.slots || []).some((x) => slotKey(x) === slotKey({ ...spot, t: undefined }) && slotType(a, x) !== spot.t)) spot.tx = true;
    }
  }
  if (!spot.v) delete spot.v;
  const k = slotKey(spot);
  if ((a.slots || []).some((x) => slotKey(x) === k)) {
    const wasHidden = (a.removed || []).includes(k);
    if (wasHidden) put("a_" + a.id, { ...a, removed: (a.removed || []).filter((x) => x !== k) });
    if (wasHidden) { closeSheet(); toast("That spot was hidden. It's back now."); return; }
    // E1q bug fix: an exact twin of a dated spot isn't added, but an empty blank spot right after it is offered (as many as you like).
    const twin = (a.slots || []).filter((x) => slotKey(x) === k).pop();
    confirmSheet("That spot is already in the album", "This album already has a " + slotLabel(spot) + (spot.v ? " " + spot.v : "") + " spot. Add an empty blank spot right after it instead? Any coin can go there.", "Add a blank spot", () => {
      const cur = getAlbum(a.id), list = (cur.slots || []).slice(), at = list.findIndex((x) => x.id === twin.id);
      let k2 = at + 1; while (k2 < list.length && list[k2].blank) k2++; // after any blank spots already there, so the newest goes last
      const add = newBlankSpot();
      put("a_" + a.id, { ...cur, slots: [...list.slice(0, k2), add, ...list.slice(k2)], freeOrder: true });
      closeSheet(); render();
      toast("Blank spot added after " + slotLabel(twin) + ".", { label: "Undo", fn: () => { put("a_" + a.id, cur); render(); } });
    });
    return;
  }
  const at = fd.get("at") || "year", cur = a.slots || [];
  let slots, free = a.freeOrder;
  if (isSetAlbum(a) || at === "end") { slots = [...cur, spot]; free = free || (!isSetAlbum(a) && cur.some((x) => !x.blank && x.y > spot.y)); }
  else if (at === "start") { slots = [spot, ...cur]; free = free || cur.some((x) => !x.blank && x.y < spot.y); }
  else slots = a.freeOrder ? insertByYear(cur, spot) : sortSlots([...cur, spot]);
  put("a_" + a.id, { ...a, slots, ...(free ? { freeOrder: true } : {}) });
  closeSheet();
  toast("Spot added: " + slotLabel(spot) + (spot.v ? " " + spot.v : "") + ".");
}

const selFootHtmlSafe = () => (typeof selFootHtml === "function" ? selFootHtml() : "");
