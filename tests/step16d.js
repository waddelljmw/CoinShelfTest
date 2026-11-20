const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1881, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1881); put("a_a1", a); withSlotIds(a);
    const s = getAlbum("a1").slots.find((x) => x.m === "S" && x.y === 1881);
    saveCoin({ ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "VF-20", albumId: "a1", slotId: s.id });
    saveCoin({ ...blankCoin(), id: "n1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "XF-40", qty: 1 });
    listState.q = "1881 S morgan"; go("coins");
  });
  await p.waitForTimeout(300);
  const row = await p.textContent("[data-act=lookupOpen]");
  ok("row says You own 2", /You own 2/.test(row)); console.log(row.trim());
  await p.evaluate(() => { listState.q = "1880 O morgan"; render(); }); await p.waitForTimeout(150);
  ok("not owned: no You own", !/You own/.test(await p.textContent("[data-act=lookupOpen]")));
  await p.evaluate(() => { listState.q = "1881 S morgan"; render(); }); await p.waitForTimeout(150);
  await p.click("[data-act=lookupOpen]"); await p.waitForTimeout(250);
  const sheet = await p.textContent("#sheet");
  ok("card says where it is", /You own 2/.test(sheet) && /Whitman/.test(sheet) && /not in an album or box/.test(sheet)); 
  await p.click("#sheet [data-go^=coin-]"); await p.waitForTimeout(300);
  ok("tap opens your coin", await p.evaluate(() => /^#coin-/.test(location.hash)));
  ok("sheet closed", await p.evaluate(() => !document.querySelector("#sheet .sheet-head")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
