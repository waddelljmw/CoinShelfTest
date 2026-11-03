const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1880"); await p.selectOption("[data-f=mint]", "O"); await p.fill("[data-f=qty]", "2"); await p.fill("[data-f=paid]", "40");
  const lock = await p.locator("#photoFillLocked").count(); console.log("lock button:", lock); if (lock !== 1) console.log("FAIL lock");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  // set For sale with an asking price on the coin page edit form
  const id = await p.evaluate(() => allCoins()[0].id);
  await p.evaluate((i) => { const c = getCoin(i); saveCoin({ ...c, stage: "forsale", ask: "120" }); }, id);
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html") + "#forsale"); await p.waitForTimeout(300);
  const list = (await p.textContent("#view")).replace(/\s+/g, " "); console.log("forsale:", list.slice(0, 200));
  if (!/\$120\.00/.test(list) || !/\+\$40\.00 before fees/.test(list)) console.log("FAIL for sale list");
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html") + "#coin-" + id); await p.waitForTimeout(300);
  await p.click("[data-act=sell]");
  const amt = await p.inputValue("#sellForm [name=amount]"); console.log("sold for prefilled from ask:", amt); if (amt !== "120") console.log("FAIL ask prefill");
  await p.fill("#sellForm [name=n]", "1"); const amt1 = await p.inputValue("#sellForm [name=amount]"); console.log("for 1 of 2:", amt1); if (amt1 !== "60") console.log("FAIL ask split");
  await p.selectOption("#whereType", "Whatnot"); await p.click("#sellForm summary");
  const fee = await p.inputValue("#sellForm [name=fees]"); console.log("whatnot fee on $60:", fee); if (fee !== "4.44") console.log("FAIL whatnot fee"); // 2.4+1.74+.30 = 4.44
  await p.fill("#sellForm [name=shipCharged]", "5"); await p.fill("#sellForm [name=shipping]", "4.5");
  console.log("profit line:", (await p.textContent("#profitLine")).replace(/\s+/g, " ").slice(0, 60));
  await p.fill("#sellForm [name=fees]", "9.99"); await p.fill("#sellForm [name=amount]", "70"); // typed fee must stay
  const keep = await p.inputValue("#sellForm [name=fees]"); if (keep !== "9.99") console.log("FAIL typed fee overwritten", keep);
  await p.selectOption("#whereType", "Coin shop"); await p.fill("#sellForm [name=whereDetail]", "Main St");
  await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const s = soldCoins()[0]; return { sold: s.sold, profit: saleProfit(s), cost: costOf(s), where: whereText(s.sold), cid: s.cid, left: ownedCoins().map((c) => [c.qty, c.ask, c.cid]) }; });
  console.log(JSON.stringify(r));
  // profit = 70 + 5 - 40 - 9.99 - 4.5 = 20.51
  if (r.profit !== 20.51) console.log("FAIL profit", r.profit);
  if (r.where !== "Coin shop: Main St") console.log("FAIL where");
  if (!r.cid || r.left[0][2] === r.cid) console.log("FAIL ids differ");
  const csv = await p.evaluate(() => toCsv(allCoins()));
  console.log("csv has profit col:", /Profit/.test(csv) && /Platform fees/.test(csv));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html") + "#options"); await p.waitForTimeout(300);
  console.log("options selling:", await p.locator("[data-fee=whatnotPct]").count(), "photo key spot:", /Coming soon/.test(await p.textContent("#view")));
  await p.screenshot({ path: "/tmp/options-sell.png" });
  console.log("errors", errors); await b.close();
})();
