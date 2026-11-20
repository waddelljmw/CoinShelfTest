// Step 17: the demo sample is bigger (inherited album, Kennedy multi-type album, pocket album in a box, key dates, foreign coins, coins needing info) and ?demo=big adds ~1,000 coins. Memory only.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
const idx = "file://" + require("path").resolve(__dirname, "../index.html");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(idx + "?demo=full"); await p.waitForTimeout(800);
  const q = (f) => p.evaluate(f);
  ok("inherited album has coins marked Inherited", await q(() => { const a = getAlbum("demoalbum3"), st = albumStats(a); return a.inherited && st.owned >= 10 && st.coins.every((c) => isInherited(c) && c.inhId === "demoinh1" && missingOf(c).length === 0); }));
  ok("Kennedy album covers 3 types and is partly filled", await q(() => { const a = getAlbum("demoalbum4"), st = albumStats(a); return albumTypes(a).length === 3 && st.owned > 15 && st.owned < st.total; }));
  ok("Kennedy coins are circulated from rolls or pocket change", await q(() => albumStats(getAlbum("demoalbum4")).coins.every((c) => c.noGrade && isFaceSource(c))));
  ok("pocket album has coins on 2 pages and is kept in the fire safe", await q(() => { const b = getBox("demopocket"); const cs = boxCoins(b); return b.type === "pocket" && trayCount(b) === 2 && cs.length === 7 && cs.some((c) => trayNo(c) === 2) && getBox(b.keptBox).name === "Fire safe"; }));
  ok("pocket coin spots are unique", await q(() => { const k = boxCoins(getBox("demopocket")).map((c) => trayNo(c) + "|" + c.boxRow + "|" + c.boxSlot); return new Set(k).size === k.length; }));
  ok("at least 4 key dates show the key chip", await q(() => ownedCoins().filter((c) => keyDateInfo(c)).length >= 4));
  ok("3 foreign coins", await q(() => ownedCoins().filter((c) => c.family === "Foreign coin").length === 3));
  ok("10 coins need info for the Fix-up run", await q(() => ownedCoins().filter((c) => c.id && /^demo/.test(c.id) && needsOf(c).length && !c.albumId).length >= 10));
  ok("all demo coins have valid years", await q(() => ownedCoins().every((c) => !c.typeId || !yearProblem(c))));
  ok("full demo stays small (under 450 coins)", await q(() => allCoins().length < 450));
  ok("still in memory only", await q(() => store.mode === "demo"));
  for (const v of ["home", "albums", "album-demoalbum3", "album-demoalbum4", "box-demopocket", "boxes", "coins", "value"]) { await q((x) => go(x), v); await p.waitForTimeout(150); }
  await p.goto(idx + "?demo=big"); await p.waitForTimeout(1500);
  ok("big sample has about 1,000 more coins", await q(() => allCoins().length >= 1200 && allCoins().length < 1300));
  const t0 = Date.now(); await q(() => go("coins")); await p.waitForTimeout(100);
  ok("big sample list opens in under 5 seconds (" + (Date.now() - t0) + " ms)", Date.now() - t0 < 5000);
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.slice(0, 3));
  await b.close();
})();
