// Step 2.5: coins outside the catalog: kind, grams helper, "used before", melt.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveSettings({ spot: { ...settings().spot, silver: 30 } }));
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };
  const open = async () => { await p.click("#fab"); await p.click('[data-act=what][data-v=other]'); await p.waitForTimeout(80); };

  await open();
  ok("no 'used before' list when nothing saved", !(await p.isVisible('[data-act-change=useOther]')));
  await p.fill('[data-f=typeName]', "Casino token"); await p.fill('[data-f=denom]', "$1");
  await p.selectOption('[data-f=family]', "Token"); await p.waitForTimeout(80);
  await p.fill('[data-f=year]', "1999");
  await p.selectOption('[data-f=metal]', "Silver"); await p.waitForTimeout(80);
  await p.fill('[data-f=oz]', "0.7");
  await save();
  let c = await p.evaluate(() => ownedCoins().find((x) => x.typeName === "Casino token"));
  ok("saved as Token kind with metal and weight", c && c.family === "Token" && c.metal === "Silver" && c.oz === "0.7" && !("_grams" in c));
  ok("melt worked out (0.7 oz x $30 = 21)", await p.evaluate((id) => Math.abs(meltEach(getCoin(id)) - 21) < 0.001, c.id));

  // grams helper + commemorative kind
  await open();
  await p.fill('[data-f=typeName]', "1993 Madison medal"); await p.selectOption('[data-f=family]', "Commemorative"); await p.waitForTimeout(80);
  ok("grams box hidden until a melt metal is chosen", !(await p.isVisible('[data-f=_grams]')));
  await p.selectOption('[data-f=metal]', "Silver"); await p.waitForTimeout(80);
  await p.fill('[data-f=_grams]', "20"); await p.fill('[data-f=_purity]', "0.9");
  ok("grams + purity fill ounces (0.57871)", (await p.$eval('[data-f=oz]', (e) => e.value)) === "0.57871");
  await p.fill('[data-f=year]', "1993"); await save();
  c = await p.evaluate(() => ownedCoins().find((x) => x.typeName === "1993 Madison medal"));
  ok("commemorative saved with ounces", c && c.family === "Commemorative" && c.oz === "0.57871" && !("_purity" in c));

  // used before
  await open();
  ok("'used before' list shows", await p.isVisible('[data-act-change=useOther]'));
  const idx = await p.evaluate(() => savedOthers().findIndex((o) => o.name === "Casino token"));
  await p.selectOption('[data-act-change=useOther]', String(idx)); await p.waitForTimeout(100);
  ok("pick fills name, kind, metal, weight", (await p.$eval('[data-f=typeName]', (e) => e.value)) === "Casino token" && (await p.$eval('[data-f=metal]', (e) => e.value)) === "Silver" && (await p.$eval('[data-f=oz]', (e) => e.value)) === "0.7" && (await p.$eval('[data-f=family]', (e) => e.value)) === "Token");

  // old custom coin (no kind) still reads
  await p.evaluate(() => { const o = { ...blankCoin(), id: "old1", typeName: "Old medal", family: "Old medal", year: "1970" }; put("c_" + o.id, o); });
  ok("older custom coin keeps its group", await p.evaluate(() => familyOf(getCoin("old1")) === "Old medal"));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
