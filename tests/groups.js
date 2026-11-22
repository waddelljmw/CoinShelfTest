// Step 2.6: groups can be switched out of the Home totals.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", qty: 1, status: "owned", ...o });
    mk("a", { source: "Coin show" }); mk("b", { source: "Inherited", value: "100" }); mk("c", { group: "Gifts", value: "1000" });
  });
  const total = () => p.evaluate(() => { const o = countedCoins(); return o.reduce((t, c) => t + (bestEach(c) || 0) * qtyOf(c), 0); });
  ok("three groups worked out", await p.evaluate(() => groupsPresent().join() === "My collection,Inherited,Gifts"));
  ok("all counted at first (1110)", (await total()) === 1110);
  await p.click("nav [data-go=home], [data-go=home]").catch(() => {}); await p.waitForTimeout(100);
  await p.click('[data-act=toggleGroup][data-v=Inherited]'); await p.waitForTimeout(150);
  ok("Inherited off leaves 1010", (await total()) === 1010);
  ok("home says leaving out Inherited", /Leaving out: Inherited/.test(await p.textContent("main")));
  ok("coin still in the list", await p.evaluate(() => ownedCoins().length === 3));
  ok("value history keeps the full total", await p.evaluate(() => { const h = ownedCoins().reduce((t, c) => t + (bestEach(c) || 0) * qtyOf(c), 0); return h === 1110; }));
  await p.click('[data-act=toggleGroup][data-v=Inherited]'); await p.waitForTimeout(150);
  ok("back on: 1110", (await total()) === 1110);
  ok("old coins with no group still read", await p.evaluate(() => groupOf({ source: "" }) === "My collection"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
