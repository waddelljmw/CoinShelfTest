/* "What I need" (step 43b, idea 168): replaces the Want List page.
   Albums tab: worked out each time from album gaps (Need) and upgrades (Upgrade); nothing is saved for it.
   Lists tab: the want lists, unchanged.
   Saved fields (all optional, missing = off, so old data needs no conversion):
     album.aimFor ("AU-50"), album.aimOriginals (true = original-to-album coins count too)
     want.priority (true = in the Priority section), want.maxPriceAt (when "pay up to" was set, ms) */

// Grade as a number to compare: "AU-50" → 50, "MS-64" → 64, "PR-65" → 65, Junk (Cull) → 0.
const gradeNum = (g) => (g === "Junk" ? 0 : num(String(g || "").split("-")[1]));
const aimShort = (g) => (g ? g.split("-")[0] + "+" : ""); // "AU-50" → "AU+"
// Does the album's target count this coin? Inherited coins never; original-to-album coins only with the switch on.
const aimCounts = (a, c) => !!a.aimFor && itemOf(c) === "coin" && !isInherited(c) && (!c.origAlbum || !!a.aimOriginals);
// Below the album's target? A coin with no grade counts as below (his call 11-27: pocket change needs upgrading too).
const belowAim = (a, c) => aimCounts(a, c) && (!c.grade || gradeNum(c.grade) == null || gradeNum(c.grade) < gradeNum(a.aimFor));

// One row per spot that needs something. kind: "need" (empty) or "up" (has a coin, wants a better one).
function albumNeedRows(a) {
  const st = albumStats(a), rows = [];
  st.slots.forEach((s) => {
    const coin = st.filled.get(slotKey(s)) || null;
    const ws = spotWants(a, s);
    const t = TYPE_BY_ID[slotType(a, s)];
    const label = s.set ? (t ? t.name : "Coin") : [String(s.y) + (s.m ? "-" + s.m : ""), t ? shortName(t) : "", s.pf ? "Proof" : ""].filter(Boolean).join(" ") + (s.v ? " · " + s.v : "");
    let kind = "";
    if (!coin) kind = "need";
    else if (coin.upgrade || ws.some(isUpgradeWant) || belowAim(a, coin)) kind = "up";
    if (!kind) return;
    const w = (kind === "up" ? ws.find(isUpgradeWant) : ws[0]) || ws[0] || null;
    const target = (w && w.grade) || (a.aimFor && (!coin || aimCounts(a, coin)) ? a.aimFor : "") || (kind === "up" && coin ? upgradeGrade(coin) : "");
    rows.push({ key: a.id + "|" + slotKey(s), a, s, kind, coin, want: w, label, target });
  });
  return rows;
}
const rowWords = (r) => (r.label + " " + albumTitle(r.a)).toLowerCase().replace(/-/g, " ");
const rowMatches = (r, q) => q.toLowerCase().replace(/-/g, " ").split(/\s+/).filter(Boolean).every((w) => rowWords(r).split(/\s+/).some((x) => x.startsWith(w)));

const MONTH_MS = 30.44 * 864e5;
function oldPriceHint(w) {
  if (!w || num(w.maxPrice) == null || !w.maxPriceAt) return "";
  const mo = Math.floor((Date.now() - w.maxPriceAt) / MONTH_MS);
  return mo >= 3 ? `<div class="small win-old">${mo} mo old</div>` : "";
}
function winRowHtml(r) {
  const w = r.want, up = r.kind === "up", star = !!(w && w.priority);
  const fake = { ...wantAsCoin({ typeId: slotType(r.a, r.s), year: r.s.set ? "" : r.s.y, mint: r.s.m, variety: r.s.v || "" }), grade: r.target || "" };
  const have = up ? (r.coin && r.coin.grade ? "have " + gradeText(r.coin) : "have: not graded") : "";
  return `<div class="coin-row win-row" style="display:flex;gap:8px;align-items:flex-start">
    <button class="win-star${star ? " on" : ""}" data-act="winStar" data-k="${esc(r.key)}" aria-pressed="${star}" aria-label="${star ? "Take out of Priority" : "Move to Priority"}">${star ? "★" : "☆"}</button>
    <span class="win-body"><button class="win-main" data-act="winCard" data-k="${esc(r.key)}">
      <span class="coin-label">${esc(r.label)}</span>
      <span class="coin-sub"><span class="win-tag ${up ? "up" : "need"}">${up ? "Upgrade" : "Need"}</span>${have ? " " + esc(have) : ""}${r.target ? " · " + esc(aimShort(r.target)) : ""}</span>
    </button><a class="small" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a></span>
    ${w && num(w.maxPrice) != null ? `<span class="coin-val" style="text-align:right;flex:0 0 auto"><div>up to ${money(num(w.maxPrice))}</div>${oldPriceHint(w)}</span>` : ""}
  </div>`;
}

