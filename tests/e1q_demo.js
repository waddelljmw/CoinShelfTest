// E1q 4-box check, box 3 and 4: run on ?demo (nothing saved). Coin count and totals before/after a break-up.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => { const u = q.url.split("?")[0]; fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); }); }).listen(8797);
const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route("**/api.gold-api.com/**", (r) => r.abort()); const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8797/?demo=full"); await p.waitForFunction(() => store.mode === "demo", null, { timeout: 15000 }); await p.waitForTimeout(300);
  const ev = (f) => p.evaluate(f);
  const tot = () => ev(() => ({ n: ownedCoins().length, q: sum(ownedCoins(), qtyOf), cost: Math.round(sum(ownedCoins(), (c) => costOf(c) || 0) * 100) / 100, value: Math.round(sum(ownedCoins().filter((c)=>!c.biz), (c) => (bestEach(c) || 0) * qtyOf(c))*100)/100 }));
  console.log("mode", await ev(() => store.mode), "albums", await ev(() => albums().length));
  const t0 = await tot(); console.log("before", JSON.stringify(t0));
  const aid = await ev(() => { const a = albums().find((x) => albumStats(x).total > albumStats(x).owned && !isSetAlbum(x)); go("album-" + a.id); return a.id; });
  await p.waitForTimeout(300);
  await p.click(".album-grid .slot:not(.have):not(.blank-spot) >> nth=0"); await p.waitForTimeout(200);
  await p.click("#sheet [data-act=slotElse]"); await p.waitForTimeout(200);
  await p.screenshot({ path: "/tmp/else.png" });
  await p.click("#sheet [data-act=slotElseNew]"); await p.waitForTimeout(300);
  await ev(() => { draft._what = "other"; draft.typeName = "Casino token"; draft.family = "Token"; draft.noGrade = true; draft._none = true; draft.paid = "3"; renderCoinForm(); });
  await p.screenshot({ path: "/tmp/form.png" });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400); console.log("toast", await p.textContent("#toast"));
  const t1 = await tot(); console.log("after token", JSON.stringify(t1), await ev(() => { const a = albums().find(x=>[...albumStats(x).others.values()].length); return a ? albumStats(a).others.size : 0; }));
  await p.screenshot({ path: "/tmp/ring.png" });
  await ev(() => { saveCoin({ ...blankCoin(), id: "psx", item: "set", setKind: "proof", typeName: "Proof set", family: "Sets", year: 1962, paid: "40" }); });
  const t2 = await tot();
  await ev(() => openBreakUp("psx")); await p.waitForTimeout(200);
  if (await p.locator("#sheet [data-act=buMatch]").count()) { await p.click("#sheet [data-act=buMatch]"); await p.waitForTimeout(200); }
  console.log("lines", await ev(() => JSON.stringify(bu.lines.map((l) => [l.typeId, l.cost, l.to]))));
  await p.click("#sheet [data-act=buGo]"); await p.waitForTimeout(400);
  const t3 = await tot(); console.log("set", JSON.stringify(t2), "after breakup", JSON.stringify(t3));
  ok("token adds one coin, spot still missing", t1.n === t0.n + 1);
  ok("break-up: cost unchanged, 5 coins for 1 set", t3.cost === t2.cost && t3.n === t2.n + 4);
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close(); srv.close();
})();
