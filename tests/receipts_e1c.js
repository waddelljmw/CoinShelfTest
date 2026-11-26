// E1c (v0.123.0): receipts for coins already in albums.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (f, a) => p.evaluate(f, a), wait = (n = 300) => p.waitForTimeout(n);
  await ev(() => {
    const a = { kind: "album", id: "a1", brand: "Other", number: "", name: "Morgans", typeId: "morgan-dollar", start: 1880, end: 1882, removed: [], createdAt: 1 }; a.slots = buildSlots(a.typeId, 1880, 1882); put("a_a1", a); withSlotIds(a);
    [0, 1, 2, 3, 4].forEach((i) => { const s = getAlbum("a1").slots[i]; saveCoin({ ...blankCoin(), id: "g" + i, typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", year: s.y, mint: s.m, grade: "VF-20", paid: "", source: i === 4 ? "Inherited" : "Coin Shop", albumId: "a1", slotId: s.id }); });
  });
  await ev(() => go("purchases")); await wait();
  await p.click("[data-act=purchaseNew]"); await wait();
  await p.fill("#purchaseForm [data-pf=seller]", "Main Street Coins");
  await p.fill("#purchaseForm [data-pf=date]", "2026-01-05");
  await p.click("[data-act=purchasePickOpen]"); await wait();
  await p.selectOption("#purchaseAlbum", "a1"); await wait();
  ok("album lists its 5 coins", (await p.$$("#purchasePick [data-pa]")).length === 5);
  ok("the inherited one can't be ticked", await p.$eval("#purchasePick [data-pa=g4]", (x) => x.disabled));
  for (const id of ["g0", "g1", "g2"]) await p.check("#purchasePick [data-pa=" + id + "]");
  ok("button counts the ticks", /Add 3 ticked coins/.test(await p.textContent("[data-act=purchasePickDone]")));
  await p.screenshot({ path: "/tmp/e1c.png" });
  await p.click("[data-act=purchaseSave][data-next]"); await wait(500);
  ok("Save keeps the ticked coins", await ev(() => ["g0", "g1", "g2"].every((id) => !!getCoin(id).purchaseId) && !getCoin("g3").purchaseId));
  ok("next receipt keeps date and store", await ev(() => pd.date === "2026-01-05" && pd.seller === "Main Street Coins" && !pd.items.length && !pd.id));
  await ev(() => closeSheet());
  await ev(() => go("album-a1")); await wait();
  await p.click("[data-act=selStart]"); await wait();
  await ev(() => { ["g0", "g3", "g4"].forEach((id) => listState.sel.add(id)); render(); });
  await p.click("[data-act=receiptOpen]"); await wait();
  await p.click("#sheet [data-act=receiptPick][data-id='']"); await wait();
  ok("new receipt holds only the coin that can go on it", await ev(() => pd.items.length === 1 && pd.items[0].id === "g3"));
  ok("nothing saved yet", await ev(() => !getCoin("g3").purchaseId));
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
