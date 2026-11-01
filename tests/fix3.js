// Fix 3 + 8a: safe import undo, delete-forever confirm
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  const csv = "Year,Coin type,Grade,Notes\n1921,Morgan Dollar,VF-20,a\n1922,Peace Dollar,VF-20,b\n1923,Peace Dollar,VF-20,c\n1955,Franklin Half Dollar,AU-50,d\n1964,Kennedy Half Dollar,AU-50,e\n";
  await p.evaluate((t) => { openImport(); loadImportText(t, "x.csv"); }, csv);
  await p.click("[data-act=doImport]"); await p.waitForTimeout(500);
  ok("5 imported", (await p.evaluate(() => ownedCoins().length)) === 5);
  // edit one imported coin through the form
  const id = await p.evaluate(() => ownedCoins().find((c) => c.notes === "a").id);
  await p.evaluate((i) => go("coin-" + i), id); await p.waitForTimeout(150);
  await p.click("[data-act=edit]"); await p.selectOption("[data-f=grade]", "XF-40"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("edited coin left the batch", (await p.evaluate((i) => !getCoin(i).importBatch, id)));
  // Options → Remove them asks first
  await p.click("#menuBtn"); await p.click("#menu [data-go=options]");
  await p.click("main [data-act=undoImport]"); await p.waitForTimeout(100);
  const msg = await p.textContent(".sheet");
  ok("confirmation shown", /Remove last import\?/.test(msg) && /4 imported rows/.test(msg) && /1 you've changed/.test(msg));
  await p.click("[data-act=closeSheet] >> nth=1"); await p.waitForTimeout(100);
  ok("cancel removes nothing", (await p.evaluate(() => ownedCoins().length)) === 5);
  await p.click("main [data-act=undoImport]"); await p.click("[data-act=confirmOk]"); await p.waitForTimeout(300);
  ok("edited coin kept", (await p.evaluate((i) => getCoin(i).status, id)) === "owned");
  ok("4 others in Recently deleted, not erased", (await p.evaluate(() => deletedCoins().length)) === 4);
  // restore one from Recently deleted
  await p.click("[data-act=restore] >> nth=0"); await p.waitForTimeout(150);
  ok("restore works", (await p.evaluate(() => ownedCoins().length)) === 2);
  // delete forever asks first
  await p.click("[data-act=purge] >> nth=0"); await p.waitForTimeout(100);
  ok("purge asks", await p.isVisible("text=Delete forever?"));
  await p.click("[data-act=closeSheet] >> nth=1"); await p.waitForTimeout(100);
  ok("cancel keeps it", (await p.evaluate(() => deletedCoins().length)) === 3);
  await p.click("[data-act=purge] >> nth=0"); await p.click("[data-act=confirmOk]"); await p.waitForTimeout(150);
  ok("confirm deletes", (await p.evaluate(() => deletedCoins().length)) === 2);
  // toast Undo right after import still works in one tap
  await p.evaluate((t) => { openImport(); loadImportText(t, "y.csv"); }, "Year,Coin type\n1899,Morgan Dollar\n");
  await p.click("[data-act=doImport]"); await p.waitForTimeout(300);
  await p.click("#toast button"); await p.waitForTimeout(300);
  ok("toast Undo removes the fresh import", (await p.evaluate(() => ownedCoins().some((c) => c.year === 1899))) === false);
  console.log("errors", errors); await b.close();
})();
