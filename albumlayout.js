/* Step 31 Album layout: blank spots, moving and hiding several spots, putting an album back in year order.
   An album whose spots you moved keeps its own order (album.freeOrder); nothing re-sorts it until "Put back in year order". */

// Pick mode inside Edit spots: ids in the order you tapped them; place = where the yellow bar is (after a spot id, or "__start").
const spotPick = { id: null, ids: [], place: null };
const spotPickOn = (albumId) => spotPick.id === albumId;
function spotPickReset() { spotPick.id = null; spotPick.ids = []; spotPick.place = null; }

// Words for a blank spot in lists: "blank after 1963-D" (or "blank at the start").
function blankName(a, s) {
  const ss = (a && a.slots) || [];
  const i = ss.findIndex((x) => x.id === s.id);
  for (let j = i - 1; j >= 0; j--) if (!ss[j].blank) return "blank after " + slotLabel(ss[j]) + (ss[j].v ? " " + ss[j].v : "");
  return "blank at the start";
}
const spotWords = (a, s) => (s.blank ? blankName(a, s) : slotLabel(s) + (s.v ? " " + s.v : ""));
// A coin sitting in a blank spot shows its own date and short type.
const blankCoinLabel = (c) => [c.year ? c.year + (c.mint && c.mint !== CANT_TELL ? "-" + c.mint : "") : "", c.typeName || ""].filter(Boolean).join(" ") || "Coin";

function spotPickBanner(a) {
  if (!spotPickOn(a.id)) return `<div class="banner" style="margin:0 0 10px">Use ◀ ▶ to put spots in the same order as your album. Tap a spot to rename, hide or remove it. <b>Move spots</b> moves several at once, anywhere.</div>`;
  const n = spotPick.ids.length;
  if (spotPick.place) {
    return `<div class="banner spot-pickbar" style="margin:0 0 10px"><b>Where should ${n} spot${n === 1 ? "" : "s"} go?</b> Tap a spot: the yellow bar goes after it. Nudge with ◀ ▶.
      <div class="btn-row" style="margin-top:8px"><button class="btn" data-act="spotNudge" data-d="-1" aria-label="Bar one spot earlier">◀</button><button class="btn" data-act="spotNudge" data-d="1" aria-label="Bar one spot later">▶</button>
      <button class="btn primary" data-act="spotPutHere" data-id="${esc(a.id)}">Put ${n} here</button><button class="btn" data-act="spotPickCancel">Cancel</button></div></div>`;
  }
  return `<div class="banner spot-pickbar" style="margin:0 0 10px"><b>${n ? n + " picked." : "Tap the spots to move or hide."}</b> ${n ? "They keep the order you tap them in." : "Pick across any years."}
    <div class="btn-row" style="margin-top:8px"><button class="btn primary" data-act="spotMoveOpen" data-id="${esc(a.id)}" ${n ? "" : "disabled"}>Move ${n || ""} spot${n === 1 ? "" : "s"}…</button>
    <button class="btn" data-act="spotHideGo" data-id="${esc(a.id)}" ${n ? "" : "disabled"}>Hide ${n || ""}</button><button class="btn" data-act="spotPickCancel">Cancel</button></div></div>`;
}
function spotPickItem(a, s, hit, gone) {
  const k = spotPick.ids.indexOf(s.id), on = k >= 0;
  const lab = s.blank ? (hit ? blankCoinLabel(hit) : "Blank") : slotLabel(s);
  const tap = spotPick.place ? (on ? "" : `data-act="spotPlaceAt" data-sid="${esc(s.id)}"`) : `data-act="spotPickTog" data-sid="${esc(s.id)}" aria-pressed="${on}"`;
  return `<button class="slot spot-pick${hit ? " have" : ""}${on ? " on" : ""}${s.blank && !hit ? " blank-spot" : ""}" ${tap} style="${gone ? "opacity:.4;" : ""}${on && spotPick.place ? "opacity:.45;" : ""}">${on ? `<span class="pick-n">${k + 1}</span>` : ""}${esc(lab)}${s.v ? `<span class="g">${esc(s.v)}</span>` : ""}<span class="g">${gone ? "hidden" : hit ? "✓ " + esc(slotGrade(hit)) : s.blank ? "" : "open"}</span></button>`;
}
// The yellow bar, drawn after the spot it follows (or before the first spot for "__start").
const spotBarAt = (a, after) => (spotPickOn(a.id) && spotPick.place && spotPick.place.after === after ? `<div class="spot-bar" aria-label="Spots go here"></div>` : "");