const winState = { tab: "albums", q: "", f: "all", album: "", open: {}, qOpen: {} }; // qOpen: folds made while searching or on one album, so your own folds (open) are left alone
let winFocus = false;
function allNeedRows() { return albums().flatMap(albumNeedRows); }
function winRowByKey(k) { return allNeedRows().find((r) => r.key === k); }

function albumsTabHtml() {
  let rows = allNeedRows();
  const albumIds = [...new Set(rows.map((r) => r.a.id))];
  if (winState.album && !albumIds.includes(winState.album)) winState.album = "";
  if (winState.f !== "all") rows = rows.filter((r) => r.kind === winState.f);
  if (winState.album) rows = rows.filter((r) => r.a.id === winState.album);
  if (winState.q.trim()) rows = rows.filter((r) => rowMatches(r, winState.q));
  const pri = rows.filter((r) => r.want && r.want.priority), rest = rows.filter((r) => !(r.want && r.want.priority));
  const groups = [];
  rest.forEach((r) => { let g = groups.find((x) => x.a.id === r.a.id); if (!g) groups.push((g = { a: r.a, rows: [] })); g.rows.push(r); });
  const narrowed = !!(winState.q.trim() || winState.album);
  const chip = (v, n) => `<button class="chip ${winState.f === v ? "on" : ""}" data-act="winF" data-v="${v}">${n}</button>`;
  return `<div class="toolbar" style="margin:0 0 8px"><input type="search" id="winQ" placeholder="Search, like 1949 S" aria-label="Search what I need" value="${esc(winState.q)}"></div>
    <div class="chips" style="margin-bottom:8px">${chip("all", "All")}${chip("need", "Need")}${chip("up", "Upgrade")}
      <select id="winAlbum" aria-label="Album" style="margin-left:4px"><option value="">All albums</option>${albumIds.map((id) => { const a = getAlbum(id); return `<option value="${esc(id)}" ${winState.album === id ? "selected" : ""}>${esc(albumTitle(a))}</option>`; }).join("")}</select></div>
    ${pri.length ? `<h2 style="font-size:16px;margin:12px 2px 4px">★ Priority</h2><div class="list">${pri.map(winRowHtml).join("")}</div>` : ""}
    ${groups.map((g) => {
      const need = g.rows.filter((r) => r.kind === "need").length, up = g.rows.length - need;
      const open = narrowed ? winState.qOpen[g.a.id] ?? true : winState.open[g.a.id] ?? g.rows.length <= 8;
      return `<h2 class="fold"><button class="fold-btn" data-act="winFold" data-id="${esc(g.a.id)}" aria-expanded="${open}"><span>${esc(albumTitle(g.a))} <span class="small muted">${[need ? need + " need" : "", up ? up + " upgrade" : ""].filter(Boolean).join(" · ")}${g.a.aimFor ? " · aim " + esc(aimShort(g.a.aimFor)) : ""}</span></span><i aria-hidden="true">${open ? "▾" : "▸"}</i></button></h2>${open ? `<div class="list">${g.rows.map(winRowHtml).join("")}</div>` : ""}`;
    }).join("")}
    ${rows.length ? "" : `<div class="card empty">${albums().length ? (narrowed || winState.f !== "all" ? "Nothing matches." : "Every album spot is filled and nothing needs an upgrade.") : "Add an album and its empty spots show up here by themselves."}</div>`}
    <div class="hint" style="margin-top:12px">Empty spots show as Need. Coins show as Upgrade when you tick Upgrade wanted, or when they're below the album's "Aim for" grade (Edit album).</div>`;
}
function viewWants() {
  const tab = (v, n) => `<button class="chip ${winState.tab === v ? "on" : ""}" data-act="winTab" data-v="${v}" aria-pressed="${winState.tab === v}">${n}</button>`;
  return `<h1>What I need</h1><div class="chips" style="margin-bottom:12px">${tab("albums", "Albums")}${tab("lists", "Lists")}</div>
    ${winState.tab === "lists" ? wantListsHtml() : albumsTabHtml()}`;
}

