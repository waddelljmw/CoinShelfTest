// Step 10: bigger tap areas, star gap, no eBay link under Coin Value rows.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => { put("c_a", { ...blankCoin(), id: "a", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", value: "40", qty: 1, status: "owned" }); });
  await p.evaluate(() => go("value")); await p.waitForTimeout(250);
  ok("no eBay link under Coin Value rows", await p.evaluate(() => ![...document.querySelectorAll("#view a")].some((a) => /eBay sold/.test(a.textContent))));
  await p.evaluate(() => go("coins")); await p.waitForTimeout(250);
  const g = await p.evaluate(() => { const row = document.querySelector(".coin-row"), s = row.querySelector(".row-star"), v = row.querySelector(".coin-val"); const sr = s.getBoundingClientRect(), vr = v.getBoundingClientRect(); return { h: sr.height, w: sr.width, gap: sr.left - vr.right }; });
  ok("star is 44px and has a gap from the value", g.h >= 44 && g.w >= 44 && g.gap >= 4);
  await p.click(".coin-row .coin-label"); await p.waitForTimeout(250);
  ok("tapping a coin name opens it and does not star it", await p.evaluate(() => !getCoin("a").fav && !!document.querySelector("#view .back, #view .link-btn, #view h1")));
  await p.click("#menuBtn"); await p.waitForTimeout(150);
  ok("menu rows are 44px tall", await p.evaluate(() => [...document.querySelectorAll("#menu button:not([hidden])")].filter((b) => b.offsetParent).every((b) => b.getBoundingClientRect().height >= 43.5)));
  await p.evaluate(() => { const m = document.getElementById("menu"); m.hidden = true; go("add"); }); await p.waitForTimeout(300);
  const sizes = await p.evaluate(() => ({ sum: [...document.querySelectorAll("details > summary")].map((s) => s.getBoundingClientRect().height), info: [...document.querySelectorAll(".info-btn")].map((s) => s.getBoundingClientRect().height) }));
  ok("fold bars are at least 44px", sizes.sum.length === 0 || sizes.sum.every((h) => h >= 43.5));
  ok("info buttons are at least 44px", sizes.info.length === 0 || sizes.info.every((h) => h >= 43.5));
  await p.evaluate(() => openSheet("<div class='sheet-head'><h2>T</h2><button class='x' data-act='closeSheet'>x</button></div>")); await p.waitForTimeout(200);
  ok("sheet Close is 44px", await p.evaluate(() => { const r = document.querySelector(".x").getBoundingClientRect(); return r.width >= 43.5 && r.height >= 43.5; }));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
