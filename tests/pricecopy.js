// Steps 11.2/11.3: the price list is copied once into a saved record on the phone (key "pricebook") and read from there.
// Nothing the owner sees may change: same values with the shipped price files blocked, in a view-only file, and after a restore.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
const J = JSON.stringify;
const root = path.resolve(__dirname, "..");

const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } if (/\.js$/.test(u)) r.setHeader("Content-Type", "text/javascript"); r.end(d); });
});
const URL0 = "http://localhost:8791/";

// Three known coins: a Morgan, a Full Bell Lines Franklin and a proof Silver Eagle variety.
const probe = () => {
  const cc = (o) => ({ ...blankCoin(), gradeMode: "raw", ...o });
  const list = [cc({ typeId: "morgan-dollar", year: "1881", mint: "S", grade: "MS-65" }), cc({ typeId: "franklin-half", year: "1953", mint: "S", grade: "MS-65", fbl: true }), cc({ typeId: "silver-eagle", year: "2017", mint: "S", grade: "PR-69", variety: "San Francisco (S)" })];
  return list.map((c) => [bookPrice(c), bookText(bookLookup(c)), (mintageInfo(c) || {}).text || ""]);
};
const record = () => store.docs.get("pricebook");

(async () => {
  await new Promise((go) => srv.listen(8791, go));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const open = async (q) => { await p.goto(URL0 + (q || "")); await p.waitForTimeout(500); };

  // 1. Fresh start: one record, equal to the shipped copy.
  await open();
  const first = await p.evaluate(() => { const r = store.docs.get("pricebook"); return { mode: store.mode, r: r && { kind: r.kind, format: r.format, source: r.source, edition: r.edition, savedAt: r.savedAt }, same: !!r && JSON.stringify(r.series) === JSON.stringify(SHIPPED_PRICE_BOOK.series) && JSON.stringify(r.mintage) === JSON.stringify(SHIPPED_PRICE_BOOK.mintage), series: r ? Object.keys(r.series).length : 0, used: Object.keys(PRICE_BOOK.series).length }; });
  ok("saves on this device", first.mode === "local");
  ok("fresh start saves a pricebook record", !!first.r && first.r.kind === "pricebook" && first.r.format === 1 && first.r.source === "Test Book" && first.r.edition === "Made-up" && !!first.r.savedAt);
  ok("record equals the starting copy a test page supplies (8 series)", first.same && first.series === 8 && first.used === 8);
  const before = await p.evaluate(probe);
  ok("known coins have values", before.every((x) => x[0] > 0 && /^Test Book Made-up: \$/.test(x[1]) && x[2]));
  console.log("values", J(before));

  // Add a real coin (for the view-only file and the Options line).
  await p.evaluate(() => { const c = { ...blankCoin(), id: "pc1", kind: "coin", status: "owned", typeId: "morgan-dollar", typeName: "Morgan Dollar", denom: "$1", year: "1881", mint: "S", gradeMode: "raw", grade: "MS-65", qty: 1 }; return put("c_pc1", c); });
  const pageText = async (pg) => { await pg.evaluate(() => go("coin-pc1")); await pg.waitForTimeout(200); return pg.evaluate(() => document.querySelector("#view").innerText); };
  const coinPage = await pageText(p);
  ok("coin page says Value each (Red Book)", /Value each \(Test Book\)/.test(coinPage));
  const opt = await p.evaluate(() => bookStatusLine());
  ok("Options line: " + opt, /^Test Book prices on this phone: Made-up · 8 series · saved [A-Z][a-z]{2} \d{1,2}$/.test(opt));
  ok("Options page shows the line", await p.evaluate(() => /Test Book prices on this phone/.test(redBookHtml())));

  // 2. Reload: same values, read from the saved record. The record is not rewritten.
  await open();
  const again = await p.evaluate(() => ({ savedAt: store.docs.get("pricebook").savedAt }));
  ok("same values from the saved record", J(await p.evaluate(probe)) === J(before));
  ok("the record was not written again", again.savedAt === first.r.savedAt);

  // 3. A record that differs from the shipped one wins (so a price file loaded later is never overwritten).
  await p.evaluate(() => { const r = JSON.parse(JSON.stringify(store.docs.get("pricebook"))); const t = r.series["morgan-dollar"].circ; t.rows["1881-S"] = t.rows["1881-S"].map(() => 4321); r.edition = "2031"; r.source = "Test Guide"; return put("pricebook", r, true); });
  await open();
  const mine = await p.evaluate(probe);
  ok("a different saved record wins over the shipped one", mine[0][0] === 4321 && /^Test Guide 2031: \$4,321/.test(mine[0][1]));
  ok("other coins unchanged", mine[1][0] === before[1][0] && mine[2][0] === before[2][0]);
  ok("the source name comes from the record", /Value each \(Test Guide\)/.test(await pageText(p)) && await p.evaluate(() => /Test Guide values/.test(redBookHtml())));

  // 4. Restore: the later-saved price list wins.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pc-"));
  const backup = await p.evaluate(() => buildBackup());
  ok("the backup carries the price list", backup.docs.some((d) => d.id === "pricebook"));
  const withBook = (savedAt, price) => { const c = JSON.parse(J(backup)); const d = c.docs.find((x) => x.id === "pricebook").data; d.savedAt = savedAt; d.series["morgan-dollar"].circ.rows["1881-S"] = d.series["morgan-dollar"].circ.rows["1881-S"].map(() => price); return c; };
  const restore = async (name, data) => {
    const f = path.join(tmp, name); fs.writeFileSync(f, J(data));
    await p.evaluate(() => openBackupSheet()); await p.waitForTimeout(100);
    await p.setInputFiles("#restoreFile", f); await p.waitForTimeout(300);
    await p.click("[data-act=confirmOk]"); await p.waitForTimeout(800);
    return (await p.evaluate(probe))[0][0];
  };
  ok("an older backup does not replace newer prices", (await restore("old.json", withBook("2020-01-01T00:00:00.000Z", 111))) === 4321);
  ok("a newer backup's prices win", (await restore("new.json", withBook("2099-01-01T00:00:00.000Z", 222))) === 222);
  const noBook = JSON.parse(J(backup)); noBook.docs = noBook.docs.filter((d) => d.id !== "pricebook");
  ok("a backup with no price list keeps the phone's", (await restore("none.json", noBook)) === 222);
  await open();
  ok("the restored price list is still there after reopening", (await p.evaluate(probe))[0][0] === 222);

  // 5. View-only file: no price table inside, and the coin shows the same value.
  const want = await p.evaluate(() => { const c = getCoin("pc1"); return [bookPrice(c), bookText(bookLookup(c)), mintageInfo(c).text, valueSource(c)]; });
  const html = await p.evaluate(() => buildSnapshot({}));
  ok("view-only file holds no price table", !/SHIPPED_PRICE_BOOK\s*=/.test(html) && !/"rows":\{/.test(html) && !/"pricebook"/.test(html.split("window.COIN_SNAPSHOT")[1].split("</script>")[0]) && !html.includes("1881-S\":["));
  console.log("snapshot size", Math.round(html.length / 1024) + " KB");
  const sf = path.join(tmp, "snap.html"); fs.writeFileSync(sf, html);
  const sp = await ctx.newPage(); const serr = []; sp.on("pageerror", (e) => serr.push(e.message));
  await sp.goto("file://" + sf); await sp.waitForTimeout(500);
  const snapPage = await pageText(sp);
  const got = await sp.evaluate(() => { const c = getCoin("pc1"); return { mode: store.mode, v: [bookPrice(c), bookText(bookLookup(c)), (mintageInfo(c) || {}).text, valueSource(c)], series: Object.keys(PRICE_BOOK.series).length, changed: bookPrice({ ...c, grade: "MS-63" }) }; });
  ok("view-only coin shows the same value, words and mintage", got.mode === "snapshot" && J(got.v) === J(want));
  ok("view-only coin page shows it", snapPage.includes("Value each (Test Guide)") && snapPage.includes("$222"));
  ok("view-only file has no price list to look in", got.series === 0 && got.changed === null);
  ok("view-only file doesn't say it has no prices", /values in this file were worked out when it was made/.test(await sp.evaluate(() => bookStatusLine())));
  ok("no page errors in the view-only file", serr.length === 0);
  await sp.close();

  // 6. The demo shows no book values and saves nothing.
  const dp = await ctx.newPage(); const derr = []; dp.on("pageerror", (e) => derr.push(e.message));
  await dp.goto(URL0 + "?demo"); await dp.waitForTimeout(700);
  const demo = await dp.evaluate(() => ({ mode: store.mode, coins: allCoins().length, book: allCoins().filter((c) => bookPrice(c) != null).length, rec: !!store.docs.get("pricebook"), total: sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)), home: document.querySelector("#view").innerText, line: bookStatusLine() }));
  ok("demo has coins but no book values", demo.mode === "demo" && demo.coins > 10 && demo.book === 0 && !demo.rec);
  ok("demo still shows a total (melt and face)", demo.total > 0 && !/valued from the/.test(demo.home));
  ok("demo Options line: " + demo.line, demo.line === "No Red Book prices on this phone.");
  ok("no page errors in the demo", derr.length === 0);
  await dp.close();
  await open();
  ok("the demo did not touch the saved price list", (await p.evaluate(probe))[0][0] === 222);

  ok("no page errors", errors.length === 0);
  console.log("errors", J(errors.concat(serr, derr)));
  await b.close(); srv.close();
})();
