// Step 1.3: share the app link, and share a snapshot through the phone's Share menu.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    window.__shared = [];
    navigator.share = async (d) => { window.__shared.push({ title: d.title, url: d.url, text: d.text, files: (d.files || []).map((f) => ({ name: f.name, type: f.type, size: f.size })) }); };
    navigator.canShare = (d) => !!(d && d.files);
  });
  // snapshot builds its file from the app's own files, so serve over http
  const http = require("http"), fs = require("fs"), path = require("path"), root = path.resolve(__dirname, "..");
  const srv = http.createServer((q, r) => fs.readFile(path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); })).listen(8773);
  await p.goto("http://localhost:8773/"); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "s", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "MS-63", paid: 99 }); go("options"); });
  await p.waitForTimeout(150);
  await p.click("[data-act=shareApp]"); await p.waitForTimeout(150);
  const s1 = await p.evaluate(() => window.__shared[0]);
  ok("Share the app sends the app's address", s1 && s1.url === "https://waddelljmw.github.io/CoinShelfTest/" && /private/.test(s1.text));
  await p.click("[data-act=openSnapshot]"); await p.click("#snapForm button[type=submit]"); await p.waitForTimeout(1200);
  const s2 = await p.evaluate(() => window.__shared[1]);
  ok("snapshot goes to the Share menu as an .html file", s2 && s2.files.length === 1 && /coin-cabinet-snapshot-.*\.html$/.test(s2.files[0].name) && s2.files[0].size > 1000);
  // without a Share menu: link is copied
  await p.evaluate(() => { delete navigator.share; navigator.share = undefined; navigator.clipboard.writeText = async (t) => { window.__copied = t; }; });
  await p.evaluate(() => closeSheet()); await p.click("[data-act=shareApp]"); await p.waitForTimeout(150);
  ok("no Share menu: link copied instead", await p.evaluate(() => window.__copied === APP_URL));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
