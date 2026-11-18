// Pipeline step 1 "Log it right": R4-3 visible carry-over, R4-23 metal prices survive a fast Back.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (m, v) => console.log((v ? "ok   " : "FAIL ") + m);
  // R4-3: the last coin's Where from shows as a chip you can clear in one tap
  await p.evaluate(() => { saveSettings({ lastSource: "Coin Show", lastHolder: "" }, true); openCoinForm(null); });
  await p.waitForTimeout(200);
  ok("carried Where from shows 'Same as last: Where from: Coin Show'", /Same as last: Where from: Coin Show/.test(await p.textContent("#coinForm")));
  await p.click("[data-act=carryClear][data-k=source]"); await p.waitForTimeout(150);
  ok("one tap clears it", !/Same as last/.test(await p.textContent("#coinForm")) && (await p.evaluate(() => draft.source)) === "");
  await p.evaluate(() => closeSheet());
  // R4-23: typing a gold price then a fast navigation keeps the other metal prices
  await p.evaluate(() => { saveSettings({ spot: { gold: 2000, silver: 25, copper: 4 } }, true); go("options"); });
  await p.waitForTimeout(200);
  if (await p.$("[data-spot=gold]")) {
    await p.evaluate(() => { const i = document.querySelector("[data-spot=gold]"); i.value = "2100"; i.dispatchEvent(new Event("input", { bubbles: true })); go("home"); });
    await p.waitForTimeout(1000);
    const sp = await p.evaluate(() => settings().spot || {});
    ok("fast Back keeps silver and copper, saves the gold typed " + JSON.stringify(sp), sp.silver === 25 && sp.copper === 4 && sp.gold === 2100);
  } else console.log("SKIP metal price box not on the Options page");
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
