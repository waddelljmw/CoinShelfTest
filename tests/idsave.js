// Fix (v0.38.3): a new coin's ID is saved to the phone and stays the same after reopening.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8772);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8772/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 });
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(500);
  const before = await p.evaluate(() => allCoins().map((c) => c.cid));
  ok("new coin is MD-001", before.length === 1 && before[0] === "MD-001");
  await p.reload(); await p.waitForFunction(() => store.mode === "local" && allCoins().length, null, { timeout: 15000 }); await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({ ids: allCoins().map((c) => c.cid), next: settings().idNext }));
  ok("same ID after reopening (MD-001, not MD-002)", after.ids.length === 1 && after.ids[0] === "MD-001");
  ok("next Morgan number is 2", after.next && after.next.MD === 2);
  ok("no page errors", !errors.length);
  await b.close(); srv.close();
})();
