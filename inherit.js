/* Inheritances (Step 9.3b): the list in Options, the picker on Add/Edit coin, "Mark inherited" for many coins,
   the coin page history and banner, and "Original to the album". Helpers like inheritances() and missingOf() live in values.js.
   An inheritance is { id, from, date, earlier: [{ who, when }], valueWhen } kept in settings.inheritances; settings.inhDefault is the default one. */

const inhCount = (id) => allCoins().filter((c) => c.status !== "deleted" && c.inhId === id).length;
const inhOpts = (sel, extra) => `${inheritances().map((i) => `<option value="${esc(i.id)}" ${sel === i.id ? "selected" : ""}>${esc(inhLabel(i) || "(no name)")}</option>`).join("")}${extra || ""}`;
// "Earlier owners" as one line, oldest first, ending with you.
const inhHistory = (i) => (i ? [...(i.earlier || []).map((e) => [e.who, e.when]), [i.from, i.date]].filter((e) => e[0] || e[1]).map((e) => [e[0], e[1] && "(" + e[1] + ")"].filter(Boolean).join(" ")).concat("you").join(" → ") : "");

/* ---------- Options list ---------- */
function inhOptionsHtml() {
  const list = inheritances(), def = inhDefaultId();
  return `<h2>Inheritances</h2>
    <div class="card">
      ${list.length ? list.map((i) => `<div class="rowline"><span><b>${esc(inhLabel(i) || "(no name)")}</b>${i.id === def ? ` <span class="sold-tag">Default</span>` : ""}<div class="small muted">${inhCount(i.id)} coin${inhCount(i.id) === 1 ? "" : "s"}${(i.earlier || []).length ? " · " + esc(inhHistory(i)) : ""}</div></span><span>${i.id === def ? "" : `<button class="link-btn" data-act="inhDefault" data-id="${esc(i.id)}">Make default</button> `}<button class="link-btn" data-act="inhEdit" data-id="${esc(i.id)}">Edit</button></span></div>`).join("") : `<div class="small muted">None yet. Add one, like "Mother-in-law, 2023".</div>`}
      <div class="btn-row"><button class="btn" data-act="inhEdit">+ New inheritance</button></div>
      <div class="hint">Choosing Source = Inherited on a coin fills in the default. Inherited coins stay locked from selling.</div>
    </div>`;
}
let inhEd = null; // the inheritance being edited in the sheet
function inhRead() {
  if (!inhEd) return;
  const v = (k) => { const e = document.querySelector('#sheet [data-inh="' + k + '"]'); return e ? e.value.trim() : null; };
  ["from", "date", "valueWhen"].forEach((k) => { const x = v(k); if (x !== null) inhEd[k] = x; });
  inhEd.earlier = inhEd.earlier.map((e, i) => ({ who: v("who" + i) ?? e.who, when: v("when" + i) ?? e.when }));
}
function inhSheet() {
  const e = inhEd;
  openSheet(`<div class="sheet-head"><h2>${e.isNew ? "New inheritance" : "Edit inheritance"}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <label class="f"><span>From whom</span><input type="text" data-inh="from" value="${esc(e.from)}" placeholder="e.g. Mother-in-law" maxlength="60"></label>
    <label class="f"><span>When inherited</span><input type="text" data-inh="date" value="${esc(e.date)}" placeholder="e.g. 2023 or 2023-05-14" maxlength="20"></label>
    <label class="f"><span>Value when inherited, each coin <span class="muted small">(optional, for tax records)</span></span><input type="number" inputmode="decimal" step="0.01" min="0" data-inh="valueWhen" value="${esc(e.valueWhen)}"></label>
    <b class="small">Earlier owners <span class="muted">(optional)</span></b>
    ${e.earlier.map((o, i) => `<div class="grid2"><label class="f"><span>Who</span><input type="text" data-inh="who${i}" value="${esc(o.who)}" placeholder="e.g. Her grandmother" maxlength="60"></label><label class="f"><span>Until / when</span><input type="text" data-inh="when${i}" value="${esc(o.when)}" placeholder="e.g. 1974" maxlength="20"></label></div><button class="link-btn" data-act="inhDelEarlier" data-i="${i}">Remove this owner</button>`).join("")}
    <div class="btn-row"><button class="btn" data-act="inhAddEarlier">+ Earlier owner</button></div>
    <div class="hint">Oldest first. This shows on each coin's page as its history.</div>
    <button class="btn primary block" data-act="inhSave" style="margin-top:10px">Save</button>
    ${e.isNew ? "" : `<button class="btn danger block" data-act="inhDelete" style="margin-top:8px">Delete this inheritance</button>`}`);
}
const inhSet = (list, def) => saveSettings({ inheritances: list, inhDefault: def });
Object.assign(actions, {
  inhEdit: (el) => {
    const i = el.dataset.id ? inheritances().find((x) => x.id === el.dataset.id) : null;
    inhEd = i ? { ...JSON.parse(JSON.stringify(i)), isNew: false } : { id: uid(), from: "", date: "", valueWhen: "", earlier: [], isNew: true };
    inhEd.earlier = inhEd.earlier || []; inhEd.valueWhen = inhEd.valueWhen ?? "";
    inhSheet();
  },
  inhAddEarlier: () => { inhRead(); inhEd.earlier.push({ who: "", when: "" }); inhSheet(); },
  inhDelEarlier: (el) => { inhRead(); inhEd.earlier.splice(+el.dataset.i, 1); inhSheet(); },
  inhSave: () => {
    inhRead();
    const e = inhEd;
    if (!e.from && !e.date) { toast("Add who it came from or when."); return; }
    const rec = { id: e.id, from: e.from, date: e.date, valueWhen: num(e.valueWhen) == null ? "" : String(Math.max(0, num(e.valueWhen))), earlier: e.earlier.filter((o) => o.who || o.when) };
    const list = inheritances(), has = list.some((x) => x.id === rec.id);
    const next = has ? list.map((x) => (x.id === rec.id ? rec : x)) : [...list, rec];
    inhSet(next, has ? inhDefaultId() : inhDefaultId() || rec.id);
    inhEd = null; closeSheet(); render();
  },
  inhDelete: () => {
    const e = inhEd, list = inheritances(), def = inhDefaultId(), n = inhCount(e.id);
    inhSet(list.filter((x) => x.id !== e.id), def === e.id ? "" : def);
    inhEd = null; closeSheet(); render();
    toast("Deleted." + (n ? " " + n + " coin" + (n === 1 ? "" : "s") + " now say “who/when not set”." : ""), { label: "Undo", fn: () => { inhSet(list, def); render(); toast("Back again."); } });
  },
  inhDefault: (el) => { saveSettings({ inhDefault: el.dataset.id }); },
});

