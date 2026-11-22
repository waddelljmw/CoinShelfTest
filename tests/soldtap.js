// Home "Sold" tile opens the Sold list (item 56).
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8841);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8841/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  await p.evaluate(() => {
    put("c_s1", { ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", status: "sold", qty: 1, paid: "30", sold: { date: "2026-11-01", amount: "50" } }, true);
    put("settings", { ...settings(), showSold: true }, true);
    go("home");
  });
  await p.waitForTimeout(300);
  ok("Sold tile is on Home", await p.locator(".stat[data-act=seeSold]").count() === 1);
  await p.click(".stat[data-act=seeSold]"); await p.waitForTimeout(300);
  ok("tapping it opens My Coins on Sold", await p.evaluate(() => currentRoute().view === "coins" && listState.status === "sold"));
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
