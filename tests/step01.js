const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // A: narrow then widen keeps own spots, hidden spots, coins
  await p.evaluate(() => {
    const a = { kind: "album", id: "m1", brand: "Whitman", number: "1", name: "", typeId: "morgan-dollar", start: 1878, end: 1880, removed: ["1878|CC|"], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1878, 1880); a.slots.push({ id: "c1", y: 1878, m: "", v: "My spot", custom: true });
    put("a_m1", a);
    saveCoin({ ...blankCoin(), id: "k1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1878, mint: "", variety: "My spot", grade: "VF-20", albumId: "m1", slotId: "c1" });
    go("album-m1");
  });
  await p.waitForTimeout(200);
  const edit = async (s, e) => { await p.click("[data-act=editAlbum]"); await p.fill("#editAlbumForm [name=start]", s); await p.fill("#editAlbumForm [name=end]", e); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200); };
  const removedBefore = await p.evaluate(() => getAlbum("m1").removed.slice());
  await edit("1879", "1880"); await edit("1878", "1880");
  const r = await p.evaluate(() => { const a = getAlbum("m1"); return { custom: a.slots.some((s) => s.id === "c1"), removed: a.removed, n: a.slots.length, dup: a.slots.length !== new Set(a.slots.map((s) => s.y + "|" + s.m + "|" + (s.v || ""))).size, owned: ownedCoins().filter((c) => c.albumId === "m1").length, stats: albumStats(a) }; });
  ok("custom spot kept", r.custom);
  ok("hidden spot stays hidden", JSON.stringify(r.removed) === JSON.stringify(removedBefore));
  ok("no duplicate spots", !r.dup);
  ok("coin still fills its spot", JSON.stringify(r.stats).includes('"c1"') || r.stats.filled >= 1 || r.stats.have >= 1);
  console.log(JSON.stringify(r.stats).slice(0, 160));
  // B: change mint of a spot coin
  await p.evaluate(() => {
    const a = { kind: "album", id: "m2", brand: "Whitman", number: "2", name: "", typeId: "morgan-dollar", start: 1880, end: 1880, removed: [], createdAt: 2 };
    a.slots = buildSlots(a.typeId, 1880, 1880); put("a_m2", a); withSlotIds(a);
    const s = getAlbum("m2").slots.find((x) => x.y === 1880 && x.m === "S");
    saveCoin({ ...blankCoin(), id: "k2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20", albumId: "m2", slotId: s.id });
    openCoinForm("k2");
  });
  await p.waitForTimeout(150);
  await p.selectOption("[data-f=mint]", "O"); await p.click("#coinForm [type=submit], .btn.primary[type=submit]"); await p.waitForTimeout(200);
  const b2 = await p.evaluate(() => { const a = getAlbum("m2"); const so = a.slots.find((x) => x.y === 1880 && x.m === "O"); const c = getCoin("k2"); return { slotId: c.slotId || "", fillsO: so && albumStats(a).filled && JSON.stringify(albumStats(a)).includes("k2") }; });
  ok("mint change clears old spot link", b2.slotId === "");
  ok("coin now fills the O spot", !!b2.fillsO);
  // C: snapshot omits maxPrice unless ticked
  await p.evaluate(() => { put("w_x1", { kind: "want", id: "x1", typeId: "morgan-dollar", year: 1893, mint: "S", maxPrice: 444.44, listId: DEFAULT_LIST_ID, createdAt: 1 }); });
  const docs = await p.evaluate(async () => (await snapshotDocs({ photos: false })).find((d) => d.id === "w_x1").data.maxPrice);
  const docs2 = await p.evaluate(async () => (await snapshotDocs({ photos: false, maxPay: true })).find((d) => d.id === "w_x1").data.maxPrice);
  ok("max pay left out", docs === "");
  ok("max pay included when ticked", docs2 === 444.44);
  // D: below lowest grade, no variety
  const t = await p.evaluate(() => { const c = { ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1878, mint: "", grade: "VF-8", gradeMode: "raw" }; const bl = bookLookup(c); return { below: bl && bl.below, text: bookText(c, bl) }; });
  ok("below-grade for variety-only date", t.below === true);
  console.log(JSON.stringify(t.text).slice(0, 140));
  // E: Escape on new list returns to want form
  await p.evaluate(() => { go("wants"); openWantForm(null); }); await p.waitForTimeout(150);
  await p.fill("[name=maxPrice]", "12.50"); await p.selectOption("#wantListPick, [name=listId]", "__new"); await p.waitForTimeout(150);
  ok("new list sheet open", await p.evaluate(() => !!document.querySelector("#wlForm")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  ok("Escape returns to want form with typed value", await p.evaluate(() => { const f = document.querySelector("[name=maxPrice]"); return !!f && f.value === "12.5" || (!!f && f.value === "12.50"); }));
  await p.selectOption("#wantListPick, [name=listId]", "__new"); await p.waitForTimeout(100);
  await p.mouse.click(5, 5); await p.waitForTimeout(150);
  ok("outside tap returns to want form", await p.evaluate(() => !!document.querySelector("[name=maxPrice]") && !document.querySelector("#wlForm")));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