/* ---------- Add / Edit coin ---------- */
// Shown under "Where from" when the source is Inherited: which inheritance, value when inherited, and the album check.
function inhFields(d) {
  if (!isInherited(d)) return "";
  const al = d.albumId && d.albumId !== "__new" ? getAlbum(d.albumId) : null;
  return `<div class="inh-box">
    <label class="f"><span>Which inheritance</span><select data-f="inhId" data-rerender><option value="">Not set yet</option>${inhOpts(d.inhId, `<option value="__new" ${d.inhId === "__new" ? "selected" : ""}>+ New inheritance…</option>`)}</select></label>
    ${d.inhId === "__new" ? `<div class="grid2"><label class="f"><span>From whom</span><input type="text" data-f="_inhFrom" value="${esc(d._inhFrom || "")}" placeholder="e.g. Uncle Bob" maxlength="60"></label><label class="f"><span>When</span><input type="text" data-f="_inhDate" value="${esc(d._inhDate || "")}" placeholder="e.g. 2024" maxlength="20"></label></div>` : ""}
    <label class="f"><span>Value when inherited <span class="muted small">(each, optional)</span></span><input type="number" inputmode="decimal" step="0.01" min="0" data-f="inhValue" value="${esc(d.inhValue ?? "")}"></label>
    ${al && al.inherited ? `<label class="switch"><span>Original to the album<div class="small muted">It was in the album when you inherited it</div></span><input type="checkbox" data-fcheck="origAlbum" ${d.origAlbum ? "checked" : ""}></label>` : ""}
  </div>`;
}
// Run from saveDraft on the copy being saved: creates a new inheritance if asked, drops fields that don't apply.
function inhPrepSave(c) {
  const from = String(c._inhFrom || "").trim(), date = String(c._inhDate || "").trim();
  delete c._inhFrom; delete c._inhDate;
  if (!isInherited(c)) { delete c.inhId; delete c.inhValue; delete c.origAlbum; return; }
  if (c.inhId === "__new") {
    if (from || date) { const rec = { id: uid(), from, date, valueWhen: "", earlier: [] }; inhSet([...inheritances(), rec], inhDefaultId() || rec.id); c.inhId = rec.id; }
    else c.inhId = "";
  }
  if (!c.inhId) delete c.inhId;
  c.inhValue = num(c.inhValue) == null ? "" : String(Math.max(0, num(c.inhValue)));
  const al = c.albumId && getAlbum(c.albumId);
  if (!(al && al.inherited)) delete c.origAlbum; else c.origAlbum = !!c.origAlbum;
}

