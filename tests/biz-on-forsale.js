// Step 21 (idea 130): Personal / Business switch on the For sale question (Seller Mode only; no new saved field).
const { chromium } = require("./_compat");
const ok = (name, v) => { console.log((v ? "ok   " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn) => p.evaluate(fn);
  ok("Seller Mode off: no switch", await ev(() => {
    put("c_b1", { ...blankCoin(), id: "b1", typeName: "T", year: "1980", qty: 1, status: "owned" }, true);
    actions.forSale({ dataset: { id: "b1" } });
    const no = !document.getElementById("fsBiz"); closeSheet(); return no;
  }));
  ok("Seller Mode on: switch shows, starts Personal, Business saves with For sale", await ev(() => {
    saveSeller({ on: true }, true);
    actions.forSale({ dataset: { id: "b1" } });
    const sel = document.getElementById("fsBiz"); const start = !!sel && sel.value === "";
    sel.value = "1"; actions.forSaleOk({ dataset: { id: "b1" } });
    const c = getCoin("b1"); return start && c.stage === "forsale" && c.biz === true;
  }));
  ok("Switch starts on Business for a Business coin; Personal choice removes biz", await ev(() => {
    actions.notForSale({ dataset: { id: "b1" } });
    actions.forSale({ dataset: { id: "b1" } });
    const sel = document.getElementById("fsBiz"); const start = sel.value === "1";
    sel.value = ""; actions.forSaleOk({ dataset: { id: "b1" } });
    const c = getCoin("b1"); return start && c.stage === "forsale" && !("biz" in c);
  }));
  ok("Don't ask again still asks for a Personal coin in Seller Mode", await ev(() => {
    actions.notForSale({ dataset: { id: "b1" } }); saveSettings({ skipForSaleAsk: true }, true);
    actions.forSale({ dataset: { id: "b1" } });
    const asked = !!document.getElementById("fsBiz") && getCoin("b1").stage !== "forsale"; closeSheet(); return asked;
  }));
  ok("Inherited coin: no switch, no biz", await ev(() => {
    put("c_i1", { ...blankCoin(), id: "i1", typeName: "I", year: "1981", qty: 1, status: "owned", source: "Inherited" }, true);
    actions.forSale({ dataset: { id: "i1" } }); const no = !document.getElementById("fsBiz"); closeSheet(); return no && !getCoin("i1").biz;
  }));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
