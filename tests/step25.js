// Step 25: P and D side by side, 2020-W, seller suggestions, new sources.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const s = await p.evaluate(() => buildAlbumSlots(["atb-quarter"], "dates", 2018, 2021, false).filter((x) => x.y === 2019 || x.y === 2020 || x.y === 2021).map((x) => x.y + x.m + ":" + (x.v || "")));
  ok("2019 Lowell is P, D, W together", s.slice(0, 3).join() === "2019:Lowell,2019D:Lowell,2019W:Lowell");
  ok("2020 has W spots, 15 in all", s.filter((x) => x.startsWith("2020")).length === 15 && s.some((x) => x === "2020W:Tallgrass Prairie"));
  ok("2021 stays P and D only", s.filter((x) => x.startsWith("2021")).join() === "2021:Tuskegee Airmen,2021D:Tuskegee Airmen");
  const o = await p.evaluate(() => buildAlbumSlots(["roosevelt-clad"], "dates", 1999, 1999, false).map((x) => x.m).join());
  ok("plain years keep P then D", o === ",D");
  ok("new sources offered, Bank roll not", await p.evaluate(() => ["Antique store", "Yard sale", "Estate sale"].every((x) => SOURCE_DEFAULTS.includes(x)) && !SOURCE_DEFAULTS.includes("Bank roll")));
  ok("old Bank roll coins still count as face", await p.evaluate(() => isFaceSource({ source: "Bank roll" })));
  await p.evaluate(() => { put("c_s1", { kind: "coin", id: "s1", typeId: "kennedy-clad", year: 1990, mint: "P", status: "owned", seller: "M. Barr Coins", source: "eBay" }); put("c_s2", { kind: "coin", id: "s2", typeId: "kennedy-clad", year: 1991, mint: "P", status: "owned", seller: "Main Street Coins", source: "Coin Shop" }); });
  await p.evaluate(() => { document.body.insertAdjacentHTML("beforeend", '<label id="tl"><input id="ti" data-suggest="seller" type="text"></label>'); });
  await p.fill("#ti", "m. b"); await p.waitForTimeout(80);
  ok("typing 'm. b' offers M. Barr Coins", (await p.$$eval(".ta-list.sugg button", (e) => e.map((x) => x.textContent))).join() === "M. Barr Coins");
  await p.click(".ta-list.sugg button"); await p.waitForTimeout(50);
  ok("tapping it fills the box and closes the list", (await p.inputValue("#ti")) === "M. Barr Coins" && !(await p.$(".ta-list.sugg")));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
