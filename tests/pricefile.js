// Step 11.3: Load a price file / Save price file (Coin Value page). Made-up prices only (tests/fixtures/prices.json).
const { chromium } = require("./_compat");
const fs = require("fs"), path = require("path"), os = require("os");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
const fx = require("./fixtures/prices.json");
const copy = () => JSON.parse(JSON.stringify(fx));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { window.SHIPPED_PRICE_BOOK = null; }); // the real app ships no prices: start with none
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pf-"));
  const file = (name, data) => { const f = path.join(tmp, name); fs.writeFileSync(f, typeof data === "string" ? data : JSON.stringify(data)); return f; };
  const coin = { typeId: "morgan-dollar", year: "1881", mint: "S", grade: "MS-65", gradeMode: "raw" };
  const price = () => p.evaluate((c) => bookPrice(c), coin);
  const rec = () => p.evaluate(() => { const r = store.docs.get("pricebook"); return r ? { savedAt: r.savedAt, n: Object.keys(r.series).length } : null; });
  const open = async () => { await p.evaluate(() => go("value")); await p.waitForTimeout(250); };
  const msg = () => p.textContent("#priceMsg");

  // 1. No file loaded yet: no book values, the page says how to load one, typed values still count.
  await open();
  ok("no record and no book value at the start", (await rec()) === null && (await price()) === null);
  ok("the page says how to load a price file", /No prices yet/.test(await msg()) && (await p.locator("#priceFile").count()) === 1);
  ok("a typed value still works", await p.evaluate(() => valueEach({ ...blankCoin(), typeId: "morgan-dollar", year: "1881", gradeMode: "raw", grade: "MS-65", value: "77", qty: 1 }) === 77));

  // 2. A good file: asks first, shows the counts, replaces only on OK, Undo goes back.
  await p.setInputFiles("#priceFile", file("good.json", { ...copy(), savedAt: "2020-01-01T00:00:00.000Z" })); await p.waitForTimeout(300);
  const ask = await p.textContent(".sheet");
  ok("asks first with the counts: " + ask.replace(/\s+/g, " ").slice(0, 120), /8 series, 32 rows/.test(ask) && /Replace the prices on this phone\?/.test(ask) && /no row/.test(ask));
  ok("nothing changed yet", (await rec()) === null);
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(300);
  const after = await rec();
  ok("prices saved on the phone", !!after && after.n === 8 && (await price()) === fx.series["morgan-dollar"].circ.rows["1881-S"][6] && after.savedAt > "2021");
  ok("the page shows the series list", /Test Book prices on this phone: Made-up · 8 series/.test(await p.textContent("#bookStatus")));
  await p.click("#toast button"); await p.waitForTimeout(300);
  ok("Undo: no book values again, nothing else lost", (await price()) === null && (await p.evaluate(() => store.docs.get("pricebook").series && Object.keys(store.docs.get("pricebook").series).length)) === 0);
  ok("Undo with nothing before leaves an undated empty list", (await p.evaluate(() => store.docs.get("pricebook").savedAt)) === "");
  ok("a backup with prices beats that empty list, even an old one", await p.evaluate((f) => Object.keys(mergeRestored("pricebook", { ...f, kind: "pricebook", savedAt: "2019-01-01T00:00:00.000Z" }).series).length === 8, fx));
  ok("no false dip in value over time while no prices are loaded", await p.evaluate(() => { store.docs.set("history", { kind: "history", days: { "2020-01-01": { v: 500, m: 10, n: 3 } } }); recordHistory(); const d = store.docs.get("history").days; store.docs.delete("history"); return Object.keys(d).length === 1; }));
  await open();
  ok("after Undo the page asks for a file again", /No prices yet/.test(await msg()));

  // 3. Load again, then bad files: each is refused with a plain reason and the prices stay.
  await p.setInputFiles("#priceFile", file("good2.json", copy())); await p.waitForTimeout(300); await p.click("[data-act=confirmOk]"); await p.waitForTimeout(300);
  await open();
  const base = await rec(), basePrice = await price();
  const bad = async (name, data, re) => {
    await open();
    await p.setInputFiles("#priceFile", file(name, data)); await p.waitForTimeout(250);
    const m = await msg(), sheet = await p.locator(".sheet").count();
    ok("refused: " + name + " (" + m.slice(0, 70) + ")", re.test(m) && /not changed/.test(m) || (/isn't a Coin Cabinet price file|too big/.test(m) && re.test(m)));
    ok("  prices unchanged and no question asked", JSON.stringify(await rec()) === JSON.stringify(base) && (await price()) === basePrice && sheet === 0);
  };
  ok("an empty list doesn't beat a backup's prices, but a newer real one keeps", await p.evaluate((f) => mergeRestored("pricebook", { ...f, kind: "pricebook", savedAt: "2019-01-01T00:00:00.000Z" }) === store.docs.get("pricebook"), fx));
  await bad("cut-short.json", JSON.stringify(copy()).slice(0, 200), /isn't a Coin Cabinet price file/);
  await bad("not-prices.json", { kind: "backup", format: 1, series: {} }, /isn't a Coin Cabinet price file/);
  await bad("newer.json", { ...copy(), format: 2 }, /newer version/);
  await bad("empty.json", { ...copy(), series: {} }, /no prices/);
  let d = copy(); d.series["morgan-dollar"].circ.rows["1881-S"].pop(); await bad("short-row.json", d, /row 1881-S/);
  d = copy(); d.series["morgan-dollar"].circ.rows["1881-S"][2] = "12 dollars"; await bad("text-number.json", d, /numbers or blanks/);
  d = copy(); d.series["morgan-dollar"].circ.rows["1881-S"][2] = -5; await bad("negative.json", d, /numbers or blanks/);
  d = copy(); d.series["morgan-dollar"].circ.grades[0] = "Shiny"; await bad("odd-grade.json", d, /grade this app doesn't know/);
  d = copy(); d.series["morgan-dollar"].circ = { grades: [], rows: {} }; await bad("no-grades.json", d, /not in the right shape/);
  d = copy(); d.mintage = { "morgan-dollar": { circ: { "1881-S": { x: 1 } } } }; await bad("odd-mintage.json", d, /mintage list/);
  d = copy(); d.series["__proto__x"] = []; await bad("odd-series.json", d, /not in the right shape/);
  await bad("too-big.json", " ".repeat(2 * 1024 * 1024 + 10), /too big/);

  ok("the 11.2 private file (kind coin-cabinet-prices) is accepted", await p.evaluate((f) => !checkPriceFile({ ...f, kind: "coin-cabinet-prices" }).error, fx));

  // 4. Save price file: writes the saved list; loading that file back is accepted.
  await open();
  await p.evaluate(() => { window.__saved = null; downloadsApi = { save: async (o) => { window.__saved = o; } }; });
  await p.click("[data-act=savePriceFile]"); await p.waitForTimeout(250);
  const saved = await p.evaluate(() => window.__saved);
  const sd = saved && JSON.parse(saved.data);
  ok("saved file name and shape", !!saved && /^coin-cabinet-prices-\d{4}-\d{2}-\d{2}\.json$/.test(saved.filename) && sd.kind === "pricebook" && sd.format === 1 && Object.keys(sd.series).length === 8);
  ok("the message says it saved", /^Saved coin-cabinet-prices-/.test(await msg()));
  await p.setInputFiles("#priceFile", file("roundtrip.json", sd)); await p.waitForTimeout(250);
  ok("the saved file loads back", /Replace the prices on this phone\?/.test(await p.textContent(".sheet")));
  await p.click(".sheet [data-act=closeSheet] >> nth=0"); await p.waitForTimeout(150);
  ok("Cancel changes nothing", JSON.stringify(await rec()) === JSON.stringify(base));

  // 5. Coins are not touched by any of this.
  ok("coins untouched", await p.evaluate(() => allCoins().length) === 0);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
