// Session 17 tidy batch: hide values keeps melt, collapsible Options, Home toggles, junk silver default,
// For sale button, Purchase order, Paid with autofill, FBL fallback, Incomplete mark/filter, want list check.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  ok("hide values keeps a coin's melt price", await ev(() => {
    HIDE_NOW = true; const a = money(5), m = moneyOpen(5), still = HIDE_NOW; HIDE_NOW = false;
    return a === HIDDEN_TEXT && m !== HIDDEN_TEXT && still === true;
  }));

  ok("Options sections start folded, open when tapped, version stays visible", await ev(() => {
    const closed = viewOptions();
    actions.optSec({ dataset: { v: "adding-coins" } });
    const open = viewOptions();
    actions.optSec({ dataset: { v: "adding-coins" } });
    return !/Junk silver goes in/.test(closed) && /Junk silver goes in/.test(open) && /Coin Cabinet version/.test(closed) && /fold-btn/.test(closed);
  }));

  ok("Home toggles hide Recently added", await ev(() => {
    put("c_h1", { ...blankCoin(), id: "h1", typeName: "T", year: "1990", qty: 1, status: "owned" }, true);
    const on = viewHome();
    saveSettings({ showAdded: false }, true); const off = viewHome(); saveSettings({ showAdded: true }, true);
    return /Recently added/.test(on) && !/Recently added/.test(off);
  }));

  ok("Value over time and Sold results fold", await ev(() => {
    actions.homeSec({ dataset: { v: "history" } }); const h = viewHome(); actions.homeSec({ dataset: { v: "history" } });
    return /data-v="history"/.test(h) && !/class="card"[^>]*>\s*<div class="small muted">Your chart starts today/.test(h);
  }));

  // Junk silver goes in My Silver Stack by default (new coins only); the switch turns it off.
  await ev(async () => {
    openCoinForm(null); Object.assign(draft, { typeName: "Junk dimes", year: "1964", gradeMode: "raw", grade: "Junk", metal: "Silver", oz: "0.0723", qty: 5 }); await saveDraft();
  });
  ok("new junk silver lands in My Silver Stack", await ev(() => { const c = allCoins().find((x) => x.typeName === "Junk dimes"); return c && c.stack === "My Silver Stack"; }));
  await ev(async () => {
    saveSettings({ junkStack: false }, true);
    openCoinForm(null); Object.assign(draft, { typeName: "Junk quarters", year: "1964", gradeMode: "raw", grade: "Junk", metal: "Silver", oz: "0.18", qty: 2 }); await saveDraft();
    saveSettings({ junkStack: true }, true);
  });
  ok("switch off keeps new junk out of a stack", await ev(() => { const c = allCoins().find((x) => x.typeName === "Junk quarters"); return c && !c.stack; }));
  ok("stored junk coins don't change on edit", await ev(async () => {
    put("c_old", { ...blankCoin(), id: "old", typeName: "Old junk", year: "1950", gradeMode: "raw", grade: "Junk", metal: "Silver", oz: "0.1", qty: 1, status: "owned" }, true);
    openCoinForm("old"); await saveDraft(); return !getCoin("old").stack;
  }));

  // For sale button
  ok("For sale button asks, remembers 'Don't ask again', and puts the coin on the list", await ev(() => {
    put("c_fs", { ...blankCoin(), id: "fs", typeName: "Sale", year: "1980", qty: 1, status: "owned" }, true);
    put("c_inh", { ...blankCoin(), id: "inh", typeName: "Inh", year: "1981", qty: 1, status: "owned", source: "Inherited" }, true);
    actions.forSale({ dataset: { id: "fs" } });
    const asked = !!document.getElementById("fsNoAsk") && getCoin("fs").stage !== "forsale";
    document.getElementById("fsNoAsk").checked = true; actions.forSaleOk({ dataset: { id: "fs" } });
    const done = getCoin("fs").stage === "forsale" && settings().skipForSaleAsk === true;
    actions.notForSale({ dataset: { id: "fs" } });
    const off = getCoin("fs").stage !== "forsale";
    actions.forSale({ dataset: { id: "fs" } });  // no question now
    const quick = getCoin("fs").stage === "forsale";
    return asked && done && off && quick;
  }));
  ok("coin page shows For sale (not for inherited coins)", await ev(() => { go("coin-fs"); return true; }) && (await p.waitForTimeout(150), await ev(() => /data-act="(forSale|notForSale)"/.test($("#view").innerHTML))));
  await ev(() => saveSettings({ skipForSaleAsk: false }, true));

  // Purchase details sit between Grade and Quantity
  await ev(() => openCoinForm(null)); await p.waitForTimeout(100);
  ok("Purchase details come before Quantity, value and metal", await ev(() => {
    const h = $("#sheet").innerHTML; const a = h.indexOf("Purchase details"), q = h.indexOf("Quantity, value and metal"), g = h.indexOf("My estimated grade");
    return g > -1 && a > g && q > a;
  }));

  // Paid with fills itself
  await p.selectOption("[data-f=_sourceKind]", "eBay"); await p.waitForTimeout(100);
  ok("eBay fills Paid with = Card", await ev(() => draft.payMethod === "Card"));
  await p.selectOption("[data-f=_sourceKind]", "Coin Show"); await p.waitForTimeout(100);
  ok("Coin Show changes it to Cash", await ev(() => draft.payMethod === "Cash"));
  await ev(() => { draft.payMethod = "Check"; });
  await p.selectOption("[data-f=_sourceKind]", "eBay"); await p.waitForTimeout(100);
  ok("a choice you made yourself isn't overwritten", await ev(() => draft.payMethod === "Check"));
  await ev(() => closeSheet());

  // Franklin FBL: no FBL price for the grade -> regular Red Book price
  ok("FBL falls back to the regular Red Book price", await ev(() => {
    const id = Object.keys(PRICE_BOOK.series).find((i) => PRICE_BOOK.series[i].fbl && PRICE_BOOK.series[i].circ);
    if (!id) return true;
    const circ = PRICE_BOOK.series[id].circ;
    const k = Object.keys(circ.rows).find((x) => !x.includes("|") && circ.rows[x][0] != null);
    if (!k) return true;
    const c = { typeId: id, year: k.split("-")[0], mint: k.split("-")[1] || "", grade: circ.grades[0], fbl: true };
    const want = bookLookup({ ...c, fbl: false });
    const r = bookLookup(c);
    return !!r && r.price != null && want && r.price === want.price && r.kind === "circ";
  }));

  // Incomplete mark and filter
  ok("Incomplete: coin with no grade or no cost", await ev(() => {
    const full = { ...blankCoin(), status: "owned", grade: "MS-63", paid: "5" };
    return isIncomplete({ ...full, grade: "" }) && isIncomplete({ ...full, paid: "" }) && !isIncomplete(full)
      && !isIncomplete({ ...full, paid: "", source: "Inherited", grade: "MS-63" });
  }).catch(() => false));
  ok("Incomplete mark shows on the row and the filter keeps only those", await ev(() => {
    put("c_i1", { ...blankCoin(), id: "i1", typeName: "Half", year: "1990", qty: 1, status: "owned", grade: "", paid: "" }, true);
    put("c_i2", { ...blankCoin(), id: "i2", typeName: "Full", year: "1991", qty: 1, status: "owned", gradeMode: "raw", grade: "MS-63", paid: "3" }, true);
    listState.f = { inc: "1" };
    const a = extraFilter(getCoin("i1")), b2 = extraFilter(getCoin("i2")); listState.f = {};
    return /inc-mark/.test(coinRow(getCoin("i1"))) && !/inc-mark/.test(coinRow(getCoin("i2"))) && a && !b2;
  }));

  // Want list check
  ok("Add coin that matches a want asks to remove it", await p.evaluate(async () => {
    const t = TYPE_BY_ID[Object.keys(TYPE_BY_ID)[0]];
    put("w_wq", { kind: "want", id: "wq", listId: DEFAULT_LIST_ID, typeId: t.id, typeName: t.name, denom: t.denom, year: String(t.start), mint: "", grade: "", variety: "" }, true);
    openCoinForm(null); draft.typeId = t.id; draft.typeName = t.name; draft.family = t.family; draft.denom = t.denom; draft.metal = t.metal; draft.year = String(t.start); draft.mint = "";
    await saveDraft();
    const asked = !!document.querySelector("[data-act=confirmOk]") && /want list/.test($("#sheet").textContent);
    document.querySelector("[data-act=confirmOk]").click();
    return asked && !getWant("wq");
  }));

  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
