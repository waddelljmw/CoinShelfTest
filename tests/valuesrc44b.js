// Step 44b: value sources (reviews/41). Made-up prices from tests/fixtures/prices.json only.
const { chromium } = require("./_compat");
const path = require("path"), fs = require("fs");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
const PAGE = "file://" + path.resolve(__dirname, "../index.html");
const totals = (p) => p.evaluate(() => { const o = countedCoins(); return Math.round(sum(o, (c) => (bestEach(c) || 0) * qtyOf(c)) * 100) / 100; });

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(500);
  await p.evaluate(() => {
    saveSettings({ spot: { silver: 30, gold: 2000, platinum: null, copper: null } }, true);
    const base = { kind: "coin", status: "owned", typeId: "morgan-dollar", typeName: "Morgan Dollar", metal: "Silver", oz: "0.77344", gradeMode: "raw", qty: 1 };
    put("c_k1", { ...base, id: "k1", year: "1881", mint: "S", grade: "MS-63" }, true);              // list price 537
    put("c_k2", { ...base, id: "k2", year: "1881", mint: "S", grade: "MS-63", value: "600", valueFrom: "ebay" }); // old typed value
    put("c_k3", { ...base, id: "k3", year: "1921", mint: "", grade: "VF-20" });                     // no list row: melt
  });
  await p.waitForTimeout(200);
  const before = await totals(p);
  ok("old coins: list price, typed value, melt (" + before + ")", await p.evaluate(() => bookPrice(getCoin("k1")) === 537 && valueEach(getCoin("k2")) === 600 && valueSource(getCoin("k3")) === "melt"));

  // Named source + compare values: totals don't move.
  const id = await p.evaluate(() => addSource("Blue Book"));
  ok("source made and named", await p.evaluate((id) => valueFromText("s:" + id) === "Blue Book" && addSource("blue book") === id, id));
  await p.evaluate((id) => { const c = getCoin("k1"); put("c_k1", { ...c, compare: [{ from: "s:" + id, value: "450" }, { from: "ebay", value: "20" }] }); }, id);
  ok("compare values never count in totals", (await totals(p)) === before);
  await p.evaluate(() => go("coin-k1")); await p.waitForTimeout(250);
  let page = await p.textContent("#app, main, body");
  ok("coin page shows both compare lines", /Blue Book\s*compare\s*\$450/.test(page) && /eBay sold\s*compare\s*\$20/.test(page));

  // Melt (follows silver).
  await p.evaluate(() => { const c = getCoin("k2"); put("c_k2", { ...c, value: "", valueFrom: "melt" }); });
  ok("Melt pick follows the metal price", await p.evaluate(() => { const c = getCoin("k2"); return valueSource(c) === "melt" && Math.abs(valueEach(c) - meltEach(c)) < 1e-9; }));
  await p.evaluate(() => saveSettings({ spot: { ...settings().spot, silver: 40 } }, true));
  ok("…and moves when silver moves", await p.evaluate(() => Math.abs(valueEach(getCoin("k2")) - 0.77344 * 40) < 0.01 && Math.abs(valueEach(getCoin("k2")) - meltEach(getCoin("k2"))) < 1e-9));
  await p.evaluate(() => saveSettings({ spot: { ...settings().spot, silver: 30 } }, true));

  // A second price list: compare line only, until it fills blank coins. Never borrow.
  await p.evaluate(() => { const r = JSON.parse(JSON.stringify(store.docs.get("pricebook"))); r.source = "Second List"; r.series = { "morgan-dollar": r.series["morgan-dollar"] }; r.series["morgan-dollar"].circ.rows["1881-S"] = r.series["morgan-dollar"].circ.rows["1881-S"].map((x) => x * 2); put("pricebook2", r); });
  ok("list 1 still fills blank coins", await p.evaluate(() => bookPrice(getCoin("k1")) === 537 && activeBookKey() === "pricebook"));
  await p.evaluate(() => go("coin-k1")); await p.waitForTimeout(250);
  page = await p.textContent("body");
  ok("coin page shows the other list to compare", /Second List\s*compare\s*\$1,074/.test(page));
  await p.evaluate(() => go("value")); await p.waitForTimeout(250);
  ok("Fill blank coins from shows with 2 lists", (await p.locator("#fillFrom").count()) === 1);
  await p.selectOption("#fillFrom", "pricebook2"); await p.waitForTimeout(250);
  ok("list 2 now fills blank coins", await p.evaluate(() => bookPrice(getCoin("k1")) === 1074));
  ok("never borrows from list 1 (no row in list 2 → melt)", await p.evaluate(() => { const c = { ...getCoin("k1"), typeId: "franklin-half", typeName: "Franklin Half", year: "1950", mint: "", grade: "MS-63" }; return bookPrice(c) === null; }));
  await p.selectOption("#fillFrom", "pricebook"); await p.waitForTimeout(250);
  const m2 = await p.evaluate(() => meltEach(getCoin("k2")));
  ok("back to list 1, total as before (only k2 changed to melt)", Math.abs((await totals(p)) - (before - 600 + m2)) < 0.01);

  // The form: Melt clears the Value box; + Name a new source makes one and picks it.
  await p.evaluate(() => openCoinForm("k1")); await p.waitForSelector("#coinForm");
  await p.fill("#coinForm [data-f=value]", "500"); await p.waitForTimeout(100);
  ok("Value from lists Melt and + Name a new source", (await p.locator("#coinForm select[data-f=valueFrom] option[value=melt]").count()) === 1 && (await p.locator("#coinForm select[data-f=valueFrom] option[value=__new]").count()) === 1);
  await p.selectOption("#coinForm select[data-f=valueFrom]", "__new"); await p.waitForTimeout(200);
  await p.fill("#vsName", "My Book"); await p.click("[data-act=vsSave]"); await p.waitForTimeout(400);
  ok("new source picked on the form", await p.evaluate(() => draft && /^s:/.test(draft.valueFrom) && valueFromText(draft.valueFrom) === "My Book"));
  ok("compare rows from before are on the form", (await p.locator("#coinForm [data-cmp]").count()) === 4);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("saved: My Book value 500 and two compare values", await p.evaluate(() => { const c = getCoin("k1"); return c.value === "500" && valueFromText(c.valueFrom) === "My Book" && c.compare.length === 2; }));
  await p.evaluate(() => openCoinForm("k3")); await p.waitForSelector("#coinForm");
  await p.selectOption("#coinForm select[data-f=valueFrom]", "melt"); await p.waitForTimeout(100);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("Melt saved with an empty Value box", await p.evaluate(() => { const c = getCoin("k3"); return c.valueFrom === "melt" && !c.value; }));

  // Options › Value sources: rename shows on every coin; a used source can't be removed.
  await p.evaluate(() => go("options")); await p.waitForTimeout(300);
  ok("Options has Value sources with Used by", /Value sources/.test(await p.textContent("body")) && /Used by 1 coin/.test(await p.textContent("body")));
  await p.fill(`[data-vsren="${id}"]`, "Blue Book 2027"); await p.press(`[data-vsren="${id}"]`, "Tab"); await p.waitForTimeout(250);
  ok("rename shows on the coin", await p.evaluate(() => valueFromText(getCoin("k1").compare[0].from) === "Blue Book 2027"));

  // Simple mode hides + Compare another value.
  await p.evaluate(() => { saveSettings({ level: "simple" }, true); openCoinForm("k2"); }); await p.waitForSelector("#coinForm");
  ok("Simple mode hides the compare link", (await p.locator("[data-act=cmpAdd]").count()) === 0);
  await p.click(".sheet-head [data-act=closeSheet]").catch(() => {}); await p.evaluate(() => saveSettings({ level: "everything" }, true));

  // CSV round trip.
  const row = await p.evaluate(() => coinToRow(getCoin("k1")));
  ok("CSV writes names: " + row.valueFrom + " / " + row.cmp1From, row.valueFrom === "My Book" && row.cmp1From === "Blue Book 2027" && row.cmp2From === "eBay sold" && String(row.cmp2Value) === "20");
  ok("CSV writes Melt (follows metal) for a Melt pick", (await p.evaluate(() => coinToRow(getCoin("k3")).valueFrom)) === "Melt (follows metal)");
  const back = await p.evaluate((r) => rowToCoin((k) => r[k] ?? null).coin || rowToCoin((k) => r[k] ?? null), row);
  ok("CSV read back keeps sources and compare", await p.evaluate((c) => valueFromText(c.valueFrom) === "My Book" && c.compare.length === 2 && valueFromText(c.compare[0].from) === "Blue Book 2027", back));
  const nw = await p.evaluate((r) => { const x = rowToCoin((k) => ({ ...r, valueFrom: "Grandpa's list" })[k] ?? null); return x.coin || x; }, row);
  ok("an unknown name waits as a new name (no source made in the preview)", nw.valueFrom === "n:Grandpa's list" && (await p.evaluate(() => !valueSources().some((s) => s.name === "Grandpa's list"))));

  // Backup and restore into a second copy: everything comes back, same totals.
  const t1 = await totals(p);
  const bk = await p.evaluate(async () => buildBackup());
  ok("backup carries list 2, sources and compare", bk.docs.some((d) => d.id === "pricebook2") && (bk.docs.find((d) => d.id === "settings").data.valueSources || []).length === 2 && bk.docs.find((d) => d.id === "c_k1").data.compare.length === 2);
  const f = "/tmp/cc-44b-backup.json"; fs.writeFileSync(f, JSON.stringify(bk));
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const q = await ctx2.newPage(); q.on("pageerror", (e) => errors.push(e.message));
  await q.goto(PAGE); await q.waitForTimeout(500);
  await q.evaluate(() => { saveSettings({ spot: { silver: 30, gold: 2000, platinum: null, copper: null }, valueSources: [{ id: "here1", name: "Phone only" }] }, true); });
  await q.evaluate(() => openBackupSheet()); await q.waitForTimeout(100);
  await q.setInputFiles("#restoreFile", f); await q.waitForTimeout(300);
  if (await q.isVisible("[data-act=confirmOk]")) { await q.click("[data-act=confirmOk]"); await q.waitForTimeout(1200); }
  ok("restore keeps both source lists (joined)", await q.evaluate(() => ["Phone only", "My Book", "Blue Book 2027"].every((n) => valueSources().some((s) => s.name === n))));
  ok("restored coin shows its source names", await q.evaluate(() => valueFromText(getCoin("k1").valueFrom) === "My Book" && getCoin("k3").valueFrom === "melt"));
  ok("restored list 2 is there", await q.evaluate(() => loadedBooks().length === 2));
  ok("totals match after restore", (await totals(q)) === t1);

  ok("no page errors", !errors.length); console.log("errors", errors);
  await b.close();
})();
