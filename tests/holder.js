// Step 2.1: holder, CAC sticker, COA + packaging, quick-add remembers holder and source, old coins still read right.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const add = async (type, year) => { await p.click("#fab"); await p.fill("#typeSearch", type); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill("[data-f=year]", year); };
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };

  // 1. Raw coin in a 2x2 from a coin show, with COA + packaging
  await add("morgan", "1921");
  await p.selectOption('[data-f="holder"]', "2x2"); await p.waitForTimeout(80);
  await p.selectOption('[data-f="_sourceKind"]', "Coin Show"); await p.waitForTimeout(80);
  ok("no packaging box before COA", !(await p.isVisible('[data-f="packaging"]')));
  await p.check('[data-fcheck="coa"]'); await p.waitForTimeout(80);
  await p.fill('[data-f="packaging"]', "blue box");
  ok("no CAC on a raw coin", !(await p.isVisible('[data-f="cac"]')));
  await save();
  let c = await p.evaluate(() => ownedCoins().find((x) => x.year === 1921));
  ok("saved holder/coa/packaging", c.holder === "2x2" && c.coa === true && c.packaging === "blue box" && !("_lastHolder" in c));
  ok("coin page shows holder + COA", /2x2/.test(await p.textContent("main")) && /Included/.test(await p.textContent("main")));

  // 2. Quick-add remembers holder and source
  await add("peace", "1922");
  ok("holder remembered", (await p.$eval('[data-f="holder"]', (e) => e.value)) === "2x2");
  ok("source remembered", (await p.$eval('[data-f="_sourceKind"]', (e) => e.value)) === "Coin Show");
  ok("COA not remembered", !(await p.isChecked('[data-fcheck="coa"]')));

  // 3. Certified -> Slab by itself, CAC gold badge
  await p.click('[data-act=gmode][data-v=cert]'); await p.waitForTimeout(80);
  ok("certified shows Slab", (await p.$eval('[data-f="holder"]', (e) => e.value)) === "Slab");
  await p.selectOption('[data-f="cac"]', "Gold");
  await save();
  c = await p.evaluate(() => ownedCoins().find((x) => x.year === 1922));
  ok("saved slab + gold CAC", c.holder === "Slab" && c.cac === "Gold");
  ok("CAC badge on coin page", await p.isVisible(".cac.gold"));
  ok("Slab not remembered as last holder", await p.evaluate(() => settings().lastHolder === "2x2"));

  // 4. Switching a coin to raw drops its CAC
  await p.click("[data-act=edit]"); await p.waitForTimeout(150);
  await p.click('[data-act=gmode][data-v=raw]'); await p.waitForTimeout(80);
  await save();
  c = await p.evaluate(() => ownedCoins().find((x) => x.year === 1922));
  ok("raw coin has no CAC or Slab", c.cac === "" && c.holder !== "Slab");

  // 5. Older coins (no holder field) read as Album / Slab / blank
  const old = await p.evaluate(() => [holderOf({ albumId: "x" }), holderOf({ gradeMode: "cert" }), holderOf({ gradeMode: "raw" }), cacOf({ gradeMode: "raw", cac: "Gold" })]);
  ok("old coins convert on read", old.join("|") === "Album|Slab||");

  // 6. CSV round trip keeps the new fields
  const csv = await p.evaluate(() => toCsv());
  ok("CSV has holder columns", /Holder,COA,Packaging/.test(csv) && /2x2,Yes,blue box/.test(csv));

  console.log("errors", errors);
  await b.close();
})();
