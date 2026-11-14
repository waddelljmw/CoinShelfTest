// 4-box rule, boxes 2 and 4: saved data carries a version number, and an old backup gives the same coin count and totals
// before and after (re-saving every coin, reopening the app, and a backup-then-restore into a second scratch copy).
// Uses the made-up tests/fixtures/backup-v058.json, so no real coins and no Red Book prices are needed.
const { chromium } = require("./_compat");
const path = require("path"), fs = require("fs");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
const FIXTURE = path.resolve(__dirname, "fixtures/backup-v058.json");
const PAGE = "file://" + path.resolve(__dirname, "../index.html");

const measure = (p) => p.evaluate(() => {
  const owned = countedCoins(), r4 = (x) => Math.round(x * 1e4) / 1e4;
  return JSON.stringify({
    records: allCoins().filter((c) => c.status !== "deleted").length,
    count: sum(owned, qtyOf),
    total: r4(sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c))),
    melt: r4(sum(owned, (c) => (meltEach(c) || 0) * qtyOf(c))),
    cost: r4(sum(owned, (c) => costOf(c) || 0)),
    years: allCoins().map((c) => c.id + ":" + c.year).sort().join(","),
  });
});
async function restore(p, file) {
  await p.evaluate(() => openBackupSheet()); await p.waitForTimeout(100);
  await p.setInputFiles("#restoreFile", file); await p.waitForTimeout(300);
  if (await p.isVisible("[data-act=confirmOk]")) { await p.click("[data-act=confirmOk]"); await p.waitForTimeout(1000); }
}

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const ctx1 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx1.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(400);
  ok("scratch copy starts empty", (await p.evaluate(() => allCoins().length)) === 0);
  ok("settings record is stamped dataVersion 1", await p.evaluate(() => (store.docs.get("settings") || {}).dataVersion === 1 && DATA_VERSION === 1));

  await restore(p, FIXTURE);
  const before = await measure(p);
  ok("fixture restored (12 coins)", JSON.parse(before).records === 12);

  // Re-save every coin through the real edit form, changing nothing (the no-year coin k5 must still save).
  const ids = await p.evaluate(() => allCoins().map((c) => c.id));
  let saved = 0;
  for (const id of ids) {
    await p.evaluate((i) => openCoinForm(i), id); await p.waitForSelector("#coinForm");
    await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
    const said = await p.evaluate(() => [...document.querySelectorAll(".toast")].map((t) => t.textContent).join(" "));
    if (!(await p.isVisible("#coinForm")) || /Saved\./.test(said)) saved++;
    if (await p.isVisible("#coinForm")) await p.click(".sheet-head [data-act=closeSheet]");
  }
  ok("every coin re-saves without being stopped", saved === ids.length);
  ok("count and totals match after re-saving every coin", (await measure(p)) === before);

  await p.reload(); await p.waitForTimeout(600);
  ok("count and totals match after reopening the app", (await measure(p)) === before);
  ok("settings still dataVersion 1 after restoring an old backup", await p.evaluate(() => (store.docs.get("settings") || {}).dataVersion === 1));

  const bk = await p.evaluate(async () => buildBackup());
  ok("backup carries dataVersion 1", bk.dataVersion === 1);
  ok("backup's settings record carries dataVersion 1", (bk.docs.find((d) => d.id === "settings") || {}).data.dataVersion === 1);
  fs.writeFileSync("/tmp/cc-dv-backup.json", JSON.stringify(bk));

  // Second scratch copy: restore that backup, same numbers.
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const q = await ctx2.newPage(); q.on("pageerror", (e) => errors.push(e.message));
  await q.goto(PAGE); await q.waitForTimeout(400);
  await restore(q, "/tmp/cc-dv-backup.json");
  ok("count and totals match in a second scratch copy after backup and restore", (await measure(q)) === before);

  // A backup from a newer data version is refused, nothing added.
  fs.writeFileSync("/tmp/cc-dv-future.json", JSON.stringify({ ...bk, dataVersion: 99, docs: [{ id: "c_zz", data: { kind: "coin", id: "zz", status: "owned" } }] }));
  await restore(q, "/tmp/cc-dv-future.json");
  ok("newer-data-version backup is refused", /newer version/.test(await q.innerText("#restoreMsg")) && !(await q.evaluate(() => store.docs.has("c_zz"))));

  // N2 review fixes: the "No date" spreadsheet column round trip, and a group of mixed years isn't stopped.
  const csv = await q.evaluate(() => {
    const c = { ...blankCoin(), id: "w1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", year: "", noDate: "worn" };
    const row = coinToRow(c), back = rowToCoin((k) => row[k]).coin;
    const dated = rowToCoin((k) => ({ ...row, year: "1881" })[k]).coin;
    return [row.noDate, back.noDate, dated.noDate || ""].join("|");
  });
  ok("No date column: export 'Too worn', import back as worn, a year wins", csv === "Too worn|worn|");
  const n0 = await q.evaluate(() => allCoins().length);
  await q.evaluate(() => go("home")); await q.waitForTimeout(200);
  await q.click("#fab"); await q.fill("#typeSearch", "wheat"); await q.click("#typeList button[data-act=pickType] >> nth=0");
  await q.fill("[data-f=_many]", "3"); await q.press("[data-f=_many]", "Tab"); await q.waitForTimeout(300);
  await q.click("#coinForm button[type=submit]"); await q.waitForTimeout(500);
  ok("group of 3 with mixed years (no year) still saves", (await q.evaluate(() => allCoins().length)) === n0 + 3);

  ok("no page errors", errors.length === 0);
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
