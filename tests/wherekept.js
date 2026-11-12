const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    put("b_bx1", { kind: "box", id: "bx1", name: "Gray Box", type: "storage", createdAt: 1 });
    const mk = (id, extra) => { const a = { kind: "album", id, brand: "Whitman", number: id, name: "", typeId: "morgan-dollar", start: 1880, end: 1880, removed: [], createdAt: 1, ...extra }; a.slots = buildSlots(a.typeId, 1880, 1880); put("a_" + id, a); };
    mk("a1", { keptBox: "bx1", keptPlace: "Shelf 2" }); mk("a2", {}); mk("a3", { keptBox: "bx1" });
    const mc = (id, al) => saveCoin({ ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", albumId: al });
    mc("c1", "a1"); mc("c2", "a2"); mc("c3", "a3");
    return ["c1", "c2", "c3"].map((i) => whereText2(getCoin(i)));
  });
  ok("full chain", r[0] === "Whitman a1 › Gray Box › Shelf 2");
  ok("album only", r[1] === "Whitman a2");
  ok("no shelf spot left off", r[2] === "Whitman a3 › Gray Box");
  await p.evaluate(() => go("coin-c1")); await p.waitForTimeout(200);
  ok("coin page shows chain", /Gray Box › Shelf 2/.test(await p.textContent(".album-chip")));
  await p.evaluate(() => { go("home"); actions.guideStart(); }); await p.waitForTimeout(300);
  ok("walkthrough step 1 has Next", await p.locator("#guideBubble [data-act=guideNext]").count() === 1);
  await p.evaluate(() => { guide.step = 3; guideBubble(); });
  ok("walkthrough step 4 has Next", await p.locator("#guideBubble [data-act=guideNext]").count() === 1);
  await p.evaluate(() => { guide.step = 5; guideBubble(); });
  ok("walkthrough step 6 has no Next", await p.locator("#guideBubble [data-act=guideNext]").count() === 0);
  ok("no page errors", errors.length === 0);
  await b.close();
})();
