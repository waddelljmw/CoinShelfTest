// v0.106.1: the Needs Attention run only keeps going for coins it opened; a coin opened from an album edits normally and Save stays put.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f) => p.evaluate(f);
  await ev(() => {
    saveCoin({ ...blankCoin(), id: "n1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "" });
    saveCoin({ ...blankCoin(), id: "n2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1882, mint: "S", grade: "" });
  });
  await ev(() => actions.fixupStart()); await p.waitForTimeout(250);
  ok("run keeps going from the button", await ev(() => fixup.on && !!document.querySelector("#coinForm")));
  await ev(() => { closeSheet(); go("coin-n2"); }); await p.waitForTimeout(150);
  await ev(() => openCoinForm("n2")); await p.waitForTimeout(250);
  ok("opening a coin by hand ends the run", await ev(() => !fixup.on) && !(await p.$("[data-act=fixupSkip]")));
  await ev(() => { draft.grade = "G-4"; draft.paid = "1"; draft.source = "Coin Shop"; });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("Save does not jump to another coin", await ev(() => !document.querySelector("#coinForm") && location.hash === "#coin-n2"));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
