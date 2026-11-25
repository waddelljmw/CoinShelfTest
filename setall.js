/* Step 30 (ideas 155, 156, 137b, 97b, 133): Select › Set for all.
   One button on the Select bar opens a short list; each row opens a small sheet that changes the picked coins.
   Safe by default: a sheet starts on "Only the blank ones" when some coins already have a value, and shows what
   "Change all" would replace. Slabbed coins keep their grade and holder. Sold coins are skipped. One Undo. */
const SA_ROWS = [
  ["grade", "Grade"], ["described", "Described as", "Circulated, AU, UNC, BU…"], ["holder", "Holder"],
  ["keepFor", "Keeping for"], ["orig", "Original to the album", "album coins only"], ["inh", "Inherited"],
  ["purchase", "Purchase info", "date, where from, price"], ["notes", "Add to notes", "adds a line, keeps what's there"],
  ["want", "Add to a want list"],
];
const saBack = `<button type="button" class="link-btn" data-act="saOpen" style="margin:0 0 8px">‹ Set for all</button>`;
const saHead = (t) => `<div class="sheet-head"><h2>${t}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>${saBack}`;
const isSlab = (c) => c.gradeMode === "cert";

// Each simple field: who it applies to (a reason string = skipped), what it is now, and how to set it.
const SA_FIELDS = {
  grade: {
    title: "grade",
    why: (c) => (itemOf(c) !== "coin" ? "only coins have a grade" : isSlab(c) ? "slabbed; its grade is on the label" : ""),
    now: (c) => (c.grade === "Other" ? c.customGrade || "Other" : c.grade || (c.noGrade ? "Not graded" : "")),
    set: (c, v) => {
      if (v !== "Not graded" && c.grade && c.grade !== "Other" && isProofGrade(c.grade) !== isProofGrade(v)) return isProofGrade(c.grade) ? "it's a proof; pick a PR grade" : "not a proof; pick a non-PR grade";
      if (v === "Not graded") { c.grade = ""; c.noGrade = true; } else { c.grade = v; delete c.noGrade; }
      delete c.customGrade; return "";
    },
  },
  described: {
    title: "Described as",
    why: (c) => (itemOf(c) !== "coin" ? "only coins have this" : ""),
    now: (c) => c.described || "",
    set: (c, v) => { c.described = v; return ""; },
  },
  holder: {
    title: "holder",
    why: (c) => (itemOf(c) !== "coin" ? "only coins have this holder list" : isSlab(c) ? "slabbed; the slab is its holder" : c.albumId && getAlbum(c.albumId) ? "it's in an album" : ""),
    now: (c) => holderOf(c),
    set: (c, v) => { c.holder = v; return ""; },
  },
  keepFor: {
    title: "Keeping for",
    why: (c) => (stageOf(c) === "forsale" ? "it's For sale; take it off first" : c.biz ? "it's in Business" : ""),
    now: (c) => keepForOf(c),
    set: (c, v) => { c.keepFor = v; return ""; },
  },
};
const saOwned = () => pickedCoins().filter((c) => c.status === "owned");
const saSoldCount = () => pickedCoins().length - saOwned().length;
// Splits the picked coins for a field: ok (can change) and skip ([coin, why]).
function saSplit(f) {
  const ok = [], skip = [];
  saOwned().forEach((c) => { const w = f.why(c); if (w) skip.push([c, w]); else ok.push(c); });
  return { ok, skip };
}
const saCountText = (list) => { const m = new Map(); list.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return [...m].map(([k, n]) => (n > 1 ? n + " × " : "") + k).join(" · "); };
const saPlural = (n) => n + " coin" + (n === 1 ? "" : "s");