// Move picked spots to a place: after a spot id, "__start" or "__end". They keep the order they were picked. One Undo.
function moveSpotsTo(albumId, ids, after) {
  const a = withSlotIds(getAlbum(albumId));
  if (!a) return false;
  const pick = new Set(ids);
  const moving = ids.map((id) => (a.slots || []).find((x) => x.id === id)).filter(Boolean);
  const rest = (a.slots || []).filter((x) => !pick.has(x.id));
  let at = after === "__start" ? 0 : after === "__end" ? rest.length : rest.findIndex((x) => x.id === after) + 1;
  if (after !== "__start" && after !== "__end" && at === 0) return false;
  const slots = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
  put("a_" + a.id, { ...a, slots, freeOrder: true });
  spotPickReset();
  if (!$("#sheet").hidden) closeSheet();
  render();
  toast("Moved " + moving.length + " spot" + (moving.length === 1 ? "" : "s") + ".", { label: "Undo", fn: () => { put("a_" + a.id, a); render(); } });
  return true;
}

function openSpotMove(albumId) {
  const a = getAlbum(albumId);
  if (!a || !spotPick.ids.length) return;
  const n = spotPick.ids.length;
  const words = spotPick.ids.map((id) => (a.slots || []).find((x) => x.id === id)).filter(Boolean).map((s) => spotWords(a, s));
  openSheet(`<div class="sheet-head"><h2>Move ${n} spot${n === 1 ? "" : "s"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p class="small muted" style="margin-top:0">In this order: ${esc(words.join(", "))}</p>
    <form id="spotMoveForm" data-id="${esc(a.id)}">
      <label class="f"><span>Put them after</span><input type="text" name="after" id="spotMoveAfter" placeholder="Year and mint, e.g. 1963-D" autocomplete="off"></label>
      <button class="btn primary block" type="submit">Put them there</button>
    </form>
    <button class="btn block" style="margin-top:10px" data-act="spotPlaceMode" data-id="${esc(a.id)}">Tap where in the album</button>
    <div class="btn-row" style="margin-top:10px"><button class="btn" data-act="spotMoveEdge" data-id="${esc(a.id)}" data-w="__start">To the start</button><button class="btn" data-act="spotMoveEdge" data-id="${esc(a.id)}" data-w="__end">To the end</button></div>
    <div class="hint">Coins stay in their spots and move with them. Undo puts everything back.</div>`);
}
function saveSpotMove(form) {
  const a = getAlbum(form.dataset.id);
  if (!a) return;
  const txt = String(new FormData(form).get("after") || "").trim();
  const t = findSpotByText(a, txt, new Set(spotPick.ids));
  if (!t) { toast(txt ? "No " + txt + " spot in this album (other than the ones you picked)." : "Type a year and mint, like 1963-D."); return; }
  moveSpotsTo(a.id, spotPick.ids.slice(), t.id);
}

