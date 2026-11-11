// Bug #4 (review 08): a box's number shows kept albums as their own number, not added to the coin count.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const t = await p.evaluate(() => {
    put("b_bx1", { kind: "box", id: "bx1", name: "Box one", type: "storage", look: "black", rows: 2, perRow: 3, createdAt: 1 }, true);
    const before = boxCountText(getBox("bx1"));
    put("a_al1", { kind: "album", id: "al1", brand: "Other", number: "Test album", name: "Test album", typeId: COIN_TYPES[0].id, typeIds: [COIN_TYPES[0].id], layout: "dates", start: 1990, end: 1991, removed: [], keptBox: "bx1", createdAt: 1 }, true);
    return [before, boxCountText(getBox("bx1")), boxStats(getBox("bx1")).filled];
  });
  ok("no albums: plain count", t[0] === "0/6");
  ok("one album: own number, coin count unchanged", t[1] === "0/6 · 1 album" && t[2] === 0);
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  ok("Storage page shows it", /0\/6 · 1 album/.test(await p.textContent("body")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