function saInput(key, f) {
  if (key === "grade") return `<select id="saVal" data-sa><option value="">Pick a grade…</option><option>Not graded</option>${GRADES.map((g) => `<option>${esc(g)}</option>`).join("")}</select>`;
  if (key === "described") return `<select id="saVal" data-sa><option value="">Pick one…</option>${DESCRIBED_WORDS.map((w) => `<option>${w}</option>`).join("")}<option value="__own">Your own words…</option></select>
    <input type="text" id="saOwn" data-sa maxlength="30" placeholder="Gem BU" hidden style="margin-top:6px">`;
  if (key === "holder") return `<select id="saVal" data-sa><option value="">Pick a holder…</option>${HOLDERS.filter((h) => h !== "Album" && h !== "Slab" && h !== "Other").map((h) => `<option>${esc(h)}</option>`).join("")}</select>`;
  return `<input type="text" id="saVal" data-sa data-suggest="keepFor" autocomplete="off" maxlength="40" placeholder="my son">`;
}
function saValue(key) {
  const v = (($("#saVal") || {}).value || "").trim();
  return key === "described" && v === "__own" ? (($("#saOwn") || {}).value || "").trim() : v;
}
const saMode = () => (document.querySelector('#sheet input[name="saMode"]:checked') || {}).value || "blank";
function saSheet(key) {
  const f = SA_FIELDS[key], { ok, skip } = saSplit(f), blank = ok.filter((c) => !f.now(c)), filled = ok.filter((c) => f.now(c));
  const sold = saSoldCount();
  const choose = blank.length && filled.length;
  openSheet(`${saHead("Set " + f.title + " for " + saPlural(ok.length))}
    <div class="small muted" style="margin-bottom:8px">Now: ${esc(saCountText(ok.map((c) => f.now(c) || "blank"))) || "nothing to change"}</div>
    <label class="f"><span>${key === "grade" ? "Grade" : key === "described" ? "Described as" : key === "holder" ? "Holder" : "Keeping for"}</span>${saInput(key, f)}</label>
    ${key === "described" ? `<div class="hint">What the flip, holder or seller says. It never changes your grade or value.</div>` : ""}
    ${key === "keepFor" ? `<div class="hint">\u{1F512} Locked: they can't go For sale, and Mark as sold asks first. They still count in your totals.</div>` : ""}
    ${choose ? `<div class="btn-row" style="margin:8px 0"><label><input type="radio" name="saMode" value="blank" data-sa checked> Only the ${blank.length} blank</label><label><input type="radio" name="saMode" value="all" data-sa> Change all ${ok.length}</label></div>` : ""}
    <div class="small" id="saPreview" style="margin:6px 0"></div>
    ${skip.length || sold ? `<div class="hint">${[skip.length ? skip.length + " skipped (" + esc([...new Set(skip.map((x) => x[1]))].join("; ")) + ")" : "", sold ? sold + " sold, skipped" : ""].filter(Boolean).join(". ")}.</div>` : ""}
    <button class="btn primary block" data-act="saGo" data-k="${key}" style="margin-top:10px" ${ok.length ? "" : "disabled"}>Set</button>
    <div class="hint">One Undo puts everything back.</div>`);
  saPreview(key);
}
// Which coins a tap would change, and the button and preview words to match.
function saTargets(key) {
  const f = SA_FIELDS[key], { ok } = saSplit(f), blank = ok.filter((c) => !f.now(c));
  return !blank.length || blank.length === ok.length || saMode() === "all" ? ok : blank;
}
function saPreview(key) {
  const f = SA_FIELDS[key], el = $("#saPreview"), btn = document.querySelector('#sheet [data-act="saGo"]');
  if (key === "described") { const o = $("#saOwn"); if (o) o.hidden = ($("#saVal") || {}).value !== "__own"; }
  if (!el || !btn) return;
  const v = saValue(key), t = saTargets(key);
  const replaced = t.filter((c) => f.now(c) && f.now(c) !== v).map((c) => f.now(c));
  btn.textContent = v ? "Set " + v + " on " + saPlural(t.length) : "Set on " + saPlural(t.length);
  el.innerHTML = replaced.length ? `<span style="color:var(--warn,#b26b00)">Replaces ${esc(saCountText(replaced))}</span>` : "";
}
document.addEventListener("input", (e) => { if (e.target.matches && e.target.matches("[data-sa]")) saPreview((document.querySelector('#sheet [data-act="saGo"]') || { dataset: {} }).dataset.k); });
document.addEventListener("change", (e) => { if (e.target.matches && e.target.matches("[data-sa]")) saPreview((document.querySelector('#sheet [data-act="saGo"]') || { dataset: {} }).dataset.k); });

// Runs bulkApply over the picked coins, but only the target ones change; the rest are listed as skipped.
function saApply(label, ids, fn) {
  bulkApply(label, (c) => {
    if (c.status !== "owned") return "sold";
    if (!ids.has(c.id)) return ids.why(c) || true; // true = left alone on purpose (Only blank), not listed
    return fn(c);
  });
  listState.sel = null; render();
}

/* ---------- Original to the album (156: any album, bought or inherited) ---------- */
function saOrigSheet() {
  const inAlb = saOwned().filter((c) => c.albumId && getAlbum(c.albumId)), out = saOwned().length - inAlb.length;
  openSheet(`${saHead("Original to the album")}
    <p class="small">${saPlural(inAlb.length)} in an album${out ? ", " + out + " not in an album (skipped)" : ""}. Now: ${inAlb.filter((c) => c.origAlbum).length} marked original.</p>
    <div class="hint">For coins that were already in the album when you got it, bought or inherited.</div>
    <button class="btn primary block" data-act="saOrigGo" data-v="1" style="margin-top:10px" ${inAlb.length ? "" : "disabled"}>Mark original (${inAlb.length})</button>
    <button class="btn block" data-act="saOrigGo" data-v="0" style="margin-top:8px" ${inAlb.length ? "" : "disabled"}>Not original</button>`);
}

/* ---------- Add to notes (never wipes what's there) ---------- */
function saNotesSheet() {
  const n = saOwned().length;
  openSheet(`${saHead("Add to notes for " + saPlural(n))}
    <label class="f"><span>Line to add</span><input type="text" id="saNote" maxlength="200" placeholder="From the 2024 estate lot"></label>
    <div class="hint">Added as a new line at the end of each coin's notes. Nothing already there is changed.</div>
    <button class="btn primary block" data-act="saNotesGo" style="margin-top:10px" ${n ? "" : "disabled"}>Add to ${saPlural(n)}</button>`);
}

/* ---------- Add to a want list (133) ---------- */
const saWantWhy = (c) => (itemOf(c) !== "coin" ? "only coins go on want lists" : !c.typeId ? "no coin type" : "");
function saWantSheet() {
  ensureDefaultList();
  const ok = saOwned().filter((c) => !saWantWhy(c));
  openSheet(`${saHead("Add " + saPlural(ok.length) + " to a want list")}
    <label class="f"><span>Which list</span><select id="saList" data-saw>${wantLists().map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("")}<option value="__new">+ New list…</option></select></label>
    <label class="f" id="saNewRow" hidden><span>New list name</span><input type="text" id="saNewName" maxlength="60" placeholder="Morgan upgrades"></label>
    <div class="hint">Each goes on as an upgrade: same year, mint and variety, one grade better. Coins already on that list are skipped.</div>
    <button class="btn primary block" data-act="saWantGo" style="margin-top:10px" ${ok.length ? "" : "disabled"}>Add to list</button>`);
}
document.addEventListener("change", (e) => { if (e.target.matches && e.target.matches("[data-saw]")) { const r = $("#saNewRow"); if (r) r.hidden = e.target.value !== "__new"; } });
let saWantLast = null;

Object.assign(actions, {
  saOpen: () => {
    if (!pickedCoins().length) return;
    const n = pickedCoins().length;
    openSheet(`<div class="sheet-head"><h2>Set for all ${n}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <div class="card" style="padding:0">${SA_ROWS.map(([k, l, sub]) => `<button type="button" class="rowline sa-row" data-act="saPick" data-k="${k}" style="width:100%;min-height:48px;padding:10px 12px;background:none;border:0;border-bottom:1px solid var(--line,#ddd);text-align:left;color:inherit;font:inherit"><span>${esc(l)}${sub ? ` <span class="muted small">(${esc(sub)})</span>` : ""}</span><span class="muted">›</span></button>`).join("")}</div>
      <div class="hint">Year, mint, coin type, photos, ID and album spot are different on every coin, so they aren't here.</div>`);
  },
  saPick: (el) => {
    const k = el.dataset.k;
    if (SA_FIELDS[k]) return saSheet(k);
    if (k === "orig") return saOrigSheet();
    if (k === "inh") return actions.inhMark();
    if (k === "purchase") return actions.pcOpen();
    if (k === "notes") return saNotesSheet();
    if (k === "want") return saWantSheet();
  },
  saGo: (el) => {
    const key = el.dataset.k, f = SA_FIELDS[key], v = saValue(key);
    if (!v) { toast(key === "keepFor" ? "Type who you're keeping them for." : "Pick what to set."); return; }
    const t = new Set(saTargets(key).map((c) => c.id));
    t.why = (c) => f.why(c);
    saApply(f.title.charAt(0).toUpperCase() + f.title.slice(1) + " set", t, (c) => (f.now(c) === v ? "already " + v : f.set(c, v)));
  },
  saOrigGo: (el) => {
    const on = el.dataset.v === "1";
    bulkApply(on ? "Marked original" : "Marked not original", (c) => {
      if (c.status !== "owned") return "sold";
      if (!(c.albumId && getAlbum(c.albumId))) return "not in an album";
      if (!!c.origAlbum === on) return on ? "already original" : "already not original";
      if (on) c.origAlbum = true; else delete c.origAlbum;
      return "";
    });
    listState.sel = null; render();
  },
  saNotesGo: () => {
    const line = (($("#saNote") || {}).value || "").trim();
    if (!line) { toast("Type the line to add."); return; }
    bulkApply("Note added", (c) => {
      if (c.status !== "owned") return "sold";
      const n = String(c.notes || "").replace(/\s+$/, "");
      if (n.split("\n").includes(line)) return "already has that line";
      c.notes = n ? n + "\n" + line : line; return "";
    });
    listState.sel = null; render();
  },
  saWantGo: () => {
    let listId = ($("#saList") || {}).value || DEFAULT_LIST_ID, newList = null;
    if (listId === "__new") {
      const name = (($("#saNewName") || {}).value || "").trim();
      if (!name) { toast("Name the new list."); return; }
      newList = { kind: "wantlist", id: uid(), name, scope: "any", typeId: "", grade: "", createdAt: Date.now() };
      saveWantList(newList); listId = newList.id;
    }
    const wl = getWantList(listId), made = [], skipped = [];
    pickedCoins().forEach((c) => {
      const why = c.status !== "owned" ? "sold" : saWantWhy(c) || (!listAccepts(wl, c.typeId) ? "that list is for a different coin type" : findWant(c.typeId, c.year, c.mint, c.variety || "", listId, isProofGrade(c.grade)) ? "already on that list" : "");
      if (why) { skipped.push([labelOf(c), why]); return; }
      const w = newWant({ typeId: c.typeId, year: c.year, mint: c.mint, variety: c.variety || "", pf: isProofGrade(c.grade), albumId: c.albumId || "", listId, grade: wl && wl.scope === "type-grade" ? wl.grade : upgradeGrade(c), notes: "Upgrade" });
      saveWant(w); made.push(w);
    });
    saWantLast = { made, newList };
    listState.sel = null; closeSheet(); render();
    const name = wl ? wl.name : "the list";
    if (skipped.length) openSheet(`<div class="sheet-head"><h2>${made.length ? "Added " + made.length + " to " + esc(name) : "Nothing added"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small">Skipped ${skipped.length}:</p><div class="card">${skipped.map(([n, w]) => `<div class="rowline"><span>${esc(n)}</span><span class="muted small">${esc(w)}</span></div>`).join("")}</div>
      ${made.length ? `<button class="btn block" data-act="saWantUndo" style="margin-top:10px">Undo this</button>` : ""}`);
    else toast("Added " + made.length + " to " + name + ".", made.length ? { label: "Undo", fn: actions.saWantUndo } : null);
  },
  saWantUndo: () => {
    if (!saWantLast) return;
    saWantLast.made.forEach((w) => remove("w_" + w.id));
    if (saWantLast.newList) remove("wl_" + saWantLast.newList.id);
    saWantLast = null; closeSheet(); render(); toast("Undone.");
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["saGo", "saOrigGo", "saNotesGo", "saWantGo", "saWantUndo"].forEach((a) => SNAPSHOT_BLOCK.add(a));
