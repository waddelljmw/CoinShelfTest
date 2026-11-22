// Step 1.2: installable app, works offline, shows "new version ready" and updates on tap.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
let swVersion = null; // when set, sw.js is served with this cache name (a pretend new release)
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  const f = path.join(root, u === "/" ? "index.html" : u);
  fs.readFile(f, (e, d) => {
    if (e) { r.statusCode = 404; return r.end(); }
    if (u === "/sw.js" && swVersion) d = Buffer.from(String(d).replace(/const CACHE = "[^"]*"/, `const CACHE = "coin-cabinet-${swVersion}"`));
    r.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream");
    r.setHeader("Cache-Control", "no-cache");
    r.end(d);
  });
}).listen(8772);
(async () => {
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // Files the offline copy keeps must match the files the page loads, and versions must match.
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8"), html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const listed = new Set([...sw.matchAll(/"([^"]+\.(?:js|css|png|webmanifest|html))"/g)].map((m) => m[1]));
  const needed = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const missing = needed.filter((f) => !listed.has(f));
  ok("offline copy includes every file the page loads", missing.length === 0); if (missing.length) console.log(missing);
  const appV = fs.readFileSync(path.join(root, "app.js"), "utf8").match(/APP_VERSION = "([^"]+)"/)[1];
  ok("sw.js cache name matches APP_VERSION " + appV, sw.includes(`"coin-cabinet-${appV}"`));
  const man = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  ok("manifest has name, standalone display and icons", man.name && man.display === "standalone" && man.icons.length >= 2 && man.icons.every((i) => fs.existsSync(path.join(root, i.src))));

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8772/"); await p.waitForTimeout(300);
  await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(300);
  ok("offline helper is installed", await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())));
  await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(() => saveCoin({ ...blankCoin(), id: "x", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "MS-63" })); await p.waitForTimeout(150);
  // No internet: the app still opens, with the coin
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(600);
  ok("opens with no internet, coins still there", await p.evaluate(() => typeof store !== "undefined" && store.mode === "local" && ownedCoins().length === 1));
  await ctx.setOffline(false);
  // A new release: banner appears, tapping it reloads into the new version, coins untouched
  swVersion = "99.0.0";
  await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await p.waitForSelector("#updateBar", { timeout: 8000 }).catch(() => {});
  ok("'new version ready' banner shows", !!(await p.$("#updateBar")));
  ok("banner suggests a backup first (none saved yet)", /backup/i.test((await p.textContent("#updateBar").catch(() => "")) || ""));
  const nav = p.waitForNavigation({ timeout: 8000 }).catch(() => null);
  await p.click("#updateNow"); await nav; await p.waitForTimeout(500);
  ok("after updating: new version running, coins kept", await p.evaluate(async () => (await caches.keys()).join() === "coin-cabinet-99.0.0" && ownedCoins().length === 1));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
