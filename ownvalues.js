"use strict";
/* Idea 79a: bring your own values. Load a spreadsheet (CSV) of your own numbers: pick the file, match the columns,
   check the preview, confirm. The numbers are added to the saved price record "pricebook" (same shape as a price file,
   see pricefile.js). Nothing ships with the app, your coins are never changed, and Undo puts the old prices back.
   One row = one coin type, year, mint, grade and value. Uses parseCsv / matchType / parseGrade / splitYear (sheets.js). */
const OV_FIELDS = [
  { key: "type", head: "Coin type", names: ["cointype", "type", "coin", "series", "name", "description"] },
  { key: "year", head: "Year", names: ["year", "date"] },
  { key: "mint", head: "Mint", names: ["mint", "mintmark", "mm"] },
  { key: "grade", head: "Grade", names: ["grade", "condition"] },
  { key: "value", head: "Value", names: ["value", "price", "valueeach", "amount", "bid", "ask"] },
];
const OV_SOURCE_DEFAULT = "My values";
let ov = null;

function ovTemplate() {
  // Made-up example numbers, only to show the shape. Replace them with your own.
  return ["Coin type,Year,Mint,Grade,Value",
    "Morgan Dollar,1881,S,MS-63,100",
    "Morgan Dollar,1881,S,MS-64,150",
    "Morgan Dollar,1884,CC,AU-55,300",
    "Mercury Dime,1942,,MS-65,45"].join("\r\n") + "\r\n";
}
async function saveOvTemplate() {
  const say = (t) => { const m = $("#priceMsg"); if (m) m.textContent = t; };
  if (!downloadsApi) { say("Saving files isn't available here."); return; }
  const name = "coin-cabinet-my-values-template.csv";
  try { await downloadsApi.save({ filename: name, data: ovTemplate(), type: "text/csv" }); }
  catch (e) { say(e && e.code === "declined" ? "Not saved." : "Couldn't save the file. Try again."); return; }
  say("Saved " + name + ". Replace the example rows with your own numbers, then tap Load your own values.");
}
function ovHelp() {
  openSheet(`<div class="sheet-head"><h2>Your own values: how it works</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>Use any spreadsheet app and save it as a <b>CSV</b> file. One row for each coin type, year, mint and grade, with your value for it.</p>
    <div class="card small"><b>Columns</b><div class="muted" style="margin-top:4px">Coin type, Year, Grade and Value are needed. Mint is optional (leave it blank for Philadelphia and for proofs). Grades like MS-65, AU-55, PR-69. Proof coins: use a PR grade. The headings can be named anything, you match them on the next screen.</div></div>
    <p class="small muted">Your numbers are added to the prices already on this phone (the same coin and grade is replaced). Your coins are not changed, and Undo puts the old prices back. Only use numbers you're allowed to use: don't copy a price service's pages or files you don't have a license for.</p>
    <div class="btn-row"><button class="btn primary" data-act="saveOvTemplate">Get a blank template</button><button class="btn" data-act="closeSheet">Close</button></div>`);
}

