// Step 29: container looks, Lockable, boxes inside boxes, move everything, delete moves up, loose coins in a spot box, stack AND box, year set holder.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  // an old box with no new fields reads as before
  await p.evaluate(() => put("b_old", { kind: "box", id: "old", name: "Old box", rows: 2, perRow: 2, look: "plastic", color: "red" }));
  ok("old box unchanged", await p.evaluate(() => { const x = getBox("old"); return x.type === "storage" && x.look === "plastic" && x.color === "red" && !x.locked && boxLookText(x) === "Plastic · red"; }));
  // red metal lockable box through the form
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "Red box");
  await p.selectOption("#boxLook", "metal"); await p.selectOption("[name=color]", "red");
  await p.uncheck("#boxSpots"); await p.check("[name=locked]");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const red = await p.evaluate(() => allBoxes().find((x) => x.name === "Red box"));
  ok("metal red lockable box saved", red && red.look === "metal" && red.color === "red" && red.locked === true && red.spots === false);
  ok("lock shows on the box page", /\u{1F512}/u.test(await p.textContent("h1")) && /Metal · red · Lockable/.test(await p.textContent("main")));
  // a bag inside it via + Container inside
  await p.click("[data-act=boxNewInside]"); await p.fill("[name=name]", "Big ziplock"); await p.selectOption("#boxLook", "bag");
  ok("container inside presets Kept in", await p.evaluate((id) => document.querySelector("#sheet [name=keptBox]").value === id, red.id));
  ok("bag starts without numbered spots", !(await p.isChecked("#boxSpots")));
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const bag = await p.evaluate(() => allBoxes().find((x) => x.name === "Big ziplock"));
  ok("bag kept in the red box", bag && bag.look === "bag" && bag.keptBox === red.id);
  // other container with a typed name
  await p.evaluate(() => go("boxes")); await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "Kohl's box"); await p.selectOption("#boxLook", "other");
  ok("name box shows for Other", await p.isVisible("[name=lookName]"));
  await p.fill("[name=lookName]", "Jewelry box"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  ok("other look keeps its name", await p.evaluate(() => { const x = allBoxes().find((y) => y.name === "Kohl's box"); return x.look === "other" && boxLookText(x) === "Jewelry box"; }));
  // junk silver coin: in the bag AND its stack
  const cid = await p.evaluate((bagId) => { openCoinForm(null); pickType("roosevelt-silver"); draft.year = "1950"; draft.grade = "Junk"; draft.metal = "Silver"; draft.stack = "Junk silver stack"; applyKept(draft, "b:" + bagId); return draft.stack; }, bag.id);
  ok("picking a box keeps the stack", cid === "Junk silver stack");
  ok("Also in a stack shows", await p.evaluate(() => { renderCoinForm(); return !!document.querySelector("[data-alsostack]") || !isJunk(draft); }));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const coin = await p.evaluate(() => ownedCoins().find((x) => x.year === 1950));
  ok("coin saved in box and stack", coin && coin.boxId === bag.id && String(coin.stack || "").length > 0);
  // path and deep count
  await p.evaluate((id) => go("coin-" + id), coin.id); await p.waitForTimeout(150);
  ok("coin page shows the path", /Big ziplock › Red box/.test(await p.textContent("main")));
  ok("deep count on the red box", await p.evaluate((id) => deepNote(getBox(id)) === "1 coins inside (all levels)", red.id));
  // move everything from the red box into the old spot box
  await p.evaluate((id) => go("box-" + id), bag.id); await p.waitForTimeout(150);
  const totBefore = await p.evaluate(() => JSON.stringify([ownedCoins().length, sum(ownedCoins(), qtyOf)]));
  await p.click("[data-act=boxMoveAll]"); await p.selectOption("#mvAllTo", "old"); await p.click("[data-act=boxMoveAllGo]"); await p.waitForTimeout(250);
  ok("move everything fills the first spot", await p.evaluate((id) => { const c = ownedCoins().find((x) => x.id === id); return c.boxId === "old" && c.boxRow === "1" && c.boxSlot === "1" && String(c.stack || "").length > 0; }, coin.id));
  ok("coin count and totals match after the move", totBefore === await p.evaluate(() => JSON.stringify([ownedCoins().length, sum(ownedCoins(), qtyOf)])));
  await p.click(".toast button, #toast button").catch(() => {}); await p.waitForTimeout(250);
  ok("undo puts it back in the bag", await p.evaluate((a) => ownedCoins().find((x) => x.id === a.c).boxId === a.b, { c: coin.id, b: bag.id }));
  ok("a box can't move into its own inner box", await p.evaluate((a) => !moveTargets(getBox(a.r)).some((x) => x.id === a.b), { r: red.id, b: bag.id }));
  // delete the bag: coin moves up into the red box
  await p.evaluate((id) => go("box-" + id), bag.id); await p.waitForTimeout(150);
  await p.click("[data-act=boxDelete]"); await p.click("[data-act=confirmOk]"); await p.waitForTimeout(250);
  ok("delete moves the coin up one level", await p.evaluate((a) => !getBox(a.b) && ownedCoins().find((x) => x.id === a.c).boxId === a.r, { c: coin.id, b: bag.id, r: red.id }));
  // loose coin in a numbered-spot box
  const loose = await p.evaluate(() => { const c = { ...blankCoin(), holder: "2x2 cardboard flip", boxId: "old", _spotAsk: "loose" }; return [boxCheck(c), c.boxId, c.boxRow]; });
  ok("loose coin allowed in a spot box", loose[0] === "" && loose[1] === "old" && !loose[2]);
  ok("no spot and no loose still asks", /Pick a row/.test(await p.evaluate(() => boxCheck({ ...blankCoin(), holder: "2x2 cardboard flip", boxId: "old" }))));
  // year set holder
  await p.evaluate(() => go("boxes")); await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "1925 set");
  await p.selectOption("[name=type]", "yearset"); await p.fill("[name=setYear]", "1925");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const ys = await p.evaluate(() => allBoxes().find((x) => x.type === "yearset"));
  ok("year set saved with 5 spots", ys && ys.setYear === 1925 && ys.rows === 1 && ys.perRow === 5);
  ok("spots are named", /Half/.test(await p.textContent("main")) && /Cent/.test(await p.textContent("main")));
  await p.click('[data-act=boxAdd][data-slot="2"]'); await p.waitForTimeout(150);
  const add = await p.$("#sheet [data-act=boxAddNew]"); if (add) { await add.click(); await p.waitForTimeout(150); }
  ok("quarter spot fills year and type", await p.evaluate(() => draft.year === "1925" && draft.typeId === "standing-liberty-quarter"));
  ok("1964 half in the 1925 set is allowed", await p.evaluate((id) => { const c = { ...blankCoin(), typeId: "kennedy-90", year: 1964, boxId: id, boxRow: "1", boxSlot: "1" }; return boxCheck(c) === "" && boxText(c) === "1925 set · Half"; }, ys.id));
  ok("1916 dime type left blank (two types)", await p.evaluate(() => ysTypeFor(1916, 3) === ""));
  // backup and restore keep the new box fields and the coin's box + stack
  ok("backup and restore keep them", await p.evaluate(async (a) => {
    const bk = await buildBackup(); [...store.docs.keys()].filter((k) => k.startsWith("b_")).forEach((k) => remove(k));
    restorePending = JSON.parse(JSON.stringify(bk)); await doRestore(); await new Promise((r) => setTimeout(r, 300));
    const r = getBox(a.r), y = allBoxes().find((x) => x.type === "yearset"), c = ownedCoins().find((x) => x.id === a.c);
    return r && r.locked && r.look === "metal" && r.color === "red" && y && y.setYear === 1925 && c.boxId === a.r && String(c.stack || "").length > 0;
  }, { r: red.id, c: coin.id }));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
