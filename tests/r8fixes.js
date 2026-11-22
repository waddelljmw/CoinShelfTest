// R8 fixes: CSV keeps melt coins following silver; Undo import takes back made inheritances; wrong-type album message.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const ok = (n, c) => console.log((c ? "ok   " : "FAIL ") + n);
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveSettings({ spot: { gold: 3884.9, silver: 40, platinum: 1434.5, copper: 6.48 } }));
  // R8-1: melt coin exported at silver 40, imported at silver 50
  await p.evaluate(() => saveCoin({ ...blankCoin(), typeId: "mercury-dime", typeName: "Mercury Dime", family: "Mercury dime", denom: "10C", metal: "Silver", oz: 0.07234, year: 1941, mint: "P", grade: "VF-20" }));
  const csv = await p.evaluate(() => toCsv());
  ok("export marks melt coin", /,Melt,/.test(csv));
  await p.evaluate(() => { [...store.docs.keys()].filter((k) => k.startsWith("c_")).forEach((k) => store.docs.delete(k)); saveSettings({ spot: { gold: 3884.9, silver: 50, platinum: 1434.5, copper: 6.48 } }); });
  await p.evaluate((t) => { openImport(); loadImportText(t, "x.csv"); }, csv);
  await p.click("[data-act=doImport]"); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const c = allCoins()[0]; return { v: c.value, best: bestEach(c), melt: meltEach(c) }; });
  ok("value not frozen", !r.v && Math.abs(r.best - r.melt) < 0.001);
  await p.evaluate(() => saveSettings({ spot: { gold: 3884.9, silver: 60, platinum: 1434.5, copper: 6.48 } }));
  ok("follows silver after import", await p.evaluate(() => { const c = allCoins()[0]; return Math.abs(bestEach(c) - meltEach(c)) < 0.001 && meltEach(c) > 0; }));
  // R8-4a: Undo import removes the inheritance it made
  await p.evaluate(() => { saveSettings({ inheritances: [], inhDefault: "" }); [...store.docs.keys()].filter((k) => k.startsWith("c_")).forEach((k) => store.docs.delete(k)); });
  const csv2 = "Year,Coin type,Grade,Source,Inherited from\n1941,Mercury Dime,VF-20,Inherited,Grandpa Joe\n";
  await p.evaluate((t) => { openImport(); loadImportText(t, "y.csv"); }, csv2);
  await p.click("[data-act=doImport]"); await p.waitForTimeout(400);
  ok("inheritance made", await p.evaluate(() => inheritances().length === 1));
  await p.evaluate(() => undoImport(true)); await p.waitForTimeout(400);
  ok("undo removes made inheritance", await p.evaluate(() => inheritances().length === 0 && !settings().inhDefault));
  // R8-4b: album for other coin types says so
  await p.evaluate(() => put("a_m1", { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "Morgans", typeId: "morgan-dollar", start: 1878, end: 1921, removed: [], createdAt: 1 }));
  const csv3 = "Year,Coin type,Grade,Album\n1941,Mercury Dime,VF-20,Whitman 9128\n";
  const al = await p.evaluate(() => albumTitle(albums()[0]));
  await p.evaluate((t) => { openImport(); loadImportText(t, "z.csv"); }, csv3.replace("Whitman 9128", al));
  await p.click("[data-act=doImport]"); await p.waitForTimeout(400);
  const msg = await p.textContent("#toast");
  ok("wrong-type message", /made for other coin types/.test(msg) && !/isn't here/.test(msg));
  ok("no page errors", errors.length === 0);
  console.log("errors", errors);
  await b.close();
})();
