const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "7178", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a);
    saveCoin({ ...blankCoin(), id: "own1", typeId: "peace-dollar", typeName: "Peace Dollar", family: "Peace dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1922, mint: "", grade: "AU-50", albumId: "alb1" });
    go("album-alb1");
  });
  await p.waitForTimeout(250);
  // open slot 1922-S
  await p.click(".slot:has-text('1922-S')");
  console.log("open slot sheet:", (await p.textContent(".sheet")).replace(/\s+/g, " ").trim().slice(0, 170));
  await p.screenshot({ path: "/tmp/slot-menu.png" });
  await p.click("[data-act=slotWant]"); await p.waitForTimeout(150); await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(200);
  console.log("want saved:", JSON.stringify(await p.evaluate(() => { const w = findWant("peace-dollar", 1922, "S"); return w && { y: w.year, m: w.mint, album: w.albumId }; })));
  console.log("card shows:", (await p.textContent(".slot:has-text('1922-S')")).trim());
  await p.click(".slot:has-text('1922-S')");
  console.log("again:", (await p.textContent(".sheet .card")).trim());
  await p.click("[data-act=closeSheet] >> nth=0");
  // owned slot 1922 → upgrade option + View coin
  await p.click(".slot.have");
  console.log("owned sheet:", (await p.textContent(".sheet")).replace(/\s+/g, " ").trim().slice(0, 140));
  await p.click("[data-act=slotWant]"); await p.waitForTimeout(150); await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(150);
  console.log("upgrade want:", !!(await p.evaluate(() => findWant("peace-dollar", 1922, ""))));
  await p.click(".slot.have"); await p.click(".sheet [data-go^=coin-]"); await p.waitForTimeout(250);
  console.log("view coin →", await p.evaluate(() => location.hash));
  // I have it on an open slot that's wanted → form prefilled with album, saving clears want
  await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(200);
  await p.click(".slot:has-text('1922-S')"); await p.click("[data-act=closeSheet] >> nth=0");
  await p.click(".slot:has-text('1923-D')"); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  console.log("have prefill:", JSON.stringify(await p.evaluate(() => ({ t: draft.typeId, y: draft.year, m: draft.mint, album: draft.albumId }))));
  await p.selectOption("[data-f=grade]", "XF-40"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(200);
  console.log("owned now:", (await p.textContent(".stat:has-text('Owned') .v")).trim());
  console.log("errors", errors); await b.close();
})();
