// "Take out of album": coins go loose (default) or into a box, stay in the collection, Undo restores them.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    put("a_Zed", { kind: "album", id: "Zed", brand: "Other", number: "", name: "Zed", typeId: "morgan-dollar", typeIds: ["morgan-dollar"] });
    saveCoin({ ...blankCoin(), id: "t1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20", albumId: "Zed" });
    saveCoin({ ...blankCoin(), id: "t2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "VF-20" });
    go("coins");
  });
  await p.waitForTimeout(250);
  await p.evaluate(() => { listState.sel = new Set(["t1", "t2"]); render(); });
  await p.waitForTimeout(150);
  ok("button is there", !!(await p.$("[data-act=toOpen]")));
  await p.evaluate(() => actions.toOpen()); await p.waitForTimeout(100);
  ok("sheet defaults to Loose", await p.$eval('#sheet [data-flt="to"]', (e) => e.value) === "none");
  await p.evaluate(() => actions.toGo()); await p.waitForTimeout(150);
  ok("album coin is now loose", await p.evaluate(() => !getCoin("t1").albumId));
  ok("coin is still owned (not deleted)", await p.evaluate(() => getCoin("t1").status === "owned"));
  ok("coin not in an album was skipped, unchanged", await p.evaluate(() => getCoin("t2").status === "owned"));
  await p.evaluate(() => actions.fltUndo()); await p.waitForTimeout(100);
  ok("Undo puts it back in the album", await p.evaluate(() => getCoin("t1").albumId === "Zed"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
