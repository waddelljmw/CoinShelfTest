// R4-37: the Filter panel can filter coins by Where from (e.g. Inherited); it joins the other filters and shows as a chip.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const mk = (id, source, year) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan", typeName: "Morgan dollar", year, metal: "Silver", value: "50", qty: 1, status: "owned", source });
    mk("a", "Inherited", "1921"); mk("b", "Coin Show", "1881"); mk("c", "Coin Show", "1882"); mk("d", "", "1883");
  });
  await p.evaluate(() => go("coins")); await p.waitForTimeout(200);
  await p.evaluate(() => openFilterPanel && openFilterPanel()).catch(() => {});
  await p.waitForTimeout(150);
  let sheetHas = await p.evaluate(() => !!document.querySelector('select[data-flt="src"]'));
  if (!sheetHas) { const btn = await p.$("[data-act=fltOpen], [data-act=filterOpen], [data-act=openFilters]"); if (btn) { await btn.click(); await p.waitForTimeout(150); } sheetHas = await p.evaluate(() => !!document.querySelector('select[data-flt="src"]')); }
  ok("panel has a Where from choice", sheetHas);
  ok("it lists Inherited and Coin Show once each", await p.evaluate(() => { const o = [...document.querySelector('select[data-flt="src"]').options].map((x) => x.value); return o.includes("Inherited") && o.filter((x) => x === "Coin Show").length === 1; }));
  await p.evaluate(() => { listState.f = { src: "Inherited" }; });
  ok("filter keeps only Inherited coins", await p.evaluate(() => allCoins().filter(extraFilter).length === 1 && allCoins().filter(extraFilter)[0].id === "a"));
  await p.evaluate(() => { listState.f = { src: "coin show" }; });
  ok("matches Coin Show ignoring capitals", await p.evaluate(() => allCoins().filter(extraFilter).length === 2));
  await p.evaluate(() => { listState.f = { src: "Coin Show", yFrom: "1882" }; });
  ok("combines with year", await p.evaluate(() => allCoins().filter(extraFilter).length === 1));
  await p.evaluate(() => { listState.f = { src: "Inherited" }; render(); }); await p.waitForTimeout(200);
  ok("chip says Where from: Inherited", /Where from: Inherited/.test(await p.textContent("main")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
