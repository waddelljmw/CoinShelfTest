const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const add = async (y) => { await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill("[data-f=year]", String(y)); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };
  await add(1881);
  await p.click("[data-act=sell]");
  console.log("options:", await p.$$eval("#whereType option", (o) => o.map((x) => x.textContent)));
  await p.selectOption("#whereType", "Coin show");
  console.log("coin show field:", await p.isVisible("[name=whereDetail]"), await p.textContent("#whereDetailBox"));
  await p.fill("[name=whereDetail]", "FUN Show");
  await p.screenshot({ path: "/tmp/where.png" });
  await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(200);
  await p.click(".brand"); await p.waitForTimeout(150); await p.click("h2:has-text('Recently sold') + .list .coin-row"); await p.waitForTimeout(250);
  console.log("page:", (await p.textContent(".card:has-text('Where')")).replace(/\s+/g, " ").trim());
  // edit: prefilled, switch to eBay Live (detail field disappears)
  await p.click("[data-act=editSale]");
  console.log("prefill:", await p.inputValue("#whereType"), await p.inputValue("[name=whereDetail]"));
  await p.selectOption("#whereType", "eBay Live");
  console.log("detail gone:", !(await p.isVisible("[name=whereDetail]")));
  await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("saved:", JSON.stringify(await p.evaluate(() => { const c = soldCoins()[0]; return { t: c.sold.whereType, d: c.sold.whereDetail, w: c.sold.where }; })));
  // Other with write-in
  await add(1882); await p.click("[data-act=sell]"); await p.selectOption("#whereType", "Other"); await p.fill("[name=whereDetail]", "Facebook Marketplace");
  await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(200);
  // old free-text sale shows up properly when edited
  await p.evaluate(() => { const c = { ...blankCoin(), typeId: "peace-dollar", typeName: "Peace Dollar", year: 1922, status: "sold", sold: { at: 1, date: "2026-10-01", amount: 50, where: "ebay" } }; saveCoin(c); window.__old = c.id; });
  await p.evaluate(() => go("coin-" + window.__old)); await p.waitForTimeout(250); await p.click("[data-act=editSale]");
  console.log("old 'ebay' read as:", await p.inputValue("#whereType"));
  await p.click("[data-act=closeSheet] >> nth=0");
  // export / import of Sold where
  const csv = await p.evaluate(() => toCsv());
  const col = csv.split("\n")[0].split(",").indexOf("Sold where");
  console.log("export Sold where:", csv.split("\n").slice(1).map((l) => l.split(",")[col]).filter(Boolean));
  console.log("import parse:", await p.evaluate(() => JSON.stringify(["Coin show: Baltimore Expo", "whatnot", "Ebay Live", "Mom friend"].map((t) => whereFromText(t).where))));
  console.log("errors", errors); await b.close();
})();
