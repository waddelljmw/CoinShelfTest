// Step 1.3: share the app link, and share a snapshot through the phone's Share menu.
const { chromium } = require("./_compat");
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
  // Build B: a snapshot with every switch off carries none of the private fields.
  const inc0 = { paid: false, source: false, notes: false, sale: false, cert: false, maxPay: false, photos: false, values: false };
  await p.evaluate(() => {
    saveCoin({ ...blankCoin(), id: "p1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1882, mint: "O", grade: "MS-64", paid: 123, source: "Inherited", notes: "ZZNOTE",
      inhId: "ZZINH", inhValue: "ZZINHVAL", origAlbum: "ZZALB", sellLater: true, ask: 777, biz: true, caseName: "ZZCASE", cert: "ZZCERT" });
    store.docs.set("settings", { ...(store.docs.get("settings") || {}), kind: "settings", hideValues: true,
      seller: { name: "ZZBIZ", ein: "99-ZZEIN", address: "ZZADDR", permit: "ZZPERMIT" }, inheritances: [{ id: "ZZINH", from: "ZZFROM" }], inhDefault: "ZZINH",
      lastPay: "ZZPAY", lastSource: "ZZSRC", feeRates: { zz: 1 }, pricing: { zz: 1 }, shipping: { zz: 1 }, idNext: 5, lastBackup: "ZZBK", savedFilters: [{ name: "ZZFILT" }] });
    store.docs.set("history", { kind: "history", days: { "2026-11-01": { total: 424242 } } });
  });
  const docs = await p.evaluate((i) => snapshotDocs(i), inc0);
  const dump = JSON.stringify(docs);
  const coin = docs.find((d) => d.id.startsWith("c_") && d.data.year === 1882).data, set = docs.find((d) => d.id === "settings").data;
  ok("snapshot (all off): no private text anywhere", !/ZZ|99-ZZ|424242/.test(dump));
  ok("snapshot (all off): coin private fields gone", ["inhId", "inhValue", "origAlbum", "sellLater", "ask", "biz", "caseName", "paid", "notes", "cert"].every((k) => !(k in coin)));
  ok("snapshot (all off): inherited coin just says Inherited", coin.source === "Inherited");
  ok("snapshot (all off): settings keep only display keys", !["seller", "inheritances", "inhDefault", "lastPay", "lastSource", "feeRates", "pricing", "shipping", "idNext", "lastBackup", "savedFilters"].some((k) => k in set) && set.hideValues === true);
  ok("snapshot (all off): no price stamp, mintage kept", !coin.snapBook || coin.snapBook.book === null);
  ok("snapshot (all off): no value history", !docs.some((d) => d.id === "history"));
  // the file still opens and shows the coin
  const html = await p.evaluate((i) => buildSnapshot(i), inc0);
  const file = require("path").join(require("os").tmpdir(), "snap-privacy-test.html");
  fs.writeFileSync(file, html);
  const q = await b.newPage({ viewport: { width: 390, height: 844 } }); const qerr = []; q.on("pageerror", (e) => qerr.push(e.message));
  await q.goto("file://" + file); await q.waitForTimeout(500);
  ok("snapshot opens with no errors", qerr.length === 0 && (await q.evaluate(() => store.mode)) === "snapshot");
  if (qerr.length) console.log(qerr);
  await q.evaluate(() => go("coins")); await q.waitForTimeout(200);
  ok("snapshot shows the coin", /Morgan/.test(await q.evaluate(() => document.body.innerText)));
  for (const v of ["home", "value", "albums", "wants", "coins", "stacks", "boxes", "options"]) { await q.evaluate((x) => go(x), v); await q.waitForTimeout(120); }
  ok("snapshot: every main page opens without errors", qerr.length === 0);
  if (qerr.length) console.log(qerr);
  await q.close();
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
