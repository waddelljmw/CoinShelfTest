// How the price lookup treats Roosevelt dimes, Kennedy halves, Silver Eagles, Indian $2.50 and Mercury dimes.
// Since Step 11.3 it runs on the made-up price list in tests/fixtures/prices.json (no real prices in the repo).
// It checks the lookup rules (grade, strike kind, variety, mintage, FB/FBL words), not any real price.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const fx = require("./fixtures/prices.json");
  const row = (id, kind, key) => fx.series[id][kind].rows[key];
  const r = await p.evaluate(() => {
    const price = (c) => { const x = bookLookup(c); return x && x.price != null ? x.price : null; };
    const problems = [];
    Object.entries(PRICE_BOOK.series).forEach(([id, kinds]) => Object.entries(kinds).forEach(([kind, t]) => {
      t.grades.forEach((g) => { if (!GRADES.includes(g)) problems.push("bad grade " + id + " " + g); });
      Object.entries(t.rows).forEach(([k, row]) => { if (row.length !== t.grades.length) problems.push("row length " + id + " " + k); });
    }));
    const T = (typeId, year, mint, grade, variety) => ({ typeId, year, mint, grade, variety: variety || "" });
    return {
      problems,
      rooS: price(T("roosevelt-silver", 1949, "S", "MS-65")),
      rooSAbove: price(T("roosevelt-silver", 1949, "S", "MS-67")),
      rooNoMmk: price(T("roosevelt-clad", 1982, "P", "MS-65", "No Mintmark, Strong Strike")),
      rooSms: price({ ...T("roosevelt-clad", 1966, "P", "MS-65"), sms: true }),
      kenny2005: price(T("kennedy-clad", 2005, "P", "MS-67")),
      eagleProof: price(T("silver-eagle", 2017, "S", "PR-70", "San Francisco (S)")),
      indian: price(T("indian-2-5", 1911, "D", "MS-63", "Strong D")),
      indianBelow: bookLookup(T("indian-2-5", 1911, "D", "VG-8", "Strong D")),
      merc16D: price(T("mercury-dime", 1916, "D", "MS-63")),
      mercFb: price({ ...T("mercury-dime", 1945, "S", "MS-65", "Micro S"), fbl: true }),
      mercFbText: bookText(bookLookup({ ...T("mercury-dime", 1945, "S", "MS-65", "Micro S"), fbl: true })),
      mercFbForFranklin: bookText(bookLookup({ ...T("franklin-half", 1953, "S", "MS-65"), fbl: true })),
      mint1: mintageInfo(T("roosevelt-silver", 1950, "S", "MS-63")) && mintageInfo(T("roosevelt-silver", 1950, "S", "MS-63")).text,
      noRow: bookLookup(T("roosevelt-silver", 1947, "S", "MS-65")),
    };
  });
  ok("every price row has the right number of grades and real grade names", r.problems.length === 0);
  ok("roosevelt silver 1949-S MS-65 picks the MS-65 column", r.rooS === row("roosevelt-silver", "circ", "1949-S")[1]);
  ok("a grade above the top column uses the top column", r.rooSAbove === row("roosevelt-silver", "circ", "1949-S")[2]);
  ok("a variety-keyed row is found", r.rooNoMmk === row("roosevelt-clad", "circ", "1982|No Mintmark, Strong Strike")[1] && r.eagleProof === row("silver-eagle", "proof", "2017|San Francisco (S)")[1]);
  ok("special mint set rows are used when ticked", r.rooSms === row("roosevelt-clad", "sms", "1966")[1]);
  ok("kennedy and indian rows", r.kenny2005 === row("kennedy-clad", "circ", "2005")[3] && r.indian === row("indian-2-5", "circ", "1911-D|Strong D")[4]);
  ok("below the lowest column is flagged, not priced", !!r.indianBelow && r.indianBelow.below === true);
  ok("a date with no row has no price", !!r.noRow && r.noRow.none === true);
  ok("mercury 1916-D", r.merc16D === row("mercury-dime", "circ", "1916-D")[6]);
  ok("Full Bands price is used and says FB (Franklins still say FBL)", r.mercFb === row("mercury-dime", "fbl", "1945-S|Micro S")[2] && / FB\)/.test(r.mercFbText) && / FBL\)/.test(r.mercFbForFranklin));
  ok("mintage comes from the saved list", r.mint1 === "12,345,678");
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
