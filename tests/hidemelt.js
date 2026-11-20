// R4-27: "Hide values" also hides melt on every page that shows amounts (list, coin page, albums, Value), but never on Options.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    saveSettings({ spot: { ...settings().spot, silver: 32.1 } });
    put("c_m1", { ...blankCoin(), id: "m1", typeId: "morgan", typeName: "Morgan dollar", year: "1921", metal: "Silver", oz: "0.7734", value: "50", qty: 1, status: "owned" });
  });
  const pages = ["coins", "coin-m1", "value", "albums"];
  for (const pg of pages) { await p.evaluate((x) => go(x), pg); await p.waitForTimeout(150); }
  await p.evaluate(() => go("coins")); await p.waitForTimeout(150);
  ok("melt shows on My Coins before hiding", /melt \$\d/.test(await p.textContent("main")));
  await p.evaluate(() => saveSettings({ hideValues: true }));
  for (const pg of pages) {
    await p.evaluate((x) => go(x), pg); await p.waitForTimeout(150);
    ok(pg + ": no dollar amounts or melt with hide values on", !/\$\d/.test((await p.textContent("main")).replace(/\$\d+(\.\d+)? (Gold|Eagle)/g, "")));
  }
  await p.evaluate(() => go("coins")); await p.waitForTimeout(150);
  ok("My Coins melt line shows dots", /melt •••/.test(await p.textContent("main")));
  await p.evaluate(() => go("options")); await p.waitForTimeout(150);
  ok("Options still shows metal prices", /32\.1/.test(await p.evaluate(() => [...document.querySelectorAll("input")].map((i) => i.value).join(" "))));
  await p.evaluate(() => saveSettings({ hideValues: false })); await p.evaluate(() => go("coins")); await p.waitForTimeout(150);
  ok("turning it off brings melt back", /melt \$\d/.test(await p.textContent("main")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
