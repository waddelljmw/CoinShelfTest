/* Coin ID numbers (Step 7.0). Every item gets an ID like MD-012: type code + a number that counts up per code.
   Numbers are never reused (the next number for each code is kept in settings.idNext). Old coins get theirs on read. */
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
const idParts = (s) => { const m = /^([A-Z0-9]{1,4})-(\d+)$/.exec(String(s || "").trim().toUpperCase()); return m ? { code: m[1], n: +m[2] } : null; };
// Who already has this ID (other than coin `exceptId`)?
function idOwner(cid, exceptId) {
  const want = String(cid || "").trim().toUpperCase();
  return allCoins().find((c) => c.id !== exceptId && String(c.cid || "").toUpperCase() === want) || null;
}
// Give every coin without an ID its number, oldest first. Quiet: no screen redraw. Safe to call any time.
let idBusy = false;
function ensureIds() {
  if (idBusy || store.mode === "snapshot" || store.mode === "loading") return;
  const missing = allCoins().filter((c) => !c.cid);
  if (!missing.length) return;
  idBusy = true;
  try {
    const next = { ...(settings().idNext || {}) };
    // Never go below the highest number already in use (covers a restored backup).
    allCoins().forEach((c) => { const p = idParts(c.cid); if (p && (next[p.code] || 1) <= p.n) next[p.code] = p.n + 1; });
    missing.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id)));
    missing.forEach((c) => {
      const code = idCodeOf(c);
      let n = next[code] || 1;
      while (idOwner(idText(code, n))) n++;
      next[code] = n + 1;
      put("c_" + c.id, { ...c, cid: idText(code, n) }, true);
    });
    saveSettings({ idNext: next }, true);
  } finally { idBusy = false; }
}
// Change a coin's ID by hand. Returns "" if saved, or a plain-words problem.
function setCoinId(id, text) {
  const c = getCoin(id);
  if (!c) return "That coin isn't here.";
  const v = String(text || "").trim().toUpperCase();
  const p = idParts(v);
  if (!p) return "Type an ID like MD-012: letters, a dash, then a number.";
  const other = idOwner(v, id);
  if (other) return v + " is already used by " + labelOf(other) + ".";
  const next = { ...(settings().idNext || {}) };
  if ((next[p.code] || 1) <= p.n) { next[p.code] = p.n + 1; saveSettings({ idNext: next }, true); }
  saveCoin({ ...c, cid: v });
  return "";
}
