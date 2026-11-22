// Ideas 83 (Value from) + 84 (Favorites): a new saved field each. 4-box rule: old coins still load and show no
// field, counts and totals match before and after setting both fields, both survive backup -> restore, and an
// old backup without them still loads. Made-up fixture only.
const { chromium } = require("./_compat");
const path = require("path"), fs = require("fs");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
const FIXTURE = path.resolve(__dirname, "fixtures/backup-v058.json");
const PAGE = "file://" + path.resolve(__dirname, "../index.html");
const measure = (p) => p.evaluate(() => {
  const owned = countedCoins(), r4 = (x) => Math.round(x * 1e4) / 1e4;
  return JSON.stringify({ records: allCoins().length, count: sum(owned, qtyOf), total: r4(sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c))), cost: r4(sum(owned, (c) => costOf(c) || 0)) });
});
async function restore(p, file) {
  await p.evaluate(() => openBackupSheet()); await p.waitForTimeout(100);
  await p.setInputFiles("#restoreFile", file); await p.waitForTimeout(300);
  if (await p.isVisible("[data-act=confirmOk]")) { await p.click("[data-act=confirmOk]"); await p.waitForTimeout(1000); }
}
(async () => {
  const b = await chromium.launch(); const errors = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(400);
  await restore(p, FIXTURE);
  const before = await measure(p);
  ok("old backup restored (12 coins)", JSON.parse(before).records === 12);
  ok("old coins have no valueFrom and no fav", await p.evaluate(() => allCoins().every((c) => c.valueFrom === undefined && !c.fav)));
  await p.evaluate(() => go("coin-k2")); await p.waitForTimeout(300);
  ok("old coin page shows plain Value, no star lit", await p.evaluate(() => !/\(eBay sold\)/.test(document.body.innerText) && !!document.querySelector(".star") && document.querySelector(".star").getAttribute("aria-pressed") === "false"));

  // Value from through the real form: shows only with a Value, saves the key, clears when Value is cleared.
  await p.evaluate(() => openCoinForm("k2")); await p.waitForSelector("#coinForm");
  await p.evaluate(() => { const d = document.querySelector("#coinForm details[data-sec=more]"); if (d) d.open = true; });
  ok("Value from is offered while Value has a number", await p.isVisible("#vfRow"));
  await p.selectOption("[data-f=valueFrom]", "ebay");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("form saved key 'ebay'", await p.evaluate(() => getCoin("k2").valueFrom === "ebay"));
  await p.evaluate(() => go("coin-k2")); await p.waitForTimeout(300);
  ok("coin page reads Value (eBay sold)", await p.evaluate(() => /Value( each)? \(eBay sold\)/.test(document.body.innerText)));
  await p.evaluate(() => openCoinForm("k2")); await p.waitForSelector("#coinForm");
  await p.fill("[data-f=value]", ""); await p.dispatchEvent("[data-f=value]", "input");
  ok("Value from hides when Value is empty", !(await p.isVisible("#vfRow")));
  await p.click(".sheet-head [data-act=closeSheet]");
  ok("a typed Value is not touched by merely opening the form", await p.evaluate(() => getCoin("k2").value === "55" || num(getCoin("k2").value) === 55));

  // Favorites: row star toggles without opening the coin, Undo works.
  await p.evaluate(() => { listState.status = "owned"; go("coins"); }); await p.waitForTimeout(200);
  const url0 = await p.evaluate(() => location.hash);
  await p.click(".coin-row .row-star >> nth=0"); await p.waitForTimeout(200);
  ok("row star stars one coin", (await p.evaluate(() => allCoins().filter((c) => c.fav).length)) === 1);
  ok("tapping the star did not open the coin", (await p.evaluate(() => location.hash)) === url0);
  await p.click("#toast [data-act=toastAction]"); await p.waitForTimeout(150);
  ok("Undo takes the star off (field gone, not false)", await p.evaluate(() => allCoins().every((c) => !("fav" in c))));
  await p.evaluate(() => { put("c_k3", { ...getCoin("k3"), fav: true }); put("c_k9", { ...getCoin("k9"), fav: true, valueFrom: "dealer" }); });
  await p.evaluate(() => { listState.f = { fav: "1" }; go("coins"); }); await p.waitForTimeout(200);
  ok("Favorites only filter shows 2 coins", (await p.locator(".coin-row").count()) === 2);
  ok("filter chip says Favorites only", await p.evaluate(() => fltChips().some((x) => x[1] === "Favorites only")));
  await p.evaluate(() => { listState.f = {}; });

  // Counts and totals unchanged by the two fields.
  const after = await measure(p);
  ok("coin count, Value total and Paid total the same after setting both fields", after.replace(/"records":\d+,/, "") === before.replace(/"records":\d+,/, "") || after === before);

  // CSV out.
  const csv = await p.evaluate(() => toCsv(allCoins()));
  ok("CSV has Value from and Favorite columns", /Value from/.test(csv.split("\n")[0]) && /Favorite/.test(csv.split("\n")[0]));
  ok("CSV carries 'Dealer offer' and 'Yes'", /Dealer offer/.test(csv) && /Yes/.test(csv));
  // CSV in: names map back to the key.
  const back = await p.evaluate(() => { const h = ["Label", "Year", "Value", "Value from", "Favorite"], row = ["Test", "1964", "5", "NGC price guide", "Yes"]; const get = (k) => { const col = SHEET_COLS.find((c) => c.key === k); const i = h.findIndex((x) => col && col.names.includes(x.toLowerCase().replace(/[^a-z0-9]/g, ""))); return i < 0 ? "" : row[i]; }; const c = rowToCoin(get).coin; return [c.valueFrom, c.fav]; });
  ok("CSV in: 'NGC price guide' -> ngc, Favorite Yes -> true", back[0] === "ngc" && back[1] === true);

  // Backup -> restore into a second scratch copy keeps both fields and the totals.
  const bk = await p.evaluate(async () => buildBackup()); fs.writeFileSync("/tmp/cc-vf-backup.json", JSON.stringify(bk));
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); q.on("pageerror", (e) => errors.push(e.message));
  await q.goto(PAGE); await q.waitForTimeout(400); await restore(q, "/tmp/cc-vf-backup.json");
  ok("restore keeps valueFrom and fav", await q.evaluate(() => getCoin("k9").valueFrom === "dealer" && getCoin("k9").fav === true && getCoin("k3").fav === true));
  ok("second copy has the same count and totals", (await measure(q)) === after);
  ok("DATA_VERSION stays 1", await q.evaluate(() => DATA_VERSION === 1));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors.join("\n"));
  await b.close();
})();
