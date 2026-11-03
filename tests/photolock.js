// Photo fill is switched off: grayed locked button in Add coin, closed spot in Options.
const { chromium } = require("./_compat");
(async () => {
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(500);
  await p.click("#fab"); await p.waitForTimeout(200);
  const t = (await p.textContent("#photoFillLocked")) || "";
  ok("locked button shows 🔒", t.includes("🔒"));
  ok("locked button is disabled", await p.isDisabled("#photoFillLocked"));
  ok("no photo picker while locked", (await p.$("#photoFill")) === null);
  ok("Options has the closed Photo fill spot", await p.evaluate(() => viewOptions().includes("Photo fill (API key)") && viewOptions().includes("Coming soon")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
