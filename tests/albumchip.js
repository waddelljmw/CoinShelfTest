const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1880, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1880); put("a_a1", a); withSlotIds(a);
    const s = getAlbum("a1").slots.find((x) => x.m === "S");
    saveCoin({ ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20", albumId: "a1", slotId: s.id });
    saveCoin({ ...blankCoin(), id: "n1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "", grade: "VF-20" });
    go("coin-s1");
  });
  await p.waitForTimeout(200);
  const t = await p.textContent(".album-chip");
  ok("shows album and spot", /Whitman/.test(t) && !/spot/.test(t)); console.log(t.trim());
  await p.screenshot({ path: "/tmp/chip.png" });
  await p.click(".album-chip .link-btn"); await p.waitForTimeout(150);
  ok("link opens the album", await p.evaluate(() => location.hash === "#album-a1"));
  await p.evaluate(() => go("coin-n1")); await p.waitForTimeout(150);
  ok("no chip when not in an album", !(await p.$(".album-chip")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
