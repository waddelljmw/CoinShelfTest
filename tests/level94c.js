// Step 9.4c: Simple mode. Three levels only change what is shown; saved data and an existing collection stay as they are.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8798);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8798/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  const vis = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden; }, sel);
  const menu = () => p.evaluate(() => ["albums", "boxes", "wants", "value", "coins", "home"].map((g) => { const e = document.querySelector(`#menu [data-go=${g}]`); return g + ":" + (e && !e.hidden ? 1 : 0); }).join(" ") + " rep:" + (document.querySelector("#menu [data-act=openReport]").hidden ? 0 : 1));
  // 1. a collection that already exists (no level saved) stays on Everything
  await p.evaluate(() => {
    put("c_k1", { ...blankCoin(), id: "k1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", status: "owned", qty: 1, paid: "30", notes: "keep me", boxId: "bx1", albumId: "al1" }, true);
    put("settings", { ...settings(), hideSpot: { gold: true }, showAdded: false, seller: { on: true } }, true);
    render();
  });
  await p.waitForTimeout(200);
  const before = await p.evaluate(() => { const s = settings(); delete s.optOpen; return JSON.stringify([s, getCoin("k1")]); });
  ok("no saved level means Everything", await p.evaluate(() => levelKey() === "everything"));
  ok("Everything shows the whole menu", /albums:1 boxes:1 wants:1 value:1 coins:1 home:1 rep:1/.test(await menu()) && await vis("#menuShows"));
  // 2. Simple: short menu, no Value over time, short Add coin form, Options still has the switch
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  ok("Options starts with How much to show, always visible", await p.evaluate(() => { const t = document.querySelector("#view").innerText; return t.indexOf("How much to show") > 0 && t.indexOf("How much to show") < t.indexOf("Spot prices"); }));
  await p.click("[data-act=setLevel][data-v=simple]"); await p.waitForTimeout(300);
  ok("Simple menu is short", /albums:0 boxes:0 wants:0 value:1 coins:1 home:1 rep:0/.test(await menu()) && !(await vis("#menuShows")) && !(await vis("#menuStacks")));
  ok("Simple hides Seller Mode in Options", await p.locator("[data-act=sellerMode]").count() === 0);
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  ok("Simple hides Value over time", await p.locator(".hist, #historyCard, [data-sec=history]").count() === 0 || !/Value over time/.test(await p.locator("#view").innerText()));
  await p.evaluate(() => openCoinForm(null)); await p.waitForTimeout(300);
  const secs = await p.evaluate(() => [...document.querySelectorAll("#coinForm details[data-sec]")].map((d) => d.dataset.sec));
  ok("Simple Add coin leaves out status, holder and errors", !secs.includes("status") && !secs.includes("holder") && !secs.includes("errors") && secs.includes("notes") && secs.includes("purchase"));
  await p.evaluate(() => { closeSheet && closeSheet(); go("home"); });
  await p.evaluate(() => openCoinForm("k1")); await p.waitForTimeout(300);
  ok("a saved coin still shows every section when edited", (await p.evaluate(() => [...document.querySelectorAll("#coinForm details[data-sec]")].map((d) => d.dataset.sec))).includes("holder"));
  // 3. Collector
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  await p.click("[data-act=setLevel][data-v=collector]"); await p.waitForTimeout(300);
  ok("Collector shows albums, storage, wants, report; not Shows", /albums:1 boxes:1 wants:1 value:1 coins:1 home:1 rep:1/.test(await menu()) && !(await vis("#menuShows")));
  // 4. back to Everything: nothing was lost or changed
  await p.click("[data-act=setLevel][data-v=everything]"); await p.waitForTimeout(300);
  const after = await p.evaluate(() => { const s = settings(); delete s.level; delete s.optOpen; return JSON.stringify([s, getCoin("k1")]); });
  const wasS = JSON.parse(before); const nowS = JSON.parse(after);
  ok("switching levels keeps every coin field", JSON.stringify(wasS[1]) === JSON.stringify(nowS[1]));
  ok("switching levels keeps every other setting", JSON.stringify(wasS[0]) === JSON.stringify(nowS[0]));
  ok("Everything shows Shows again (Seller Mode was on)", await vis("#menuShows"));
  // 5. welcome sheet lets a new person pick a level before the guide question
  await p.evaluate(() => { put("c_k1", { ...getCoin("k1"), status: "deleted" }, true); put("settings", { ...settings(), level: undefined }, true); go("home"); });
  await p.waitForTimeout(300);
  ok("welcome shows on an empty app", await p.locator(".welcome [data-act=startCollection]").count() === 1);
  await p.click("[data-act=startCollection]"); await p.waitForTimeout(200);
  ok("welcome sheet offers the 3 levels and still the guide choice", await p.locator("#sheet [data-act=setLevel]").count() === 3 && await p.locator("#sheet [data-act=guideStart]").count() === 1);
  await p.click("#sheet [data-act=setLevel][data-v=simple]"); await p.waitForTimeout(200);
  ok("picking a level keeps the sheet open and marks it", await p.locator("#sheet [data-act=guideStart]").count() === 1 && await p.evaluate(() => levelKey() === "simple") && /✓ Simple/.test(await p.locator("#sheet").innerText()));
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
