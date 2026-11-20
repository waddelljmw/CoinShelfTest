// R4-39: "+" on an empty box slot offers a coin you already have (or a new one); one Undo.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    put("b_bx1", { kind: "box", id: "bx1", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 });
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan", typeName: "Morgan dollar", year: "1921", metal: "Silver", value: "50", qty: 1, status: "owned", ...o });
    mk("loose1", { year: "1881" }); mk("inbox", { boxId: "bx1", boxRow: "1", boxSlot: "1" }); mk("two", { qty: 2 });
    put("a_al1", { kind: "album", id: "al1", name: "Morgan set", typeId: "morgan", start: 1878, end: 1921 }); mk("inalbum", { albumId: "al1" });
    go("box-bx1");
  });
  await p.waitForTimeout(200);
  await p.click('.slot[data-slot="2"][data-row="1"]'); await p.waitForTimeout(200);
  const opts = await p.evaluate(() => [...document.querySelectorAll('#sheet [data-flt="boxHave"] option')].map((o) => o.value).filter(Boolean));
  ok("offers only the single loose coin", JSON.stringify(opts) === JSON.stringify(["loose1"]));
  ok("also offers a new coin", !!(await p.$('#sheet [data-act="boxAddNew"]')));
  await p.click('#sheet [data-act="boxHave"]'); await p.waitForTimeout(100);
  ok("asks to pick a coin first", await p.evaluate(() => !getCoin("loose1").boxId));
  await p.selectOption('#sheet [data-flt="boxHave"]', "loose1"); await p.click('#sheet [data-act="boxHave"]'); await p.waitForTimeout(200);
  ok("coin is placed in row 1, slot 2", await p.evaluate(() => { const c = getCoin("loose1"); return c.boxId === "bx1" && c.boxRow === "1" && c.boxSlot === "2"; }));
  ok("slot now shows the coin", !(await p.$('.slot[data-slot="2"][data-row="1"][data-act="boxAdd"]')));
  await p.click(".toast [data-act], .toast button"); await p.waitForTimeout(200);
  ok("Undo puts it back loose", await p.evaluate(() => { const c = getCoin("loose1"); return !c.boxId && !c.boxRow; }));
  await p.evaluate(() => { put("c_loose1", { ...getCoin("loose1"), status: "sold" }); render(); });
  await p.click('.slot[data-slot="3"][data-row="1"]'); await p.waitForTimeout(250);
  ok("with no coin to offer, the new coin form opens straight away", await p.evaluate(() => !document.querySelector('#sheet [data-flt="boxHave"]') && !!document.querySelector("#coinForm")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
