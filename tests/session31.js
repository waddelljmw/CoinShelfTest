// Session 31 review fixes: restore keeps inheritances, inherited sales count as held over 1 year,
// "estimate*" only for coins actually counted, CSV inheritance columns, confirm before deleting a used inheritance.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  // 1. restore joins inheritances by id
  const merged = await ev(() => {
    saveSettings({ inheritances: [{ id: "here", from: "Aunt", date: "2020" }], inhDefault: "here" }, true);
    return mergeRestored("settings", { inheritances: [{ id: "bk", from: "Mother-in-law", date: "2023", valueWhen: "5" }, { id: "here", from: "Old copy" }], inhDefault: "bk" });
  });
  ok("restore keeps both inheritances", merged.inheritances.length === 2 && merged.inheritances.some((i) => i.id === "bk"));
  ok("same id: this phone's copy wins; phone default kept", merged.inheritances.find((i) => i.id === "here").from === "Aunt" && merged.inhDefault === "here");

  // 2. inherited sale is held over 1 year
  const row = await ev(() => {
    put("c_ti", { ...blankCoin(), id: "ti", typeName: "Sold inh", year: "1990", qty: 1, status: "sold", source: "Inherited", inhValue: "10", acquired: "2026-03-01", sold: { date: "2026-10-01", amount: 20 } }, true);
    return taxData(2026).find((r) => r[2].includes("Sold inh"));
  });
  ok("inherited sale: held over 1 year = Yes", row[8] === "Yes" && row[9] === "Yes");

  // 3 + 4. estimate* only for counted / reported coins
  await ev(() => {
    put("c_ok", { ...blankCoin(), id: "ok", typeName: "Good", year: "1990", grade: "MS-63", paid: "5", qty: 1, status: "owned" }, true);
    put("c_hid", { ...blankCoin(), id: "hid", typeName: "Hidden", year: "1990", qty: 1, status: "owned", group: "Side box" }, true);
    saveSettings({ hiddenGroups: ["Side box"] }, true);
  });
  ok("coin in a hidden group isn't counted as needing info", await ev(() => !needInfoCoins().some((c) => c.id === "hid")));
  await ev(() => saveSettings({ hiddenGroups: [] }, true));
  const rep = await ev(async () => buildReport({ ids: new Set(["ok"]) }));
  ok("report of complete coins has no estimate*", !rep.includes("estimate*") && !rep.includes("*Estimate."));
  const rep2 = await ev(async () => buildReport({ ids: new Set(["ok", "hid"]) }));
  ok("report with an incomplete coin says estimate*", rep2.includes("estimate*"));

  // 5. CSV columns
  const csv = await ev(() => {
    put("c_iv", { ...blankCoin(), id: "iv", typeName: "Inh coin", year: "1990", qty: 1, status: "owned", source: "Inherited", inhId: "bk" }, true);
    saveSettings({ inheritances: [{ id: "bk", from: "Mother-in-law", date: "2023", valueWhen: "5" }] }, true);
    return toCsv(allCoins().filter((c) => c.id === "iv"));
  });
  ok("CSV has Inherited from + Value when inherited", csv.includes("Inherited from") && csv.includes("Mother-in-law, 2023") && csv.includes("Value when inherited"));
  ok("snapshot includes inherit.js", await ev(() => SNAP_FILES.includes("inherit.js")));

  // 6. confirm before deleting an inheritance coins use
  await ev(() => { inhEd = { ...inheritances().find((i) => i.id === "bk") }; actions.inhDelete(); });
  ok("used inheritance asks first", await p.locator("[data-act=confirmOk]").count() === 1 && await ev(() => inheritances().length === 1));
  await ev(() => actions.confirmOk());
  ok("after OK it's deleted", await ev(() => inheritances().length === 0));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
