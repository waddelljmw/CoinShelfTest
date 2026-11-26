// Step 33a (v0.119.0): Semi-key tag from a short checked list. Nothing new is saved.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const mk = (typeId, year, mint, o) => ({ typeId, year, mint, gradeMode: "raw", grade: "VF-20", ...o });
    const all = Object.entries(SEMI_KEYS).flatMap(([t, l]) => l.map((k) => { const [y, m] = k.split("|"); return mk(t, +y, m === "P" ? "" : m); }));
    return {
      n: all.length,
      badTypes: all.filter((c) => !TYPE_BY_ID[c.typeId] || mintWarning(c.typeId, c.year, c.mint)).map((c) => c.typeId + c.year + c.mint),
      hidden: all.filter((c) => !isSemiKey(c)).map((c) => c.typeId + c.year + c.mint),
      common: isSemiKey(mk("morgan-dollar", 1921, "")), proof: isSemiKey(mk("franklin-half", 1953, "", { grade: "PR-63" })),
      key: isSemiKey(mk("morgan-dollar", 1893, "S")),
      card: coinCardHtml(mk("morgan-dollar", 1893, "CC"), { spot: true }),
      row: lookupRowsHtml("1893-cc morgan"),
    };
  });
  ok("16 dates listed", r.n === 16);
  ok("every listed date is a real date and mint " + r.badTypes, !r.badTypes.length);
  ok("every listed date shows (none already Key date) " + r.hidden, !r.hidden.length);
  ok("common, proof and key dates get no Semi-key", !r.common && !r.proof && !r.key);
  ok("card shows Semi-key, not Key date", /Semi-key/.test(r.card) && !/Key date/.test(r.card));
  ok("search row for 1893-CC Morgan shows Semi-key", /Semi-key/.test(r.row));
  console.log("errors", errors); await b.close();
})();
