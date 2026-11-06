// Red Book values for Roosevelt dimes, Kennedy halves, Silver Eagles and Indian Head $2.50 (catalog/pricebook-modern.js).
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    const price = (c) => { const x = bookLookup(c); return x && x.price != null ? x.price : null; };
    const series = ["roosevelt-silver", "roosevelt-clad", "kennedy-90", "kennedy-40", "kennedy-clad", "silver-eagle", "indian-2-5"];
    const problems = [];
    series.forEach((id) => Object.entries(PRICE_BOOK.series[id]).forEach(([kind, t]) => {
      t.grades.forEach((g) => { if (!GRADES.includes(g)) problems.push("bad grade " + id + " " + g); });
      Object.entries(t.rows).forEach(([k, row]) => {
        if (row.length !== t.grades.length) problems.push("row length " + id + " " + k);
        const v = row.filter((x) => x != null); if (v.some((x, i) => i && x < v[i - 1])) problems.push("prices fall " + id + " " + kind + " " + k);
      });
      const m = PRICE_BOOK.mintage[id] && PRICE_BOOK.mintage[id][kind];
      if (m) Object.keys(m).forEach((k) => { if (!t.rows[k]) problems.push("mintage without row " + id + " " + kind + " " + k); });
    }));
    // every date and mint the album builder offers for a regular-strike series has a price row
    const missing = [];
    ["roosevelt-silver", "roosevelt-clad", "kennedy-40", "kennedy-clad"].forEach((id) => {
      (EXACT_SLOTS[id] || []).forEach(([y, ms]) => {
        if (y > 2025) return;
        ms.split(" ").forEach((m) => { const k = y + (m === "P" ? "" : "-" + m); if (!PRICE_BOOK.series[id].circ.rows[k]) missing.push(id + " " + k); });
      });
    });
    const T = (typeId, year, mint, grade, variety) => ({ typeId, year, mint, grade, variety: variety || "" });
    return {
      problems, missing,
      rooS: price(T("roosevelt-silver", 1949, "S", "MS-65")),
      rooNoMmk: price(T("roosevelt-clad", 1982, "P", "MS-65", "No Mintmark, Strong Strike")),
      rooSilverProof: price(T("roosevelt-clad", 1992, "S", "PR-67", "Silver")),
      rooProofNoS: price(T("roosevelt-clad", 1968, "S", "PR-67", "No S")),
      rooSms: price({ ...T("roosevelt-clad", 1966, "P", "MS-65"), sms: true }),
      kenny2005: price(T("kennedy-clad", 2005, "P", "MS-67")),
      kenny2004D: price(T("kennedy-clad", 2004, "D", "MS-67")),
      kennyProofSilver: price(T("kennedy-clad", 2012, "S", "PR-68", "Silver")),
      kenny64sms: price({ ...T("kennedy-90", 1964, "P", "MS-65"), sms: true }),
      kenny64proofHair: price(T("kennedy-90", 1964, "S", "PR-67", "Accented Hair (proof)")),
      eagle2015: price(T("silver-eagle", 2015, "P", "MS-70")),
      eagleProof: price(T("silver-eagle", 2017, "S", "PR-70", "San Francisco (S)")),
      indian: price(T("indian-2-5", 1911, "D", "MS-63", "Strong D")),
      indianProof: price(T("indian-2-5", 1908, "P", "PR-65")),
      mint1: mintageInfo(T("roosevelt-silver", 1950, "S", "MS-63")) && mintageInfo(T("roosevelt-silver", 1950, "S", "MS-63")).text,
    };
  });
  ok("every price row has the right number of grades, real grade names, prices never fall, mintages match rows", r.problems.length === 0);
  if (r.problems.length) console.log(r.problems.slice(0, 8).join("\n"));
  ok("every album date and mint for Roosevelt and Kennedy has a price", r.missing.length === 0);
  if (r.missing.length) console.log(r.missing.slice(0, 12).join(", "));
  ok("1949-S Roosevelt MS-65 = $46", r.rooS === 46);
  ok("1982 No Mintmark Strong Strike MS-65 = $220", r.rooNoMmk === 220);
  ok("1992 Silver proof PF-67 = $8", r.rooSilverProof === 8);
  ok("1968 No S proof PF-67 = $20,000", r.rooProofNoS === 20000);
  ok("1966 dime special mint set MS-65 = $4.10", r.rooSms === 4.1);
  ok("2005 Kennedy MS-67 = $210, 2004-D MS-67 = $34", r.kenny2005 === 210 && r.kenny2004D === 34);
  ok("2012-S Silver Kennedy proof PF-68 = $115", r.kennyProofSilver === 115);
  ok("1964 Kennedy special mint set MS-65 = $38,500", r.kenny64sms === 38500);
  ok("1964 Accented Hair proof PF-67 = $150", r.kenny64proofHair === 150);
  ok("2015 Silver Eagle MS-70 = $4,500", r.eagle2015 === 4500);
  ok("2017-S Silver Eagle proof PF-70 = $145", r.eagleProof === 145);
  ok("1911-D Strong D Indian quarter eagle MS-63 = $13,000", r.indian === 13000);
  ok("1908 Indian quarter eagle proof PF-65 = $29,000", r.indianProof === 29000);
  ok("1950-S dime mintage shows the 1950 proof/regular mintage", r.mint1 === "20,440,000");
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
