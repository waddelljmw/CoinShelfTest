// Back keeps your scroll spot; opening a page by link still starts at the top.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => { document.body.style.minHeight = "4000px"; go("coins"); }); await p.waitForTimeout(150);
  await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(100);
  await p.evaluate(() => go("albums")); await p.waitForTimeout(150);
  ok("opening a page by link starts at the top", await p.evaluate(() => window.scrollY) === 0);
  await p.evaluate(() => history.back()); await p.waitForTimeout(250);
  ok("Back returns to the same spot", Math.abs(await p.evaluate(() => window.scrollY) - 900) < 5);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
