// Inherited guard: Edit asks before leaving Inherited; Mark as sold only with the sell-eventually note (and asks);
// every other way of selling or moving an inherited coin still refuses.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    put("settings", { ...settings(), inheritances: [{ id: "i1", from: "Mother-in-law", date: "2023", earlier: [], valueWhen: "5" }], inhDefault: "i1" });
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", value: "40", qty: 1, status: "owned", ...o });
    mk("inh", { source: "Inherited", inhId: "i1", inhValue: "30" }); mk("plain", { source: "eBay" });
  });
  const coin = (id) => p.evaluate((i) => getCoin(i), id);

  // A) Edit: leaving Inherited asks first
  await p.evaluate(() => { openCoinForm("inh"); applySourceKind(draft, "eBay"); renderCoinForm(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => saveDraft()); await p.waitForTimeout(250);
  ok("asks before changing the source", /No longer inherited/.test(await p.textContent("#sheetTop")));
  ok("nothing saved yet", (await coin("inh")).source === "Inherited");
  await p.click("#sheetTop [data-act=inhLeaveKeep]:not(.x)"); await p.waitForTimeout(250);
  ok("Keep Inherited leaves it inherited", (await coin("inh")).source === "Inherited" && (await p.evaluate(() => isInherited(draft))));
  await p.evaluate(() => { applySourceKind(draft, "eBay"); renderCoinForm(); saveDraft(); }); await p.waitForTimeout(250);
  await p.click("#sheetTop [data-act=inhLeaveOk]"); await p.waitForTimeout(400);
  ok("Change it saves the new source", (await coin("inh")).source === "eBay");
  await p.evaluate(() => saveCoin({ ...getCoin("inh"), source: "Inherited", inhId: "i1", inhValue: "30" }));
  await p.evaluate(() => { openCoinForm("inh"); draft.notes = "x"; saveDraft(); }); await p.waitForTimeout(400);
  ok("other edits to an inherited coin don't ask", !/No longer inherited/.test(await p.textContent("#sheetTop")) && (await coin("inh")).notes === "x");
  await p.evaluate(() => { openCoinForm("plain"); applySourceKind(draft, "Coin Show"); saveDraft(); }); await p.waitForTimeout(400);
  ok("non-inherited coins don't ask", (await coin("plain")).source === "Coin Show");

  // A) Mark as sold on an inherited coin
  await p.evaluate(() => go("coin-inh")); await p.waitForTimeout(250);
  ok("no Mark as sold without the note", !(await p.$("[data-act=sell]")));
  await p.click("[data-act=sellLater]"); await p.waitForTimeout(250);
  ok("Mark as sold shows with the note", !!(await p.$("[data-act=sell]")));
  await p.click("[data-act=sell]"); await p.waitForTimeout(250);
  ok("asks first", /Sell this inherited coin/.test(await p.textContent("#sheet")) && !(await p.$("#sheet form")));
  await p.click("#sheet [data-act=closeSheet]:not(.x)"); await p.waitForTimeout(150);
  ok("Cancel opens no sale form", !(await p.$("#sheet form")) && (await coin("inh")).status === "owned");
  await p.click("[data-act=sell]"); await p.waitForTimeout(200); await p.click("#sheet [data-act=confirmOk]"); await p.waitForTimeout(250);
  ok("Continue opens the sale form", /Mark as sold/.test(await p.textContent("#sheet")) && !!(await p.$("#sheet form")));
  await p.evaluate(() => closeSheet());
  await p.evaluate(() => go("coin-plain")); await p.waitForTimeout(200);
  ok("a normal coin still has Mark as sold, no ask", !!(await p.$("[data-act=sell]")));
  await p.click("[data-act=sell]"); await p.waitForTimeout(250);
  ok("normal coin goes straight to the form", !!(await p.$("#sheet form")));
  await p.evaluate(() => closeSheet());

  // Still refused: For sale, Business, dealer case, grouped order, bulk source change
  const r = await p.evaluate(() => {
    const out = {};
    putForSale("inh", true); out.forSale = stageOf(getCoin("inh")) !== "forsale";
    draft = { ...getCoin("inh"), _status: "forsale" }; saveDraft(); out.draftForSale = stageOf(getCoin("inh")) !== "forsale";
    bizMoveOne("inh", true); out.biz = !getCoin("inh").biz;
    put("settings", { ...settings(), seller: { ...(settings().seller || {}), on: true } });
    put("b_case", { id: "case", type: "dealer", name: "Case", forSale: true });
    out.dealer = /can't go in a for-sale dealer case/.test(boxCheck({ ...getCoin("inh"), boxId: "case" }));
    openOrder([getCoin("inh"), getCoin("inh")]); out.order = !document.querySelector("#sheet form") && getCoin("inh").status === "owned";
    closeSheet();
    listState._shown = [getCoin("inh")]; listState.sel = new Set(["inh"]);
    const s = document.createElement("select"); s.id = "pcSrc"; s.innerHTML = '<option value="eBay" selected>eBay</option>'; document.body.appendChild(s);
    actions.pcGo(); s.remove();
    out.bulk = getCoin("inh").source === "Inherited";
    return out;
  });
  ok("For sale refused", r.forSale && r.draftForSale); ok("Business refused", r.biz); ok("dealer case refused", r.dealer);
  ok("grouped order refused", r.order); ok("bulk source change refused", r.bulk);
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
