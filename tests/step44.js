// Step 4.4: arrange the Home shelf, hide values, collapsible sections, bar units, wooden box, roll colors.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", qty: 1, status: "owned", ...o });
    mk("set", { item: "set", year: "1964", typeName: "Proof set", value: "60" });
    mk("bar", { item: "bullion", bShape: "Bar", bWeight: "10", bPurity: "0.999", metal: "Silver", oz: "9.99", stack: "My Silver Stack" });
    mk("rq", { item: "roll", typeId: "washington-silver", metal: "Silver", value: "250" });
    put("a_al1", { kind: "album", id: "al1", name: "Franklin 1948–63", typeId: "franklin", start: 1948, end: 1963 });
    put("a_al2", { kind: "album", id: "al2", name: "Morgan set", typeId: "morgan", start: 1878, end: 1921 });
    put("b_bx1", { kind: "box", id: "bx1", name: "Black box 1", rows: 10, perRow: 10, createdAt: 1 });
    put("b_dx1", { kind: "box", id: "dx1", name: "Case", type: "display", look: "wood", spots: false, createdAt: 2 });
  });
  const labels = () => p.evaluate(() => [...document.querySelectorAll(".sh-lab")].map((e) => e.textContent).filter(Boolean));
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  ok("default order", JSON.stringify(await labels()) === JSON.stringify(["Top shelf · totals", "Albums", "Stacks and coins", "Storage boxes", "Display boxes", "Sets"]));
  ok("old settings without shelfLayout work", await p.evaluate(() => { saveSettings({ shelfLayout: undefined }); return shelfOrder().join() === "albums,stacks,storage,display,sets"; }));
  ok("wooden display box is a solid case", !!(await p.$(".sh-case.solid")));
  // reorder
  await p.evaluate(() => moveShelf("sets", -1)); await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  ok("moved Sets up one", (await labels()).join("|") === "Top shelf · totals|Albums|Stacks and coins|Storage boxes|Sets|Display boxes");
  // pin to top
  await p.evaluate(() => saveLayout({ pins: { stacks: "top" } })); await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  ok("pin to top puts it right under the totals", (await labels())[1] === "Stacks and coins");
  // lock in place: others move around it
  await p.evaluate(() => saveLayout({ pins: { storage: "lock" }, order: ["albums", "stacks", "storage", "display", "sets"] }));
  await p.evaluate(() => { moveShelf("sets", -1); moveShelf("sets", -1); });
  ok("locked shelf stays at its position", await p.evaluate(() => shelfLayout().order.indexOf("storage") === 2 && shelfLayout().order.join() === "albums,sets,storage,stacks,display" || shelfLayout().order.indexOf("storage") === 2));
  ok("locked shelf cannot be moved itself", await p.evaluate(() => { const before = shelfLayout().order.join(); moveShelf("storage", -1); return shelfLayout().order.join() === before; }));
  // hide a shelf and a single album; totals unchanged
  const total0 = await p.evaluate(() => sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)));
  await p.evaluate(() => saveLayout({ pins: {}, hidden: { sets: true }, hiddenItems: { al1: true } })); await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  ok("hidden shelf not drawn", !(await labels()).includes("Sets"));
  ok("hidden album not drawn, other still is", (await p.$$(".sh-spine")).length === 1);
  ok("hidden things still count in totals", await p.evaluate((t) => sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)) === t, total0));
  // Options UI + album page switch
  await p.evaluate(() => go("options")); await p.waitForTimeout(100);
  ok("Options lists 5 shelves and a hidden note", (await p.$$(".shelf-opt")).length === 5 && /1 album or box hidden/.test(await p.textContent("main")));
  await p.click("[data-act=shelfShowAll]"); await p.waitForTimeout(100);
  ok("Show all clears hidden items", await p.evaluate(() => hiddenItemCount() === 0));
  await p.evaluate(() => go("album-al1")); await p.waitForTimeout(100);
  await p.click("[data-act=shelfItem]"); await p.waitForTimeout(100);
  ok("album page switch hides it", await p.evaluate(() => !itemShown("al1")));
  await p.evaluate(() => go("box-bx1")); await p.waitForTimeout(100);
  ok("box page has the switch", !!(await p.$("[data-act=shelfItem]")));
  // hide values
  await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  ok("values visible by default", /\$/.test(await p.textContent(".sh-plaques")));
  await p.click("[data-act=hideValues]"); await p.waitForTimeout(100);
  ok("hide values hides dollar amounts on Home", !/\$\d/.test(await p.textContent(".sh-plaques")));
  await p.evaluate(() => { saveSettings({ spot: { ...settings().spot, silver: 32.1 } }); go("home"); }); await p.waitForTimeout(100);
  ok("but metal prices stay visible", /\$32\.10/.test(await p.textContent(".sh-spot")));
  await p.evaluate(() => go("coin-rq")); await p.waitForTimeout(100);
  ok("and on a coin page", !/\$\d/.test(await p.textContent("main")));
  await p.evaluate(() => go("home")); await p.click("[data-act=hideValues]"); await p.waitForTimeout(100);
  ok("tap again shows them", /\$\d/.test(await p.textContent(".sh-plaques")));
  // collapsible sections
  await p.click("[data-act=homeSec][data-v=added]"); await p.waitForTimeout(100);
  ok("section folds shut and is remembered", await p.evaluate(() => settings().homeClosed.added === true) && !(await p.$("main .list")));
  await p.click("[data-act=homeSec][data-v=added]"); await p.waitForTimeout(100);
  ok("section opens again", !!(await p.$("main .list")));
  // bar units
  ok("bar units convert and store ounces", await p.evaluate(() => {
    const c = { bWeight: "32.1507", bUnit: "kg" };
    return barAmount(c) === 1 && barWeightText(c) === "1 kg" && barAmount({ bWeight: "10" }) === 10 && roundTo(20 / unitFactor("g"), 6) === 0.643014;
  }));
  // roll colors
  ok("quarter roll is orange, halves sand, Morgan beige", await p.evaluate(() => rollColor({ typeId: "washington-silver" }) === "orange" && rollColor({ typeId: "kennedy-90" }) === "sand" && rollColor({ typeId: "morgan-dollar" }) === "beige" && rollColor({ typeId: "sacagawea-dollar" }) === "gray"));
  await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  ok("roll drawn with wrapper color", !!(await p.$(".sh-roll.rc-orange")));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
