"use strict";
/* Step 11.3: the price list comes from a file you keep (Options > Red Book values > Load a price file).
   No prices ship with the app. The file is saved on the phone as the record "pricebook" (see app.js). */
const PRICE_FILE_MAX = 2 * 1024 * 1024;

// Checks a price file's shape. Returns { error } or { nSeries, rows, missing }. Nothing is changed here.
function checkPriceFile(d) {
  const bad = (error) => ({ error });
  if (!d || typeof d !== "object" || Array.isArray(d) || d.kind !== "pricebook") return bad("That isn't a Coin Cabinet price file.");
  if (d.format !== 1) return bad(d.format > 1 ? "This price file is from a newer version of Coin Cabinet. Update the app first." : "That isn't a Coin Cabinet price file.");
  const ser = d.series;
  if (!ser || typeof ser !== "object" || Array.isArray(ser) || !Object.keys(ser).length) return bad("That price file has no prices in it.");
  let rows = 0;
  for (const [id, kinds] of Object.entries(ser)) {
    if (!kinds || typeof kinds !== "object" || Array.isArray(kinds)) return bad("The prices for " + id + " are not in the right shape.");
    for (const [kind, t] of Object.entries(kinds)) {
      const where = id + " (" + kind + ")";
      if (!t || !Array.isArray(t.grades) || !t.grades.length || !t.rows || typeof t.rows !== "object" || Array.isArray(t.rows)) return bad("The price table for " + where + " is not in the right shape.");
      if (!t.grades.every((g) => typeof g === "string" && (typeof GRADES === "undefined" || GRADES.includes(g)))) return bad("The price table for " + where + " has a grade this app doesn't know.");
      for (const [k, row] of Object.entries(t.rows)) {
        if (!Array.isArray(row) || row.length !== t.grades.length || !row.every((x) => x === null || (typeof x === "number" && isFinite(x) && x >= 0))) return bad("The row " + k + " in " + where + " has something other than numbers or blanks.");
        rows++;
      }
    }
  }
  if (d.mintage != null) {
    const okM = typeof d.mintage === "object" && !Array.isArray(d.mintage) && Object.values(d.mintage).every((kinds) => kinds && typeof kinds === "object" && Object.values(kinds).every((tab) => tab && typeof tab === "object" && Object.values(tab).every((v) => typeof v === "number" || typeof v === "string")));
    if (!okM) return bad("The mintage list in that price file is not in the right shape.");
  }
  // Dates the app lists (catalog/bookfacts.js) for the series in this file that have no price row.
  let missing = 0;
  if (typeof BOOK_FACTS !== "undefined") for (const id of Object.keys(ser)) for (const [kind, keys] of Object.entries(BOOK_FACTS[id] || {})) { const t = ser[id][kind]; if (t && Array.isArray(keys)) keys.forEach((k) => { if (!t.rows[k]) missing++; }); }
  return { nSeries: Object.keys(ser).length, rows, missing };
}

let pricePending = null;
async function readPriceFile(file) {
  const msg = $("#priceMsg"), say = (t) => { if (msg) msg.textContent = t; };
  if (file.size > PRICE_FILE_MAX) { say("That file is too big to be a price file."); return; }
  let d;
  try { d = JSON.parse(await file.text()); } catch (e) { say("That isn't a Coin Cabinet price file."); return; }
  const r = checkPriceFile(d);
  if (r.error) { say(r.error + " The prices on this phone were not changed."); return; }
  pricePending = d;
  say("");
  confirmSheet("Replace the prices on this phone?",
    r.nSeries + " series, " + r.rows.toLocaleString("en-US") + " rows" + (r.missing ? "; " + r.missing + " date" + (r.missing === 1 ? "" : "s") + " in the app's lists " + (r.missing === 1 ? "has" : "have") + " no row" : "") + ". Your coins are not changed.",
    "Replace prices", () => applyPriceFile());
}
function applyPriceFile() {
  const d = pricePending; pricePending = null;
  if (!d) return;
  const before = store.docs.get("pricebook");
  const make = (b) => ({ kind: "pricebook", format: 1, source: String(b.source || "Red Book"), edition: String(b.edition || ""), series: b.series || {}, mintage: b.mintage || {}, savedAt: new Date().toISOString() });
  put("pricebook", make(d));
  render();
  toast("Prices replaced.", { label: "Undo", fn: () => { put("pricebook", make(before || {})); render(); toast("Undone. The earlier prices are back."); } });
}
async function savePriceFile() {
  const msg = $("#priceMsg"), say = (t) => { if (msg) msg.textContent = t; };
  const rec = store.docs.get("pricebook");
  if (!rec || !Object.keys(rec.series || {}).length) { say("There are no prices on this phone to save."); return; }
  if (!downloadsApi) { say("Saving files isn't available here."); return; }
  const name = "coin-cabinet-prices-" + today() + ".json";
  try { await downloadsApi.save({ filename: name, data: JSON.stringify({ kind: "pricebook", format: 1, source: rec.source, edition: rec.edition, series: rec.series, mintage: rec.mintage || {}, savedAt: rec.savedAt }), type: "application/json" }); }
  catch (e) { say(e && e.code === "declined" ? "Not saved." : "Couldn't save the file. Try again."); return; }
  say("Saved " + name + ".");
}
Object.assign(actions, { savePriceFile: () => savePriceFile() });
document.addEventListener("change", (e) => {
  if (e.target.id === "priceFile" && e.target.files && e.target.files[0]) readPriceFile(e.target.files[0]);
});
