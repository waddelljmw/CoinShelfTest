const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const yp = (t, y) => p.evaluate(([t, y]) => yearProblem(t, y, "coin"), [t, y]);
  // War nickel years (item 89, review K-04)
  for (const y of [1943, 1944, 1945]) { const m = await yp("jefferson-nickel", y); ok(y + " regular Jefferson refused and points to the War Nickel", /wasn't made/.test(m) && /Jefferson War Nickel/.test(m)); ok(y + " War Nickel accepted", (await yp("jefferson-war-nickel", y)) === ""); }
  ok("1942 and 1946 regular Jefferson still fine", (await yp("jefferson-nickel", 1942)) === "" && (await yp("jefferson-nickel", 1946)) === "");
  // Indian cent metal by year (review K-03)
  const m = (y) => p.evaluate((y) => { const d = { typeId: "indian-cent", year: y, metal: "Copper", oz: CU.cent }; applyYearMetal(d); return [d.metal, d.oz]; }, y);
  const a = await m(1860), c = await m(1864), e = await m(1900);
  ok("1860 Indian cent is Copper-nickel 4.67 g (0.13213 oz copper)", a[0] === "Copper-nickel" && a[1] === 0.13213);
  ok("1864 and 1900 stay bronze (Copper)", c[0] === "Copper" && c[1] === 0.09499 && e[0] === "Copper");
  const back = await p.evaluate(() => { const d = { typeId: "indian-cent", year: 1860, metal: "Copper", oz: CU.cent }; applyYearMetal(d); d.year = 1880; applyYearMetal(d); return [d.metal, d.oz]; });
  ok("changing 1860 to 1880 goes back to Copper", back[0] === "Copper" && back[1] === 0.09499);
  const steel = await p.evaluate(() => { const d = { typeId: "lincoln-wheat", year: 1943, metal: "Copper", oz: CU.cent }; applyYearMetal(d); const s = d.metal; d.year = 1944; applyYearMetal(d); return [s, d.metal]; });
  ok("1943 steel cent still works and resets", steel[0] === "Steel" && steel[1] === "Copper");
  console.log("errors", errors); await b.close();
})();
