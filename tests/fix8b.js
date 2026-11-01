const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "lotA", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1921, grade: "VF-20", qty: 10, paid: "40", notes: "the lot" }); go("coin-lotA"); });
  await p.waitForTimeout(150);
  const sell = async (n) => { await p.click("[data-act=sell]"); if (n) await p.fill("#sellForm [name=n]", String(n)); await p.fill("#sellForm [name=amount]", "50"); await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(150); };
  await sell(3);
  await p.evaluate(() => go("coin-lotA")); await p.waitForTimeout(150);
  await sell(); // the other 7
  ok("all 10 sold in 2 pieces", (await p.evaluate(() => soldCoins().map((c) => c.qty).sort().join())) === "3,7");
  // move back the 3, then the 7
  const s3 = await p.evaluate(() => soldCoins().find((c) => c.qty === 3).id);
  await p.evaluate((i) => go("coin-" + i), s3); await p.waitForTimeout(150); await p.click("[data-act=unsell]"); await p.waitForTimeout(150);
  await p.evaluate(() => go("coin-lotA")); await p.waitForTimeout(150); await p.click("[data-act=unsell]"); await p.waitForTimeout(150);
  const owned = await p.evaluate(() => ownedCoins().map((c) => [c.qty, c.notes, c.paid]));
  ok("one entry of 10 again", owned.length === 1 && owned[0][0] === 10 && owned[0][1] === "the lot" && owned[0][2] === "40");
  ok("no sold left", (await p.evaluate(() => soldCoins().length)) === 0);
  // undo after moving back restores the sale
  await p.evaluate(() => { const c = ownedCoins()[0]; go("coin-" + c.id); }); await p.waitForTimeout(150);
  await sell();
  await p.evaluate(() => go("coin-" + soldCoins()[0].id)); await p.waitForTimeout(150);
  await p.click("[data-act=unsell]"); await p.waitForTimeout(150);
  await p.click("#toast button"); await p.waitForTimeout(150);
  const after = await p.evaluate(() => soldCoins().map((c) => [c.qty, c.sold && c.sold.amount]));
  ok("undo brings back the sale details", after.length === 1 && after[0][0] === 10 && after[0][1] === 50);
  // pieces that were changed after the split are not merged
  await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "lotB", typeId: "peace-dollar", typeName: "Peace Dollar", year: 1922, grade: "VF-20", qty: 4 }); go("coin-lotB"); });
  await p.waitForTimeout(150); await sell(1);
  await p.evaluate(() => { const c = getCoin("lotB"); saveCoin({ ...c, grade: "XF-40" }); });
  const sp = await p.evaluate(() => soldCoins().find((c) => c.year === 1922).id);
  await p.evaluate((i) => go("coin-" + i), sp); await p.waitForTimeout(150); await p.click("[data-act=unsell]"); await p.waitForTimeout(150);
  ok("regraded piece not merged", (await p.evaluate(() => ownedCoins().filter((c) => c.year === 1922).map((c) => c.qty).sort().join())) === "1,3");
  console.log("errors", errors); await b.close();
})();