// Starring or pricing a spot with no want yet quietly makes one, tied to that spot (General list). It goes when the spot fills.
function ensureRowWant(r) {
  if (r.want) return r.want;
  ensureDefaultList();
  const w = newWant({ typeId: slotType(r.a, r.s), year: r.s.set ? "" : r.s.y, mint: r.s.m, variety: r.s.v || "", pf: !!r.s.pf, albumId: r.a.id, listId: DEFAULT_LIST_ID, grade: r.target || "", notes: r.kind === "up" ? "Upgrade" : "" });
  saveWant(w);
  return w;
}
function openWinCard(k) {
  const r = winRowByKey(k);
  if (!r) return;
  const w = r.want, fake = { ...wantAsCoin({ typeId: slotType(r.a, r.s), year: r.s.set ? "" : r.s.y, mint: r.s.m, variety: r.s.v || "" }), grade: r.target || "VF-20" };
  const own = typeof youOwnLine === "function" ? youOwnLine(fake) : "";
  openSheet(`<div class="sheet-head"><h2>${esc(r.label)}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="small muted" style="margin:-4px 0 10px"><span class="win-tag ${r.kind === "up" ? "up" : "need"}">${r.kind === "up" ? "Upgrade" : "Need"}</span> ${esc(albumTitle(r.a))}${r.coin ? " · have " + esc(r.coin.grade ? gradeText(r.coin) : "not graded") : ""}</div>
    ${typeof coinCardHtml === "function" ? coinCardHtml(fake, { spot: !r.s.set, inAlbum: !!r.coin }) : own}
    <div class="card">
      <div class="rowline"><span class="muted">Target</span><span>${r.target ? esc(r.target) + " or better" : "Any grade"}</span></div>
      <div class="rowline"><span class="muted">Pay up to</span><span>${w && num(w.maxPrice) != null ? money(num(w.maxPrice)) + ` <button class="link-btn" data-act="winPrice" data-k="${esc(k)}">edit</button>` : `<button class="link-btn" data-act="winPrice" data-k="${esc(k)}">Pay up to… (not set)</button>`}</span></div>
      ${oldPriceHint(w)}
    </div>
    <button class="btn block btn-addcoin" data-act="winBought" data-k="${esc(k)}">Bought it</button>
    <div class="btn-row">
      <button class="btn" data-act="winStar" data-k="${esc(k)}">${w && w.priority ? "★ Take out of Priority" : "☆ Priority"}</button>
      <button class="btn" data-act="winOpenAlbum" data-id="${esc(r.a.id)}">Open in album</button>
      <a class="btn" style="text-align:center;text-decoration:none;color:inherit" href="${esc(ebayUrl(fake))}" target="_blank" rel="noopener">eBay sold ↗</a>
    </div>`);
}
function openWinPrice(k) {
  const r = winRowByKey(k);
  if (!r) return;
  const p = r.want && num(r.want.maxPrice);
  openSheetOver(`<div class="sheet-head"><h2>Pay up to</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p><b>${esc(r.label)}</b>${r.target ? ` <span class="small muted">${esc(r.target)} or better</span>` : ""}</p>
    <form id="winPriceForm" data-k="${esc(k)}"><label class="f"><span>Most you'd pay ($)</span><input type="number" name="p" inputmode="decimal" step="0.01" min="0" value="${p != null ? p : ""}"></label>
    <div class="hint">Leave it empty to clear it. The date is kept so an old price shows "mo old".</div>
    <div class="btn-row"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-act="closeSheet">Cancel</button></div></form>`);
}
function saveWinPrice(form) {
  const r = winRowByKey(form.dataset.k);
  if (!r) return;
  const p = num(new FormData(form).get("p"));
  if (p == null && !r.want) { closeSheet(); return; }
  const w = ensureRowWant(r);
  saveWant({ ...w, maxPrice: p ?? "", maxPriceAt: p != null ? Date.now() : undefined });
  closeSheet();
  toast(p != null ? "Pay up to " + money(p) + "." : "Price cleared.");
  render();
}
// Q3 (11-27): when a coin reaches the album's target, its quiet upgrade want goes away by itself (a want you made for a higher grade stays).
function aimCleanup(c) {
  const a = c && c.albumId && getAlbum(c.albumId);
  if (!a || !a.aimFor || c.upgrade || belowAim(a, c) || !aimCounts(a, c)) return;
  const st = albumStats(a);
  const s = st.slots.find((x) => { const h = st.filled.get(slotKey(x)); return h && h.id === c.id; });
  if (s) spotWants(a, s).filter((w) => isUpgradeWant(w) && w.grade === a.aimFor).forEach((w) => remove("w_" + w.id));
}
// Edit album: "Aim for" target grade + the originals switch.
function albumAimField(a) {
  const g = (a && a.aimFor) || "";
  return `<label class="f"><span>Aim for (grade or better)</span><select name="aimFor"><option value="">No target</option>${GRADES.filter((x) => x !== "Junk").map((x) => `<option ${x === g ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <div class="hint" style="margin-top:-4px">Coins below it show as Upgrade on What I need. Inherited coins never do.</div>
    <label class="f inline-check"><input type="checkbox" name="aimOriginals" ${a && a.aimOriginals ? "checked" : ""}> <span>Upgrade original coins too</span></label>`;
}
function readAlbumAim(fd, a) {
  const out = { ...a };
  const g = String(fd.get("aimFor") || "");
  if (g && GRADES.includes(g)) out.aimFor = g; else delete out.aimFor;
  if (fd.get("aimOriginals")) out.aimOriginals = true; else delete out.aimOriginals;
  return out;
}

Object.assign(actions, {
  winTab: (el) => { winState.tab = el.dataset.v; render(); },
  winF: (el) => { winState.f = el.dataset.v; render(); },
  winFold: (el) => { const id = el.dataset.id; (winState.q.trim() || winState.album ? winState.qOpen : winState.open)[id] = el.getAttribute("aria-expanded") !== "true"; render(); },
  winCard: (el) => openWinCard(el.dataset.k),
  winPrice: (el) => openWinPrice(el.dataset.k),
  winStar: (el) => {
    const r = winRowByKey(el.dataset.k);
    if (!r) return;
    const w = ensureRowWant(r);
    const on = !w.priority, nw = { ...w };
    if (on) nw.priority = true; else delete nw.priority;
    saveWant(nw);
    toast(on ? "Moved to Priority." : "Back in its album.");
    if ($("#sheet") && !$("#sheet").hidden) openWinCard(el.dataset.k);
    render();
  },
  winBought: (el) => {
    const r = winRowByKey(el.dataset.k);
    if (!r) return;
    closeSheet();
    const w = ensureRowWant(r);
    gotWant(w.id);
  },
  winOpenAlbum: (el) => { closeSheet(); go("album-" + el.dataset.id); },
});
document.addEventListener("input", (e) => {
  if (e.target.id === "winQ") { winState.q = e.target.value; winState.qOpen = {}; winFocus = true; render(); }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "winAlbum") { winState.album = e.target.value; winState.qOpen = {}; render(); }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "winPriceForm") { e.preventDefault(); saveWinPrice(e.target); }
});
