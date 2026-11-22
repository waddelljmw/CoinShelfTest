// Session 24b: seller fixes from review 3.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await ev(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", paid: "4", qty: 1, status: "owned", ...o }, true);
    mk("a", { stage: "forsale", ask: "30", cid: "T-2" }); mk("b", { stage: "forsale", cid: "T-1", grade: "MS-65" }); mk("c", {});
    saveSeller({ on: true }, true);
    put("sh_s1", { kind: "show", id: "s1", name: "Future Expo", type: "coinshow", start: "2099-01-10", end: "2099-01-11", costs: { table: 100 }, createdAt: 1 }, true);
    put("sh_s2", { kind: "show", id: "s2", name: "Running", type: "whatnot", start: "2000-01-01", end: "2099-12-31", costs: { gas: 20 }, createdAt: 2 }, true);
  });
  // Sold form: show date, future warning, up-front fields, last payment method
  await ev(() => openSell("c")); 
  ok("running show: date is today", await ev(() => document.querySelector("#sellForm").elements.date.value === today()));
  ok("Paid with, fees and tax are up front (not in More details)", await ev(() => { const f = document.querySelector("#sellForm"), d = f.querySelector("details.more"); return ["payMethod", "fees", "salesTax"].every((k) => f.elements[k] && !d.contains(f.elements[k])); }));
  await ev(() => { const s = document.getElementById("showId"); s.value = "s1"; s.dispatchEvent(new Event("change", { bubbles: true })); });
  ok("future show: date is its first day + future warning", await ev(() => document.querySelector("#sellForm").elements.date.value === "2099-01-10" && /future/.test(document.getElementById("dateHint").textContent)));
  await ev(() => { const f = document.querySelector("#sellForm"); f.elements.date.value = "2024-05-05"; f.elements.date.dispatchEvent(new Event("input", { bubbles: true })); const s = document.getElementById("showId"); s.value = "s2"; s.dispatchEvent(new Event("change", { bubbles: true })); });
  ok("a date you picked is not overwritten", await ev(() => document.querySelector("#sellForm").elements.date.value === "2024-05-05"));
  await ev(() => { const f = document.querySelector("#sellForm"); f.elements.payMethod.value = "Venmo"; doSell(f); });
  ok("last payment method remembered", await ev(() => settings().lastPay === "Venmo"));
  await ev(() => { put("c_d", { ...blankCoin(), id: "d", typeName: "Test", year: "1990", value: "10", paid: "4", qty: 1, status: "owned" }, true); openSell("d"); });
  ok("next sale starts with it", await ev(() => document.querySelector("#sellForm").elements.payMethod.value === "Venmo"));
  await ev(() => closeSheet());
  // Home label
  ok("Sold results say before show costs", await ev(() => /before show costs/.test(soldCard())));
  // Dealer defaults
  await ev(() => { boxForm(null); const t = document.querySelector("#boxForm [name=type]"); t.value = "dealer"; t.dispatchEvent(new Event("change", { bubbles: true })); });
  ok("new dealer case starts at 2 rows of 6", await ev(() => { const f = document.querySelector("#boxForm"); return f.elements.rows.value === "2" && f.elements.perRow.value === "6"; }));
  await ev(() => { const f = document.querySelector("#boxForm"); f.elements.name.value = "X"; f.elements.rows.value = ""; saveBoxForm(f); });
  ok("plain error for a case", await ev(() => /how many rows and spots/.test(document.querySelector("#toast, .toast").textContent)));
  await ev(() => closeSheet());
  // Case page: order, set asking price for all
  await ev(() => {
    put("b_dc", { kind: "box", id: "dc", name: "Case", type: "dealer", look: "wood", spots: true, rows: 2, perRow: 6, forSale: true, createdAt: 3 }, true);
    put("c_a", { ...getCoin("a"), boxId: "dc", boxRow: "2", boxSlot: "1" }, true);
    put("c_b", { ...getCoin("b"), boxId: "dc", boxRow: "1", boxSlot: "3" }, true);
  });
  ok("case page lists coins in slot order", await ev(() => { const h = dealerPanel(getBox("dc")); return h.indexOf(labelOf(getCoin("b"))) >= 0 && h.indexOf("1·3") < h.indexOf("2·1"); }));
  await ev(() => saveSettings({ pricing: { bookPct: 90, meltPct: 10 } }, true));
  ok("unpriced list holds only the coin with no price", await ev(() => caseUnpriced(getBox("dc")).map((c) => c.id).join() === "b"));
  await ev(() => { put("c_b", { ...getCoin("b"), type: "silver", metal: "silver" }, true); });
  ok("Set asking price for all never touches a set price", await ev(() => { actions.caseAskGo({ dataset: { id: "dc", pick: "book" } }); return getCoin("a").ask === "30"; }));
  ok("Undo available after set all", await ev(() => { actions.caseUndo(); return getCoin("a").ask === "30"; }));
  // Select closes after move
  await ev(() => { listState._shown = [getCoin("c")]; listState.sel = new Set(["c"]); actions.mvOpen(); const e = document.querySelector('#sheet [data-flt="mv"]'); e.value = "none"; actions.mvGo(); });
  ok("Select closes after Move", await ev(() => listState.sel === null));
  // Price list
  ok("price list text has ID, grade and price in ID order", await ev(() => { const t = priceListText(); return t.indexOf("T-1") < t.indexOf("T-2") && /MS-65/.test(t) && /\$30\.00/.test(t); }));
  ok("price list page builds", await ev(() => /<table>/.test(priceListHtml()) && /T-2/.test(priceListHtml())));
  // Break-even
  ok("show page: sell more to cover costs", await ev(() => /Sell \$100\.00 more to cover show costs/.test(viewShow({ id: "s1" }))));
  ok("page errors", errors.length === 0);
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
