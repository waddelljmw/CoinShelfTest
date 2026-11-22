const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = require("path").resolve(__dirname, "..");
const srv = http.createServer((q, r) => { const f = path.join(root, q.url.split("?")[0] === "/" ? "index.html" : q.url.split("?")[0]); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); }); }).listen(8765);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { window.__saved = null; window.claude = { use: async (k) => (k === "downloads" ? { save: async (o) => { window.__saved = o; return { status: "saved" }; } } : null) }; });
  await p.goto("http://localhost:8765/"); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const base = blankCoin();
    put("c_k1", { ...base, id: "k1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "MS-63", paid: 77.77, source: "SecretShop", notes: "SECRETNOTE", cert: "12345678" });
    put("c_k2", { ...base, id: "k2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1882, mint: "", grade: "VF-20", status: "sold", sold: { date: "2026-01-01", amount: 99, to: "BuyerBob", whereType: "eBay" } });
    put("c_k3", { ...base, id: "k3", typeId: "morgan-dollar", year: 1883, status: "deleted" });
    put("wl_l1", { kind: "wantlist", id: "l1", name: "Second list", createdAt: 2 });
    go("options");
  });
  await p.waitForTimeout(200);
  await p.click("[data-act=openSnapshot]"); await p.click("#snapForm button[type=submit]"); await p.waitForTimeout(800);
  const html = await p.evaluate(() => window.__saved && window.__saved.data);
  ok("snapshot saved", !!html);
  ok("private fields left out", !/SecretShop|SECRETNOTE|BuyerBob|77\.77|12345678/.test(html.split("window.COIN_SNAPSHOT")[1].split("</script>")[0]));
  ok("deleted coin left out", !html.includes('"id":"c_k3"'));
  fs.writeFileSync("/tmp/snap.html", html);
  // with details ticked
  await p.click("[data-act=openSnapshot]"); await p.check("#snapForm [name=paid]"); await p.check("#snapForm [name=sale]");
  await p.click("#snapForm button[type=submit]"); await p.waitForTimeout(800);
  const html2 = await p.evaluate(() => window.__saved.data);
  ok("opted-in details included", html2.includes("77.77") && html2.includes("BuyerBob") && !html2.includes("SECRETNOTE"));
  // open the snapshot file
  const q = await b.newPage({ viewport: { width: 390, height: 844 } }); const e2 = []; q.on("pageerror", (e) => e2.push(e.message));
  await q.goto("file:///tmp/snap.html"); await q.waitForTimeout(400);
  ok("opens in snapshot mode", await q.evaluate(() => store.mode === "snapshot" && document.body.classList.contains("readonly")));
  ok("coins visible", await q.evaluate(() => ownedCoins().length === 1));
  await q.evaluate(() => go("wants")); await q.waitForTimeout(150);
  ok("want-list tabs visible", await q.evaluate(() => { const t = document.querySelector("[data-act=wantsPickList]"); return !!t && getComputedStyle(t).display !== "none"; }));
  const blocked = await q.evaluate(() => {
    const before = store.docs.size; const res = [];
    for (const act of ["wlNew", "wantNew", "missing", "addSpot", "editAlbum", "purge", "unsell"]) { const bt = document.createElement("button"); bt.dataset.act = act; bt.dataset.id = "k1"; document.body.appendChild(bt); bt.click(); res.push(document.querySelector("#sheet").hidden); bt.remove(); }
    return res.every(Boolean) && store.docs.size === before;
  });
  ok("mutating actions inert", blocked);
  await q.click("#fab"); await q.waitForTimeout(150);
  ok("+ try-out still opens", await q.evaluate(() => !document.querySelector("#sheet").hidden));
  ok("no page errors", errors.length + e2.length === 0); if (errors.length + e2.length) console.log(errors, e2);
  await b.close(); srv.close();
})();
