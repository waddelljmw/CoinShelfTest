// The Melt Table is a menu item under Coin Value and opens the melt page.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const ok = (n, c) => console.log((c ? "ok   " : "FAIL ") + n);
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.click("#menuBtn");
  const items = await p.$$eval("#menu button", (x) => x.filter((e) => !e.hidden).map((e) => e.textContent.trim()));
  const i = items.indexOf("Coin Value");
  ok("Melt Table sits under Coin Value", items[i + 1] === "Insurance Report" && items[i + 2] === "Melt Table");
  await p.click('#menu [data-go=melt]'); await p.waitForTimeout(300);
  ok("opens the melt page", /melt/i.test(await p.textContent("main")));
  ok("no page errors", errors.length === 0);
  console.log("errors", errors);
  await b.close();
})();
