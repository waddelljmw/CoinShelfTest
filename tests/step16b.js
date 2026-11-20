const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.click("#fab"); await p.waitForTimeout(400);
  const inFold = await p.evaluate(() => { const i = document.querySelector('[data-f="_many"]'); return i ? !!i.closest("details") : null; });
  ok("how-many box exists", inFold !== null);
  ok("how-many box is not inside a fold", inFold === false);
  const n = await p.evaluate(() => document.querySelectorAll('[data-f="_many"]').length);
  ok("only one how-many box", n === 1);
  // + button hides while scrolling down, returns at the bottom
  await p.evaluate(() => { go("coins"); for (let i = 0; i < 40; i++) saveCoin({ ...blankCoin(), id: "x" + i, typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Dollars", year: 1880 + (i % 9), grade: "VF-20" }); go("coins"); });
  await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(120);
  await p.evaluate(() => window.scrollTo(0, 1200)); await p.waitForTimeout(120);
  ok("+ steps aside while scrolling down", await p.evaluate(() => document.getElementById("fab").classList.contains("away")));
  await p.waitForTimeout(900);
  ok("+ comes back when scrolling stops", await p.evaluate(() => !document.getElementById("fab").classList.contains("away")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
