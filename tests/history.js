const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  console.log("empty cabinet saves nothing:", await p.evaluate(() => { recordHistory(); return !store.docs.get("history"); }));
  await p.evaluate(() => saveSettings({ spot: { silver: 49.14, gold: 3884.9 } }));
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1921"); await p.selectOption("[data-f=grade]", "MS-63"); await p.fill("[data-f=qty]", "4");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(2000);
  console.log("today recorded:", JSON.stringify(await p.evaluate(() => historyDays())));
  await p.click(".brand"); await p.waitForTimeout(150);
  console.log("day-1 note:", await p.textContent("h2:has-text('Value over time') + .card"));
  // Add a few older days to see the chart
  await p.evaluate(() => {
    const d = { ...historyDays() };
    const back = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    d[back(120)] = { v: 120, m: 150, n: 2 }; d[back(60)] = { v: 160, m: 170, n: 3 }; d[back(20)] = { v: 190, m: 160, n: 3 }; d[back(5)] = { v: 205, m: 175, n: 4 };
    put("history", { kind: "history", days: d });
  });
  await p.waitForTimeout(200);
  console.log("90 days:", (await p.textContent("h2:has-text('Value over time') + .card")).replace(/\s+/g, " ").trim().slice(0, 120));
  await p.screenshot({ path: "/tmp/history-home.png", fullPage: true });
  await p.click("[data-act=histRange][data-v=all]"); await p.waitForTimeout(150);
  console.log("All:", (await p.textContent("h2:has-text('Value over time') + .card span.num")).trim());
  await p.click('[data-act=histRange][data-v="30"]'); await p.waitForTimeout(150);
  console.log("30 days:", (await p.textContent("h2:has-text('Value over time') + .card span.num")).trim());
  // No rewrite when nothing changed
  const v1 = await p.evaluate(() => JSON.stringify(store.docs.get("history")));
  await p.evaluate(() => recordHistory());
  console.log("no change → no write:", v1 === await p.evaluate(() => JSON.stringify(store.docs.get("history"))));
  // Spot change updates today's point
  await p.evaluate(() => saveSettings({ spot: { silver: 55, gold: 3884.9 } })); await p.waitForTimeout(2000);
  console.log("spot change updates today:", JSON.stringify(await p.evaluate(() => historyDays()[today()])));
  console.log("errors", errors); await b.close();
})();
