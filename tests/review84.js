// Step 8.4 review fixes: album spot check on case return, edit sale keeps keptIn/show,
// attendee costs out of reports, Move to Personal skips sold coins, deleting a case returns coins, period switch.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  ok("case return won't double up an album spot", await ev(() => {
    saveSeller({ on: true }, true);
    put("a_alb", { kind: "album", id: "alb", name: "Album", slots: [{ id: "s1" }] }, true);
    put("b_dc", { kind: "box", id: "dc", name: "Case", type: "dealer", look: "wood", spots: false, rows: 0, perRow: 0, createdAt: 2 }, true);
    put("c_x", { ...blankCoin(), id: "x", typeName: "T", year: "1990", qty: 1, status: "owned", albumId: "alb", slotId: "s1" }, true);
    const c = JSON.parse(JSON.stringify(getCoin("x"))); applyKept(c, "b:dc"); saveCoin(c);
    put("c_y", { ...blankCoin(), id: "y", typeName: "T", year: "1991", qty: 1, status: "owned", albumId: "alb", slotId: "s1" }, true);
    actions.caseOut({ dataset: { id: "x" } });
    const r = allCoins().filter((c) => c.slotId === "s1").map((c) => c.id).join();
    closeSheet(); return r === "y";
  }));
  await ev(() => { put("b_st", { kind: "box", id: "st", name: "Black 1", type: "storage", look: "black", spots: false, rows: 0, perRow: 0, createdAt: 1 }, true);
    put("sh_s1", { kind: "show", id: "s1", name: "Expo", type: "coinshow", start: today(), role: "seller", costs: { table: 50 } }, true);
    put("c_k", { ...blankCoin(), id: "k", typeName: "K", year: "1971", qty: 1, status: "owned", boxId: "st", biz: true, paid: "5" }, true);
    openSell("k"); const f = document.getElementById("sellForm"); f.elements.amount.value = "15"; f.elements.showId.value = "s1"; doSell(f); });
  await ev(() => { openSell("k", true); doSell(document.getElementById("sellForm")); });
  ok("editing a sale keeps Was kept in", await ev(() => getCoin("k").sold.keptIn === "Black 1" && getCoin("k").sold.showId === "s1"));
  await ev(() => { saveSeller({ on: false }, true); openSell("k", true); doSell(document.getElementById("sellForm")); saveSeller({ on: true }, true); });
  ok("editing with Seller Mode off keeps the show", await ev(() => getCoin("k").sold.showId === "s1" && getCoin("k").sold.keptIn === "Black 1"));
  ok("attendee costs stay out of Reports", await ev(() => {
    put("sh_a", { kind: "show", id: "a", name: "Visit", type: "coinshow", start: today(), role: "attendee", costs: { gas: 40, hotel: 100 } }, true);
    const d = repData({ kind: "year", y: new Date().getFullYear(), n: 1 }); return d.showTotal === 50;
  }));
  ok("Quarter back to Month keeps the month", await ev(() => {
    repPeriod.kind = "month"; repPeriod.n = 11; repPeriod.y = 2026;
    actions.repKind({ dataset: { v: "quarter" } }); actions.repKind({ dataset: { v: "month" } }); return repPeriod.n === 10;
  }));
  ok("Move to Personal skips sold coins", await ev(() => {
    listState._shown = [getCoin("k")]; listState.sel = new Set(["k"]); actions.bizBulkBack(); closeSheet && closeSheet(); return !!getCoin("k").biz;
  }));
  ok("deleting a case sends coins back", await ev(() => {
    put("c_z", { ...blankCoin(), id: "z", typeName: "Z", year: "1999", qty: 1, status: "owned", boxId: "st" }, true);
    const c = JSON.parse(JSON.stringify(getCoin("z"))); applyKept(c, "b:dc"); saveCoin(c);
    actions.boxDelete({ dataset: { id: "dc" } }); const btn = document.querySelector("[data-act=confirmOk]"); btn && btn.click();
    const z = getCoin("z"); return !getBox("dc") && z.boxId === "st" && !z.stage && !z.caseFrom;
  }));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.join("\n"));
  await b.close();
})();
