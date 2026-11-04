/* Coin ID numbers (Step 7.0, styles added in Step 9.5). Default: every item gets an ID like MD-012 (type code + a number that counts up per code).
   settings.idStyle: app (default) | own (renamed codes, settings.idOwn) | running (one number, settings.idRun) | off.
   Numbers are never reused (the next number per code is kept in settings.idNext; the running number under "#run"). Old coins get theirs on read. */
function idCodeOf(c) {
  const it = itemOf(c);
  if (it === "set") return ID_CODES_OTHER.set;
  if (it === "roll") return (c.typeId && ID_CODES[c.typeId]) || ID_CODES_OTHER.roll;
  if (it === "bullion") return c.bShape === "Round" ? ID_CODES_OTHER.round : c.bShape === "Other" || c.bShape === "Shape" ? ID_CODES_OTHER.silverItem : ID_CODES_OTHER.bar;
  if (c.typeId && ID_CODES[c.typeId]) return ID_CODES[c.typeId];
  const fam = String(c.family || "").toLowerCase();
  if (/medal|token/.test(fam)) return ID_CODES_OTHER.medal;
  if (/foreign/.test(fam)) return ID_CODES_OTHER.foreign;
  return ID_CODES_OTHER.coin;
}
const idText = (code, n) => code + "-" + String(n).padStart(3, "0");
const idParts = (s) => { const m = /^([A-Z0-9]{1,6})-(\d+)$/.exec(String(s || "").trim().toUpperCase()); return m ? { code: m[1], n: +m[2] } : null; };
const idStyle = () => { const k = settings().idStyle; return k === "own" || k === "running" || k === "off" ? k : "app"; };
const idClean = (s) => String(s || "").trim().replace(/\s+/g, " ");
const idCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
// How a coin's next ID is made in the current style: { key: counter name, start, text(n) }.
function idPlan(c) {
  const st = idStyle(), s = settings();
  if (st === "running") {
    const r = s.idRun || {}, prefix = String(r.prefix || "").trim(), ds = String(r.start || "").replace(/\D/g, "") || "1";
    return { key: "#run", start: +ds || 1, prefix, text: (n) => prefix + String(n).padStart(ds.length, "0") };
  }
  const base = idCodeOf(c || {});
  const o = st === "own" ? (s.idOwn || {})[base] || {} : {};
  const code = idCode(o.code) || base;
  return { key: code, start: Math.max(1, Math.floor(+o.start) || 1), text: (n) => idText(code, n) };
}
// The number inside an ID for this plan (null if it doesn't fit the plan).
function idNumOf(pl, cid) {
  if (!cid) return null;
  if (pl.key === "#run") {
    const t = String(cid).trim(); if (!t.toUpperCase().startsWith(pl.prefix.toUpperCase())) return null;
    const rest = t.slice(pl.prefix.length); return /^\d+$/.test(rest) ? +rest : null;
  }
  const p = idParts(cid); return p && p.code === pl.key ? p.n : null;
}
const idNormKey = (s) => { const p = idParts(s); return p ? idText(p.code, p.n) : idClean(s).toUpperCase(); };
// Who already has this ID (other than coin `exceptId`)? Old IDs kept from a renumber count too.
function idOwner(cid, exceptId) {
  const want = idNormKey(cid);
  if (!want) return null;
  return allCoins().find((c) => c.id !== exceptId && ((c.cid && idNormKey(c.cid) === want) || (c.oldCids || []).some((o) => idNormKey(o) === want))) || null;
}
// The next number for a plan: never below the start, the saved counter, or any number already in use.
function idNextFor(pl, next) {
  let n = Math.max(next[pl.key] || 1, pl.start);
  allCoins().forEach((o) => { const m = idNumOf(pl, o.cid); if (m != null && n <= m) n = m + 1; });
  return n;
}
// Give every coin without an ID its number, oldest first. Quiet: no screen redraw. Safe to call any time. Does nothing when IDs are off.
let idBusy = false;
function ensureIds() {
  if (idBusy || store.mode === "snapshot" || store.mode === "loading" || idStyle() === "off") return;
  const missing = allCoins().filter((c) => !c.cid);
  if (!missing.length) return;
  idBusy = true;
  try {
    const next = { ...(settings().idNext || {}) }, seen = new Set();
    missing.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)));
    missing.forEach((c) => {
      const pl = idPlan(c);
      if (!seen.has(pl.key)) { seen.add(pl.key); next[pl.key] = idNextFor(pl, next); }
      let n = next[pl.key];
      while (idOwner(pl.text(n))) n++;
      next[pl.key] = n + 1;
      put("c_" + c.id, { ...c, cid: pl.text(n) }, true);
    });
    saveSettings({ idNext: next }, true);
  } finally { idBusy = false; }
}
// After a label is typed by hand: if it fits the current style, move the counter past it so it's never handed out again.
function idBump(v) {
  const next = { ...(settings().idNext || {}) };
  const pl = idStyle() === "running" ? idPlan() : null, p = idParts(v);
  if (pl) { const m = idNumOf(pl, v); if (m != null && (next[pl.key] || 1) <= m) { next[pl.key] = m + 1; saveSettings({ idNext: next }, true); } }
  else if (p && (next[p.code] || 1) <= p.n) { next[p.code] = p.n + 1; saveSettings({ idNext: next }, true); }
}
// Tidy a typed label: any text is allowed. In the app's/own styles, MD-12 becomes MD-012.
function idTidy(text) {
  const v = idClean(text), p = idParts(v), st = idStyle();
  return p && (st === "app" || st === "own") ? idText(p.code, p.n) : v;
}
// Problem with a typed label for coin `exceptId`, or "" if fine.
function idProblem(v, exceptId) {
  if (v.length > 40) return "That label is too long (40 characters at most).";
  const other = idOwner(v, exceptId);
  return other ? v + " is already used by " + labelOf(other) + "." : "";
}
// Change a coin's ID by hand. Returns "" if saved, or a plain-words problem.
function setCoinId(id, text) {
  const c = getCoin(id);
  if (!c) return "That coin isn't here.";
  const v = idTidy(text);
  if (!v) {
    if (idStyle() !== "off") return "Type an ID, or choose \"Off\" for Coin ID style in Options to leave them blank.";
    saveCoin({ ...c, cid: "" }); return "";
  }
  const bad = idProblem(v, id);
  if (bad) return bad;
  idBump(v);
  saveCoin({ ...c, cid: v });
  return "";
}
// Add-coin form: the ID the next new coin will get ("" when IDs are off).
function nextIdPreview(d) {
  if (idStyle() === "off") return "";
  const pl = idPlan(d || {}), next = settings().idNext || {};
  let n = idNextFor(pl, next);
  while (idOwner(pl.text(n))) n++;
  return pl.text(n);
}
// Check a label typed on the Add/Edit coin form. Returns a problem, or "" (and tidies c.cid).
function checkTypedId(c) {
  if (c.cid == null) return "";
  const v = idTidy(c.cid);
  if (!v) { delete c.cid; return ""; }
  const bad = idProblem(v, c.id);
  if (bad) return bad;
  c.cid = v;
  if (!getCoin(c.id) || getCoin(c.id).cid !== v) idBump(v);
  return "";
}
// "Renumber my coins": owned coins, oldest first, from the style's start. Old IDs are kept (c.oldCids). Returns how many changed.
function renumberCoins() {
  if (idStyle() === "off") return 0;
  const all = allCoins();
  const owned = all.filter((c) => c.status === "owned").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)));
  const fixed = new Set();
  all.filter((c) => c.status !== "owned").forEach((c) => [c.cid, ...(c.oldCids || [])].filter(Boolean).forEach((x) => fixed.add(idNormKey(x))));
  owned.forEach((c) => (c.oldCids || []).forEach((x) => fixed.add(idNormKey(x))));
  const cnt = {}, plan = [];
  owned.forEach((c) => {
    const pl = idPlan(c); let n = cnt[pl.key] ?? pl.start;
    while (fixed.has(idNormKey(pl.text(n)))) n++;
    cnt[pl.key] = n + 1; plan.push({ c, to: pl.text(n) });
  });
  const prevNext = settings().idNext || {}, next = { ...prevNext };
  Object.keys(cnt).forEach((k) => { next[k] = Math.max(next[k] || 1, cnt[k]); });
  const undo = [];
  plan.forEach(({ c, to }) => {
    if (c.cid === to) return;
    undo.push({ id: c.id, cid: c.cid, oldCids: c.oldCids });
    const olds = c.cid ? [...(c.oldCids || []).filter((x) => idNormKey(x) !== idNormKey(c.cid)), c.cid] : c.oldCids;
    put("c_" + c.id, { ...c, cid: to, ...(olds ? { oldCids: olds } : {}) }, true);
  });
  saveSettings({ idNext: next, lastRenumber: undo.length ? { undo, prevNext, at: today() } : null }, true); // kept so Undo still works later
  return undo.length;
}
function undoRenumber() {
  const idUndo = settings().lastRenumber;
  if (!idUndo) return;
  idUndo.undo.forEach((u) => { const c = getCoin(u.id); if (!c) return; const b = { ...c, cid: u.cid }; if (u.oldCids) b.oldCids = u.oldCids; else delete b.oldCids; put("c_" + u.id, b, true); });
  saveSettings({ idNext: idUndo.prevNext, lastRenumber: null }, true);
}
/* --- Options: Coin ID style --- */
const ID_STYLES = [["app", "App's codes"], ["own", "My own codes"], ["running", "One running number"], ["off", "Off"]];
const ID_OTHER_NAMES = { bar: "Bars", round: "Rounds", silverItem: "Other silver items", set: "Sets", roll: "Rolls", medal: "Medals and tokens", foreign: "Foreign coins", coin: "Other coins" };
function idStyleOptionsHtml() {
  const s = settings(), st = idStyle(), r = s.idRun || {}, own = s.idOwn || {};
  const sample = nextIdPreview({ typeId: "morgan-dollar" });
  const note = { app: "Every item gets a code for its type and a number, like MD-012.", own: "Same as the app's codes, but you choose the letters (and the starting number) for each coin type.", running: "One number for everything, whatever the type. Counts up by one.", off: "No automatic IDs. Type your own on each coin, or leave it blank." }[st];
  const rows = [...Object.entries(ID_CODES).map(([tid, code]) => [code, (typeof TYPE_BY_ID !== "undefined" && TYPE_BY_ID[tid] ? TYPE_BY_ID[tid].name : tid)]), ...Object.entries(ID_CODES_OTHER).map(([k, code]) => [code, ID_OTHER_NAMES[k] || k])];
  return `<h2>Coin ID style</h2>
    <div class="card"><div class="small muted">The ID is what you write on a flip. Changing the style only affects coins you add from now on.</div>
      <div class="chips" style="margin-top:8px">${ID_STYLES.map(([k, n]) => `<button class="chip ${st === k ? "on" : ""}" data-act="idStyle" data-v="${k}">${n}</button>`).join("")}</div>
      <div class="hint">${note}</div>
      ${st === "running" ? `<div class="grid2"><label class="f"><span>Starts with (optional)</span><input type="text" maxlength="12" placeholder="JW-" data-idrun="prefix" value="${esc(r.prefix || "")}"></label>
        <label class="f"><span>First number</span><input type="text" inputmode="numeric" placeholder="1050" data-idrun="start" value="${esc(r.start || "")}"></label></div>
        <div class="hint">Zeros up front are kept: 0007 stays four digits.</div>` : ""}
      ${st === "own" ? `<details class="more"><summary>My codes (1 to 6 letters or numbers each)</summary>
        ${rows.map(([base, name]) => `<div class="grid2" style="align-items:end"><label class="f"><span>${esc(name)}</span><input type="text" maxlength="6" placeholder="${esc(base)}" data-idown="${esc(base)}" data-part="code" value="${esc((own[base] || {}).code || "")}"></label>
          <label class="f"><span>Start at</span><input type="text" inputmode="numeric" placeholder="1" data-idown="${esc(base)}" data-part="start" value="${esc((own[base] || {}).start || "")}"></label></div>`).join("")}</details>` : ""}
      ${st === "off" ? "" : `<div class="hint">Example of the next ID: <b>${esc(sample)}</b></div>
      <div class="btn-row"><button class="btn" data-act="idRenumber">Renumber my coins</button></div>
      ${s.lastRenumber ? `<div class="btn-row"><button class="btn" data-act="idUndoRenumber">Undo last renumber (${s.lastRenumber.undo.length} coin${s.lastRenumber.undo.length === 1 ? "" : "s"}, ${esc(s.lastRenumber.at || "")})</button></div>` : ""}
      <div class="hint">Optional. Renumbers the coins you own in the order you added them. Each keeps its old ID, so labels already on flips still find it. Undo stays here in Options until you renumber again.</div>`}
    </div>`;
}
const idRenumberAsk = () => confirmSheet("Renumber my coins?", "Every coin you own gets a new ID in the order you added it. Its old ID is kept and still found by search. Sold coins keep theirs. Making a Backup first is a good idea. An Undo button stays in Options.", "Renumber", () => {
  const n = renumberCoins();
  render();
  toast(n ? "Renumbered " + n + " coin" + (n === 1 ? "" : "s") + "." : "Nothing to change.", n ? { label: "Undo", fn: () => { undoRenumber(); render(); toast("Back to the old IDs."); } } : undefined);
});
