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
  ok("Morgan opens its own Photograde page", /photograde#\/Morgan\/Grades$/.test(t.pl || ""));
  const codes = await p.evaluate(() => [["standing-liberty-quarter", 1916, ""], ["standing-liberty-quarter", 1917, ""], ["standing-liberty-quarter", 1917, "Type 2"], ["standing-liberty-quarter", 1920, ""], ["standing-liberty-quarter", 1925, ""], ["shield-nickel", 1870, ""], ["liberty-nickel", 1890, ""], ["buffalo-nickel", 1920, ""], ["jefferson-war-nickel", 1943, ""], ["ike-40", 1971, ""], ["sba-dollar", 1979, ""], ["sacagawea-dollar", 2000, ""], ["kennedy-90", 1964, ""], ["presidential-dollar", 2010, ""]].map((a) => pcgsCodeFor(...a)).join(","));
  ok("PCGS codes follow type, year and design", codes === "SLQT1,SLQT1,SLQe,SLQe,SLQ,ShieldNic,LibNic,Buffalo,Jefferson,Ike,SBA,SAC,Kennedy,");
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=mint]", "S");
  ok("eBay link follows the date", /1881-S/.test(await p.evaluate(() => decodeURIComponent((document.querySelector("#ebayLink") || {}).href || ""))));
  await p.evaluate(() => { closeSheet(); put("c_t", { ...blankCoin(), id: "t", typeName: "Test coin", year: "1990", value: "50", status: "owned" }); go("value"); });
  await p.waitForTimeout(200);
  ok("Coin Value page has eBay links", /eBay sold/.test(await p.textContent("main")) && (await p.$$("main a[href*=ebay]")).length >= 1);
  await p.evaluate(() => { put("c_g", { ...blankCoin(), id: "g", typeId: "buffalo-nickel", typeName: "Buffalo Nickel", year: "1920", grade: "VF-20", status: "owned" }); go("coin-g"); });
  await p.waitForTimeout(200);
  ok("coin page has a PCGS photos link near the grade", await p.evaluate(() => !!document.querySelector("main a[href$='#/Buffalo/Grades']")));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
