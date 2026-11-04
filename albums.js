// Albums: spots, stats, album pages and spot editing (split from app.js; plain script, shares the page's global names)
/* --- Albums --- */
// Spine color picker (used for "Other" brand albums; Whitman, Dansco, Harris and Littleton have their own colors).
const albumColorField = (val) => `<label class="f"><span>Spine color <span class="muted small">(used when the brand is Other)</span></span><select name="color">${BOX_COLORS.filter((x) => x[0] !== "clear").map((x) => `<option value="${x[0]}" ${(val || "red") === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>`;
const albumTitle = (a) => a.name || [a.brand, a.number].filter(Boolean).join(" ") || "Album";
// A slot is one spot in an album: year, mint mark, and optionally a variety (e.g. "8 Tail Feathers").
// Type-set spots ("set") hold one coin of a type, any date. "tx" marks a date spot shared by two of the album's types.
// "pf" marks a proof spot (only a coin with a PR grade fills it).
const slotKey = (s) => (s.set ? "set:" + s.t : s.y + "|" + s.m) + (s.v ? "|" + s.v : "") + (s.pf ? "|PF" : "") + (s.tx ? "#" + s.t : "");
const slotLabel = (s) => (s.set ? (TYPE_BY_ID[s.t] ? shortName(TYPE_BY_ID[s.t]) : "Coin") : s.y + (s.m ? "-" + s.m : "") + (s.pf ? " Proof" : ""));
// Years Red Book lists proofs for a type. US proofs moved from Philadelphia (no mint mark) to San Francisco in 1968.
const proofYears = (typeId) => { const p = PRICE_BOOK.series[typeId] && PRICE_BOOK.series[typeId].proof; return p ? [...new Set(Object.keys(p.rows).map((k) => +k.split("|")[0].split("-")[0]))].sort((x, y) => x - y) : []; };
const proofMint = (typeId, y) => { const p = PRICE_BOOK.series[typeId].proof.rows; const k = Object.keys(p).find((x) => x.split("|")[0].startsWith(y + "-")); return k ? normMint(k.split("|")[0].split("-")[1]) : y >= 1968 ? "S" : ""; };
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
function buildAlbumSlots(types, layout, start, end, proofs) {
  if (layout === "set") return types.map((id) => ({ id: uid(), set: true, t: id, y: "", m: "" }));
  const out = [], seen = new Set();
  types.forEach((id) => {
    const t = TYPE_BY_ID[id];
    if (!t) return;
    buildSlots(id, Math.max(start, t.start), Math.min(end, typeLastYear(t))).forEach((s) => {
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
// Short grade for an album card: "VF-20", "PCGS MS-63", or "owned" when no grade was entered.
function slotGrade(c) {
  const g = c.grade === "Other" ? c.customGrade : c.grade;
  if (!g) return "owned";
  return c.gradeMode === "cert" ? [c.service === "Other" ? c.customService : c.service, g].filter(Boolean).join(" ") : g;
}
// Years always stay in order; within a year, spots keep the order you gave them.
function sortSlots(slots) {
  return slots.map((x, i) => [x, i]).sort((a, b) => a[0].y - b[0].y || a[1] - b[1]).map((p) => p[0]);
}
// Give every spot a stable id (older albums were saved without them). Returns the album, with ids.
function withSlotIds(a) {
  if (!a || (a.slots || []).every((s) => s.id)) return a;
  const b = { ...a, slots: (a.slots || []).map((s) => (s.id ? s : { ...s, id: uid() })) };
  put("a_" + b.id, b);
  return b;
}
function buildSlots(typeId, start, end) {
  const t = TYPE_BY_ID[typeId];
  if (!t) return [];
  const out = [];
  if (EXACT_SLOTS[typeId]) {
    EXACT_SLOTS[typeId].forEach(([y, ms]) => {
      if (y < start || y > end) return;
      ms.split(" ").forEach((m) => {
        // Some dates have a spot per variety (e.g. 1909 VDB, the four 2009 designs); "" is the plain spot.
        const vs = (t.varieties && t.varieties[y + "|" + normMint(m)]) || [""];
        vs.forEach((v) => out.push(v ? { id: uid(), y, m: normMint(m), v } : { id: uid(), y, m: normMint(m) }));
      });
    });
  } else {
    for (let y = start; y <= end; y++) t.mints.forEach((m) => out.push({ id: uid(), y, m: normMint(m) }));
  }
  return out;
}
function albumStats(a) {
  const coins = ownedCoins().filter((c) => c.albumId === a.id);
  const slots = albumSlots(a);
  const filled = new Map();
  const used = new Set();
  const multi = albumTypes(a).length > 1 || isSetAlbum(a);
  // Does this coin fit this spot? Type sets match by type; date spots by date (and type, if the album has several).
  const pfOk = (c, s) => (s.pf ? isProofGrade(c.grade) : !(a.proofs && isProofGrade(c.grade)));
  const sameDate = (c, s) => (s.set ? c.typeId === s.t : num(c.year) === s.y && normMint(c.mint) === s.m && (!multi || c.typeId === slotType(a, s)) && pfOk(c, s));
  // 1) Coins added to a specific spot stay in that spot, whatever it's renamed or moved to.
  slots.forEach((s) => {
    if (!s.id) return;
    const hit = coins.find((c) => !used.has(c.id) && c.slotId === s.id && sameDate(c, s));
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  // 2) Other coins: variety spots by matching variety, then plain spots by date.
  slots.filter((s) => s.v && !filled.has(slotKey(s))).forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && sameDate(c, s) && (varietyFits(c.variety, s.v) || varietyFits(c.spotVariety, s.v)));
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  slots.filter((s) => !s.v && !filled.has(slotKey(s))).forEach((s) => {
    const hit = coins.find((c) => !used.has(c.id) && sameDate(c, s) && !(c.slotId && slots.some((x) => x.id === c.slotId))) || null;
    if (hit) { filled.set(slotKey(s), hit); used.add(hit.id); }
  });
  return {
    coins, slots, filled,
    owned: filled.size, total: slots.length,
    value: sum(coins, (c) => (bestEach(c) || 0) * qtyOf(c)),
    melt: sum(coins, (c) => (meltEach(c) || 0) * qtyOf(c)),
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
// Move one album (within its series) or a whole series (d = -1 up, 1 down).
function moveAlbum(id, d, whole) {
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
      <button class="btn block" data-act="sortAlbumsDate">Sort by date</button>
      <button class="btn primary block" style="margin-top:12px" data-act="reorderAlbums">Done</button>`;
  }
  const card = (a) => {
    const st = albumStats(a);
    const done = st.total && st.owned === st.total;
    const numLine = a.name && (a.brand !== "Other" || a.number) ? [a.brand !== "Other" ? a.brand : "", a.number && "No. " + a.number].filter(Boolean).join(" ") : "";
    return `<button class="card" style="display:block;width:100%;text-align:left" data-go="album-${esc(a.id)}">
        <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(albumTitle(a))}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</b><span class="num">${st.owned}/${st.total}</span></div>
        ${numLine ? `<div class="small">${esc(numLine)}</div>` : ""}
        <div class="small muted">${esc(isSetAlbum(a) ? "Type set · " + albumTypes(a).length + " types" : albumTypeText(a))}${a.start ? " · " + a.start + "–" + a.end : ""} · ${money(st.value, "$0.00")}</div>
        <div class="bar"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div></button>`;
  };
  return `<h1>My Albums</h1>
    <button class="btn primary block" data-act="newAlbum">+ New album</button>
    ${list.length > 1 ? `<div style="text-align:right;margin-top:8px"><button class="link-btn" data-act="reorderAlbums">Reorder albums</button></div>` : ""}
    <div style="margin-top:12px">${list.length ? units.map((u) => u.key ? `<div class="series-box"><div class="series-head"><b>${esc(seriesTitle(u.items))}</b></div>${u.items.map(card).join("")}</div>` : card(u.items[0])).join("") : `<div class="card empty">No albums yet. Make one here, or pick an album number when you add a coin.</div>`}</div>`;
}
const albumEdit = { id: null };
function viewAlbum(r) {
  const a = getAlbum(r.id);
  if (!a) return `<div class="card empty">That album isn't here. <button class="link-btn" data-go="albums">Back to My Albums</button></div>`;
  const st = albumStats(a);
  const done = st.total && st.owned === st.total;
  const editing = albumEdit.id === a.id;
  const extras = st.coins.filter((c) => ![...st.filled.values()].includes(c));
  return `<button class="link-btn" data-go="albums">← My Albums</button>
    <h1 style="margin-top:10px">${esc(albumTitle(a))}${done ? `<span class="check" aria-label="Complete">✓</span>` : ""}</h1>
    <div class="small muted" style="margin:-8px 0 12px">${esc([a.brand, a.number && "No. " + a.number, isSetAlbum(a) ? "Type set" : albumTypeText(a)].filter(Boolean).join(" · "))}${a.start ? " · " + a.start + "–" + a.end : ""}</div>
    <div class="stats">
      <div class="stat"><div class="k">Owned</div><div class="v">${st.owned}/${st.total}</div></div>
      <div class="stat"><div class="k">Missing</div><div class="v">${st.total - st.owned}</div><button class="link-btn small" data-act="missing" data-id="${esc(a.id)}">Show missing</button></div>
      <div class="stat"><div class="k">Album value</div><div class="v">${money(st.value, "$0.00")}</div></div>
      <div class="stat"><div class="k">Album melt</div><div class="v">${money(st.melt, "$0.00")}</div></div>
    </div>
    <div class="bar" style="margin:12px 0 16px"><i style="width:${st.total ? (st.owned / st.total) * 100 : 0}%"></i></div>
    ${typeof shelfItemSwitch === "function" ? shelfItemSwitch(a.id) : ""}
    ${!editing && typeof pageSelHtml === "function" ? pageSelHtml([...st.filled.values(), ...extras]) : ""}
    <div class="btn-row" style="margin:0 0 12px">
      <button class="btn" data-act="addSpot" data-id="${esc(a.id)}">+ Add a spot</button>
      <button class="btn ${editing ? "primary" : ""}" data-act="editSlots" data-id="${esc(a.id)}">${editing ? "Done editing" : "Edit spots"}</button>
    </div>
    ${editing ? `<div class="banner" style="margin:0 0 10px">Use ◀ ▶ to put spots in the same order as your album (within each year). Tap a spot to rename its label, or hide or remove it.</div>` : ""}
    <div class="album-grid">${(editing ? a.slots || [] : st.slots).map((s, i, arr) => {
      const k = slotKey(s);
      const hit = st.filled.get(k);
      const gone = (a.removed || []).includes(k);
      const lab = slotLabel(s);
      const vLine = s.v ? `<span class="g" style="font-weight:600;color:var(--ink)">${esc(s.v)}</span>` : "";
      const data = `data-album="${esc(a.id)}" data-sid="${esc(s.id || "")}" data-y="${s.y}" data-m="${esc(s.m)}" data-v="${esc(s.v || "")}"`;
      if (editing) {
        const canL = i > 0 && arr[i - 1].y === s.y, canR = i < arr.length - 1 && arr[i + 1].y === s.y;
        return `<div class="slot slot-edit" style="${s.custom ? "border-color:var(--accent);" : ""}${gone ? "opacity:.4;" : ""}">
          <button class="slot-name" data-act="spotEdit" data-id="${esc(a.id)}" data-i="${i}" style="${gone ? "text-decoration:line-through" : ""}">${esc(lab)}${vLine}<span class="g">${gone ? "hidden" : s.custom ? "added" : "edit"}</span></button>
          ${canL || canR ? `<span class="slot-mv"><button data-act="moveSpot" data-id="${esc(a.id)}" data-i="${i}" data-d="-1" ${canL ? "" : "disabled"} aria-label="Move earlier">◀</button><button data-act="moveSpot" data-id="${esc(a.id)}" data-i="${i}" data-d="1" ${canR ? "" : "disabled"} aria-label="Move later">▶</button></span>` : ""}
        </div>`;
      }
      const onN = spotWants(a, s).length;
      const tag = onN ? `<span class="g" style="color:var(--accent)">★ ${wantedTag(onN)}</span>` : "";
      return hit
        ? `<button class="slot have${listState.sel ? " sel" + (listState.sel.has(hit.id) ? " on" : "") : ""}" ${listState.sel ? `data-act="selToggle" data-id="${esc(hit.id)}" aria-pressed="${listState.sel.has(hit.id)}"` : `data-act="slotMenu" ${data} data-coin="${esc(hit.id)}"`}>${esc(lab)}${vLine}<span class="g">${esc(slotGrade(hit))}</span>${hit.origAlbum ? `<span class="g" style="color:var(--accent)">original</span>` : ""}${tag}</button>`
        : `<button class="slot" data-act="slotMenu" ${data}${listState.sel ? " disabled" : ""}>${esc(lab)}${vLine}${tag || `<span class="g">open</span>`}</button>`;
    }).join("")}</div>
    ${extras.length ? `<h2>Also in this album</h2><div class="list">${extras.map((c) => (listState.sel && typeof selRow === "function" ? selRow(c) : coinRow(c))).join("")}</div>` : ""}
    ${selFootHtmlSafe()}
    <div class="btn-row">
      ${st.total - st.owned > 0 ? `<button class="btn" data-act="missing" data-id="${esc(a.id)}">★ Add missing to a want list</button>` : ""}
      <button class="btn" data-act="editAlbum" data-id="${esc(a.id)}">Edit album</button>
      <button class="btn danger" data-act="deleteAlbum" data-id="${esc(a.id)}">Delete album</button>
    </div>
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
      <label class="f"><span>Variety or label (optional)</span><input type="text" name="v" id="spotV" list="spotVList" value="${esc(s.v || "")}" placeholder="e.g. 7 Tail Feathers" maxlength="60"></label>
      <datalist id="spotVList">${opts.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>
      ${opts.length ? `<div class="hint">Red Book varieties for this date: ${opts.map((o) => `<button type="button" class="link-btn" data-act="pickSpotV" data-v="${esc(o)}">${esc(o)}</button>`).join(", ")}</div>` : ""}
      <div class="btn-row"><button class="btn primary" type="submit">Save</button>
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
  const s = a && PRICE_BOOK.series[tid || slotType(a, { y, m })];
  if (!s || !y) return [];
  const base = String(y) + (normMint(m) ? "-" + normMint(m) : "");
  const out = new Set();
  Object.values(s).forEach((tab) => Object.keys(tab.rows).forEach((k) => { const [b, v] = k.split("|"); if (v && b === base) out.add(v); }));
  return [...out];
}
function openAddSpot(id) {
  const a = getAlbum(id);
  if (!a) return;
  openSheet(`<div class="sheet-head"><h2>Add a spot</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p class="small muted" style="margin-top:0">For a spot your album has that isn't shown, like a variety. A coin with a matching variety fills it.</p>
    <form id="spotForm" data-id="${esc(a.id)}">
      ${isSetAlbum(a) || albumTypes(a).length > 1 ? `<label class="f"><span>Coin type</span><select name="t">${albumTypes(a).map((id) => `<option value="${id}">${esc(TYPE_BY_ID[id].name)}</option>`).join("")}</select></label>
      <div class="hint">To add a type that isn't in this album yet, use Edit album.</div>` : ""}${isSetAlbum(a) ? "" : `<div class="grid2">
        <label class="f"><span>Year</span><input type="number" inputmode="numeric" name="y" id="spotY" required placeholder="${a.start}"></label>
        <label class="f"><span>Mint mark</span><select name="m" id="spotM">${MINTS.map((m) => `<option value="${m}">${m || "None (Philadelphia)"}</option>`).join("")}</select></label>
      </div>`}
      ${isSetAlbum(a) ? "" : `<label class="switch"><span>Proof spot</span><input type="checkbox" name="pf"></label>`}
      <label class="f"><span>Variety or label (optional)</span><input type="text" name="v" id="spotV" list="spotVList" placeholder="e.g. 8 Tail Feathers" maxlength="60"></label>
      <datalist id="spotVList"></datalist>
      <div class="hint" id="spotHint"></div>
      <div class="btn-row"><button class="btn primary" type="submit">Add spot</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div>
    </form>`);
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
  const a = getAlbum(form.dataset.id);
  if (!a) return;
  const fd = new FormData(form);
  let spot;
  if (isSetAlbum(a)) {
    spot = { id: uid(), set: true, t: fd.get("t"), y: "", m: "", v: String(fd.get("v") || "").trim(), custom: true };
    if (!spot.v) { toast("Give the spot a label, like Bicentennial or 1909 VDB."); return; }
  } else {
    const y = num(fd.get("y"));
    if (!y || y < 1700 || y > thisYear()) { toast("Enter a year."); return; }
    spot = { id: uid(), y, m: normMint(fd.get("m") || ""), v: String(fd.get("v") || "").trim(), custom: true };
    if (fd.get("pf")) spot.pf = true;
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
    closeSheet();
    toast(wasHidden ? "That spot was hidden. It's back now." : "That spot is already in the album.");
    return;
  }
  const all = [...(withSlotIds(a).slots || []), spot];
  put("a_" + a.id, { ...a, slots: isSetAlbum(a) ? all : sortSlots(all) });
  closeSheet();
  toast("Spot added: " + slotLabel(spot) + (spot.v ? " " + spot.v : "") + ".");
}


const selFootHtmlSafe = () => (typeof selFootHtml === "function" ? selFootHtml() : "");
