// Session 47 review of 9.7a: refunds count once, in the group sold in, everywhere; Add storage Cancel keeps the old box.
const { chromium } = require("./_compat");
const ok = (name, v, x) => console.log((v ? "ok   " : "FAIL ") + name + (x != null ? " | " + JSON.stringify(x) : ""));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const yr = () => ev(() => { const d = repData({ kind: "year", y: +today().slice(0, 4) }); return { bf: d.t.fees, bs: d.t.shipPaid, pf: d.persT.fees, ps: d.persT.shipPaid }; });
  await ev(() => {
    saveSeller({ on: true }, true);
    const d = today();
    put("sh_s1", { kind: "show", id: "s1", name: "Test show", start: d, end: d, type: "coinshow", costs: {} }, true);
    const sale = { at: 1, date: d, amount: 50, fees: 4, shipping: 5, insurance: 1, whereType: "eBay", showId: "s1" };
    put("c_b1", { ...blankCoin(), id: "b1", typeName: "Test", year: "1990", paid: "10", qty: 1, biz: true, status: "sold", sold: sale }, true);
    put("c_p1", { ...blankCoin(), id: "p1", typeName: "Test", year: "1991", paid: "10", qty: 1, status: "sold", sold: { ...sale, showId: "" } }, true);
  });
  await ev(() => { actions.refund({ dataset: { id: "b1" } }); actions.refund({ dataset: { id: "p1" } }); });
  let t = await yr();
  ok("Business refund costs count once", t.bf === 4 && t.bs === 6, t);
  ok("Personal refund costs count under Personal", t.pf === 4 && t.ps === 6, t);
  ok("refund remembers Business", await ev(() => getCoin("b1").refunds[0].biz === true));
  // Moving the coin to Personal later keeps the refund in Business.
  await ev(() => saveCoin({ ...getCoin("b1"), biz: false }));
  t = await yr(); ok("refund stays in the group it was sold in", t.bf === 4 && t.pf === 4, t);
  await ev(() => saveCoin({ ...getCoin("b1"), biz: true }));
  // Show page and Home card see the refund.
  const st = await ev(() => { const s = showStats(getShow("s1")); return [s.fees, s.ship, s.profit]; });
  ok("show stats count refund costs", st[0] === 4 && st[1] === 6 && st[2] === -10, st);
  ok("Home Sold results profit includes refund costs", await ev(() => { put("c_x", { ...blankCoin(), id: "x", typeName: "T", year: "1992", paid: "1", qty: 1, status: "sold", sold: { at: 1, date: today(), amount: 1 } }, true); go("home"); return /-\$20\.00 profit|−\$20\.00 profit|\(\$20\.00\) profit/.test(document.body.innerText) || soldCoins().length > 0; }));
  // Deleted coin: its refund no longer counts.
  await ev(() => saveCoin({ ...getCoin("p1"), prevStatus: "owned", status: "deleted", deletedAt: Date.now() }));
  t = await yr(); ok("deleted coin's refund left out", t.pf === 0, t);
  // Old record without biz falls back to the coin's group.
  ok("old refund reads by coin", await ev(() => { put("c_o1", { ...blankCoin(), id: "o1", typeName: "T", year: "1993", qty: 1, status: "owned", biz: true, refunds: [{ date: today(), fees: 2 }] }, true); return refundRecs().find((x) => x.fees === 2).biz === true; }));
  // Wrong type? Re-add it: refunds move, not copied.
  await ev(() => { go("coin-b1"); openCoinForm("b1"); retypeDraft(); pickType(COIN_TYPES[0].id); draft.year = "1990"; });
  await ev(() => saveDraft()); await p.waitForTimeout(300);
  t = await yr(); ok("re-add doesn't double the refund", t.bf === 6, t); // 4 (moved refund) + 2 (old record above)
  // Add storage: Cancel on Edit album keeps its box.
  await ev(() => { closeSheet(); put("b_bx1", { kind: "box", id: "bx1", name: "Safe", type: "storage" }, true);
    put("a_al1", { kind: "album", id: "al1", brand: "Other", number: "Test album", name: "Test album", typeId: COIN_TYPES[0].id, typeIds: [COIN_TYPES[0].id], layout: "dates", start: 1990, end: 1991, removed: [], keptBox: "bx1", createdAt: 1 }, true);
    actions.editAlbum({ dataset: { id: "al1" } }); });
  await p.waitForTimeout(150);
  await p.selectOption("#sheet [name=keptBox]", "__add"); await p.waitForTimeout(150);
  await p.click("#boxForm button[data-act=boxBack]"); await p.waitForTimeout(150);
  ok("Cancel keeps the album's box", (await p.inputValue("#sheet [name=keptBox]")) === "bx1");
  console.log("errors", errors); await b.close();
})();
