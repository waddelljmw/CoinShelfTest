// Bug #2: restoring onto a fresh app keeps the backup's Home layout (defaults on this device don't win).
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => { const u = q.url.split("?")[0]; fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } if (u.endsWith(".js")) r.setHeader("Content-Type", "text/javascript"); r.setHeader("Cache-Control", "no-cache"); r.end(d); }); }).listen(8791);
(async () => {
  const b = await chromium.launch(); const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = []; const a = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); a.on("pageerror", (e) => errors.push(e.message));
  await a.goto("http://localhost:8791/"); await a.waitForTimeout(500);
  await a.evaluate(() => saveSettings({ seenVersion: "x" })); await a.waitForTimeout(150); // fresh app: full defaults saved
  const r = await a.evaluate(() => {
    const s = mergeRestored("settings", { kind: "settings", shelfStyle: "safe", shelfLayout: { order: ["a"], hidden: {}, hiddenItems: {}, pins: {} }, homeClosed: { added: true }, hideValues: true, showSold: true });
    return { style: s.shelfStyle, order: s.shelfLayout.order.join(), closed: s.homeClosed.added, hide: s.hideValues, sold: s.showSold };
  });
  ok("restore onto a fresh app keeps shelfStyle, shelfLayout, folded sections", r.style === "safe" && r.order === "a" && r.closed === true && r.hide === true && r.sold === true);
  await a.evaluate(() => saveSettings({ shelfStyle: "bookcase", showSold: false, hideValues: true })); await a.waitForTimeout(100);
  const r2 = await a.evaluate(() => mergeRestored("settings", { kind: "settings", shelfStyle: "safe", hideValues: false }));
  ok("a setting changed on this device still wins", r2.hideValues === true);
  console.log("errors", JSON.stringify(errors)); await b.close(); srv.close();
})();
