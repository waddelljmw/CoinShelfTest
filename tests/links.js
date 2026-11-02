// Phase 3: research links.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => { openCoinForm(null); actions.what({ dataset: { v: "us" } }); });
  ok("no type yet: general PCGS link", await p.evaluate(() => /pcgs\.com\/photograde$/.test(document.querySelector("#pcgsLink").href)));
  ok("no eBay link before a type or year", !(await p.$("#ebayLink")));
  await p.evaluate(() => { pickType("morgan-dollar"); });
  await p.waitForTimeout(100);
  const t = await p.evaluate(() => ({ id: draft.typeId, pl: (document.querySelector("#pcgsLink") || {}).href, pt: (document.querySelector("#pcgsLink") || {}).textContent }));
  ok("type picked: PCGS link names the coin", /Morgan/.test(t.pl || "") && /PCGS Photo Guide: Morgan/.test(t.pt || ""));
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=mint]", "S");
  ok("eBay link follows the date", /1881-S/.test(await p.evaluate(() => decodeURIComponent((document.querySelector("#ebayLink") || {}).href || ""))));
  await p.evaluate(() => { closeSheet(); put("c_t", { ...blankCoin(), id: "t", typeName: "Test coin", year: "1990", value: "50", status: "owned" }); go("value"); });
  await p.waitForTimeout(200);
  ok("Coin Value page has eBay links", /eBay sold/.test(await p.textContent("main")) && (await p.$$("main a[href*=ebay]")).length >= 1);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
