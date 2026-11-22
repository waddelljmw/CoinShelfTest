const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveCoin({ ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1921, grade: "VF-20" }));
  await p.click("#menuBtn");
  console.log("menu:", await p.$$eval("#menu button", (x) => x.map((b) => b.textContent)));
  await p.screenshot({ path: "/tmp/menu.png" });
  await p.click("#menu [data-act=openReport]"); await p.waitForTimeout(200);
  console.log("menu closed:", await p.evaluate(() => document.getElementById("menu").hidden), "| report form open:", await p.isVisible("[data-act=makeReport]"));
  console.log("errors", errors); await b.close();
})();
