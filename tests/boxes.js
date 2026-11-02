// Step 2.8: wheat penny box organizer.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  // make a box through the page
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "Black box 1"); await p.fill("[name=rows]", "2"); await p.fill("[name=perRow]", "3");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const box = await p.evaluate(() => allBoxes()[0]);
  ok("box made", box && box.name === "Black box 1" && box.rows === 2 && box.perRow === 3);
  ok("box page shows 6 empty slots", (await p.$$(".slot")).length === 6);
  // add a coin into row 1 slot 2 from the box page
  await p.click('[data-act=boxAdd][data-row="1"][data-slot="2"]'); await p.waitForTimeout(150);
  ok("form opens in a 2x2 with the spot filled", await p.evaluate(() => draft.holder === "2x2 cardboard flip" && draft.boxRow === "1" && draft.boxSlot === "2"));
  await p.evaluate(() => { pickType("lincoln-wheat"); draft.year = "1909"; draft.mint = "S"; draft.grade = "G-4"; renderCoinForm(); });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const c = await p.evaluate(() => ownedCoins().find((x) => x.boxId));
  ok("coin saved with box, row, slot", c && c.boxRow === "1" && c.boxSlot === "2" && c.year === 1909);
  await p.evaluate((id) => go("box-" + id), box.id); await p.waitForTimeout(200);
  ok("slot shows the date", /1909-S/.test(await p.textContent(".slot.full")));
  // same spot refused
  const refused = await p.evaluate(() => { const x = { ...blankCoin(), holder: "2x2 cardboard flip", boxId: allBoxes()[0].id, boxRow: "1", boxSlot: "2" }; return boxCheck(x); });
  ok("taken spot is refused", /already holds/.test(refused));
  ok("outside the box is refused", /Pick a row/.test(await p.evaluate(() => boxCheck({ ...blankCoin(), holder: "2x2 cardboard flip", boxId: allBoxes()[0].id, boxRow: "3", boxSlot: "1" }))));
  ok("next free spot skips the full one", await p.evaluate(() => { const n = nextFreeSpot(allBoxes()[0]); return n.row === 1 && n.slot === 1; }));
  ok("non-2x2 coin loses box fields", await p.evaluate(() => { const x = { ...blankCoin(), holder: "Loose", boxId: "z", boxRow: "1", boxSlot: "1" }; boxCheck(x); return x.boxId === undefined; }));
  // search
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  await p.fill("#boxQ", "1909-S"); await p.click("#boxFind button"); await p.waitForTimeout(150);
  ok("search finds box, row and slot", /Black box 1 · Row 1 · Slot 2/.test(await p.textContent("main")));
  // missing dates
  const m = await p.evaluate(() => missingWheat());
  ok("missing wheat dates counted", m.total > 100 && m.missing.length === m.total - 1 && !m.missing.some((s) => s.y === 1909 && s.m === "S"));
  // the coin page shows where it is
  await p.evaluate((id) => go("coin-" + id), c.id); await p.waitForTimeout(150);
  ok("coin page shows its box", /Black box 1 · Row 1 · Slot 2/.test(await p.textContent("main")));
  // shrinking below a coin is refused; delete box keeps the coin and Undo restores
  await p.evaluate(() => go("box-" + allBoxes()[0].id)); await p.waitForTimeout(150);
  await p.click("[data-act=boxEdit]"); await p.fill("[name=perRow]", "1"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(150);
  ok("too-small box refused", await p.evaluate(() => allBoxes()[0].perRow === 3));
  await p.evaluate(() => closeSheet());
  await p.click("[data-act=boxDelete]"); await p.click("[data-act=confirmOk]"); await p.waitForTimeout(250);
  ok("box deleted, coin kept without a spot", await p.evaluate(() => allBoxes().length === 0 && ownedCoins().some((x) => x.year === 1909 && !x.boxId)));
  await p.click(".toast button, #toast button").catch(() => {}); await p.waitForTimeout(250);
  ok("undo brings back box and spot", await p.evaluate(() => allBoxes().length === 1 && ownedCoins().some((x) => x.boxId === allBoxes()[0].id && x.boxSlot === "2")));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