// Hide the picked spots. Asks first if any holds a coin (the coin stays in the album). One Undo.
function hidePickedSpots(albumId, ok) {
  const a = getAlbum(albumId);
  if (!a || !spotPick.ids.length) return;
  const ss = spotPick.ids.map((id) => (a.slots || []).find((x) => x.id === id)).filter(Boolean);
  const st = albumStats(a), full = ss.filter((s) => st.filled.has(slotKey(s)));
  if (full.length && !ok) {
    confirmSheet("Hide " + ss.length + " spot" + (ss.length === 1 ? "" : "s") + "?", full.length + " of them hold" + (full.length === 1 ? "s" : "") + " a coin (" + full.map((s) => spotWords(a, s)).slice(0, 4).join(", ") + (full.length > 4 ? "…" : "") + "). Hide anyway? The coins stay in the album.", "Hide spots", () => hidePickedSpots(albumId, true));
    return;
  }
  const removed = new Set(a.removed || []);
  ss.forEach((s) => removed.add(slotKey(s)));
  put("a_" + a.id, { ...a, removed: [...removed] });
  spotPickReset();
  if (!$("#sheet").hidden) closeSheet();
  render();
  toast("Hid " + ss.length + " spot" + (ss.length === 1 ? "" : "s") + ".", { label: "Undo", fn: () => { put("a_" + a.id, a); render(); } });
}

// "Put back in year order": within a year the album's own spots first (in the order the app makes them, a proof right after
// its regular spot), then spots you added for that year; blank spots go to the end in their current order. One Undo.
function yearOrderSlots(a) {
  const ss = a.slots || [];
  const pf = a.proofs === true ? "all" : a.proofs || "";
  const info = typeof lookupAlbum === "function" ? lookupAlbum(a.brand, a.number) : null;
  const ref = buildAlbumSlots(albumTypes(a), "dates", a.start, a.end, pf, info && info.spotVarieties);
  const rank = new Map();
  ref.forEach((s, i) => { const k = slotKey(s); if (!rank.has(k)) rank.set(k, i); });
  const regOf = (s) => ss.find((x) => !x.custom && !x.blank && !x.pf && !x.v && x.y === s.y && normMint(x.m) === normMint(s.m) && (!x.tx || x.t === s.t));
  const key = (s, i) => {
    if (s.blank) return [1e9, 2, i, i];
    if (s.custom) return [s.y, 1, 0, i];
    let r = rank.has(slotKey(s)) ? rank.get(slotKey(s)) : 1e6 + i;
    if (s.pf) { const g = regOf(s); if (g && rank.has(slotKey(g))) r = rank.get(slotKey(g)) + 0.5; }
    return [s.y, 0, r, i];
  };
  return ss.map((s, i) => [s, key(s, i)]).sort((x, y) => { for (let k = 0; k < 4; k++) if (x[1][k] !== y[1][k]) return x[1][k] - y[1][k]; return 0; }).map((p) => p[0]);
}
function putBackYearOrder(albumId) {
  const a0 = getAlbum(albumId);
  if (!a0 || isSetAlbum(a0)) return;
  const a = withSlotIds(a0);
  const next = { ...a, slots: yearOrderSlots(a) };
  delete next.freeOrder;
  put("a_" + a.id, next);
  render();
  toast("Spots are back in year order.", { label: "Undo", fn: () => { put("a_" + a.id, a); render(); } });
}

