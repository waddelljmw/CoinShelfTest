// Step 13 "Numbers agree": Business counted apart everywhere, one coin count, face labels, refund back to For sale.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8842);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8842/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const mk = (id, extra) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", status: "owned", qty: 1, value: "100", ...extra });
    put("settings", { ...settings(), sellerMode: true }, true);
    mk("p1", {}); mk("b1", { biz: true });
    const a = { id: "al1", name: "Test", typeIds: ["morgan-dollar"], start: 1880, end: 1880 };
    put("a_al1", a);
    put("c_p1", { ...getCoin("p1"), albumId: "al1" }); put("c_b1", { ...getCoin("b1"), albumId: "al1" });
    const st = albumStats(a);
    // sold Business coin that was for sale, then refunded
    put("c_s1", { ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, grade: "VF-20", status: "sold", biz: true, ask: "120", qty: 1, sold: { date: "2026-11-01", amount: "110" } });
    returnToStock({ dataset: { id: "s1" } }, true);
    const back = getCoin("s1");
    return { albumValue: st.value, stage: back.stage, status: back.status, inList: stageOf(back) };
  });
  ok("album value leaves Business coin out (100, not 200)", r.albumValue === 100);
  ok("refunded Business coin is back on For sale", r.status === "owned" && r.stage === "forsale" && r.inList === "forsale");
  const face = await p.evaluate(() => { const c = { ...blankCoin(), typeId: "jefferson-nickel", typeName: "Jefferson Nickel", year: 1946, grade: "VF-20", qty: 1, status: "owned" }; return { src: valueSource(c), best: bestEach(c) }; });
  ok("face-lifted nickel says Face, not Melt", face.src === "face" && face.best === 0.05);
  await p.evaluate(() => { put("c_p1", { ...getCoin("p1"), biz: true }); put("c_b1", { ...getCoin("b1"), biz: true }); go("home"); });
  await p.waitForTimeout(300);
  ok("Business-only Home does not say 'No coins yet'", !(await p.locator("body").innerText()).includes("No coins yet"));
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