/* ---------- Coin page ---------- */
function coinInhHtml(c) {
  const miss = missingOf(c);
  const banner = miss.length ? `<div class="banner miss-banner"><b>Missing: ${esc(miss.join(", "))}</b> <button class="btn" data-act="edit" data-id="${esc(c.id)}">Fill in</button></div>` : "";
  if (!isInherited(c)) return banner;
  const i = inheritanceOf(c), v = inhValueOf(c);
  const row = (k, val) => `<div class="rowline"><span class="muted">${k}</span><span class="num" style="text-align:right">${val}</span></div>`;
  return banner + `<div class="card"><b>Inherited</b>${i ? row("From", esc(inhLabel(i))) + ((i.earlier || []).length ? row("History", esc(inhHistory(i))) : "") : row("From", `<span class="muted">Inherited (who/when not set)</span>`)}${v != null ? row("Value when inherited", money(v)) : ""}${c.origAlbum ? row("Album", "Original to the album") : ""}</div>`;
}

/* ---------- Select > Mark inherited ---------- */
function inhMarkSheet(pick) {
  const picked = pickedCoins(), sel = pick === undefined ? inhDefaultId() || "__new" : pick;
  openSheet(`<div class="sheet-head"><h2>Mark ${picked.length} as inherited</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <label class="f"><span>Which inheritance</span><select data-inh-pick>${inhOpts(sel, `<option value="__new" ${sel === "__new" ? "selected" : ""}>+ New inheritance…</option>`)}</select></label>
    ${sel === "__new" ? `<div class="grid2"><label class="f"><span>From whom</span><input type="text" data-inh="mfrom" maxlength="60" placeholder="e.g. Mother-in-law"></label><label class="f"><span>When</span><input type="text" data-inh="mdate" maxlength="20" placeholder="e.g. 2023"></label></div>` : ""}
    <div class="hint">Inherited coins can't be For sale or Business. Those are skipped and listed. One Undo puts everything back.</div>
    <button class="btn primary block" data-act="inhMarkGo" style="margin-top:10px">Mark inherited</button>`);
}
document.addEventListener("change", (e) => { if (e.target.matches && e.target.matches("[data-inh-pick]")) inhMarkSheet(e.target.value); });
Object.assign(actions, {
  inhMark: () => { if (!pickedCoins().length) return; inhMarkSheet(); },
  inhMarkGo: () => {
    const pk = document.querySelector("#sheet [data-inh-pick]");
    let id = pk ? pk.value : "";
    if (id === "__new") {
      const g = (k) => { const x = document.querySelector('#sheet [data-inh="' + k + '"]'); return x ? x.value.trim() : ""; };
      const from = g("mfrom"), date = g("mdate");
      if (!from && !date) { toast("Add who it came from or when."); return; }
      const rec = { id: uid(), from, date, valueWhen: "", earlier: [] };
      inhSet([...inheritances(), rec], inhDefaultId() || rec.id); id = rec.id;
    }
    if (!id) { toast("Pick an inheritance."); return; }
    bulkApply("Marked inherited", (c) => {
      if (c.status !== "owned") return "not in your collection";
      if (c.biz) return "it's in Business; move it to Personal first";
      if (stageOf(c) === "forsale") return "it's For sale; take it off first";
      const b = c.boxId && typeof getBox === "function" ? getBox(c.boxId) : null;
      if (b && typeof caseOn === "function" && caseOn(b)) return "it's in a for-sale case";
      if (isInherited(c) && c.inhId === id) return "already in it";
      c.source = "Inherited"; c.inhId = id; return "";
    });
    listState.sel = null; render();
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["inhEdit", "inhAddEarlier", "inhDelEarlier", "inhSave", "inhDelete", "inhDefault", "inhMark", "inhMarkGo"].forEach((a) => SNAPSHOT_BLOCK.add(a));
