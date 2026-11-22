// Step 9.7a: refund keeps the record, whole-lot price, bulk price floor, Paid with, check #, Add storage, Tick all, black.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  // --- Refund / cancel keeps the sale on record and its costs ---
  await ev(() => {
    saveSeller({ on: true }, true);
    const d = new Date().toISOString().slice(0, 10);
    put("c_r1", { ...blankCoin(), id: "r1", typeName: "Test", year: "1990", paid: "10", qty: 1, biz: true, status: "sold",
      sold: { at: 1, date: d, amount: 50, fees: 4, shipping: 5, insurance: 1, shipCharged: 3, whereType: "eBay" } }, true);
  });
  const before = await ev(() => repData({ kind: "year", y: +today().slice(0, 4) }).t);
  await ev(() => actions.refund({ dataset: { id: "r1" } }));
  const c = await ev(() => getCoin("r1"));
  ok("refund puts the coin back in stock", c.status === "owned" && !c.sold);
  ok("refund keeps the sale as a Refunded record", Array.isArray(c.refunds) && c.refunds.length === 1 && c.refunds[0].amount === 50 && c.refunds[0].refundedAt > 0);
  const after = await ev(() => repData({ kind: "year", y: +today().slice(0, 4) }));
  ok("no longer counted as a sale", after.t.sales === 0 && after.t.n === 0 && before.sales === 50);
  ok("fee and shipping still count as costs", after.t.fees === 4 && after.t.shipPaid === 6);
  ok("report profit is negative by those costs", after.profit === -10);
  // refund then sell again: the refund stays with the stock, the new sale counts alone
  await ev(() => { const x = getCoin("r1"); put("c_r1", { ...x, status: "sold", sold: { at: 2, date: today(), amount: 70, fees: 2, whereType: "eBay" } }, true); });
  const again = await ev(() => repData({ kind: "year", y: +today().slice(0, 4) }));
  ok("sell again: new sale counted, old refund's costs kept", again.t.sales === 70 && again.t.fees === 6 && again.t.shipPaid === 6);
  // plain "Move back to collection" still removes the record
  await ev(() => actions.unsell({ dataset: { id: "r1" } }));
  ok("Move back to collection keeps the old refund but adds none", (await ev(() => getCoin("r1"))).refunds.length === 1);

  // --- Whole-lot price: saved as price each ---
  await p.evaluate(() => { go("coins"); });
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1921"); await p.selectOption("[data-f=grade]", "MS-63"); await p.fill("[data-f=qty]", "20");
  ok("lot switch shows when Quantity is above 1", await p.isVisible("#lotRow"));
  await p.selectOption("[data-f=_lotMode]", "lot"); await p.fill("[data-f=paid]", "24.5");
  ok("live total line", (await p.textContent("#costHint")).includes("Total: $24.50 for 20"));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const lot = await ev(() => allCoins().find((x) => x.year == 1921 && x.qty == 20));
  ok("lot price saved as price each", !!lot && Math.abs(+lot.paid * 20 - 24.5) < 1e-6 && Math.abs(await ev(() => costOf(allCoins().find((x) => x.year == 1921 && x.qty == 20))) - 24.5) < 1e-6);

  // --- Bulk asking price: Suggested never below cost + 10% ---
  await ev(() => {
    put("c_b1", { ...blankCoin(), id: "b1", typeName: "Test", year: "1990", paid: "100", value: "", qty: 1, biz: true, status: "owned", stage: "forsale" }, true);
  });
  ok("askPick top is at least cost + 10%", await ev(() => askPick(getCoin("b1"), "top") >= 110));
  await ev(() => { listState._shown = [getCoin("b1")]; listState.sel = new Set(["b1"]); actions.selAsk(); });
  ok("Select → Suggested asking price sets it", +(await ev(() => getCoin("b1").ask)) >= 110);

  // --- Paid with: not carried over between sales ---
  await ev(() => saveSettings({ lastPay: "Cash", lastPayShow: "" }, true));
  await ev(() => put("c_p1", { ...blankCoin(), id: "p1", typeName: "Test", year: "1991", paid: "5", qty: 1, status: "owned" }, true));
  await ev(() => openSell("p1"));
  ok("Paid with starts blank", (await p.inputValue("#sellForm [name=payMethod]")) === "");
  await p.selectOption("#sellForm [name=payMethod]", "Check");
  ok("Check # box appears for Check", await p.isVisible("#sellForm [name=checkNo]"));
  await p.fill("#sellForm [name=checkNo]", "1042"); await p.fill("#sellForm [name=amount]", "20");
  await p.click("#sellForm button[type=submit]"); await p.waitForTimeout(200);
  ok("check number saved", (await ev(() => getCoin("p1").sold.checkNo)) === "1042");

  // --- Black color, Tick all ---
  ok("Black is a box and spine color", await ev(() => BOX_COLORS.some((x) => x[0] === "black") && colorHex("black") === "#1c1c1c"));

  // --- Add storage round trip from the coin form ---
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1884"); await p.fill("[data-f=notes]", "keep me");
  await p.selectOption("[data-kept]", "b:__add"); await p.waitForTimeout(150);
  await p.fill("#boxForm [name=name]", "New safe box"); await p.fill("#boxForm [name=rows]", "2"); await p.fill("#boxForm [name=perRow]", "5"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  ok("back on the coin form with typing kept and new box picked", (await p.inputValue("[data-f=year]")) === "1884" && (await p.inputValue("[data-f=notes]")) === "keep me" && (await p.inputValue("[data-kept]")).startsWith("b:") && (await ev(() => draft.boxId === allBoxes().find((x) => x.name === "New safe box").id)));

  console.log("errors", errors); await b.close();
})();
