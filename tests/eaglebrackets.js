// Step 11.6: Silver Eagles. The plain date is the ordinary coin; "(P)", "(S)", "(W)" are choices; a coin saved with a mint letter still finds its value.
// Runs on the made-up price list in tests/fixtures/prices.json (no real prices in the repo).
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    const E = (year, mint, variety, grade) => ({ typeId: "silver-eagle", year, mint, variety: variety || "", grade: grade || "MS-69" });
    const price = (c) => { const x = bookLookup(c); return x && x.price != null ? x.price : null; };
    const mt = (c) => { const m = mintageInfo(c); return m ? m.text + (m.shared ? " shared" : "") : null; };
    return {
      noMint2005: price(E(2005, "")), w2005: price(E(2005, "W")), s2005: price(E(2005, "S")),
      plain2015: price(E(2015, "")), p2015: price(E(2015, "", "(P)")), w2015: price(E(2015, "W")), savedP2015: price(E(2015, "P")),
      plain2011: price(E(2011, "")), s2011: price(E(2011, "S")), w2011: price(E(2011, "W")), w2011b: price(E(2011, "W", "Burnished")),
      w2011ms70: price(E(2011, "W", "", "MS-70")),
      mintPlain2015: mt(E(2015, "")), mintP2015: mt(E(2015, "", "(P)")), mintW2011: mt(E(2011, "W")), mintW2011b: mt(E(2011, "W", "Burnished")), mint2005: mt(E(2005, "W")),
      choices2015: bookVarieties(E(2015, "")), choices2011: bookVarieties(E(2011, "")),
      facts: BOOK_FACTS["silver-eagle"].circ.filter((k) => /^(2005|2015)/.test(k)),
    };
  });
  ok("a 2005 with no mint mark shows a value", r.noMint2005 === 11);
  ok("a 2005 saved with W (or S) still finds it", r.w2005 === 11 && r.s2005 === 11);
  ok("a plain 2015 is the ordinary coin, not the rare (P)", r.plain2015 === 33 && r.p2015 === 91);
  ok("a 2015 saved with W finds the (W) row; saved with P uses the plain date", r.w2015 === 33 && r.savedP2015 === 33);
  ok("2011: plain is the lower row; saved S and W find their own choice", r.plain2011 === 51 && r.s2011 === 51 && r.w2011 === 61);
  ok("a saved W coin with the Burnished variety still finds Burnished", r.w2011b === 71);
  ok("grade columns still work", r.w2011ms70 === 62);
  ok("mintage: plain date, (P) choice, saved W, Burnished", r.mintPlain2015 === "8,888,888" && r.mintP2015 === "777" && r.mintW2011 === "5,555,555 shared" && r.mintW2011b === "99,999" && r.mint2005 === "1,234,567");
  ok("variety choices offer the plain coin and (P)/(W) (and Burnished with W saved)", JSON.stringify(r.choices2015) === JSON.stringify(["", "(P)", "(W)"]) && r.choices2011.includes("(S)") && r.choices2011.includes("(W)"));
  ok("the date list has the plain date and the choices", r.facts.includes("2005") && r.facts.includes("2015") && r.facts.includes("2015|(P)") && r.facts.includes("2015|(W)") && !r.facts.includes("2005-W"));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
