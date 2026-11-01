// Spreadsheet (CSV) import and export for Coin Cabinet.
// Loaded after app.js and uses its helpers (store, put, settings, COIN_TYPES, ...).
"use strict";

/* ---------- columns ---------- */
// One entry per spreadsheet column. `names` are other headings we recognize on import
// (compared lowercase with spaces, dashes and punctuation removed).
const SHEET_COLS = [
  { key: "label", head: "Label", names: ["label", "name", "title", "description"] },
  { key: "status", head: "Status", names: ["status", "state"] },
  { key: "year", head: "Year", names: ["year", "date", "yr"] },
  { key: "mint", head: "Mint", names: ["mint", "mintmark", "mm"] },
  { key: "typeName", head: "Coin type", names: ["cointype", "type", "series", "coin", "design", "kind"] },
  { key: "denom", head: "Denomination", names: ["denomination", "denom", "facevalue", "face"] },
  { key: "variety", head: "Variety", names: ["variety", "var"] },
  { key: "gradeMode", head: "Raw or certified", names: ["raworcertified", "rawcertified", "gradetype", "certified", "slabbed", "graded"] },
  { key: "grade", head: "Grade", names: ["grade", "condition", "estimatedgrade", "myestimatedgrade"] },
  { key: "service", head: "Grading service", names: ["gradingservice", "service", "grader", "tpg", "company"] },
  { key: "cert", head: "Cert number", names: ["certnumber", "cert", "certno", "certification", "certificationnumber", "serial"] },
  { key: "fbl", head: "FBL", names: ["fbl", "fullbelllines"] },
  { key: "sms", head: "SMS", names: ["sms", "specialmintset"] },
  { key: "metal", head: "Metal", names: ["metal", "composition"] },
  { key: "oz", head: "Metal oz", names: ["metaloz", "oz", "metalcontent", "metalcontentoz", "asw", "agw", "fineweight", "weightoz"] },
  { key: "qty", head: "Qty", names: ["qty", "quantity", "count", "number", "amount"] },
  { key: "paid", head: "Paid each", names: ["paideach", "paid", "pricepaid", "cost", "purchaseprice", "price"] },
  { key: "value", head: "Value each", names: ["valueeach", "value", "estimatedvalue", "worth", "currentvalue", "marketvalue"] },
  { key: "redBook", head: "Red Book each", names: ["redbookeach", "redbook", "redbookvalue"], exportOnly: true },
  { key: "meltEach", head: "Melt each", names: ["melteach", "melt", "meltvalue"], exportOnly: true },
  { key: "source", head: "Source", names: ["source", "from", "acquiredfrom", "seller", "boughtfrom", "origin"] },
  { key: "acquired", head: "Date acquired", names: ["dateacquired", "acquired", "purchasedate", "datepurchased", "dateadded", "bought"] },
  { key: "album", head: "Album", names: ["album", "folder", "binder"] },
  { key: "notes", head: "Notes", names: ["notes", "note", "comments", "comment", "memo"] },
  { key: "soldDate", head: "Sold date", names: ["solddate", "datesold"] },
  { key: "soldAmount", head: "Sold for", names: ["soldfor", "soldprice", "saleprice", "soldamount"] },
  { key: "shipping", head: "Shipping", names: ["shipping", "shippingcost"] },
  { key: "insurance", head: "Insurance", names: ["insurance", "insurancecost"] },
  { key: "soldWhere", head: "Sold where", names: ["soldwhere", "wheresold", "soldon", "soldvia", "platform", "venue"] },
  { key: "soldTo", head: "Sold to", names: ["soldto", "buyer", "buyername", "customer", "purchaser"] },
];
const COL_BY_KEY = Object.fromEntries(SHEET_COLS.map((c) => [c.key, c]));
const squash = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* ---------- export ---------- */
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function coinToRow(c) {
  const a = c.albumId ? getAlbum(c.albumId) : null;
  const s = c.sold || {};
  const m = meltEach(c);
  const rb = bookPrice(c);
  return {
    label: labelOf(c), status: c.status === "sold" ? "Sold" : "Owned", year: c.year, mint: c.mint, typeName: c.typeName, denom: c.denom,
    variety: c.variety, gradeMode: c.gradeMode === "cert" ? "Certified" : "Raw",
    grade: c.grade === "Other" ? c.customGrade : c.grade, service: c.gradeMode === "cert" ? (c.service === "Other" ? c.customService : c.service) : "",
    cert: c.cert, fbl: c.fbl ? "Yes" : "", sms: c.sms ? "Yes" : "", metal: c.metal, oz: c.oz, qty: qtyOf(c), paid: c.paid, value: c.value,
    redBook: rb ?? "", meltEach: m == null ? "" : m.toFixed(2), source: (c.source || "").trim(), acquired: c.acquired,
    album: a ? albumTitle(a) : "", notes: c.notes, soldDate: s.date, soldAmount: s.amount, shipping: s.shipping, insurance: s.insurance, soldWhere: c.sold ? whereText(c.sold) : "", soldTo: s.to || "",
  };
}
function toCsv(coins) {
  const list = coins || allCoins().filter((c) => c.status !== "deleted");
  return [SHEET_COLS.map((c) => c.head).join(","), ...list.map((c) => { const r = coinToRow(c); return SHEET_COLS.map((col) => csvCell(r[col.key])).join(","); })].join("\n");
}
async function doExport() {
  const csv = toCsv();
  const name = "coin-cabinet-" + today() + ".csv";
  if (downloadsApi) {
    try { await downloadsApi.save({ filename: name, data: csv }); return; } catch (e) { if (e && e.code === "declined") return; }
  }
  try { await navigator.clipboard.writeText(csv); toast("Copied the spreadsheet. Paste it into Excel or Google Sheets."); }
  catch (e) { toast("Couldn't export from this view."); }
}

