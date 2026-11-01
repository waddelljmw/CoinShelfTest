const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const mk = (id, typeId, s, e) => { const a = { kind: "album", id, brand: "Whitman", number: id, name: "", typeId, start: s, end: e, removed: [], createdAt: 1 }; a.slots = buildSlots(typeId, s, e); put("a_" + id, a); };
    mk("am", "morgan-dollar", 1878, 1880); mk("ap", "peace-dollar", 1921, 1923);
    saveCoin({ ...blankCoin(), id: "k1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", year: 1880, mint: "S", grade: "VF-20", paid: 30, notes: "keep me", photos: [] });
    go("coin-k1");
  });
  await p.waitForTimeout(150);
  await p.click("[data-act=edit]"); await p.waitForTimeout(150);
  const f = await p.evaluate(() => ({ search: !!document.querySelector("#typeSearch"), locked: (document.querySelector(".locked-type") || {}).textContent || "", albums: [...document.querySelectorAll("[data-f=albumId] option")].map((o) => o.value) }));
  ok("edit form hides type search", !f.search);
  ok("edit form shows locked type", /Morgan/.test(f.locked));
  ok("album list only shows Morgan albums", f.albums.includes("am") && !f.albums.includes("ap"));
  // tamper: try to change type via DOM / draft and save
  await p.evaluate(() => { draft.typeId = "peace-dollar"; draft.typeName = "Peace Dollar"; pickType("peace-dollar"); });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("type unchanged after tamper", await p.evaluate(() => getCoin("k1").typeId === "morgan-dollar" && getCoin("k1").typeName === "Morgan Dollar"));
  // tamper: put it in Peace album
  await p.evaluate(() => { openCoinForm("k1"); draft.albumId = "ap"; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("can't move into another type's album", await p.evaluate(() => getCoin("k1").albumId !== "ap"));
  await p.evaluate(() => closeSheet());
  // Re-add flow
  await p.evaluate(() => go("coin-k1")); await p.waitForTimeout(100);
  await p.click("[data-act=edit]"); await p.waitForTimeout(100); await p.click("[data-act=retype]"); await p.waitForTimeout(150);
  ok("re-add opens a new coin form with type search", await p.evaluate(() => !!document.querySelector("#typeSearch") && draft._isNew && draft._replaces === "k1"));
  await p.fill("#typeSearch", "peace"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.waitForTimeout(100);
  await p.fill("[data-f=year]", "1922"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const r = await p.evaluate(() => { const owned = ownedCoins(); return { n: owned.length, t: owned[0] && owned[0].typeId, paid: owned[0] && owned[0].paid, notes: owned[0] && owned[0].notes, old: getCoin("k1").status }; });
  ok("old coin moved to Recently deleted", r.old === "deleted");
  ok("new coin has new type and copied details", r.n === 1 && r.t === "peace-dollar" && String(r.paid) === "30" && r.notes === "keep me");
  await p.click("#toast button"); await p.waitForTimeout(200);
  ok("Undo restores the original", await p.evaluate(() => ownedCoins().length === 1 && getCoin("k1").status === "owned" && getCoin("k1").typeId === "morgan-dollar"));
  // New coin: pick album first sets type; then picking another type clears album
  await p.evaluate(() => { closeSheet(); openCoinForm(); }); await p.waitForTimeout(100);
  await p.selectOption("[data-f=albumId]", "ap"); await p.waitForTimeout(150);
  ok("picking album first sets its type", await p.evaluate(() => draft.typeId === "peace-dollar" && draft.albumId === "ap"));
  await p.evaluate(() => { draft._isNew = true; }); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.waitForTimeout(100);
  ok("changing type on a new coin clears mismatched album", await p.evaluate(() => draft.typeId === "morgan-dollar" && draft.albumId === ""));
  await p.evaluate(() => closeSheet());
  // Wants
  await p.evaluate(() => {
    ensureDefaultList();
    put("wl_peace", { kind: "wantlist", id: "peace", name: "Peace only", scope: "type", typeId: "peace-dollar", grade: "", createdAt: 3 });
    put("wl_cust", { kind: "wantlist", id: "cust", name: "Birthday", scope: "any", typeId: "", grade: "", createdAt: 4 });
    put("w_m1", { kind: "want", id: "m1", typeId: "morgan-dollar", year: 1893, mint: "S", listId: DEFAULT_LIST_ID, createdAt: 1 });
    go("wants"); openWantForm("m1");
  });
  await p.waitForTimeout(150);
  const wf = await p.evaluate(() => ({ lists: [...document.querySelectorAll("#wantListPick option")].map((o) => o.value), typeDisabled: document.querySelector("#wantForm select[name=typeId]").disabled }));
  ok("Peace-only list not offered for a Morgan want", !wf.lists.includes("peace") && wf.lists.includes("cust"));
  ok("want type locked", wf.typeDisabled);
  await p.selectOption("#wantListPick", "cust"); await p.waitForTimeout(100); await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(150);
  ok("Morgan want moves to custom list, still Morgan", await p.evaluate(() => getWant("m1").listId === "cust" && getWant("m1").typeId === "morgan-dollar"));
  // tamper: force Peace list via DOM
  await p.evaluate(() => { openWantForm("m1"); const s = document.querySelector("#wantListPick"); const o = document.createElement("option"); o.value = "peace"; s.appendChild(o); s.value = "peace"; saveWantForm(document.querySelector("#wantForm")); });
  ok("tampered move to Peace list blocked", await p.evaluate(() => getWant("m1").listId === "cust" && getWant("m1").typeId === "morgan-dollar"));
  // new list scoped to Peace from the edit form
  await p.evaluate(() => { closeSheet(); openWantForm("m1"); }); await p.selectOption("#wantListPick", "__new"); await p.waitForTimeout(100);
  await p.fill("#wlForm [name=name]", "Peace 2"); await p.selectOption("#wlScope", "type"); await p.waitForTimeout(100);
  await p.selectOption("#wlForm [name=typeId]", "peace-dollar"); await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(200);
  ok("new Peace list from Morgan want keeps it Morgan on its list", await p.evaluate(() => getWant("m1").typeId === "morgan-dollar" && document.querySelector("#wantListPick").value === "cust"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
