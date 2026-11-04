// Bug #120: selling part of a group. The count starts blank (must choose); "Just 1" sells 1 of 25 and keeps 24.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.click("#fab"); await p.fill("#typeSearch", "washington"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1960"); await p.fill("[data-f=qty]", "25"); await p.fill("[data-f=paid]", "5");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  const id = await p.evaluate(() => allCoins()[0].id);
  await p.evaluate((i) => openSell(i), id);
  const blank = await p.inputValue("#sellForm [name=n]"); if (blank !== "") console.log("FAIL count should start blank:", blank);
  await p.click("#sellForm [data-act=sellCount][data-n='1']");
  if ((await p.inputValue("#sellForm [name=n]")) !== "1") console.log("FAIL Just 1 button");
  await p.evaluate(() => doSell(document.getElementById("sellForm")));
  const r = await p.evaluate(() => allCoins().map((c) => c.status + ":" + c.qty).sort().join(","));
  console.log("after:", r); if (r !== "owned:24,sold:1") console.log("FAIL split", r);
  if (errors.length) console.log("FAIL errors", errors);
  await b.close();
})();