/* ---------- CSV parsing ---------- */
// Handles quoted fields, doubled quotes, commas and line breaks inside quotes, and a byte-order mark.
function parseCsv(text) {
  text = String(text || "").replace(/^﻿/, "");
  const delim = (text.split(/\r?\n/)[0].match(/\t/g) || []).length > (text.split(/\r?\n/)[0].match(/,/g) || []).length ? "\t" : ",";
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

/* ---------- turning a row into a coin ---------- */
const money2 = (v) => { if (v == null) return ""; const s = String(v).replace(/[$,\s]/g, ""); return s === "" || isNaN(+s) ? "" : +s; };
const yesish = (v) => /^(y|yes|true|1|x|✓)$/i.test(String(v || "").trim());

function parseGrade(raw) {
  let g = String(raw || "").trim();
  if (!g) return { grade: "" };
  if (/^junk$/i.test(g)) return { grade: "Junk" };
  let m = g.toUpperCase().replace(/\s+/g, " ").match(/^(PO|P|FR|AG|G|VG|F|VF|EF|XF|AU|MS|PF|PR|SP)\s*-?\s*(\d{1,2})(\+)?$/);
  if (m) {
    let pre = m[1];
    if (pre === "P") pre = "PO";
    if (pre === "EF") pre = "XF";
    if (pre === "PF") pre = "PR";
    const cand = pre + "-" + m[2];
    if (GRADES.includes(cand)) return { grade: cand };
  }
  return { grade: "Other", customGrade: g };
}
function parseService(raw) {
  const s = String(raw || "").trim();
  if (!s) return {};
  const hit = SERVICES.find((x) => x !== "Other" && x.toLowerCase() === s.toLowerCase());
  return hit ? { service: hit } : { service: "Other", customService: s };
}
function parseMint(raw) {
  const s = String(raw || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!s || s === "NONE" || s === "NA") return "";
  return MINTS.includes(s) ? s : s;
}
// "1921-D" in a year cell gives both year and mint.
function splitYear(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/(1[789]\d\d|20\d\d)(?:\s*-?\s*(CC|[PDSOWC])\b)?/i);
  return m ? { year: +m[1], mint: m[2] ? m[2].toUpperCase() : null } : { year: "", mint: null };
}
// Find the known coin type for a name and year (e.g. "Kennedy Half Dollar" + 1967 → the 40% silver Kennedy).
function matchType(name, year, oz, metal) {
  const n = squash(name);
  if (!n) return null;
  const inYear = (t) => !year || (year >= t.start && year <= t.end);
  const ozOk = (t) => oz === "" || oz == null || Math.abs((t.oz || 0) - oz) < 0.0005;
  const sameName = COIN_TYPES.filter((t) => squash(t.name) === n || squash(shortName(t)) === n || squash(t.family) === n);
  // The metal column breaks ties, e.g. 1982 copper vs. zinc Lincoln cents.
  const metalOk = (t) => !metal || String(metal).toLowerCase().trim() === String(t.metal).toLowerCase();
  let hit = sameName.find((t) => inYear(t) && ozOk(t) && metalOk(t)) || sameName.find((t) => inYear(t) && ozOk(t)) || sameName.find(inYear) || null;
  if (!hit) {
    const words = String(name).toLowerCase().replace(/[^a-z0-9$ ]/g, " ").split(/\s+/).filter((w) => w && !["us", "the", "coin", "silver", "clad"].includes(w));
    const loose = COIN_TYPES.filter((t) => words.length && words.every((w) => (t.name + " " + t.family + " " + t.denom).toLowerCase().includes(w)));
    hit = loose.find(inYear) || null;
  }
  return hit;
}

