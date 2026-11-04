// Step 8.3: suggested asking price, Options rules, sales reports (numbers, Personal apart, CSV, printable page).
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await ev(() => {
    saveSeller({ on: true }, true);
    saveSettings({ spot: { ...settings().spot, silver: 30 } }, true);
    put("c_f", { ...blankCoin(), id: "f", typeId: "franklin-half", gradeMode: "raw", year: "1953", mint: "S", grade: "MS-64", metal: "Silver", oz: "0.36169", qty: 2, status: "owned", stage: "forsale", paid: "5" }, true);
    put("c_n", { ...blankCoin(), id: "n", typeName: "Odd token", year: "1990", qty: 1, status: "owned", stage: "forsale" }, true);
  });

  // ---- suggestions ----
  const s = await ev(() => { const c = getCoin("f"), q = suggestAsk(c); return { q, bp: bookPrice(c), me: meltEach(c) }; });
  ok("a Red Book price exists to test with", s.bp != null && s.me != null);
  ok("Red Book × 90% for the whole lot", s.q.book === Math.round(s.bp * 2 * 90) / 100);
  ok("melt + 10% for the whole lot", s.q.melt === Math.round(s.me * 2 * 110) / 100);
  ok("a coin with neither gets no suggestion", await ev(() => { const q = suggestAsk(getCoin("n")); return q.book == null && q.melt == null; }));
  await ev(() => go("coin-f")); await p.waitForTimeout(150);
  ok("coin page shows three buttons", await p.locator('[data-act=askUse]').count() === 3);
  await p.locator('[data-act=askUse][data-pick=melt]').click(); await p.waitForTimeout(150);
  ok("tapping one saves it as the asking price", await ev(() => num(getCoin("f").ask) === suggestAsk(getCoin("f")).melt));
  // percentages changeable
  await ev(() => saveSettings({ pricing: { bookPct: 80, meltPct: 25 } }, true));
  ok("changed percentages are used", await ev(() => { const q = suggestAsk(getCoin("f")), bp = bookPrice(getCoin("f")), me = meltEach(getCoin("f")); return q.book === Math.round(bp * 2 * 80) / 100 && q.melt === Math.round(me * 2 * 125) / 100; }));
  await ev(() => actions.priceReset());
  ok("reset puts back 90 and 10", await ev(() => pricingRates().bookPct === 90 && pricingRates().meltPct === 10 && pricingRates().costPct === 10));
  // form
  await ev(() => go("options")); await p.waitForTimeout(150);
  ok("Options has the asking price rules", await p.locator("[data-price=bookPct]").count() === 1);
  await ev(() => { openCoinForm("f"); }); await p.waitForTimeout(150);
  ok("coin form offers the suggestions", await p.locator("#coinForm [data-act=askUse]").count() === 3);
  await p.locator("#coinForm [data-act=askUse][data-pick=book]").click();
  ok("tapping fills the form's asking price", await ev(() => num(document.querySelector("[data-f=ask]").value) === suggestAsk(getCoin("f")).book && num(draft.ask) === suggestAsk(getCoin("f")).book));
  await ev(() => go("home"));
  // dealer case rows
  await ev(() => { put("b_dc", { kind: "box", id: "dc", name: "Show case", type: "dealer", look: "wood", spots: false, rows: 0, perRow: 0, createdAt: 2 }, true); put("c_f", { ...getCoin("f"), boxId: "dc", ask: "" }, true); go("box-dc"); }); await p.waitForTimeout(150);
  ok("dealer case row offers the suggestions", await p.locator("#view [data-act=askUse]").count() === 3);

  // ---- reports ----
  await ev(() => {
    const sale = (id, o, sold) => put("c_" + id, { ...blankCoin(), id, typeName: "Sold " + id, year: "1990", qty: 1, status: "sold", paid: o.paid, biz: o.biz, sold: { date: "2026-10-05", amount: 100, shipCharged: 5, fees: 8, shipping: 4, insurance: 1, salesTax: 7, whereType: "Whatnot", ...sold } }, true);
    sale("s1", { paid: "50", biz: true }, {});
    sale("s2", { paid: "20", biz: true }, { whereType: "Coin show", amount: 40, shipCharged: null, fees: null, shipping: null, insurance: null, salesTax: null, date: "2026-10-20" });
    sale("s3", { paid: "10" }, { amount: 30 });                         // personal
    sale("s4", { paid: "10", biz: true }, { date: "2026-09-30" });      // other month
    put("c_inh", { ...blankCoin(), id: "inh", typeName: "Inherited", source: "Inherited", status: "sold", paid: "1", biz: true, sold: { date: "2026-10-06", amount: 999 } }, true);
    put("sh_a", { kind: "show", id: "a", name: "Oct show", type: "coinshow", start: "2026-10-18", costs: { table: 60, gas: 20, hotel: 80, food: 15, other: 5 } }, true);
    repPeriod.kind = "month"; repPeriod.y = 2026; repPeriod.n = 10;
  });
  const d = await ev(() => { const d = repData(repPeriod); return { t: d.t, profit: d.profit, show: d.showTotal, pers: d.persT, plat: d.platforms, sc: d.sc, nb: d.biz.length, np: d.pers.length }; });
  ok("only October Business sales counted (2), inherited left out", d.nb === 2 && d.t.n === 2);
  ok("sales 140, shipping charged 5, tax 7 kept apart", d.t.sales === 140 && d.t.ship === 5 && d.t.tax === 7);
  ok("cost 70, fees 8, shipping+insurance 5", d.t.cost === 70 && d.t.fees === 8 && d.t.shipPaid === 5);
  ok("show costs 180", d.show === 180);
  ok("profit = 145 − 70 − 8 − 5 − 180 = −118", d.profit === -118);
  ok("Personal sale listed apart (30 for 10 paid)", d.np === 1 && d.pers.sales === 30 && d.pers.cost === 10);
  ok("platform gross includes shipping and tax; 1099-K flag", d.plat.some((x) => x.name === "Whatnot" && x.gross === 112 && x.check) && d.plat.some((x) => x.name === "Coin show" && !x.check));
  ok("Schedule C style: net profit matches profit", d.sc.net === -118 && d.sc.gross === 75 && d.sc.expenses === 193);
  const q = await ev(() => { const r1 = (n) => { repPeriod.kind = "quarter"; repPeriod.n = n; return repData(repPeriod).t.n; }; const a = r1(4), y = (repPeriod.kind = "year", repData(repPeriod).t.n); return { a, y }; });
  ok("quarter 4 holds October and year holds September too", q.a === 2 && q.y === 3);
  await ev(() => { repPeriod.kind = "month"; repPeriod.n = 10; go("reports"); }); await p.waitForTimeout(200);
  ok("Reports page shows the numbers and both save buttons", await ev(() => { const t = document.querySelector("#view").textContent; return t.includes("October 2026") && t.includes("Personal sales") && !!document.querySelector("[data-act=repPrint]") && !!document.querySelector("[data-act=repCsv]"); }));
  await p.locator("[data-act=repShift][data-v='-1']").click(); await p.waitForTimeout(100);
  ok("◀ goes to September", await ev(() => document.querySelector("#view").textContent.includes("September 2026")));
  const out = await ev(() => { repPeriod.n = 10; const d = repData(repPeriod); return { html: buildSalesReportHtml(d), csv: buildSalesReportCsv(d) }; });
  ok("printable page has the title and the platform table", out.html.includes("Sales report: October 2026") && out.html.includes("compare with 1099-K"));
  ok("spreadsheet has one row per sale, tagged", out.csv.split("\n").filter((l) => l.startsWith("Business,")).length === 2 && out.csv.split("\n").filter((l) => l.startsWith("Personal,")).length === 1);
  ok("money in the files is not hidden by the eye button", await ev(() => { HIDE_NOW = true; const h = buildSalesReportHtml(repData(repPeriod)); HIDE_NOW = false; return h.includes("$140.00"); }));
  // Seller Mode off
  await ev(() => { saveSeller({ on: false }, true); go("reports"); }); await p.waitForTimeout(150);
  ok("Seller Mode off: page says to turn it on, menu item hidden", await ev(() => document.querySelector("#view").textContent.includes("Seller Mode") && document.querySelector("#menuReports").hidden));

  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
