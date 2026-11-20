const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const png = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='18' fill='#b88a2e'/></svg>");
  await p.evaluate((png) => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1881, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1881); put("a_a1", a); withSlotIds(a);
    const sp = (y, m) => getAlbum("a1").slots.find((x) => x.y === y && x.m === m);
    saveCoin({ ...blankCoin(), id: "p1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20", albumId: "a1", slotId: sp(1880, "S").id, photos: [{ url: png }] });
    saveCoin({ ...blankCoin(), id: "p2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "VF-20", albumId: "a1", slotId: sp(1881, "S").id });
    go("album-a1");
  }, png);
  await p.waitForTimeout(400);
  ok("spot with a photo shows it", (await p.$$(".slot.have .slot-photo")).length === 1);
  const have = await p.$$(".slot.have");
  ok("coin without a photo looks as before", have.length === 2 && (await have[1].$(".slot-photo")) === null);
  await p.screenshot({ path: "/tmp/m20.png" });
  ok("no page errors", errors.length === 0);
  await b.close();
})();