function rowToCoin(get) {
  const yr = splitYear(get("year"));
  const typeText = get("typeName") || "";
  const t = matchType(typeText, yr.year, money2(get("oz")), get("metal"));
  const statusSold = /sold/i.test(get("status") || "") || money2(get("soldAmount")) !== "" || !!String(get("soldDate") || "").trim();
  const svc = parseService(get("service"));
  const g = parseGrade(get("grade"));
  const certified = /cert|slab|yes|true|graded/i.test(get("gradeMode") || "") || !!svc.service || !!String(get("cert") || "").trim();
  const c = blankCoin();
  c.year = yr.year;
  c.mint = get("mint") != null && String(get("mint")).trim() !== "" ? parseMint(get("mint")) : yr.mint || "";
  if (t) { c.typeId = t.id; c.typeName = shortName(t); c.family = t.family; c.denom = t.denom; c.metal = t.metal; c.oz = t.oz || ""; applyYearMetal(c); }
  else { c.typeName = typeText.trim(); c.family = typeText.trim() || "Other"; }
  if (String(get("denom") || "").trim()) c.denom = String(get("denom")).trim();
  const metal = String(get("metal") || "").trim();
  if (metal) { const hit = METALS.find((m) => m.toLowerCase() === metal.toLowerCase()); c.metal = hit || "Other"; if (!MELT_OF_METAL[c.metal] && !hit) c.oz = ""; }
  if (money2(get("oz")) !== "") c.oz = money2(get("oz"));
  c.gradeMode = certified ? "cert" : "raw";
  c.grade = g.grade === "Junk" && certified ? "" : g.grade;
  if (g.customGrade) c.customGrade = g.customGrade;
  if (certified) { c.service = svc.service || "PCGS"; c.customService = svc.customService || ""; c.cert = String(get("cert") || "").trim(); }
  c.variety = String(get("variety") || "").trim();
  c.fbl = yesish(get("fbl"));
  c.sms = yesish(get("sms"));
  c.qty = Math.max(1, Math.round(+money2(get("qty")) || 1));
  c.paid = String(money2(get("paid")));   // stored as text, like the add-coin form
  c.value = String(money2(get("value")));
  c.source = String(get("source") || "").trim();
  c.acquired = normDate(get("acquired"));
  c.notes = String(get("notes") || "").trim();
  const lab = String(get("label") || "").trim();
  if (lab && lab !== autoLabel(c)) { c.label = lab; c.labelEdited = true; }
  if (statusSold) {
    c.status = "sold";
    c.sold = { at: Date.now(), date: normDate(get("soldDate")) || "", amount: money2(get("soldAmount")) === "" ? null : money2(get("soldAmount")),
      shipping: money2(get("shipping")) === "" ? null : money2(get("shipping")), insurance: money2(get("insurance")) === "" ? null : money2(get("insurance")) };
    Object.assign(c.sold, whereFromText(get("soldWhere")));
    c.sold.to = String(get("soldTo") || "").trim();
  }
  c._albumName = String(get("album") || "").trim();
  return { coin: c, typeMatched: !!t, typeText };
}
// "Coin show: FUN Show" → Coin show + detail; "ebay live" → eBay Live; anything else → Other.
function whereFromText(v) {
  const w = String(v || "").trim();
  if (!w) return { whereType: "", whereDetail: "", where: "" };
  const m = w.match(/^coin\s*show\s*[:\-–]?\s*(.*)$/i);
  let out;
  if (m) out = { whereType: "Coin show", whereDetail: m[1].trim() };
  else {
    const hit = SOLD_WHERE.find((o) => o !== "Other" && squash(o) === squash(w));
    out = hit ? { whereType: hit, whereDetail: "" } : { whereType: "Other", whereDetail: w };
  }
  out.where = whereText(out);
  return out;
}
// Accepts 2026-10-31, 10/31/2026, 10/31/26.
function normDate(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`; }
  return "";
}

/* ---------- import flow ---------- */
let imp = null; // { headers, rows, map: [fieldKey|""], fileName }

function guessField(header, taken) {
  const h = squash(header);
  const col = SHEET_COLS.find((c) => !c.exportOnly && !taken.has(c.key) && c.names.includes(h));
  return col ? col.key : "";
}
function openImport() {
  imp = null;
  openSheet(`<div class="sheet-head"><h2>Import from a spreadsheet</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>Pick a CSV file. Excel, Google Sheets and Numbers can all save one ("Download as CSV" or "Export as CSV").</p>
    <div class="card small">
      <b>Columns the app understands</b>
      <div class="muted" style="margin-top:4px">Year and Coin type are needed. Also: Mint, Grade, Qty, Paid each, Value each, Source, Date acquired, Notes, Album, Grading service, Cert number, Variety. A file from <b>Export</b> works as is. Other column names can be matched on the next step.</div>
    </div>
    <label class="btn primary block file-btn" style="display:block;text-align:center">Choose CSV file<input type="file" id="importFile" accept=".csv,.tsv,.txt,text/csv,text/plain"></label>
    <div class="hint" id="importMsg"></div>`);
}
function loadImportText(text, fileName) {
  const rows = parseCsv(text);
  if (rows.length < 2) { const m = $("#importMsg"); if (m) m.textContent = "That file has no coin rows. Check it has a heading row and at least one coin."; return; }
  const headers = rows[0].map((h) => String(h).trim());
  const taken = new Set();
  const map = headers.map((h) => { const k = guessField(h, taken); if (k) taken.add(k); return k; });
  imp = { headers, rows: rows.slice(1), map, fileName, skip: new Set() };
  renderImport();
}
function importCoins() {
  if (!imp) return [];
  return imp.rows.map((r) => rowToCoin((key) => { const i = imp.map.indexOf(key); return i < 0 ? null : r[i]; }));
}
function isDuplicate(c) {
  return allCoins().some((o) => o.status !== "deleted" && o.status === c.status && o.typeId === c.typeId && (o.typeId || o.typeName === c.typeName) && String(o.year) === String(c.year) && normMint(o.mint) === normMint(c.mint) && o.grade === c.grade && o.gradeMode === c.gradeMode && (c.gradeMode !== "cert" || !c.cert || o.cert === c.cert));
}
function renderImport() {
  const parsed = importCoins();
  const hasYear = imp.map.includes("year"), hasType = imp.map.includes("typeName");
  if (!imp.dupChecked) { parsed.forEach((p, i) => { if (isDuplicate(p.coin) || (p.coin.year && yearProblem(p.coin.typeId, p.coin.year, "coin"))) imp.skip.add(i); }); imp.dupChecked = true; }
  const fieldOpts = (sel) => `<option value="">Don't import</option>` + SHEET_COLS.filter((c) => !c.exportOnly).map((c) => `<option value="${c.key}" ${sel === c.key ? "selected" : ""}>${esc(c.head)}</option>`).join("");
  const sample = (i) => { const v = imp.rows.map((r) => r[i]).find((x) => String(x || "").trim()); return v ? String(v).slice(0, 24) : ""; };
  const nNew = parsed.filter((_, i) => !imp.skip.has(i)).length;
  const coinsN = parsed.filter((_, i) => !imp.skip.has(i)).reduce((t, p) => t + qtyOf(p.coin), 0);
  openSheet(`<div class="sheet-head"><h2>Import ${esc(imp.fileName || "")}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <details ${hasYear && hasType ? "" : "open"}><summary>Match columns (${imp.map.filter(Boolean).length} of ${imp.headers.length} used)</summary>
      <div class="hint">Each column from your file, and where it goes in the app.</div>
      ${imp.headers.map((h, i) => `<div class="grid2" style="align-items:end"><label class="f"><span>${esc(h || "(no heading)")}</span><input type="text" value="${esc(sample(i))}" disabled></label>
        <label class="f"><span>&nbsp;</span><select data-impmap="${i}">${fieldOpts(imp.map[i])}</select></label></div>`).join("")}
    </details>
    ${!hasYear || !hasType ? `<div class="banner" style="margin:12px 0 0">Pick which column is the <b>${!hasYear ? "Year" : "Coin type"}</b> to continue.</div>` : `
    <h2>Preview</h2>
    <div class="small muted" style="margin:-4px 0 8px">Untick any row you don't want. Rows that look like coins you already have, or have a year that doesn't fit, start unticked.</div>
    <div class="list">${parsed.map((p, i) => {
      const c = p.coin; const flags = [];
      if (!c.year) flags.push("no year");
      else if (yearProblem(c.typeId, c.year, "coin")) flags.push("year doesn't fit: " + yearProblem(c.typeId, c.year, "coin"));
      if (!p.typeMatched) flags.push(p.typeText ? "type not recognized, kept as typed" : "no coin type");
      if (c.grade === "Other") flags.push("grade kept as typed");
      if (isDuplicate(c)) flags.push("looks like one you have");
      const ia = c._albumName && albums().find((a) => squash(albumTitle(a)) === squash(c._albumName));
      if (ia && !albumHasType(ia, c.typeId)) flags.push("album " + albumTitle(ia) + " is for other coin types, so it won't go in it");
      const v = bestEach(c);
      return `<label class="coin-row" style="cursor:pointer"><input type="checkbox" data-impskip="${i}" ${imp.skip.has(i) ? "" : "checked"} style="width:20px;height:20px;accent-color:var(--accent)">
        <span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span>
        <span class="coin-sub">${qtyOf(c) > 1 ? `<span class="qty">×${qtyOf(c)}</span> ` : ""}${esc(gradeText(c))}${c.status === "sold" ? " · Sold" : ""}</span>${flags.length ? `<span class="small" style="display:block;color:var(--bad)">${esc(flags.join(", "))}</span>` : ""}</span>
        <span class="coin-val">${money(v == null ? null : v * qtyOf(c))}</span></label>`;
    }).join("")}</div>
    <div class="btn-row"><button class="btn primary" data-act="doImport" ${nNew ? "" : "disabled"}>Import ${nNew} row${nNew === 1 ? "" : "s"} (${coinsN} coin${coinsN === 1 ? "" : "s"})</button><button class="btn" data-act="closeSheet">Cancel</button></div>`}`);
}
async function doImport() {
  const parsed = importCoins();
  const batch = "imp_" + uid();
  const chosen = parsed.filter((_, i) => !imp.skip.has(i)).map((p) => p.coin).filter((c) => !c.year || !yearProblem(c.typeId, c.year, "coin"));
  const dropped = parsed.filter((_, i) => !imp.skip.has(i)).length - chosen.length;
  const albumByName = new Map(albums().map((a) => [squash(albumTitle(a)), a.id]));
  closeSheet();
  toast("Importing " + chosen.length + " rows…");
  const ids = [];
  for (const c of chosen) {
    const an = c._albumName; delete c._albumName;
    // Only into an album made for this coin's type.
    if (an && albumByName.has(squash(an)) && albumHasType(getAlbum(albumByName.get(squash(an))), c.typeId)) c.albumId = albumByName.get(squash(an));
    c.importBatch = batch;
    ids.push(c.id);
    if (c.typeId) touchType(c.typeId);
    await saveCoin(c); // one at a time so large files don't overwhelm saving
  }
  saveSettings({ lastImport: { batch, count: ids.length, ids, at: today() } });
  const anySold = chosen.some((c) => c.status === "sold");
  if (anySold && !settings().soldAutoDone) saveSettings({ showSold: true, soldAutoDone: true });
  go("coins");
  toast("Imported " + ids.length + " rows." + (dropped ? " Skipped " + dropped + " with a year that doesn't fit." : ""), { label: "Undo", fn: () => undoImport(true) });
}
// Imported rows you haven't changed since. Edited coins leave the batch (see saveCoin).
const importLeft = (li) => li.ids.map(getCoin).filter((c) => c && c.importBatch === li.batch && c.status !== "deleted");
async function undoImport(skipConfirm) {
  const li = settings().lastImport;
  if (!li) return;
  const left = importLeft(li);
  const doIt = async () => {
    // Moved to Recently deleted (restorable), not erased.
    for (const c of left) await put("c_" + c.id, { ...c, status: "deleted", prevStatus: c.status, deletedAt: Date.now() });
    saveSettings({ lastImport: null });
    const kept = li.count - left.length;
    toast("Moved " + left.length + " imported row" + (left.length === 1 ? "" : "s") + " to Recently deleted." + (kept ? " " + kept + " you'd changed were kept." : ""));
  };
  if (skipConfirm === true) return doIt();
  if (!left.length) { saveSettings({ lastImport: null }); toast("Nothing left to remove. You've changed or removed all of those rows."); return; }
  confirmSheet("Remove last import?", left.length + " imported row" + (left.length === 1 ? "" : "s") + " you haven't changed will move to Recently deleted, where you can restore them." + (li.count > left.length ? " " + (li.count - left.length) + " you've changed since will be kept." : ""), "Remove", doIt);
}

/* ---------- wiring ---------- */
Object.assign(actions, {
  openImport,
  doImport,
  undoImport: () => undoImport(),
  export: () => doExport(),
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "importFile" && el.files && el.files[0]) {
    const f = el.files[0];
    const r = new FileReader();
    r.onload = () => loadImportText(r.result, f.name);
    r.onerror = () => { const m = $("#importMsg"); if (m) m.textContent = "Couldn't read that file."; };
    r.readAsText(f);
    return;
  }
  if (el.dataset.impmap != null && imp) {
    const i = +el.dataset.impmap;
    const k = el.value;
    if (k) imp.map = imp.map.map((x, j) => (j !== i && x === k ? "" : x)); // each field from one column only
    imp.map[i] = k;
    imp.dupChecked = false; imp.skip = new Set();
    const y = $(".sheet").scrollTop; renderImport(); $(".sheet").scrollTop = y;
    return;
  }
  if (el.dataset.impskip != null && imp) {
    const i = +el.dataset.impskip;
    el.checked ? imp.skip.delete(i) : imp.skip.add(i);
    const y = $(".sheet").scrollTop; renderImport(); $(".sheet").scrollTop = y;
  }
});
