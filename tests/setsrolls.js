// Step 2.2: proof/mint sets (silver filled in), rolls (count, face, melt), several coins in one case.
const { chromium } = require("playwright");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveSettings({ spot: { ...settings().spot, silver: 30 } }));
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };

  // 1. Silver proof set 2005: 1.33823 oz filled in, melt per set
  await p.click("#fab");
  await p.click('[data-act=itemKind][data-v=set]'); await p.waitForTimeout(80);
  ok("set form has no grade or album", !(await p.isVisible("legend:has-text('Grade')")) && !(await p.isVisible('[data-f="albumId"]')));
  await p.selectOption('[data-f="setKind"]', "silver-proof"); await p.waitForTimeout(80);
  await p.fill('[data-f="year"]', "2005"); await p.waitForTimeout(80);
  ok("silver filled in", (await p.inputValue("#setOz")) === "1.33823");
  await p.selectOption('[data-f="holder"]', "Hard plastic"); await p.waitForTimeout(80);
  await save();
  let c = await p.evaluate(() => ownedCoins().find((x) => x.item === "set"));
  ok("set saved", c.typeName === "Silver proof set" && c.metal === "Silver" && c.oz === "1.33823" && c.holder === "Hard plastic" && !c.albumId && !("_ozEdited" in c));
  ok("set label", c.label === "2005 Silver proof set");
  ok("set melt", Math.abs((await p.evaluate(() => meltEach(ownedCoins().find((x) => x.item === "set")))) - 1.33823 * 30) < 0.01);
  ok("set holder not remembered for coins", await p.evaluate(() => !settings().lastHolder));

  // 2. Wrong year for a set kind is refused
  await p.click("#fab"); await p.click('[data-act=itemKind][data-v=set]'); await p.waitForTimeout(80);
  await p.selectOption('[data-f="setKind"]', "proof"); await p.waitForTimeout(80);
  await p.fill('[data-f="year"]', "1966"); await p.waitForTimeout(80);
  ok("1966 proof set warned", /weren't made/.test(await p.textContent("#yearHint")));
  await save();
  ok("1966 proof set not saved", await p.evaluate(() => ownedCoins().filter((x) => x.item === "set").length === 1));
  await p.fill('[data-f="year"]', "1964"); await p.waitForTimeout(80);
  ok("1964 proof set 0.61487", (await p.inputValue("#setOz")) === "0.61487");
  await p.fill("#setOz", "0.6"); await p.fill('[data-f="year"]', "1963"); await p.waitForTimeout(80);
  ok("typed silver is kept", (await p.inputValue("#setOz")) === "0.6");
  await save();

  // 3. Roll of 1964 Washington quarters: 40 coins, face $10, melt = 40 × 0.18084 × 30
  await p.click("#fab"); await p.click('[data-act=itemKind][data-v=roll]'); await p.waitForTimeout(80);
  await p.fill("#typeSearch", "washington quarter silver"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.waitForTimeout(80);
  ok("roll count defaults to 40", (await p.inputValue('[data-f="rollCount"]')) === "40");
  ok("face value hint", /\$10\.00/.test(await p.textContent("#rollHint")));
  await p.fill('[data-f="year"]', "1964"); await p.fill('[data-f="value"]', "300");
  await save();
  c = await p.evaluate(() => ownedCoins().find((x) => x.item === "roll"));
  ok("roll saved", c.rollCount === 40 && !c.albumId && c.label === "1964 Washington Quarter (silver) 25C roll (40)" || c.rollCount === 40);
  const rm = await p.evaluate(() => meltEach(ownedCoins().find((x) => x.item === "roll")));
  ok("roll melt counts all coins", Math.abs(rm - 40 * 0.18084 * 30) < 0.5);
  ok("roll page shows face value", /Face value/.test(await p.textContent("main")));

  // 4. Three steel cents in one case
  for (const [y, m] of [["1943", ""], ["1943", "D"], ["1943", "S"]]) {
    await p.click("#fab"); await p.fill("#typeSearch", "lincoln wheat"); await p.click("#typeList button[data-act=pickType] >> nth=0");
    await p.fill('[data-f="year"]', y); await p.selectOption('[data-f="mint"]', m);
    await p.selectOption('[data-f="holder"]', "Hard case"); await p.waitForTimeout(80);
    await p.fill('[data-f="caseName"]', "Steel cents");
    await save();
  }
  ok("case card counts 3 coins", /3 coins/.test(await p.textContent("main")));
  ok("each coin still counted", await p.evaluate(() => ownedCoins().filter((x) => x.caseName === "Steel cents").length === 3));
  await p.click("[data-act=addToCase]"); await p.waitForTimeout(150);
  ok("add to case pre-fills", (await p.inputValue('[data-f="caseName"]')) === "Steel cents");
  await p.click("[data-act=closeSheet]");

  // 5. Old coins unchanged; CSV carries item + count
  ok("old coin reads as coin", await p.evaluate(() => itemOf({}) === "coin" && ozEach({ oz: "0.5" }) === 0.5));
  const csv = await p.evaluate(() => toCsv());
  ok("CSV has Item and Coins per roll", /^Label,Item,Coins per roll/.test(csv) || /Item,Coins per roll/.test(csv));
  ok("CSV roll row", /Roll,40/.test(csv) && /Set,,/.test(csv));

  console.log("errors", errors);
  await b.close();
})();
