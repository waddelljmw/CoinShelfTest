const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 1 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const visible = () => p.$$eval("#menu > *", (x) => x.filter((e) => !e.hidden).map((e) => e.textContent.trim()));
  const want = ["My Cabinet", "My Coins", "My Albums", "Storage", "Want List", "My Stacks", "Coin Value", "Insurance Report", "PCGS Photograde", "Options"];
  const wantBiz = ["My Cabinet", "My Coins", "My Albums", "Storage", "Want List", "My Stacks", "Coin Value", "Insurance Report", "PCGS Photograde", "My Business", "Shows", "Sales Reports", "Options"];
  await p.click("#menuBtn");
  const off = await visible();
  if (JSON.stringify(off) !== JSON.stringify(want)) console.log("FAIL order (seller off):", off);
  await p.screenshot({ path: "/tmp/menu-off.png" });
  await p.click("#menuBtn");
  const ok = await p.evaluate(() => { saveSettings({ seller: { ...settings().seller, on: true } }); syncShowsMenu(); return true; });
  await p.click("#menuBtn");
  const on = await visible();
  if (!ok || JSON.stringify(on) !== JSON.stringify(wantBiz)) console.log("FAIL order (seller on):", on);
  const sc = await p.evaluate(() => { const m = document.getElementById("menu"); return m.scrollHeight <= m.clientHeight || getComputedStyle(m).overflowY === "auto"; });
  if (!sc) console.log("FAIL menu cannot scroll");
  await p.screenshot({ path: "/tmp/menu-on.png" });
  for (const [route, label] of [["#albums", "My Albums"], ["#boxes", "Storage"], ["#stacks", "My Stacks"], ["#guide", "PCGS Photograde"]]) {
    await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(150);
    const hl = await p.$$eval("#menu button.on", (x) => x.map((e) => e.textContent.trim()));
    if (hl.join() !== label) console.log("FAIL highlight", route, hl);
  }
  console.log("errors", errors); await b.close();
})();
