// Step 11 (Slips and Undo): Take off For sale has Undo, messages last longer.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  ok("Take off For sale shows Undo and Undo puts it back for sale", await ev(() => {
    const c = blankCoin(); Object.assign(c, { id: "u1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", year: 1881, status: "owned", stage: "forsale" });
    saveCoin(c);
    actions.notForSale({ dataset: { id: "u1" } });
    const off = !getCoin("u1").stage, hasUndo = !!$("#toast [data-act=toastAction]");
    $("#toast")._action();
    return off && hasUndo && getCoin("u1").stage === "forsale";
  }));

  ok("messages stay ~1.5 seconds and Undo ~5 (123)", await ev(() => {
    const real = window.setTimeout, seen = [];
    window.setTimeout = (f, ms) => { seen.push(ms); return real(f, ms); };
    toast("hi"); toast("hi", { label: "Undo", fn() {} });
    window.setTimeout = real;
    return seen.includes(1500) && seen.includes(5000);
  }));

  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
