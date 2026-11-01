// Step 2.4: proof/mint sets (silver filled in), rolls (count, face, condition, bank wrap, value), several coins in one case.
const { chromium } = require("playwright");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveSettings({ spot: { ...settings().spot, silver: 30 } }));
  const openAll = () => p.evaluate(() => document.querySelectorAll("#coinForm details[data-sec]:not([open])").forEach((d) => { d.open = true; }));
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };
  const start = async (what) => { await p.click("#fab"); await p.click(`.what-btn[data-v=${what}]`); await p.waitForTimeout(80); await openAll(); };

  // 1. Silver proof set 2005: silver filled in, packaging, no grade or album
  await start("set");
  ok("set form has no grade, album or errors", !(await p.isVisible("legend:has-text('Grade')")) && !(await p.isVisible('[data-f="albumId"]')) && !(await p.isVisible("summary:has-text('Errors')")));
  await p.selectOption('[data-f="setKind"]', "silver-proof"); await p.waitForTimeout(80); await openAll();
  await p.fill('[data-f="year"]', "2005"); await p.waitForTimeout(80);
  ok("silver filled in", (await p.inputValue('[data-f="oz"]')) === "1.33823");
  await p.selectOption('[data-f="holder"]', "Hard plastic"); await p.waitForTimeout(80);
  await save();
  let c = await p.evaluate(() => ownedCoins().find((x) => x.item === "set"));
  ok("set saved", c && c.typeName === "Silver proof set" && c.metal === "Silver" && c.oz === "1.33823" && c.holder === "Hard plastic" && !c.albumId && !("_ozEdited" in c));
  ok("set label", c.label === "2005 Silver proof set");
  ok("set melt per set", Math.abs((await p.evaluate(() => meltEach(ownedCoins().find((x) => x.item === "set")))) - 1.33823 * 30) < 0.01);
  ok("set counted in value", Math.abs((await p.evaluate(() => bestEach(ownedCoins().find((x) => x.item === "set")))) - 1.33823 * 30) < 0.01);

  // 2. Wrong year for a set kind is refused; typed silver is kept
  await start("set");
  await p.selectOption('[data-f="setKind"]', "proof"); await p.waitForTimeout(80); await openAll();
  await p.fill('[data-f="year"]', "1966"); await p.waitForTimeout(80);
  ok("1966 proof set warned", /weren't made/.test(await p.textContent("#yearHint")));
  await save();
  ok("1966 proof set not saved", await p.evaluate(() => ownedCoins().filter((x) => x.item === "set").length === 1));
  await p.fill('[data-f="year"]', "1964"); await p.waitForTimeout(80);
  ok("1964 proof set 0.61487", (await p.inputValue('[data-f="oz"]')) === "0.61487");
  await p.fill('[data-f="oz"]', "0.6"); await p.fill('[data-f="year"]', "1963"); await p.waitForTimeout(80);
  ok("typed silver is kept", (await p.inputValue('[data-f="oz"]')) === "0.6");
  await save();

  // 3. Roll of 1964 Washington silver quarters: 40 coins, face $10, condition, bank wrap, melt = 40 coins
  await start("roll");
  await p.fill("#typeSearch", "washington quarter silver"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.waitForTimeout(80); await openAll();
  ok("roll form has no grade", !(await p.isVisible("legend:has-text('Grade')")));
  ok("roll count defaults to 40", (await p.inputValue('[data-f="rollCount"]')) === "40");
  ok("face value hint", /\$10\.00/.test(await p.textContent("#rollHint")));
  await p.fill('[data-f="year"]', "1964");
  await p.selectOption('[data-f="rollCond"]', "BU"); await p.check('[data-fcheck="bankWrap"]');
  await save();
  c = await p.evaluate(() => ownedCoins().find((x) => x.item === "roll" && x.typeId === "washington-silver"));
  ok("roll saved", c && c.rollCount === 40 && c.rollCond === "BU" && c.bankWrap === true && !c.albumId && c.grade === "");
  ok("roll label", c.label === "1964 Washington Quarter (silver) roll (40)");
  const melt = 40 * 0.18084 * 30;
  ok("roll melt counts all coins", Math.abs(await p.evaluate(() => meltEach(ownedCoins().find((x) => x.item === "roll" && x.typeId === "washington-silver"))) - melt) < 0.5);
  ok("silver roll valued at melt", Math.abs(await p.evaluate(() => bestEach(ownedCoins().find((x) => x.item === "roll" && x.typeId === "washington-silver"))) - melt) < 0.5);
  ok("roll page shows face and condition", /Face value/.test(await p.textContent("main")) && /BU/.test(await p.textContent("main")) && /Original bank wrap/.test(await p.textContent("main")));

  // 4. Clad dime roll: 50 coins, $5 face value counted; own value wins for a nicer roll
  await start("roll");
  await p.fill("#typeSearch", "roosevelt dime clad"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.waitForTimeout(80); await openAll();
  ok("dime roll defaults to 50", (await p.inputValue('[data-f="rollCount"]')) === "50");
  await save();
  c = await p.evaluate(() => ownedCoins().find((x) => x.item === "roll" && x.typeId === "roosevelt-clad"));
  ok("clad roll valued at face", c && (await p.evaluate((id) => bestEach(getCoin(id)), c.id)) === 5);
  await p.evaluate((id) => saveCoin({ ...getCoin(id), value: "12" }), c.id);
  ok("own value wins", (await p.evaluate((id) => bestEach(getCoin(id)), c.id)) === 12);

  // Single clad coin with no grade or value counts at face value
  await p.click("#fab"); await p.click(".what-btn[data-v=us]"); await p.fill("#typeSearch", "roosevelt dime clad"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill('[data-f="year"]', "1990"); await save();
  ok("ungraded clad coin counts at face", await p.evaluate(() => { const c = ownedCoins().find((x) => x.typeId === "roosevelt-clad" && x.item !== "roll"); return bestEach(c) === 0.1 && valueSource(c) === "face"; }));

  // 5. Three steel cents in one case
  for (const [y, m] of [["1943", ""], ["1943", "D"], ["1943", "S"]]) {
    await p.click("#fab"); await p.click(".what-btn[data-v=us]"); await p.fill("#typeSearch", "lincoln wheat"); await p.click("#typeList button[data-act=pickType] >> nth=0");
    await openAll(); await p.fill('[data-f="year"]', y); await p.selectOption('[data-f="mint"]', m);
    await p.selectOption('[data-f="holder"]', "Hard case"); await p.waitForTimeout(80);
    await p.fill('[data-f="caseName"]', "Steel cents");
    await save();
  }
  ok("each coin still counted", await p.evaluate(() => ownedCoins().filter((x) => x.caseName === "Steel cents").length === 3));
  const id3 = await p.evaluate(() => ownedCoins().find((x) => x.caseName === "Steel cents").id);
  await p.evaluate((id) => go("coin-" + id), id3); await p.waitForTimeout(150);
  ok("case card counts 3 coins", /3 coins/.test(await p.textContent("main")));
  await p.click("[data-act=addToCase]"); await p.waitForTimeout(150); await openAll();
  ok("add to case pre-fills", (await p.inputValue('[data-f="caseName"]')) === "Steel cents" && (await p.inputValue('[data-f="holder"]')) === "Hard case");
  await p.click("[data-act=closeSheet]");

  // 6. Old coins unchanged; CSV carries item, count, condition and wrap, and reads back
  ok("old coin reads as coin", await p.evaluate(() => itemOf({}) === "coin" && ozEach({ oz: "0.5" }) === 0.5 && meltEach({ metal: "Silver", oz: "0.5" }) === 15));
  const csv = await p.evaluate(() => toCsv());
  ok("CSV columns", /Item,Coins per roll,Roll condition,Original bank wrap/.test(csv));
  ok("CSV roll row", /,Roll,40,BU,Yes,/.test(csv) && /,Set,,,,/.test(csv));

  console.log("errors", errors);
  await b.close();
})();
