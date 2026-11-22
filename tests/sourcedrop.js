const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  await p.click("#fab");
  console.log("options:", await p.$$eval('[data-f="_sourceKind"] option', (o) => o.map((x) => x.textContent)));
  console.log("other field hidden at first:", !(await p.isVisible('[data-f="source"]')));
  // pick Pawn shop directly
  await p.selectOption('[data-f="_sourceKind"]', "Coin Shop");
  console.log("still no text field:", !(await p.isVisible('[data-f="source"]')));
  await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1921");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("saved source:", await p.evaluate(() => ownedCoins()[0].source), "| no stray _sourceKind:", await p.evaluate(() => !("_sourceKind" in ownedCoins()[0])));

  // Other -> custom text, and inherited hint still works
  await p.click("#fab"); await p.fill("#typeSearch", "peace"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1922");
  await p.selectOption('[data-f="_sourceKind"]', "Other"); await p.waitForTimeout(80);
  console.log("other field shown:", await p.isVisible('[data-f="source"]'));
  await p.fill('[data-f="source"]', "Inherited from Grandpa"); await p.waitForTimeout(80);
  console.log("inherited hint (partial match not expected, exact word check):", await p.isVisible("#inhHint"));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("saved custom source:", await p.evaluate(() => ownedCoins()[1].source));
  await p.screenshot({ path: "/tmp/source-other.png" });

  // exact "Inherited" via dropdown triggers do-not-sell hint
  await p.click("#fab"); await p.fill("#typeSearch", "franklin"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1955");
  await p.selectOption('[data-f="_sourceKind"]', "Inherited"); await p.waitForTimeout(80);
  console.log("inherited hint via dropdown:", await p.isVisible("#inhHint"));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);

  // editing a coin with a previously custom source re-selects Other and shows the text
  await p.click("#menuBtn"); await p.click("#menu [data-go=coins]"); await p.waitForTimeout(150);
  await p.click(".coin-row:has-text('1922')"); await p.waitForTimeout(150);
  await p.click("[data-act=edit]"); await p.waitForTimeout(150);
  console.log("edit reselects the prior custom value in the dropdown:", await p.evaluate(() => document.querySelector('[data-f="_sourceKind"]').value));

  console.log("errors", errors);
  await b.close();
})();