function ovGuess(headers) {
  const used = new Set(), map = {};
  OV_FIELDS.forEach((f) => { const i = headers.findIndex((h, j) => !used.has(j) && f.names.includes(squash(h))); if (i >= 0) { map[f.key] = i; used.add(i); } });
  return map;
}
function loadOvText(text, fileName) {
  const rows = parseCsv(text);
  const say = (t) => { const m = $("#priceMsg"); if (m) m.textContent = t; };
  if (rows.length < 2) { say("That file has no rows. It needs a heading row and at least one value."); return; }
  const headers = rows[0].map((h) => String(h).trim());
  ov = { headers, rows: rows.slice(1), map: ovGuess(headers), fileName, source: OV_SOURCE_DEFAULT };
  renderOv();
}
// Turns the rows into price cells and a list of rows that couldn't be used. Changes nothing.
function ovParse() {
  const m = ov.map, cells = new Map(), bad = []; let dups = 0;
  const get = (r, k) => (m[k] == null ? "" : String(r[m[k]] == null ? "" : r[m[k]]).trim());
  ov.rows.forEach((r, n) => {
    const line = n + 2, typeText = get(r, "type");
    const fail = (why) => bad.push({ line, why });
    if (!typeText && !get(r, "year") && !get(r, "value")) return;
    const yc = get(r, "year"), ym = yc.match(/^(\d{4})\s*-?\s*([A-Za-z]{0,2})$/); // "1881" or "1881-S" (any letters are kept, so a wrong mint is reported, not dropped)
    const sy = ym ? { year: +ym[1], mint: ym[2].toUpperCase() || null } : splitYear(yc), year = sy.year;
    if (!year) return fail("no year");
    const t = matchType(typeText, year, "", "");
    if (!t) return fail(typeText ? "coin type \"" + typeText.slice(0, 24) + "\" not recognized" : "no coin type");
    const yp = yearProblem(t.id, year, "coin");
    if (yp) return fail(t.name + " " + year + ": " + yp);
    const g = parseGrade(get(r, "grade")).grade;
    if (!g || g === "Other" || g === "Junk") return fail("grade \"" + get(r, "grade").slice(0, 12) + "\" not recognized");
    const raw = get(r, "value").replace(/[$,\s]/g, ""), v = raw === "" ? NaN : +raw;
    if (!isFinite(v) || v < 0) return fail("value \"" + get(r, "value").slice(0, 12) + "\" is not a number");
    const letter = parseMint(get(r, "mint")) || sy.mint || "", kind = isProofGrade(g) ? "proof" : "circ";
    if (letter && kind === "circ" && t.mints && !t.mints.includes(letter)) return fail(t.name + " " + year + ": no \"" + letter + "\" mint (" + t.mints.join(", ") + ")");
    const mint = normMint(letter);
    const key = String(year) + (kind === "proof" || !mint ? "" : "-" + mint);
    const ck = [t.id, kind, key, g].join("\u0001"), val = Math.round(v * 100) / 100;
    if (cells.has(ck) && cells.get(ck).v !== val) dups++; // same coin and grade twice with different numbers: the last one wins
    cells.set(ck, { id: t.id, kind, key, g, v: val });
  });
  return { cells: [...cells.values()], bad, dups };
}
// The saved record with these cells added. Same shape as a price file (format 1); nothing else about it changes.
function ovMerge(rec, cells, source) {
  const out = { kind: "pricebook", format: 1, source, edition: (rec && rec.edition) || "", series: JSON.parse(JSON.stringify((rec && rec.series) || {})), mintage: (rec && rec.mintage) || {}, savedAt: new Date().toISOString() };
  const tabs = new Map();
  cells.forEach((c) => { const k = c.id + "\u0001" + c.kind; if (!tabs.has(k)) tabs.set(k, []); tabs.get(k).push(c); });
  tabs.forEach((list, k) => {
    const [id, kind] = k.split("\u0001");
    const ser = (out.series[id] = out.series[id] || {});
    const old = ser[kind] || { grades: [], rows: {} };
    const grades = [...new Set([...old.grades, ...list.map((c) => c.g)])].sort((a, b) => GRADES.indexOf(a) - GRADES.indexOf(b));
    const rows = {};
    Object.entries(old.rows).forEach(([rk, arr]) => { rows[rk] = grades.map((g) => { const i = old.grades.indexOf(g); return i < 0 ? null : arr[i]; }); });
    list.forEach((c) => { if (!rows[c.key]) rows[c.key] = grades.map(() => null); rows[c.key][grades.indexOf(c.g)] = c.v; });
    ser[kind] = { ...old, grades, rows };
  });
  return out;
}
function renderOv() {
  const p = ovParse(), m = ov.map, ready = ["type", "year", "grade", "value"].every((k) => m[k] != null);
  const have = store.docs.get("pricebook"), cur = (have && have.series) || {};
  let changed = 0, fresh = 0;
  p.cells.forEach((c) => { const t = cur[c.id] && cur[c.id][c.kind], i = t ? t.grades.indexOf(c.g) : -1, row = t && t.rows[c.key], was = row && i >= 0 ? row[i] : null; if (was == null) fresh++; else if (was !== c.v) changed++; });
  const nSeries = new Set(p.cells.map((c) => c.id)).size;
  const sel = (key) => `<label class="f"><span>${esc(OV_FIELDS.find((f) => f.key === key).head)}${key === "mint" ? " (optional)" : ""}</span><select data-ovmap="${key}"><option value="">${key === "mint" ? "None" : "Pick a column"}</option>${ov.headers.map((h, i) => `<option value="${i}" ${m[key] === i ? "selected" : ""}>${esc(h || "(no heading)")}</option>`).join("")}</select></label>`;
  const sample = p.cells.slice(0, 6).map((c) => `<div class="rowline"><span>${esc((TYPE_BY_ID[c.id] || {}).name || c.id)} ${esc(c.key)} ${esc(c.g)}</span><span>${esc(money(c.v))}</span></div>`).join("");
  openSheet(`<div class="sheet-head"><h2>Your own values</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <div class="small muted">${esc(ov.fileName || "")}: match each column to what it holds.</div>
    <details ${ready ? "" : "open"}><summary>Match columns</summary><div class="grid2">${OV_FIELDS.map((f) => sel(f.key)).join("")}</div></details>
    ${!ready ? `<div class="banner" style="margin:12px 0 0">Pick a column for Coin type, Year, Grade and Value to continue.</div>` : `
    <h2>Preview</h2>
    <div class="card small"><b>${p.cells.length.toLocaleString("en-US")} value${p.cells.length === 1 ? "" : "s"}</b> for ${nSeries} coin type${nSeries === 1 ? "" : "s"}: ${fresh} new, ${changed} replacing a price already here.${p.dups ? `<br><b>${p.dups} repeated coin${p.dups === 1 ? "" : "s"} with different numbers</b>: the last one in the file is used.` : ""}${p.bad.length ? `<br><b>${p.bad.length} row${p.bad.length === 1 ? "" : "s"} skipped</b>` : ""}</div>
    <div class="list" style="margin-top:6px">${sample}</div>
    ${p.bad.length ? `<details><summary>Skipped rows (${p.bad.length})</summary>${p.bad.slice(0, 15).map((b) => `<div class="small muted">Row ${b.line}: ${esc(b.why)}</div>`).join("")}${p.bad.length > 15 ? `<div class="small muted">…and ${p.bad.length - 15} more</div>` : ""}</details>` : ""}
    <label class="f"><span>Name shown next to these values</span><input type="text" id="ovSource" value="${esc(ov.source)}"></label>
    <div class="hint">Your coins are not changed. You can undo this right after.</div>
    <div class="btn-row"><button class="btn primary" data-act="applyOv" ${p.cells.length ? "" : "disabled"}>Add ${p.cells.length.toLocaleString("en-US")} value${p.cells.length === 1 ? "" : "s"}</button><button class="btn" data-act="closeSheet">Cancel</button></div>`}`);
}
function applyOv() {
  if (!ov) return;
  const src = $("#ovSource"), name = (src && src.value.trim()) || ov.source || OV_SOURCE_DEFAULT;
  const p = ovParse();
  if (!p.cells.length) return;
  ov = null;
  const before = store.docs.get("pricebook");
  const back = before ? JSON.parse(JSON.stringify(before)) : { kind: "pricebook", format: 1, source: "", edition: "", series: {}, mintage: {}, savedAt: "" };
  put("pricebook", ovMerge(before, p.cells, name.slice(0, 40)));
  closeSheet(); render();
  toast(p.cells.length.toLocaleString("en-US") + " values added.", { label: "Undo", fn: () => { put("pricebook", back); render(); toast("Undone. The earlier prices are back."); } });
}
Object.assign(actions, { ovHelp: () => ovHelp(), saveOvTemplate: () => saveOvTemplate(), applyOv: () => applyOv() });
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "ownValuesFile" && el.files && el.files[0]) {
    const f = el.files[0]; el.value = "";
    const say = (t) => { const m = $("#priceMsg"); if (m) m.textContent = t; };
    if (f.size > PRICE_FILE_MAX) { say("That file is too big."); return; }
    const r = new FileReader();
    r.onload = () => loadOvText(r.result, f.name);
    r.onerror = () => say("Couldn't read that file.");
    r.readAsText(f);
    return;
  }
  if (el.dataset.ovmap && ov) {
    const k = el.dataset.ovmap, i = el.value === "" ? null : +el.value;
    Object.keys(ov.map).forEach((o) => { if (i != null && o !== k && ov.map[o] === i) delete ov.map[o]; }); // each column used once
    if (i == null) delete ov.map[k]; else ov.map[k] = i;
    const s = $("#ovSource"); if (s) ov.source = s.value;
    const y = $(".sheet").scrollTop; renderOv(); $(".sheet").scrollTop = y;
  }
});
