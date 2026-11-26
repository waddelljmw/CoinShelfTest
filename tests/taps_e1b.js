// E1b (v0.122.0): fewer taps for big jobs.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (f, a) => p.evaluate(f, a), wait = (n = 300) => p.waitForTimeout(n);
  await ev(() => {
    saveSettings({ showSold: true, sellOn: true, level: "full" });
    for (let i = 1; i <= 4; i++) { const a = { kind: "album", id: "a" + i, brand: "Other", number: "", name: i === 4 ? "Peace set" : "Morgan " + i, typeId: i === 4 ? "peace-dollar" : "morgan-dollar", start: i === 4 ? 1922 : 1880, end: i === 4 ? 1923 : 1882, removed: [], createdAt: i }; a.slots = buildSlots(a.typeId, a.start, a.end); put("a_" + a.id, a); withSlotIds(a); }
    [0, 1, 2].forEach((i) => { const s = getAlbum("a1").slots[i]; saveCoin({ ...blankCoin(), id: "g" + i, typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", year: s.y, mint: s.m, grade: "", paid: "1", value: String(10 * (i + 1)), source: "Coin Shop", albumId: "a1", slotId: s.id, ask: i === 0 ? "99" : "" }); });
  });
  // Quick grade: pick a grade, the next coin opens
  await ev(() => go("album-a1")); await wait();
  await p.click("[data-act=fixupQuick]"); await wait();
  const first = await ev(() => draft.id);
  await p.click("#sheet [data-act=quickPick][data-g='VF-20']"); await wait();
  ok("tapping a grade saves it", await ev((id) => getCoin(id).grade === "VF-20", first));
  ok("the next coin opens", await ev((id) => !!draft && draft.id !== id, first));
  await ev(() => actions.fixupStop()); await wait();
  // Select by grade, and the Select bar stays on screen
  await p.click("[data-act=selStart]"); await wait();
  await p.click("[data-act=selGradeOpen]"); await wait();
  await p.check("#sheet [data-selg='VF-20']"); await p.click("#sheet [data-act=selGradeGo]"); await wait();
  ok("Select by grade ticks the matching coin", await ev((id) => listState.sel.size === 1 && listState.sel.has(id), first));
  await ev(() => window.scrollTo(0, 600)); await wait();
  const bar = await p.$eval(".selstick", (x) => { const r = x.getBoundingClientRect(); return { top: r.top, h: r.height, top0: document.querySelector(".topbar").getBoundingClientRect().bottom, max: document.body.scrollHeight - innerHeight }; });
  ok("Select bar stays under the top bar " + JSON.stringify(bar), bar.max < 200 || Math.abs(bar.top - bar.top0) <= 2);
  await ev(() => actions.selDone()); await wait();
  // Sell together: lot price split by value, then asking prices
  await ev(() => { go("coins"); }); await wait();
  await ev(() => openOrder(ownedCoins())); await wait();
  await p.click("#sheet [data-act=orderMode][data-v=lot]"); await p.fill("#sheet [name=lot]", "120"); await wait(100);
  const split = await ev(() => ["g0", "g1", "g2"].map((id) => +document.querySelector("#orderForm").elements["p_" + id].value));
  ok("lot price splits by value " + JSON.stringify(split), JSON.stringify(split) === "[20,40,60]");
  await p.click("#sheet [data-act=orderAsk]"); await wait(100);
  ok("asking price fills in", await ev(() => document.querySelector("#orderForm").elements.p_g0.value === "99" && !document.querySelector("#orderForm").elements.p_g1.readOnly));
  await ev(() => closeSheet());
  // My Albums search
  await ev(() => go("albums")); await wait();
  await p.fill("#albumSearch", "peace"); await wait(100);
  ok("search leaves one album", (await p.$$eval(".album-card:not([hidden])", (x) => x.length)) === 1);
  await p.fill("#albumSearch", ""); await wait(100);
  ok("clearing shows all", (await p.$$eval(".album-card:not([hidden])", (x) => x.length)) === 4);
  // Fill spots: whole row ticks, Save stays at the bottom
  await ev(() => { const s = getAlbum("a2").slots.length; openFillAlbum("a2"); }); await wait();
  await p.click("#fillRows .fill-row:first-child .fill-name"); await wait(100);
  ok("tapping the row ticks it", await p.$eval("#fillRows .fill-row .fill-on", (x) => x.checked));
  const save = await p.$eval("[data-act=fillGo]", (x) => x.getBoundingClientRect().bottom);
  ok("Save is on screen without scrolling (" + Math.round(save) + ")", save <= 844);
  await p.screenshot({ path: "/tmp/e1b-fill.png" });
  await ev(() => closeSheet());
  // Loose coins offered after making an album; nothing moves before the tap
  await ev(() => { saveCoin({ ...blankCoin(), id: "L1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "VF-20" }); saveCoin({ ...blankCoin(), id: "L2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1882, mint: "S", grade: "F-12" }); });
  await ev(() => { const a = { kind: "album", id: "n1", brand: "Other", number: "", name: "New one", typeId: "morgan-dollar", start: 1880, end: 1882, removed: [], createdAt: 9 }; a.slots = buildSlots(a.typeId, 1880, 1882); put("a_n1", a); withSlotIds(a); openLooseOffer("n1", false); }); await wait();
  ok("two loose coins offered", (await p.$$("#looseRows [data-loose]")).length === 2);
  ok("nothing moved yet", await ev(() => !getCoin("L1").albumId && !getCoin("L2").albumId));
  await p.uncheck("#looseRows [data-loose=L2]"); await p.screenshot({ path: "/tmp/e1b-loose.png" }); await p.click("#sheet [data-act=looseGo]"); await wait();
  ok("only the ticked one goes in", await ev(() => getCoin("L1").albumId === "n1" && !!getCoin("L1").slotId && !getCoin("L2").albumId));
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
