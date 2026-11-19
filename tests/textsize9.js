// Step 9: Text size setting (Normal / Large / Extra large) and wrapping at large sizes.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    put("c_long", { ...blankCoin(), id: "long", typeId: "indian-head-gold-2-5", typeName: "Indian Head $2.50 Gold Quarter Eagle", year: 1910, grade: "MS-62", value: "1089", qty: 1, status: "owned" });
  });
  ok("starts at Normal", await p.evaluate(() => textSizeKey() === "normal" && !document.documentElement.hasAttribute("data-text")));
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  await p.evaluate(() => { saveSettings({ optOpen: { ...(settings().optOpen || {}), "text-size": true } }); render(); }); await p.waitForTimeout(200);
  ok("Options shows the three sizes", await p.evaluate(() => ["Normal", "Large", "Extra large"].every((n) => [...document.querySelectorAll("[data-act=textSize]")].some((e) => e.textContent.includes(n)))));
  await p.click("[data-act=textSize][data-v=large]"); await p.waitForTimeout(200);
  ok("Large is saved and applied", await p.evaluate(() => settings().textSize === "large" && document.documentElement.dataset.text === "large"));
  await p.click("[data-act=textSize][data-v=xl]"); await p.waitForTimeout(200);
  ok("Extra large is saved and applied", await p.evaluate(() => settings().textSize === "xl" && document.documentElement.dataset.text === "xl"));
  for (const v of ["home", "value", "coins"]) {
    await p.evaluate((x) => go(x), v); await p.waitForTimeout(250);
    ok(v + " has no sideways scroll at Extra large", await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));
  }
  ok("coin names wrap at Extra large", await p.evaluate(() => { go("coins"); const e = document.querySelector(".coin-label"); return !e || getComputedStyle(e).whiteSpace === "normal"; }));
  await p.evaluate(() => { saveSettings({ textSize: "weird" }); applyTextSize(); });
  ok("unknown value falls back to Normal", await p.evaluate(() => textSizeKey() === "normal" && !document.documentElement.hasAttribute("data-text")));
  ok("grade text on album spots is at least 13px", await p.evaluate(() => { const d = document.createElement("div"); d.className = "slot"; d.innerHTML = '<span class="sn">1</span><span class="g">F-12</span>'; document.body.appendChild(d); const r = parseFloat(getComputedStyle(d.querySelector(".g")).fontSize) >= 13 && parseFloat(getComputedStyle(d.querySelector(".sn")).fontSize) >= 13; d.remove(); return r; }));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
