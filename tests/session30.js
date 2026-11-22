// Step 9.3d: asking price third number (cost + minimum markup, never below it) and year-end tax records.
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
    // paid far above Red Book/melt: the cost floor must win
    put("c_hi", { ...blankCoin(), id: "hi", typeId: "franklin-half", gradeMode: "raw", year: "1953", mint: "S", grade: "MS-64", metal: "Silver", oz: "0.36169", qty: 2, status: "owned", stage: "forsale", paid: "500" }, true);
    // cheap coin: Red Book wins
    put("c_lo", { ...blankCoin(), id: "lo", typeId: "franklin-half", gradeMode: "raw", year: "1953", mint: "S", grade: "MS-64", metal: "Silver", oz: "0.36169", qty: 1, status: "owned", stage: "forsale", paid: "1" }, true);
    // no cost, no value
    put("c_n", { ...blankCoin(), id: "n", typeName: "Odd token", year: "1990", qty: 1, status: "owned", stage: "forsale" }, true);
  });
  const hi = await ev(() => suggestAsk(getCoin("hi")));
  ok("cost + 10% for the whole lot (500×2 → 1100)", hi.cost === 1100);
  ok("suggested never below cost + markup", hi.top === "cost" && Math.max(hi.book || 0, hi.melt || 0, hi.cost) === hi.cost);
  ok("cheap coin: Red Book is suggested", await ev(() => { const q = suggestAsk(getCoin("lo")); return q.top === "book" && q.cost === 1.1; }));
  ok("no cost, no value: nothing suggested", await ev(() => { const q = suggestAsk(getCoin("n")); return q.top == null && q.cost == null; }));
  await ev(() => saveSettings({ pricing: { costPct: 30 } }, true));
  ok("minimum markup % is changeable", await ev(() => suggestAsk(getCoin("hi")).cost === 1300));
  await ev(() => actions.priceReset());
  // inherited coin uses value when inherited
  await ev(() => put("c_in", { ...blankCoin(), id: "in", typeId: "franklin-half", year: "1953", mint: "S", qty: 2, source: "Inherited", inhValue: "40", status: "owned" }, true));
  ok("inherited coin: cost = value when inherited × qty", await ev(() => askCostBase(getCoin("in")) === 80 && suggestAsk(getCoin("in")).cost === 88));
  await ev(() => go("coin-hi")); await p.waitForTimeout(150);
  ok("coin page: highlighted button is the cost one", await p.locator("[data-act=askUse].primary[data-pick=cost]").count() === 1);
  await ev(() => go("options")); await p.waitForTimeout(150);
  ok("Options has the minimum markup box", await p.locator("[data-price=costPct]").count() === 1);

  // ---- tax records ----
  await ev(() => {
    const sale = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Sold " + id, year: "1990", qty: 1, status: "sold", ...o }, true);
    sale("t1", { paid: "50", buyTax: "2", acquired: "2024-03-01", sold: { date: "2026-10-05", amount: 100, fees: 8 } });   // held > 1 yr
    sale("t2", { paid: "20", acquired: "2026-06-01", sold: { date: "2026-10-20", amount: 40 } });                         // short
    sale("t3", { paid: "10", sold: { date: "2026-09-01", amount: 30 } });                                                  // no buy date
    sale("t4", { source: "Inherited", inhValue: "60", acquired: "2020-01-01", qty: 1, sold: { date: "2026-11-01", amount: 90 } });
    sale("t5", { paid: "10", acquired: "2025-01-01", sold: { date: "2025-12-31", amount: 15 } });                          // other year
    sale("t6", { paid: "5", acquired: "2025-10-05", sold: { date: "2026-10-05", amount: 9 } });                            // exactly one year: not over
    repPeriod.kind = "year"; repPeriod.y = 2026;
  });
  const rows = await ev(() => taxData(2026));
  ok("2026 list has 5 sales, 2025 sale left out", rows.length === 5);
  const by = (n) => rows.find((r) => r[2].includes("Sold " + n));
  ok("cost includes tax; gain = price − fees − cost (100−8−52=40)", by("t1")[4] === 52 && by("t1")[7] === 40);
  ok("held over 1 year yes / no / blank", by("t1")[8] === "Yes" && by("t2")[8] === "No" && by("t3")[8] === "" && by("t6")[8] === "No");
  ok("inherited: yes, cost = value when inherited (90−60=30)", by("t4")[9] === "Yes" && by("t4")[4] === 60 && by("t4")[7] === 30);
  ok("sorted by sale date", rows.map((r) => r[1]).join() === [...rows.map((r) => r[1])].sort().join());
  const csv = await ev(() => buildTaxCsv(2026));
  ok("CSV has the plain note and the 10 columns", csv.includes("not tax advice") && csv.includes("Date bought,Date sold,Item,Qty,Cost incl. fees,Sale price,Fees,Gain,Held over 1 year,Inherited"));
  await ev(() => go("reports")); await p.waitForTimeout(150);
  ok("Reports page has the tax records button", await p.locator("[data-act=repTax]").count() === 1);
  ok("no page errors", errors.length === 0);
  await b.close();
})();
