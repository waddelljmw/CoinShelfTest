// Phase 1 review fixes: photo cleanup age, restore merges settings/history, update waits for open forms.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
let swVersion = null;
const srv = http.createServer((q, r) => { const u = q.url.split("?")[0]; fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } if (u === "/sw.js" && swVersion) d = Buffer.from(String(d).replace(/const CACHE = "[^"]*"/, `const CACHE = "coin-cabinet-${swVersion}"`)); if (u.endsWith(".js")) r.setHeader("Content-Type", "text/javascript"); r.setHeader("Cache-Control", "no-cache"); r.end(d); }); }).listen(8774);
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFTEMIgkAPfQ/wd3QmqEAAAAASUVORK5CYII=", "base64");
(async () => {
  const b = await chromium.launch(); const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const errors = [];
  const a = await ctx.newPage(); a.on("pageerror", (e) => errors.push(e.message));
  await a.goto("http://localhost:8774/"); await a.waitForTimeout(400);
  // 1. unsaved photo survives another window opening
  await a.click("#fab"); await a.setInputFiles("#photoInput", { name: "c.png", mimeType: "image/png", buffer: PNG }); await a.waitForTimeout(400);
  const lid = await a.evaluate(() => draft.photos[0].lid);
  const t2 = await ctx.newPage(); await t2.goto("http://localhost:8774/"); await t2.waitForTimeout(500); await t2.close();
  await a.evaluate(() => { pickType("morgan-dollar"); draft.year = 1881; draft.grade = "VF-20"; }); await a.click("#coinForm button[type=submit]"); await a.waitForTimeout(200);
  await a.reload(); await a.waitForTimeout(500);
  ok("photo on an unsaved form survives another window", await a.evaluate((lid) => localPhotoUrls.has(lid), lid));
  // 2. restore merges history and settings
  await a.evaluate(() => { put("history", { kind: "history", days: { "2026-10-20": { v: 1, m: 1, n: 1 }, "2026-10-31": { v: 2, m: 2, n: 1 } } }); saveSettings({ spot: { silver: 33, gold: 2500, platinum: null, copper: null }, albumOrder: ["x"] }); });
  await a.waitForTimeout(150);
  const merged = await a.evaluate(() => {
    const h = mergeRestored("history", { kind: "history", days: { "2026-09-01": { v: 5, m: 5, n: 1 } } });
    const s = mergeRestored("settings", { kind: "settings", spot: { silver: 20, gold: null, platinum: 900, copper: null }, albumOrder: ["y"], bookEdition: "2025" });
    return { days: Object.keys(h.days).sort().join(), silver: s.spot.silver, gold: s.spot.gold, plat: s.spot.platinum, order: s.albumOrder.join(), ed: s.bookEdition };
  });
  ok("restore keeps this device's history days and adds the backup's", merged.days === "2026-09-01,2026-10-20,2026-10-31");
  ok("restore keeps this device's prices, fills in missing ones", merged.silver === 33 && merged.gold === 2500 && merged.plat === 900 && merged.ed === "2025" && merged.order === "x,y");
  // 3. Update now waits for an open form; other windows wait too
  await a.evaluate(() => navigator.serviceWorker.ready); await a.reload(); await a.waitForTimeout(400);
  const other = await ctx.newPage(); other.on("pageerror", (e) => errors.push(e.message)); await other.goto("http://localhost:8774/"); await other.waitForTimeout(400);
  await other.click("#fab"); await other.fill("#typeSearch", "peace"); await other.waitForTimeout(80);
  await a.click("#fab"); await a.waitForTimeout(80);
  swVersion = "98.0.0"; await a.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await a.waitForSelector("#updateBar", { timeout: 8000 }).catch(() => {});
  await a.click("#updateNow"); await a.waitForTimeout(400);
  ok("Update now waits while a coin form is open", await a.evaluate(() => !!draft) && /Finish or close/.test(await a.textContent("#toast")));
  await a.evaluate(() => closeSheet());
  const nav = a.waitForNavigation({ timeout: 8000 }).catch(() => null); await a.click("#updateNow"); await nav; await a.waitForTimeout(500);
  ok("after closing the form, the update goes ahead", await a.evaluate(async () => (await caches.keys()).includes("coin-cabinet-98.0.0")));
  await other.waitForTimeout(1500);
  ok("the other window keeps its half-typed form", await other.evaluate(() => !!draft && document.querySelector("#typeSearch").value === "peace"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
