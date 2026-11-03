// Step 9.1: demo mode. Opens from the button and from ?demo, stays apart from the real saved coins,
// has the sample collection the plan asks for, and demo.js stays small.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8795);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  const realCount = () => p.evaluate(() => allCoins().filter((c) => c.status !== "deleted").length);

  // ---- the button on an empty Home, then in Options ----
  await p.goto("http://localhost:8795/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  ok("Home shows Try the demo when there are no coins", await p.locator("[data-act=tryDemo]").count() > 0);
  ok("the normal app has not loaded the demo file", await p.evaluate(() => typeof demoDocs === "undefined"));
  await p.evaluate(() => { const c = blankCoin(); Object.assign(c, { id: "real1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", year: 1881, mint: "S", grade: "MS-63" }); c.label = autoLabel(c); put("c_real1", c); });
  await p.waitForTimeout(400);
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  ok("Options has Try the demo", await p.locator("[data-act=tryDemo]").count() > 0);
  await Promise.all([p.waitForFunction(() => location.search === "?demo"), p.click("[data-act=tryDemo]")]);
  await p.waitForFunction(() => store.mode === "demo", null, { timeout: 15000 }); await p.waitForTimeout(400);
  ok("the button opens the demo", await p.evaluate(() => store.mode === "demo"));

  // ---- the sample collection ----
  const info = await p.evaluate(() => {
    const coins = allCoins().filter((c) => c.status !== "deleted");
    const withType = coins.filter((c) => c.typeId && c.year);
    const badYear = withType.filter((c) => yearProblem(c.typeId, c.year, "coin")).map((c) => c.label);
    const badDate = withType.filter((c) => EXACT_SLOTS[c.typeId] && !(EXACT_SLOTS[c.typeId].find((x) => x[0] === +c.year) || [0, ""])[1].split(" ").includes(c.mint || "P")).map((c) => c.label);
    const al = getAlbum("demoalbum1"), slots = albumSlots(al), filled = slots.filter((s) => coins.some((c) => c.albumId === al.id && c.slotId === s.id)).length;
    return { n: coins.length, badYear, badDate, ratio: filled / slots.length, slots: slots.length,
      gold: coins.some((c) => c.typeId === "indian-2-5" && +c.year === 1910), box: coins.filter((c) => c.boxId === "demobox" && c.holder === "2x2 cardboard flip").length,
      rolls: coins.filter((c) => c.item === "roll").length, bars: coins.filter((c) => c.item === "bullion").map((c) => c.bWeight).sort().join(","),
      lincoln: coins.filter((c) => c.albumId === "demoalbum2").length, sold: coins.filter((c) => c.status === "sold").length, biz: coins.filter((c) => c.biz && c.status === "owned").length,
      wants: [...store.docs.keys()].filter((k) => k.startsWith("w_")).length, shows: [...store.docs.keys()].filter((k) => k.startsWith("sh_")).length,
      history: Object.keys(store.docs.get("history").days).length, seller: sellerOn(), filledCoin: coins.filter((c) => /Filled in from photos/.test(c.notes || "")).length,
      pics: coins.filter((c) => (c.photos || []).length === 2 && c.photos[0].url.startsWith("data:image/svg")).length, real: coins.some((c) => c.id === "real1") };
  });
  ok("about 100 to 125 coins (" + info.n + ")", info.n >= 100 && info.n <= 125);
  ok("every year is real (" + info.badYear.join(", ") + ")", info.badYear.length === 0);
  ok("every date and mint is in the app's coin data (" + info.badDate.join(", ") + ")", info.badDate.length === 0);
  ok("1910 Indian Head $2.50 gold coin", info.gold);
  ok("Morgan album about 85% full (" + Math.round(info.ratio * 100) + "% of " + info.slots + ")", info.ratio >= 0.8 && info.ratio <= 0.9);
  ok("Lincoln album lightly filled", info.lincoln >= 8 && info.lincoln <= 16);
  ok("black box of 25 wheat cents in 2x2 flips", info.box === 25);
  ok("rolls, a 1 oz and 10 oz bar, and rounds", info.rolls === 3 && info.bars === "1,1,10");
  ok("sold coins, business stock, a show, a want list, Seller Mode", info.sold === 5 && info.biz >= 5 && info.shows === 1 && info.wants >= 3 && info.seller);
  ok("about 12 months of value history", info.history >= 12);
  ok("one coin is marked Filled in from photos; drawn pictures on the singles", info.filledCoin === 1 && info.pics >= 20);
  ok("the real saved coin is not in the demo", !info.real);
  ok("banner says it's a demo with Exit demo", await p.evaluate(() => /Demo: these aren't real coins/.test($("#banner").textContent) && !$("#banner").hidden && !!$("#banner [data-act=exitDemo]")));
  for (const pg of ["home", "coins", "value", "options"]) { await p.evaluate((g) => go(g), pg); await p.waitForTimeout(150); }
  ok("Backup and Import are hidden in the demo", await p.locator("[data-act=openBackup], [data-act=openImport]").count() === 0);
  ok("banner still shows on another page", await p.evaluate(() => !$("#banner").hidden));
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  ok("the Home page draws without errors", await p.evaluate(() => document.querySelector("main").textContent.length > 200));

  // ---- the shelf's Rolls opens just the rolls ----
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  await p.click("[data-act=seeItems][data-v=roll]"); await p.waitForTimeout(300);
  ok("Rolls on the shelf shows only the 3 rolls", await p.evaluate(() => document.querySelectorAll("#main .list > *, main .list > *").length === 3 && /Rolls only/.test(document.querySelector("main").textContent)));
  await p.click("[data-act=fltDrop][data-k=item]"); await p.waitForTimeout(200);
  ok("removing the Rolls chip shows all coins again", await p.evaluate(() => document.querySelectorAll("main .list > *").length > 20));
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);

  // ---- photo fill showcase ----
  await p.click("#fab"); await p.waitForSelector("[data-act=demoFill]");
  ok("Add coin offers See photo fill in action", true);
  await p.click("[data-act=demoFill]"); await p.waitForFunction(() => draft && draft._demoFill === 5, null, { timeout: 15000 });
  ok("photo fill fills type, year, mint and grade", await p.evaluate(() => draft.typeId === "morgan-dollar" && draft.year === 1889 && draft.mint === "S" && draft.grade === "MS-63"));
  ok("photo fill labels its pictures Example", await p.evaluate(() => [...document.querySelectorAll("img[alt^='Example']")].length === 2 && decodeURIComponent(document.querySelector("img[alt^='Example']").src).includes("EXAMPLE")));
  await p.evaluate(() => closeSheet()); await p.waitForTimeout(200);

  // ---- changes in the demo stay in the demo ----
  await p.evaluate(() => { const c = blankCoin(); Object.assign(c, { id: "tmpdemo", typeId: "peace-dollar", typeName: "Peace Dollar", year: 1922, mint: "D", grade: "MS-63" }); put("c_tmpdemo", c); remove("c_demo3"); });
  await p.waitForTimeout(500);
  await Promise.all([p.waitForFunction(() => location.search === "" && store.mode === "local", null, { timeout: 15000 }), p.click("[data-act=exitDemo]")]);
  await p.waitForTimeout(500);
  ok("Exit demo returns to the normal app", await p.evaluate(() => store.mode === "local" && document.body.className.indexOf("demo") < 0));
  const after = await p.evaluate(() => ({ ids: allCoins().map((c) => c.id), n: allCoins().filter((c) => c.status !== "deleted").length }));
  ok("real coins unchanged after Exit (still just the one)", after.n === 1 && after.ids[0] === "real1");

  // ---- the link ----
  await p.goto("http://localhost:8795/?demo"); await p.waitForFunction(() => store.mode === "demo", null, { timeout: 15000 });
  ok("the ?demo link opens the demo", await p.evaluate(() => allCoins().length > 100));
  await p.goto("http://localhost:8795/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  ok("still just the real coin afterwards", await realCount() === 1);

  // ---- housekeeping ----
  ok("demo.js stays under 150 KB", fs.statSync(path.join(root, "catalog/demo.js")).size < 150 * 1024);
  ok("demo.js is in the offline file list", /catalog\/demo\.js/.test(fs.readFileSync(path.join(root, "sw.js"), "utf8")));
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
