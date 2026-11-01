// Step 2.2: status, purchase details and total cost, errors and problems, catalog number, old coins, CSV, backups.
const { chromium } = require("playwright");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const add = async (type, year) => { await p.click("#fab"); await p.fill("#typeSearch", type); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill("[data-f=year]", year); };
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };
  const coin = (y) => p.evaluate((y) => allCoins().find((x) => x.year === y && x.status !== "deleted"), y);

  // 1. Purchase details and total cost
  await add("morgan", "1921");
  await p.fill("[data-f=qty]", "2"); await p.fill("[data-f=paid]", "40");
  await p.click("summary:has-text('Purchase details')");
  await p.fill("[data-f=seller]", "Bob's Coins"); await p.fill("[data-f=buyTax]", "4"); await p.fill("[data-f=buyShip]", "5"); await p.fill("[data-f=buyFees]", "1.5");
  await p.selectOption("[data-f=payMethod]", "Cash"); await p.fill("[data-f=receiptNo]", "A-17");
  ok("cost hint", /Total cost: \$90\.50 for 2 coins/.test(await p.textContent("#costHint")));
  await p.selectOption("[data-f=_status]", "forsale"); await p.waitForTimeout(80);
  await p.check("[data-fcheck=upgrade]");
  await save();
  let c = await coin(1921);
  ok("saved purchase", c.seller === "Bob's Coins" && c.buyTax === "4" && c.payMethod === "Cash" && c.receiptNo === "A-17" && c.status === "owned" && c.stage === "forsale" && c.upgrade === true);
  ok("costOf", (await p.evaluate(() => costOf(allCoins().find((x) => x.year === 1921)))) === 90.5);
  ok("coin page purchase card", /Total cost\s*\$90\.50/.test(await p.textContent("main")) && /For sale · Upgrade wanted/.test(await p.textContent("main")));

  // 2. Sell 1 of 2: tax/shipping/fees split, then rejoin adds them back
  await p.click("[data-act=sell]"); await p.waitForTimeout(150);
  await p.fill("input[name=n]", "1"); await p.fill("input[name=amount]", "70");
  await p.click("#sheet button[type=submit]"); await p.waitForTimeout(200);
  const parts = await p.evaluate(() => allCoins().filter((x) => x.year === 1921).map((x) => [x.status, x.qty, x.buyTax, x.buyShip, x.buyFees, x.stage]));
  const kept = parts.find((x) => x[0] === "owned"), gone1 = parts.find((x) => x[0] === "sold");
  ok("split shares extras", kept && gone1 && kept[2] === "2" && gone1[2] === "2" && kept[3] === "2.5" && gone1[4] === "0.75" && gone1[5] === "" && kept[5] === "forsale");
  const soldId = await p.evaluate(() => allCoins().find((x) => x.year === 1921 && x.status === "sold").id);
  await p.evaluate((id) => go("coin-" + id), soldId); await p.waitForTimeout(150);
  await p.click("[data-act=unsell]"); await p.waitForTimeout(200);
  c = await coin(1921);
  ok("rejoin restores extras", (await p.evaluate(() => allCoins().filter((x) => x.year === 1921).length)) === 1 && c.qty === 2 && c.buyTax === "4" && c.buyShip === "5" && c.buyFees === "1.5");

  // 3. Inherited coins can't be For sale; Gone is left out of totals
  await add("peace", "1922");
  await p.selectOption('[data-f="_sourceKind"]', "Inherited"); await p.waitForTimeout(80);
  ok("no For sale for inherited", !(await p.$$eval("[data-f=_status] option", (os) => os.map((o) => o.value))).includes("forsale"));
  await p.fill("[data-f=value]", "50");
  await p.selectOption("[data-f=_status]", "gone"); await p.waitForTimeout(80);
  await p.selectOption("[data-f=_goneReason]", "Gifted");
  await save();
  c = await coin(1922);
  ok("gone saved", c.status === "gone" && c.gone.reason === "Gifted" && !c.stage);
  ok("gone not owned", !(await p.evaluate(() => ownedCoins().some((x) => x.year === 1922))));
  await p.evaluate(() => go("coins")); await p.waitForTimeout(100);
  ok("Gone tab", await p.isVisible("[data-act=status][data-v=gone]"));
  ok("Show filter offers For sale + Upgrade", (await p.$$eval("[data-list=stage] option", (os) => os.map((o) => o.value).join(","))) === ",forsale,upgrade");
  await p.evaluate((id) => go("coin-" + id), c.id); await p.waitForTimeout(100);
  await p.click("[data-act=ungone]"); await p.waitForTimeout(150);
  ok("back from gone", (await coin(1922)).status === "owned" && !("gone" in (await coin(1922))));

  // 4. Problems make a Details coin with no Red Book value; known varieties; mint errors
  await add("franklin", "1950");
  await p.selectOption("[data-f=grade]", "MS-63"); await p.waitForTimeout(80);
  ok("Red Book used before problems", (await p.evaluate(() => valueSource(draft))) === "book");
  await p.click("summary:has-text('Errors and problems')");
  await p.check('[data-flist=problems][value="Cleaned"]'); await p.check('[data-flist=mintErrors][value="Off-center"]');
  ok("problem stops Red Book value", (await p.evaluate(() => valueSource(draft))) !== "book" && /isn't used/.test(await p.textContent("#bookHint")));
  await save();
  c = await coin(1950);
  ok("saved problems + errors", c.problems.join() === "Cleaned" && c.mintErrors.join() === "Off-center");
  ok("Details in grade", /Raw MS-63 Details/.test(await p.evaluate(() => gradeText(allCoins().find((x) => x.year === 1950)))));
  const kv = await p.evaluate(() => [knownVarieties({ typeId: "state-quarter", year: 2004, mint: "D", variety: "Wisconsin" }).join("|"),
    knownVarieties({ typeId: "state-quarter", year: 2004, mint: "D", variety: "Iowa" }).length, knownVarieties({ typeId: "lincoln-wheat", year: 1955, mint: "P" }).join(), knownVarieties({ typeId: "lincoln-wheat", year: 1955, mint: "D" }).length]);
  ok("known varieties by date/mint/design", kv[0] === "Extra Leaf High|Extra Leaf Low" && kv[1] === 0 && kv[2] === "Doubled Die Obverse" && kv[3] === 0);

  // 5. Catalog number only on slabs
  await add("peace", "1923");
  ok("no catalog number on raw", !(await p.isVisible("[data-f=catNo]")));
  await p.click('[data-act=gmode][data-v=cert]'); await p.waitForTimeout(80);
  await p.fill("[data-f=catNo]", "7360");
  await save();
  ok("catalog number saved + shown", (await coin(1923)).catNo === "7360" && /Catalog number\s*7360/.test(await p.textContent("main")));

  // 6. Older coins (no new fields) still read right
  const old = await p.evaluate(() => { const o = { kind: "coin", status: "owned", paid: "10", qty: 1, grade: "VF-20", gradeMode: "raw" }; return [statusKey(o), costOf(o), hasProblems(o), gradeText(o), statusKey({ status: "owned", stage: "forsale", source: "Inherited" })]; });
  ok("old coins convert on read", old.join("|") === "owned|10|false|Raw VF-20|owned");
  await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  const home = await p.textContent("main");
  ok("home shows Cost", /Cost/.test(home));

  // 7. CSV round trip
  const csv = await p.evaluate(() => toCsv());
  ok("CSV has new columns", /Known variety,Mint errors,Problems,Upgrade wanted/.test(csv) && /Seller,Purchase tax,Purchase shipping,Purchase fees,Total cost,Paid with,Tracking number,Receipt number/.test(csv) && /For sale/.test(csv) && /Off-center/.test(csv));
  const back = await p.evaluate(() => {
    const rows = parseCsv(toCsv()); const head = rows[0]; const taken = new Set(); const map = head.map((h) => { const k = guessField(h, taken); if (k) taken.add(k); return k; });
    const r = rows.find((x) => x.includes("Bob's Coins")); const g = (key) => { const i = map.indexOf(key); return i < 0 ? null : r[i]; };
    const c = rowToCoin(g).coin; return [c.seller, c.buyTax, c.buyShip, c.buyFees, c.stage, c.upgrade, c.payMethod, c.receiptNo].join("|");
  });
  ok("CSV import reads new fields", back === "Bob's Coins|4|5|1.5|forsale|true|Cash|A-17");

  // 7b. Tracking: On the way shows the field; link by carrier; Mark as received
  await add("peace", "1924");
  await p.selectOption("[data-f=_status]", "coming"); await p.waitForTimeout(80);
  await p.fill("#trackNo", "1Z999AA10123456784");
  await save();
  ok("track link UPS", /ups\.com\/track\?tracknum=1Z999AA10123456784/.test(await p.getAttribute("a:has-text('Track package')", "href")));
  const urls = await p.evaluate(() => [trackUrl({ trackNo: "9400 1000 0000 0000 0000 00" }), trackUrl({ trackNo: "123456789012" }), trackUrl({ trackNo: "ABC" }), trackUrl({ trackNo: "123456789012", trackCarrier: "USPS" })]);
  ok("track links", /usps/.test(urls[0]) && /fedex/.test(urls[1]) && /google/.test(urls[2]) && /usps/.test(urls[3]));
  await p.click("[data-act=received]"); await p.waitForTimeout(150);
  c = await coin(1924);
  ok("received", c.stage === "" && !!c.receivedDate && c.trackNo === "1Z999AA10123456784" && !(await p.isVisible("[data-act=received]")));

  // 8. Receipt photos: kept by cleanup and backups; never in snapshots
  const refs = await p.evaluate(() => photoRefsOf({ photos: [{ lid: "a" }], receiptPhotos: [{ lid: "b" }] }).map((x) => x.lid).join());
  ok("photoRefsOf includes receipts", refs === "a,b");

  console.log("errors", errors);
  await b.close();
})();
