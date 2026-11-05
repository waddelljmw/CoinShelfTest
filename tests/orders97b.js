// Step 9.7b: one order with several coins, profit wording, CSV columns, show costs by kind, bought at a show, usual shipping.
const { chromium } = require("./_compat");
const ok = (name, v, x) => console.log((v ? "ok   " : "FAIL ") + name + (x != null ? " | " + JSON.stringify(x) : ""));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  // shareMoney: pieces always add back to the total
  ok("shareMoney adds back", await ev(() => { const a = shareMoney(10, [1, 1, 1]); return r2(a[0] + a[1] + a[2]) === 10; }));
  ok("shareMoney null and zero weights", await ev(() => shareMoney(null, [1, 2]).every((x) => x === null) && r2(sum(shareMoney(3, [0, 0]), (x) => x)) === 3));

  await ev(() => {
    saveSeller({ on: true }, true);
    put("sh_s1", { kind: "show", id: "s1", name: "Stream night", start: today(), type: "whatnot", role: "seller", costs: { supplies: 5 } }, true);
    ["a", "b", "c"].forEach((k, i) => put("c_" + k, { ...blankCoin(), id: k, typeName: "Test " + k, year: "199" + i, paid: "10", qty: 1, biz: true, status: "owned" }, true));
  });
  // Sell together: 3 coins, prices 10/20/30, shipping 4.50 charged, fees 3.01 (one flat fee), label 3.99
  await ev(() => openOrder(["a", "b", "c"].map(getCoin)));
  await p.fill("#orderForm [name=p_a]", "10"); await p.fill("#orderForm [name=p_b]", "20"); await p.fill("#orderForm [name=p_c]", "30");
  await p.fill("#orderForm [name=shipCharged]", "4.5"); await p.fill("#orderForm [name=shipping]", "3.99"); await p.fill("#orderForm [name=fees]", "3.01");
  await p.fill("#orderForm [name=soldTo]", "buyer1"); await p.fill("#orderForm [name=orderNo]", "W-1"); await p.fill("#orderForm [name=trackNo]", "9400 1111");
  await p.selectOption("#orderForm [name=showId]", "s1");
  await p.click("#orderForm button[type=submit]"); await p.waitForTimeout(300);
  const sold = await ev(() => ["a", "b", "c"].map((k) => getCoin(k).sold));
  ok("all three sold", sold.every((s) => s && s.orderId), sold.map((s) => s && s.amount));
  ok("one shared order id", new Set(sold.map((s) => s.orderId)).size === 1);
  ok("fees counted once (sum = 3.01)", r2sum(sold, "fees") === 3.01, sold.map((s) => s.fees));
  ok("shipping charged once (sum = 4.50)", r2sum(sold, "shipCharged") === 4.5);
  ok("label cost once (sum = 3.99)", r2sum(sold, "shipping") === 3.99);
  ok("each coin keeps its own price", sold[0].amount === 10 && sold[1].amount === 20 && sold[2].amount === 30);
  ok("buyer, order number, tracking shared", sold.every((s) => s.to === "buyer1" && s.orderNo === "W-1" && s.trackNo === "94001111" && s.showId === "s1"));
  function r2sum(list, k) { return Math.round(list.reduce((t, s) => t + (s[k] || 0), 0) * 100) / 100; }

  // Wording and numbers agree: show page, report, Home
  const st = await ev(() => showStats(getShow("s1")));
  ok("show: sales = coins only", st.sales === 60 && st.shipIn === 4.5, [st.sales, st.shipIn]);
  ok("show: profit before = 60+4.5-30-3.01-3.99", st.before === 27.5, st.before);
  ok("show: profit after = before - 5", st.profit === 22.5, st.profit);
  const d = await ev(() => { const x = repData({ kind: "year", y: +today().slice(0, 4) }); return { before: x.profit + x.showTotal, after: x.profit, fees: x.t.fees, sales: x.t.sales }; });
  ok("report agrees with the show page", Math.abs(d.before - st.before) < 0.005 && Math.abs(d.after - st.profit) < 0.005 && d.fees === 3.01 && d.sales === 60, d);
  const sections = await ev(() => repSections(repData({ kind: "year", y: +today().slice(0, 4) }), (n) => n).flatMap(([, l]) => l.map((r) => r[0])));
  ok("report has the new profit words", sections.includes("Profit before show costs") && sections.includes("Profit after show costs") && sections.includes("Supplies"));
  await ev(() => go("show-s1")); await p.waitForTimeout(200);
  const page = await p.textContent("#app, main, body");
  ok("show page words", /Profit before show costs/.test(page) && /Profit after show costs/.test(page) && /Sold here/.test(page));
  await ev(() => go("coin-a")); await p.waitForTimeout(200);
  ok("order card on a coin page", /Part of an order/.test(await p.textContent("body")) && /Refund whole order/.test(await p.textContent("body")));

  // CSV columns
  const csv = await ev(() => toCsv());
  ok("coins CSV has Business / Personal and Show", /Business \/ Personal/.test(csv.split("\n")[0]) && /Show/.test(csv.split("\n")[0]));
  const rcsv = await ev(() => buildSalesReportCsv(repData({ kind: "year", y: +today().slice(0, 4) })));
  ok("sales CSV has buyer, order, tracking", /Buyer,Order number,Tracking number/.test(rcsv) && /buyer1,W-1,94001111/.test(rcsv));

  // Refund the whole order: back in stock, fees and shipping still count once
  await ev(() => actions.refundOrder({ dataset: { id: "a" } }));
  await ev(() => { const ok1 = document.querySelector("#sheet [data-act=confirmOk], [data-act=confirmOk]"); if (ok1) ok1.click(); }); await p.waitForTimeout(300);
  ok("all three back in stock", await ev(() => ["a", "b", "c"].every((k) => getCoin(k).status === "owned" && (getCoin(k).refunds || []).length === 1)));
  const rd = await ev(() => { const x = repData({ kind: "year", y: +today().slice(0, 4) }); return [x.t.fees, x.t.shipPaid, x.t.sales]; });
  ok("refund keeps fees (3.01) and label (3.99), no sales", rd[0] === 3.01 && rd[1] === 3.99 && rd[2] === 0, rd);
  // Undo the sale of a single coin of an order works like before (old single sales are untouched)
  await ev(() => put("c_old", { ...blankCoin(), id: "old", typeName: "Old", year: "1980", paid: "5", qty: 1, status: "sold", sold: { at: 1, date: today(), amount: 9, fees: 1 } }, true));
  ok("old single sale still works", await ev(() => saleProfit(getCoin("old")) === 3 && !orderCard(getCoin("old"))));

  // Show costs by kind
  ok("cost kinds follow the show", await ev(() => showCostKeys("coinshow").join() === "table,gas,hotel,food,other" && showCostKeys("whatnot").join() === "supplies,equipment,subscriptions,other" && showCostKeys("coinshow", "attendee").join() === "entry,gas,hotel,food,other"));
  await ev(() => showForm(null)); await p.selectOption("#showForm [name=type]", "whatnot"); await p.waitForTimeout(100);
  ok("stream form offers Supplies, not Table fee", await ev(() => !!document.querySelector("#showForm [name=c_supplies]") && !document.querySelector("#showForm [name=c_table]")));
  await p.selectOption("#showForm [name=type]", "coinshow");
  ok("coin show form offers Table fee", await ev(() => !!document.querySelector("#showForm [name=c_table]") && !document.querySelector("#showForm [name=c_supplies]")));
  await ev(() => closeSheet());
  ok("Schedule C has Supplies", await ev(() => repData({ kind: "year", y: +today().slice(0, 4) }).sc.supplies === 5));

  // Bought at this show (Add coin) and Bought here on the show page
  await ev(() => { put("sh_s2", { kind: "show", id: "s2", name: "Expo", start: "2026-09-12", type: "coinshow", role: "attendee", costs: { entry: 8 } }, true); openCoinForm(null); applySourceKind(draft, "Coin Show"); renderCoinForm(); });
  ok("show picker appears for Coin Show", await ev(() => !!document.querySelector("[data-f=boughtShowId]")));
  await p.selectOption("[data-f=boughtShowId]", "s2"); await p.waitForTimeout(100);
  ok("show day fills Date acquired", await ev(() => draft.acquired === "2026-09-12" && draft.boughtShowId === "s2"), await ev(() => draft.acquired));
  await ev(() => closeSheet());
  await ev(() => put("c_bh", { ...blankCoin(), id: "bh", typeName: "Bought", year: "1970", paid: "7", qty: 1, status: "owned", acquired: "2026-09-12", boughtShowId: "s2" }, true));
  await ev(() => go("show-s2")); await p.waitForTimeout(200);
  ok("show page lists Bought here", /Bought here/.test(await p.textContent("body")) && !/Profit before/.test(await p.textContent("body")));

  // Usual shipping you charge
  await ev(() => saveSettings({ shipping: { charge: 4.25, def: 3 } }, true));
  await ev(() => openSell("a"));
  ok("Shipping you charged fills in", await ev(() => document.querySelector("#sellForm [name=shipCharged]").value === "4.25"));
  await ev(() => closeSheet());
  await ev(() => go("options")); await p.waitForTimeout(300);
  ok("Fees last checked box", await ev(() => !!document.querySelector("[data-feesdate]")));
  ok("Shows-only switch off by default", await ev(() => { saveSeller({ on: false }, true); render(); return !showsOn() && !!document.querySelector("[data-act=attendeeShows]"); }));
  // Business stays apart on Coin Value and My Stacks
  await ev(() => { saveSeller({ on: true }, true); put("c_bs", { ...blankCoin(), id: "bs", typeName: "Biz bar", year: "2000", paid: "30", qty: 1, biz: true, status: "owned", stack: "My Silver Stack", metal: "silver", oz: "1", itemType: "bullion" }, true); put("c_ps", { ...blankCoin(), id: "ps", typeName: "Pers bar", year: "2001", paid: "30", qty: 1, status: "owned", stack: "My Silver Stack", metal: "silver", oz: "1" }, true); go("value"); });
  await p.waitForTimeout(250);
  ok("Coin Value has a Business card and leaves the coin out of the lists", /Business stock/.test(await p.textContent("body")) && !/Biz bar/.test(await p.textContent("body").then((t) => t.split("Business stock")[0])));
  await ev(() => go("stacks")); await p.waitForTimeout(250);
  ok("My Stacks counts Business apart", /Business, counted apart/.test(await p.textContent("body")));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
