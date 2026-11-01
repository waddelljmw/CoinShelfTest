const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const snap = () => p.evaluate(() => allCoins().map((c) => ({ id: c.id, status: c.status, qty: c.qty, paid: c.paid, value: c.value, grade: c.grade, source: c.source, createdAt: c.createdAt, notes: c.notes, sold: !!c.sold })));
  // coin A: whole sale; coin B: lot of 5, sell 2
  for (const [y, qty] of [[1881, 1], [1921, 5]]) {
    await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
    await p.fill("[data-f=year]", String(y)); await p.selectOption("[data-f=grade]", "MS-63"); await p.fill("[data-f=qty]", String(qty));
    await p.fill("[data-f=paid]", "40"); await p.fill("[data-f=value]", "60"); await p.selectOption('[data-f="_sourceKind"]', "Coin show"); await p.fill("[data-f=notes]", "nice toning");
    await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
    await p.click("[data-act=sell]"); if (qty > 1) await p.fill("#sellForm [name=n]", "2");
    await p.fill("#sellForm [name=amount]", "150"); await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(200);
  }
  const before = await snap();
  for (let i = 0; i < 2; i++) {
    await p.click(".brand"); await p.waitForTimeout(150);
    await p.click("h2:has-text('Recently sold') + .list .coin-row"); await p.waitForTimeout(250);
    await p.click("[data-act=unsell]"); await p.waitForTimeout(250);
  }
  const after = await snap();
  console.log("before:", JSON.stringify(before)); console.log("after: ", JSON.stringify(after));
  console.log("sold section shown:", await (async () => { await p.click(".brand"); await p.waitForTimeout(150); return p.isVisible("h2:has-text('Recently sold')"); })());
  console.log("errors", errors); await b.close();
})();