// Tapping an empty blank spot: a new coin, or a coin you already have (like a box spot).
const blankCandidates = () => ownedCoins().filter((c) => !(c.albumId && getAlbum(c.albumId)) && qtyOf(c) === 1 && itemOf(c) === "coin").sort((x, y) => labelOf(x).localeCompare(labelOf(y)));
function openBlankMenu(a, s) {
  const have = blankCandidates();
  const at = `data-album="${esc(a.id)}" data-sid="${esc(s.id)}" data-y="" data-m="" data-v=""`;
  openSheet(`<div class="sheet-head"><h2>Blank spot</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="small muted" style="margin:-4px 0 12px">${esc(albumTitle(a))} · ${esc(blankName(a, s))}. Any coin fits.</div>
    <button class="btn primary block btn-addcoin" data-act="slotHave" ${at}>＋ New coin</button>
    ${have.length ? `<label class="f" style="margin-top:14px"><span>A coin I have</span><select data-flt="blankHave"><option value="">Pick a coin…</option>${have.map((c) => `<option value="${esc(c.id)}">${esc(labelOf(c))}</option>`).join("")}</select></label>
    <button class="btn block" data-act="blankHave" ${at} style="margin-top:8px">Put it here</button>
    <div class="hint">Only single coins that are not in an album. It leaves where it was kept. One Undo.</div>` : `<div class="hint" style="margin-top:10px">No loose coins to put here. Coins already in an album can be moved from their own spot.</div>`}`);
}
function blankHave(el) {
  const a = getAlbum(el.dataset.album), sel = document.querySelector('#sheet [data-flt="blankHave"]');
  const c = sel && sel.value ? getCoin(sel.value) : null;
  if (!a) return;
  if (!c) { toast("Pick a coin first."); return; }
  const aa = withSlotIds(a), s = (aa.slots || []).find((x) => x.id === el.dataset.sid);
  if (!s || albumStats(aa).filled.has(slotKey(s))) { toast("That spot just got filled."); return; }
  const before = { ...c }, next = { ...c };
  applyKept(next, "a:" + a.id, true);
  next.slotId = s.id;
  saveCoin(next); closeSheet(); render();
  toast("Put in " + albumTitle(a) + ", " + blankName(aa, s) + ".", { label: "Undo", fn: () => { saveCoin(before); render(); } });
}

Object.assign(actions, {
  spotPickStart: (el) => { spotPickReset(); spotPick.id = el.dataset.id; render(); },
  spotPickCancel: () => { spotPickReset(); render(); },
  spotPickTog: (el) => { const i = spotPick.ids.indexOf(el.dataset.sid); if (i >= 0) spotPick.ids.splice(i, 1); else spotPick.ids.push(el.dataset.sid); render(); },
  spotMoveOpen: (el) => openSpotMove(el.dataset.id),
  spotMoveEdge: (el) => moveSpotsTo(el.dataset.id, spotPick.ids.slice(), el.dataset.w),
  spotPlaceMode: (el) => {
    const a = getAlbum(el.dataset.id);
    const first = a && (a.slots || []).find((x) => !spotPick.ids.includes(x.id));
    spotPick.place = { after: first ? first.id : "__start" };
    closeSheet(); render();
  },
  spotPlaceAt: (el) => { if (spotPick.place) { spotPick.place.after = el.dataset.sid; render(); } },
  spotNudge: (el) => {
    const a = getAlbum(spotPick.id);
    if (!a || !spotPick.place) return;
    const order = ["__start", ...(a.slots || []).filter((x) => !spotPick.ids.includes(x.id)).map((x) => x.id)];
    const i = Math.max(0, order.indexOf(spotPick.place.after)), j = Math.min(order.length - 1, Math.max(0, i + (+el.dataset.d)));
    spotPick.place.after = order[j]; render();
  },
  spotPutHere: (el) => moveSpotsTo(el.dataset.id, spotPick.ids.slice(), spotPick.place ? spotPick.place.after : "__end"),
  spotHideGo: (el) => hidePickedSpots(el.dataset.id),
  spotYearOrder: (el) => putBackYearOrder(el.dataset.id),
  blankHave,
});
["spotPickStart", "spotMoveOpen", "spotMoveEdge", "spotPlaceMode", "spotPutHere", "spotHideGo", "spotYearOrder", "blankHave"].forEach((x) => SNAPSHOT_BLOCK.add(x));

document.addEventListener("submit", (e) => { if (e.target.id === "spotMoveForm") { e.preventDefault(); saveSpotMove(e.target); } });
// Add a spot: switch between a dated spot and blank spots; "After a spot" shows its box.
document.addEventListener("change", (e) => {
  const f = e.target.form;
  if (!f || f.id !== "spotForm") return;
  if (e.target.name === "kind") { const b = e.target.value === "blank"; $("#spotDated").hidden = b; $("#spotBlank").hidden = !b; }
  if (e.target.name === "bat") $("#spotBlankAfter").hidden = e.target.value !== "after";
});
