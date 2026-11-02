// Step 2.7: bullion, stacks, and the Home chips.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => { saveSettings({ spot: { gold: null, silver: 30, platinum: null, copper: null } }); });
  // fill the form the way a person would
  await p.evaluate(() => { openCoinForm(null); actions.what({ dataset: { v: "bullion" } }); });
  await p.fill("[data-f=bMaker]", "Engelhard"); await p.fill("[data-f=_bAmt]", "10"); await p.fill("[data-f=bSerial]", "A123");
  await p.fill("[data-f=source]", "Inherited").catch(() => {});
  ok("hint shows pure oz", /9\.99 oz/.test(await p.textContent("#bullionHint")));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  const bar = await p.evaluate(() => ownedCoins().find((c) => itemOf(c) === "bullion"));
  ok("bar saved as bullion", !!bar && bar.item === "bullion");
  ok("pure oz = weight x purity", bar && bar.oz === "9.99");
  ok("default stack", bar && bar.stack === "My Silver Stack");
  ok("label", bar && bar.label === "10 oz Engelhard Silver Bar");
  ok("value is melt (9.99 x 30)", await p.evaluate((id) => Math.abs(bestEach(getCoin(id)) - 299.7) < 0.01, bar.id));
  ok("year not required", bar && bar.year === "");
  // junk coin in a stack; a non-junk coin cannot be stacked
  await p.evaluate(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", qty: 1, status: "owned", ...o });
    mk("junk", { gradeMode: "raw", grade: "Junk", metal: "Silver", oz: "0.7234", stack: "My Silver Stack" });
    mk("plain", { value: "100" });
  });
  ok("junk coin stacked", await p.evaluate(() => stacksPresent().join() === "My Silver Stack" && stackOf(getCoin("junk")) === "My Silver Stack" && stackOf(getCoin("plain")) === ""));
  const total = () => p.evaluate(() => countedCoins().reduce((t, c) => t + (bestEach(c) || 0) * qtyOf(c), 0));
  const full = await total();
  ok("stack counts in total (299.7 + 21.702 + 100)", Math.abs(full - 421.402) < 0.01);
  // Home chip
  await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  ok("home shows the stack chip", !!(await p.$("[data-act=toggleStack]")));
  await p.click("[data-act=toggleStack]"); await p.waitForTimeout(150);
  ok("stack off leaves 100 (plain coin only)", Math.abs((await total()) - 100) < 0.01);
  ok("home says leaving out the stack", /Leaving out: My Silver Stack/.test(await p.textContent("main")));
  ok("full total kept for history", await p.evaluate(() => Math.abs(ownedCoins().reduce((t, c) => t + (bestEach(c) || 0) * qtyOf(c), 0) - 421.402) < 0.01));
  await p.click("[data-act=toggleStack]"); await p.waitForTimeout(150);
  ok("back on", Math.abs((await total()) - full) < 0.01);
      // Stacks page
  await p.evaluate(() => go("stacks")); await p.waitForTimeout(150);
  const txt = await p.textContent("main");
  ok("stacks page lists the stack with oz and melt", /My Silver Stack/.test(txt) && /10\.7\d\d oz pure/.test(txt));
  await p.evaluate(() => go("coins")); await p.waitForTimeout(200);
  ok("bars are kept out of Your Coins, junk coins stay", await p.evaluate(() => !/Engelhard/.test($("#view").textContent) && /in\s+Stacks/.test($("#view").textContent) && ownedCoins().some((c) => c.id === "junk")));
  // saving a normal coin never keeps a stack
  await p.evaluate(() => { openCoinForm("plain"); draft.stack = "Sneaky"; });
  await p.evaluate(() => saveDraft()); await p.waitForTimeout(150);
  ok("normal coin drops stack", await p.evaluate(() => getCoin("plain").stack === undefined));
  ok("old coins unchanged", await p.evaluate(() => itemOf({}) === "coin" && stackOf({}) === ""));
  // CSV: bars are labeled Bar with a weight, and come back as bars
  const csv = await p.evaluate(() => toCsv());
  ok("CSV has Bar and weight columns", /Bar weight \(oz\)/.test(csv) && /,Bar,,,,10,0\.999,Engelhard,A123,My Silver Stack,/.test(csv));
  ok("CSV bar round trip", await p.evaluate(() => { const row = coinToRow(ownedCoins().find((c) => itemOf(c) === "bullion")); const c = (rowToCoin((k) => row[k]) || {}).coin; return c && c.item === "bullion" && c.oz === "9.99" && c.bWeight === "10" && c.stack === "My Silver Stack"; }));
  ok("Other silver item label and CSV", await p.evaluate(() => { const o = { ...blankCoin(), item: "bullion", bShape: "Other", bWeight: "2", bPurity: "0.999", bMaker: "Acme", metal: "Silver", oz: "1.998" }; const row = coinToRow(o); const c = (rowToCoin((k) => row[k]) || {}).coin; return autoLabel(o) === "2 oz Acme Silver item" && row.item === "Other silver item" && c && c.bShape === "Other"; }));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
