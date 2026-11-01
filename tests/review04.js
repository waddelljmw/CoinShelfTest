const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // 1: custom labeled spot in a type set keeps its coin
  await p.evaluate(() => {
    const a = { kind: "album", id: "ts", brand: "Whitman", number: "T", name: "", typeId: "washington-clad", typeIds: ["washington-clad", "lincoln-wheat"], layout: "set", start: 1909, end: 1998, removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(a.typeIds, "set"); a.slots.push({ id: "bic", set: true, t: "washington-clad", y: "", m: "", v: "Bicentennial", custom: true });
    put("a_ts", a);
    const plain = a.slots.find((s) => s.t === "washington-clad" && !s.v).id;
    saveCoin({ ...blankCoin(), id: "q1", typeId: "washington-clad", typeName: "Washington Quarter", year: 1970, mint: "D", grade: "MS-63", albumId: "ts", slotId: plain });
    go("album-ts");
  });
  await p.waitForTimeout(150);
  await p.click('.slot:has-text("Bicentennial")'); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  await p.fill("[data-f=year]", "1976"); await p.selectOption("[data-f=grade]", "MS-63"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("#1 coin stays in its labeled type-set spot", await p.evaluate(() => { const st = albumStats(getAlbum("ts")); const c = [...st.filled.entries()].find(([k]) => k.includes("Bicentennial")); return c && c[1].year === 1976 && st.owned === 2; }));
  // 2: Morgan + Peace, all proofs: a Peace proof fills one spot
  await p.evaluate(() => {
    const a = { kind: "album", id: "mp", brand: "Whitman", number: "MP", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar", "peace-dollar"], layout: "dates", start: 1878, end: 1935, proofs: "all", removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(a.typeIds, "dates", 1878, 1935, "all"); put("a_mp", a);
    saveCoin({ ...blankCoin(), id: "p21", typeId: "peace-dollar", typeName: "Peace Dollar", year: 1921, mint: "", grade: "PR-63", albumId: "mp" });
  });
  ok("#2 shared proof year: separate spots, one filled", await p.evaluate(() => { const a = getAlbum("mp"); const ks = a.slots.map(slotKey); const st = albumStats(a); const pf21 = a.slots.filter((s) => s.pf && s.y === 1921); return new Set(ks).size === ks.length && pf21.length === 2 && st.owned === 1 && st.filled.size === 1; }));
  // 3 + 4: import respects album type; zinc stays zinc
  const imp = await p.evaluate(() => {
    const a = { kind: "album", id: "wq", brand: "Whitman", number: "9122", name: "", typeId: "washington-silver", start: 1932, end: 1964, removed: [], createdAt: 1 };
    a.slots = buildSlots("washington-silver", 1932, 1964); put("a_wq", a);
    const get1 = (o) => (k) => o[k];
    const m = rowToCoin(get1({ year: "1921", typeName: "Morgan Dollar", album: "Whitman 9122" }));
    const z = rowToCoin(get1({ year: "1982", mint: "D", typeName: "Lincoln Memorial Cent", metal: "Zinc" }));
    const cu = rowToCoin(get1({ year: "1982", mint: "D", typeName: "Lincoln Memorial Cent", metal: "Copper" }));
    return { zt: (z.coin || z).typeId, ct: (cu.coin || cu).typeId };
  });
  ok("#4 zinc 1982 imports as zinc, copper as copper", imp.zt === "lincoln-memorial-zinc" && imp.ct === "lincoln-memorial-copper");
  ok("#3 album rule helper", await p.evaluate(() => !albumHasType(getAlbum("wq"), "morgan-dollar") && !albumHasType(getAlbum("wq"), "")));
  // 5: regrading into/out of proof re-places the coin
  await p.evaluate(() => {
    const a = { kind: "album", id: "pf", brand: "W", number: "P", name: "", typeId: "washington-clad", typeIds: ["washington-clad"], layout: "dates", start: 1965, end: 1990, proofs: "all", removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(a.typeIds, "dates", 1965, 1990, "all"); put("a_pf", a);
    const reg = a.slots.find((s) => s.y === 1976 && s.m === "S" && !s.pf).id;
    saveCoin({ ...blankCoin(), id: "b76", typeId: "washington-clad", typeName: "Washington Quarter", year: 1976, mint: "S", grade: "MS-63", albumId: "pf", slotId: reg });
    openCoinForm("b76"); draft.grade = "PR-67";
  });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("#5a regraded to PR moves to the proof spot", await p.evaluate(() => { const st = albumStats(getAlbum("pf")); const c = st.filled.get("1976|S|PF"); return c && c.id === "b76"; }));
  await p.evaluate(() => { go("album-pf"); }); await p.waitForTimeout(150);
  await p.click('.slot:has-text("1977-D")'); await p.click("[data-act=slotHave]"); await p.waitForTimeout(100);
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(60); await p.selectOption("[data-f=grade]", "PR-65"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(150);
  ok("#5b proof grade blocked in a regular spot", await p.evaluate(() => !!draft && /regular coin/.test(document.querySelector("#toast").textContent)));
  await p.evaluate(() => closeSheet());
  // 6: proof want says proof
  await p.evaluate(() => { ensureDefaultList(); put("w_pw", { kind: "want", id: "pw", typeId: "washington-clad", typeName: "Washington Quarter", year: 1971, mint: "S", pf: true, listId: DEFAULT_LIST_ID, createdAt: 1 }); go("wants"); openWantForm("pw"); });
  await p.waitForTimeout(100);
  ok("#6 want edit form says proof", /proof/i.test(await p.textContent("#wantForm")));
  // sold coin: no album chip
  await p.evaluate(() => { const c = getCoin("q1"); saveCoin({ ...c, status: "sold", sold: { date: "2026-01-01", amount: 5 } }); closeSheet(); go("coin-q1"); });
  await p.waitForTimeout(150);
  ok("sold coin has no album chip", !(await p.$(".album-chip")));
  // 1921 Peace custom spot in Morgan+Peace album
  await p.evaluate(() => { go("album-mp"); openAddSpot("mp"); });
  await p.waitForTimeout(100);
  await p.selectOption("#spotForm [name=t]", "peace-dollar"); await p.fill("#spotY", "1921"); await p.fill("#spotV", "High Relief"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(150);
  ok("custom 1921 Peace spot added with Peace type", await p.evaluate(() => getAlbum("mp").slots.some((s) => s.custom && s.t === "peace-dollar" && s.y === 1921)));
  await p.evaluate(() => openAddSpot("mp")); await p.selectOption("#spotForm [name=t]", "peace-dollar"); await p.fill("#spotY", "1950"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(150);
  ok("custom spot outside that type's years blocked", await p.evaluate(() => !getAlbum("mp").slots.some((s) => s.y === 1950)));
  await p.evaluate(() => closeSheet());
  ok("zinc message uses full type name", await p.evaluate(() => /\(zinc\)/.test(yearProblem("lincoln-memorial-zinc", 2009, "coin"))));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
