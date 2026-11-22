const { chromium } = require("./_compat");
const fs = require("fs");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveSettings({ spot: { gold: 3884.9, silver: 49.14, platinum: 1434.5, copper: 6.48 } }));

  // 1) Round trip: make coins, export, wipe, import, compare
  await p.evaluate(() => {
    const mk = (o) => saveCoin({ ...blankCoin(), ...o });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1878, mint: "CC", grade: "VF-20", qty: 2, value: "225", source: "Inherited", notes: 'Grandpa\'s, "the good one"\nsecond line' });
    mk({ typeId: "kennedy-40", typeName: "Kennedy Half Dollar", family: "Kennedy half", denom: "50C", metal: "Silver", oz: 0.14792, year: "", grade: "Junk", qty: 25, paid: "4" });
    mk({ typeId: "franklin-half", typeName: "Franklin Half Dollar", family: "Franklin half", denom: "50C", metal: "Silver", oz: 0.36169, year: 1953, mint: "S", gradeMode: "cert", service: "PCGS", cert: "12345678", grade: "MS-65", fbl: true, paid: "250" });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1880, mint: "O", grade: "AU-55", paid: "45", status: "sold", sold: { at: 1, date: "2026-10-31", amount: 70, shipping: 5.95, insurance: 2, where: "" } });
    mk({ typeId: "washington-silver", typeName: "Washington Quarter", family: "Washington quarter", denom: "25C", metal: "Silver", oz: 0.18084, year: 1934, grade: "F-12", variety: "Light Motto" });
  });
  const csv = await p.evaluate(() => toCsv());
  fs.writeFileSync("/tmp/export.csv", csv);
  console.log("EXPORT HEAD:", csv.split("\n")[0]);
  const before = await p.evaluate(() => allCoins().map((c) => coinToRow(c)));
  await p.evaluate(() => { [...store.docs.keys()].filter((k) => k.startsWith("c_")).forEach((k) => store.docs.delete(k)); render(); });
  await p.evaluate((t) => { openImport(); loadImportText(t, "export.csv"); }, csv);
  console.log("unused columns:", await p.evaluate(() => imp.headers.filter((h, i) => !imp.map[i])));
  await p.screenshot({ path: "/tmp/import-preview.png" });
  await p.click("[data-act=doImport]"); await p.waitForTimeout(400);
  const after = await p.evaluate(() => allCoins().map((c) => coinToRow(c)));
  const strip = (r) => { const x = { ...r }; return JSON.stringify(x); };
  const A = before.map(strip).sort(), B = after.map(strip).sort();
  console.log("round trip identical:", JSON.stringify(A) === JSON.stringify(B));
  if (JSON.stringify(A) !== JSON.stringify(B)) { A.forEach((a, i) => { if (a !== B[i]) console.log(" before", a, "\n after ", B[i]); }); }

  // 2) Re-importing the same file: everything flagged as already owned
  await p.evaluate((t) => { openImport(); loadImportText(t, "export.csv"); }, csv);
  console.log("re-import preselected:", await p.evaluate(() => importCoins().length - imp.skip.size), "button:", (await p.textContent("[data-act=doImport]")).trim());
  await p.click("[data-act=closeSheet] >> nth=0");

  // 3) Base44-style file with different headings and messy values
  const b44 = [
    "Coin,Date,Mint Mark,Condition,Quantity,Purchase Price,Estimated Value,Acquired From,Photo URL,Comments",
    'Morgan Dollar,1921-D,,EF40,1,$40.00,"$1,055.00",Coin shop,http://x/y.jpg,"nice, clean"',
    "Peace dollar,1922,,MS 63,3,35,,eBay,,",
    "Walking Liberty Half,1943,S,vf-20,1,22.5,,Inherited,,",
    "Indian Head $2.50 Gold,1910,,AU-53,1,,600,Inherited,,",
    "Kennedy Half,1967,D,Junk,10,4,,Bank roll,,",
    "Commemorative token,1999,,Nice,1,5,,Flea market,,",
  ].join("\n");
  await p.evaluate((t) => { openImport(); loadImportText(t, "base44.csv"); }, b44);
  console.log("b44 map:", JSON.stringify(await p.evaluate(() => imp.headers.map((h, i) => h + "→" + (imp.map[i] || "-")))));
  const rows = await p.evaluate(() => importCoins().map((x) => [labelOf(x.coin), x.coin.typeId, x.coin.grade, x.coin.customGrade || "", x.coin.qty, x.coin.paid, x.coin.value, x.coin.source, x.typeMatched, bestEach(x.coin)]));
  rows.forEach((r) => console.log("  ", JSON.stringify(r)));
  await p.screenshot({ path: "/tmp/import-b44.png", fullPage: false });
  await p.click("[data-act=doImport]"); await p.waitForTimeout(500);
  console.log("total rows now:", await p.evaluate(() => allCoins().length));
  // Undo the batch from Options
  await p.click("#menuBtn"); await p.click("#menu [data-go=options]");
  console.log("options shows last import:", await p.isVisible("[data-act=undoImport]"));
  await p.click("[data-act=undoImport]"); await p.waitForTimeout(400);
  console.log("after undo rows:", await p.evaluate(() => allCoins().length), "link gone:", !(await p.isVisible("[data-act=undoImport]")));

  // 4) Column matching when Year heading is unknown
  await p.evaluate(() => { openImport(); loadImportText("Yr Made,What,Grade\n1921,Morgan Dollar,VF-20\n", "odd.csv"); });
  console.log("needs mapping banner:", await p.isVisible("text=Pick which column is the"));
  await p.selectOption('[data-impmap="0"]', "year"); await p.selectOption('[data-impmap="1"]', "typeName");
  console.log("after mapping preview rows:", await p.$$eval("[data-impskip]", (x) => x.length));
  await p.screenshot({ path: "/tmp/import-map.png" });
  console.log("errors", errors);
  await b.close();
})();
