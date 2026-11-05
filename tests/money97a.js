// Step 9.7a: refund keeps the record, price for the whole lot, suggested bulk price, Paid with, check number, + Add storage.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  // 1. Whole-lot price: 20 coins for $24.50 is saved as price each.
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1880"); await p.selectOption("[data-f=mint]", "O");
  ok("lot switch hidden for quantity 1", await p.evaluate(() => document.querySelector("#lotBox").hidden));
  await p.fill("[data-f=qty]", "20");
  ok("lot switch shows for quantity 20", await p.evaluate(() => !document.querySelector("#lotBox").hidden));
  await p.selectOption("[data-f=_payMode]", "total"); await p.fill("[data-f=paid]", "24.5");
  ok("live total line", (await p.textContent("#lotHint")).includes("$24.50 for 20"));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const id = await p.evaluate(() => ownedCoins()[0].id);
  const lot = await p.evaluate((i) => ({ paid: getCoin(i).paid, cost: costOf(getCoin(i)), mode: getCoin(i)._payMode }), id);
  ok("saved as price each, cost is the lot price", Math.abs(lot.cost - 24.5) < 0.005 && lot.mode === undefined);

  await p.evaluate((i) => { saveSettings({ sellerMode: true }, true); saveCoin({ ...getCoin(i), biz: true }); }, id);
  // 2. Sell 1 with a fee, paid by check; Refund keeps the sale on record.
  await p.click("[data-act=sell]"); await p.click("#sellForm summary"); await p.fill("#sellForm [name=n]", "1");
  await p.fill("#sellForm [name=amount]", "70"); await p.fill("#sellForm [name=fees]", "5"); await p.fill("#sellForm [name=shipping]", "3");
  await p.selectOption("#sellForm [name=payMethod]", "Check");
  ok("check number box shows for Check", await p.evaluate(() => !document.querySelector("#checkNoBox").hidden));
  await p.fill("#sellForm [name=checkNo]", "1234");
  await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(250);
  ok("check number saved", await p.evaluate(() => soldCoins()[0].sold.checkNo === "1234"));
  // Paid with starts blank on the next sale (no show)
  await p.evaluate(() => go("coin-" + ownedCoins()[0].id)); await p.waitForTimeout(150);
  await p.click("[data-act=sell]");
  ok("Paid with not carried over", await p.evaluate(() => document.querySelector("#sellForm [name=payMethod]").value === ""));
  await p.click("[data-act=closeSheet] >> nth=0"); await p.waitForTimeout(100);
  await p.evaluate(() => go("coin-" + soldCoins()[0].id)); await p.waitForTimeout(150);
  await p.click("[data-act=unsell][data-refund]"); await p.waitForTimeout(250);
  const rf = await p.evaluate(() => ({ sold: soldCoins().length, owned: ownedCoins().map((c) => [c.qty, (c.refunds || []).length]), r: allRefunds().map((r) => [r.amount, r.fees, refundCost(r)]) }));
  ok("no sale left, coin back in stock (rejoined)", rf.sold === 0 && rf.owned.length === 1 && rf.owned[0][0] == 20);
  ok("refund kept with its fee and shipping", rf.owned[0][1] === 1 && rf.r[0][0] === 70 && rf.r[0][2] === 8);
  ok("old coins read as no refunds", await p.evaluate(() => refundsOf({ status: "owned" }).length === 0 && refundsOf({ refunds: "x" }).length === 0));
  ok("refund card on coin page", (await p.textContent("body")).includes("Refunded sales"));
  // Undo puts the sale back
  await p.evaluate(() => document.querySelector(".toast button") && document.querySelector(".toast button").click()); await p.waitForTimeout(150);
  ok("Undo brings the sale back", await p.evaluate(() => soldCoins().length === 1 && allRefunds().length === 0));
  await p.evaluate(() => go("coin-" + soldCoins()[0].id)); await p.waitForTimeout(150);
  await p.click("[data-act=unsell][data-refund]"); await p.waitForTimeout(250);

  // Business report: the sale does not count, its fee and shipping do.
  const rep = await p.evaluate(() => {
    const d = repData({ kind: "year", y: new Date().getFullYear(), n: 1 });
    return { items: d.t.n, sales: d.t.sales, fees: d.t.fees, ship: d.t.shipPaid, refunds: d.t.refunds,};
  });
  ok("report: no sales, fee 5 and shipping 3 still count", rep.items === 0 && rep.sales === 0 && rep.fees === 5 && rep.ship === 3 && rep.refunds === 1);

  // 3. Suggested bulk price is never below cost + 10%.
  const ask = await p.evaluate(() => {
    const c = ownedCoins()[0]; const top = askPick(c, "top"), floor = r2(costOf(c) * 1.1);
    listState._shown = ownedCoins(); listState.sel = new Set([c.id]); actions.bizAskAll();
    return { top, floor, saved: num(getCoin(c.id).ask) };
  });
  ok("suggested price at or above cost + 10%", ask.top != null && ask.top >= ask.floor - 0.005);
  ok("Select → Set suggested asking price saves it", ask.saved === ask.top);

  // 4. + Add storage from Kept in: comes back with what you typed and the new box picked.
  await p.evaluate(() => go("coins")); await p.waitForTimeout(100);
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.fill("[data-f=paid]", "33");
  await p.selectOption("[data-kept]", "__newbox"); await p.waitForTimeout(150);
  ok("New box form opened", await p.evaluate(() => !!document.querySelector("#boxForm")));
  await p.fill("#boxForm [name=name]", "Test box"); await p.fill("#boxForm [name=rows]", "2"); await p.fill("#boxForm [name=perRow]", "5"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const back = await p.evaluate(() => ({ form: !!document.querySelector("#coinForm"), year: (document.querySelector("[data-f=year]") || {}).value, paid: (document.querySelector("[data-f=paid]") || {}).value, kept: (document.querySelector("[data-kept]") || {}).value, box: allBoxes().length }));
  ok("back on the coin form with typed values kept", back.form && back.year === "1881" && back.paid === "33");
  ok("new box picked", back.box === 1 && back.kept.startsWith("b:"));
  // Cancel also returns
  await p.selectOption("[data-kept]", "__newbox"); await p.waitForTimeout(100);
  await p.click("[data-act=boxCancel] >> nth=1"); await p.waitForTimeout(150);
  ok("Cancel goes back to the coin form", await p.evaluate(() => !!document.querySelector("#coinForm") && document.querySelector("[data-f=year]").value === "1881"));
  console.log("errors", errors); await b.close();
})();
