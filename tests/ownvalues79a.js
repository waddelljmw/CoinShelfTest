// Idea 79a: bring your own values (CSV: match columns, preview, confirm). Made-up numbers only.
const { chromium } = require("./_compat");
const fs = require("fs"), path = require("path"), os = require("os");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
const fx = require("./fixtures/prices.json");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { window.SHIPPED_PRICE_BOOK = null; });
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ov-"));
  const file = (name, text) => { const f = path.join(tmp, name); fs.writeFileSync(f, text); return f; };
  const price = (c) => p.evaluate((c) => bookPrice(c), c);
  const rec = () => p.evaluate(() => JSON.parse(JSON.stringify(store.docs.get("pricebook") || null)));
  const coin = (o) => ({ typeId: "morgan-dollar", year: "1881", mint: "S", grade: "MS-65", gradeMode: "raw", ...o });
  await p.evaluate(() => go("value")); await p.waitForTimeout(250);
  ok("the Options card has the new button, help and template", (await p.locator("#ownValuesFile").count()) === 1 && (await p.locator("[data-act=ovHelp]").count()) === 1);
  ok("no price before loading", (await price(coin())) === null);

  // 1. Odd headings, a $ and comma value, a combined 1884-CC year, a proof row, and bad rows that must be skipped.
  const csv = ["Series,Date,Grade,Price", "Morgan Dollar,1881-S,MS-65,\"$1,250.50\"", "Morgan Dollar,1881-S,MS-63,100", "Morgan Dollar,1884-CC,AU-55,300", "Morgan Dollar,1881,PR-65,900",
    "Mercury Dime,1942,MS-65,45", "Nonsense Coin,1900,MS-65,5", "Morgan Dollar,1950,MS-65,5", "Morgan Dollar,1881,Banana,5", "Morgan Dollar,1881,MS-65,abc", "Morgan Dollar,,MS-65,5"].join("\n");
  await p.setInputFiles("#ownValuesFile", file("mine.csv", csv)); await p.waitForTimeout(300);
  let sheet = await p.textContent(".sheet");
  ok("columns matched by themselves, preview shows 5 values for 2 types: " + sheet.replace(/\s+/g, " ").slice(0, 110), /5 values/.test(sheet) && /2 coin types/.test(sheet) && /5 new, 0 replacing/.test(sheet));
  ok("5 bad rows are listed as skipped", /5 rows skipped/.test(sheet));
  ok("nothing saved before confirming", (await rec()) === null);
  await p.click("[data-act=applyOv]"); await p.waitForTimeout(300);
  const r = await rec();
  ok("record keeps the price-file shape and the name", r && r.kind === "pricebook" && r.format === 1 && r.source === "My values" && Object.keys(r.series).length === 2);
  ok("typed-in $1,250.50 is the MS-65 price", (await price(coin())) === 1250.5);
  ok("lower grade (MS-64) uses the MS-63 price", (await price(coin({ grade: "MS-64" }))) === 100);
  ok("combined year-mint 1884-CC works", (await price(coin({ year: "1884", mint: "CC", grade: "AU-55" }))) === 300);
  ok("proof row works", (await price(coin({ grade: "PR-65", year: "1881" }))) === 900);
  ok("coins untouched (none made)", await p.evaluate(() => allCoins().length === 0));

  // 2. Undo puts the empty list back.
  await p.click("#toast [data-act], .toast button >> nth=0").catch(() => {}); await p.waitForTimeout(250);
  ok("Undo brings back the earlier prices", (await price(coin())) === null);

  // 3. Adds to an existing list: other cells stay, the same cell is replaced, a new grade widens the table.
  await p.evaluate((d) => put("pricebook", { ...d, savedAt: "2020-01-01T00:00:00.000Z" }), fx); await p.waitForTimeout(200);
  const f1 = fx.series["franklin-half"].circ;
  const keep = await price({ typeId: "franklin-half", year: "1950", mint: "", grade: "MS-65", gradeMode: "raw" });
  await p.evaluate(() => go("value")); await p.waitForTimeout(200);
  await p.setInputFiles("#ownValuesFile", file("two.csv", "Coin type,Year,Mint,Grade,Value\nFranklin Half Dollar,1950,,MS-65,77\nFranklin Half Dollar,1950,,MS-64,50\nFranklin Half Dollar,1951,,MS-65,66")); await p.waitForTimeout(300);
  sheet = await p.textContent(".sheet");
  ok("preview counts new vs replacing: " + sheet.replace(/\s+/g, " ").slice(0, 120), /3 values/.test(sheet) && /2 new, 1 replacing/.test(sheet));
  await p.fill("#ovSource", "Dealer sheet");
  await p.click("[data-act=applyOv]"); await p.waitForTimeout(300);
  const r2 = await rec();
  const fr = (g, y) => p.evaluate(([g, y]) => bookPrice({ typeId: "franklin-half", year: y, mint: "", grade: g, gradeMode: "raw" }), [g, y]);
  ok("same cell replaced (1950 MS-65 is now 77, was " + keep + ")", (await fr("MS-65", "1950")) === 77);
  ok("new grade column MS-64 added in order", r2.series["franklin-half"].circ.grades.indexOf("MS-64") === r2.series["franklin-half"].circ.grades.indexOf("MS-63") + 1 && (await fr("MS-64", "1950")) === 50);
  ok("other dates and series untouched", (await p.evaluate(() => bookPrice({ typeId: "franklin-half", year: "1953", mint: "S", grade: "MS-65", gradeMode: "raw" }))) === 471 && Object.keys(r2.series).length === Object.keys(fx.series).length);
  ok("new date 1951 added; name changed; mintage list kept", (await fr("MS-65", "1951")) === 66 && r2.source === "Dealer sheet" && JSON.stringify(r2.mintage) === JSON.stringify(fx.mintage || {}));
  ok("every row has one number per grade", Object.values(r2.series["franklin-half"].circ.rows).every((a) => a.length === r2.series["franklin-half"].circ.grades.length));
  ok("the merged record still passes the price-file check", await p.evaluate(() => !checkPriceFile(store.docs.get("pricebook")).error));

  // 4. A file missing a needed column asks for it and offers no Add button; template saves.
  await p.evaluate(() => go("value")); await p.waitForTimeout(200);
  await p.setInputFiles("#ownValuesFile", file("bad.csv", "Foo,Bar\n1,2")); await p.waitForTimeout(300);
  sheet = await p.textContent(".sheet");
  ok("asks to pick the needed columns, no Add button", /Pick a column for Coin type/.test(sheet) && (await p.locator("[data-act=applyOv]").count()) === 0);
  ok("the template parses to 4 usable values", await p.evaluate(() => { loadOvText(ovTemplate(), "t.csv"); return ovParse().cells.length === 4 && ovParse().bad.length === 0; }));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
