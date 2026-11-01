const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // Your Whitman 9122 as saved today: silver type only, years 1932-1990, spots stop at 1964
  await p.evaluate(() => {
    const a = { kind: "album", id: "w9122", brand: "Whitman", number: "9122", name: "Washington Quarters 1932-1990", typeId: "washington-silver", start: 1932, end: 1990, removed: [], createdAt: 1 };
    a.slots = buildSlots("washington-silver", 1932, 1964); put("a_w9122", a);
    const s = getAlbum("w9122").slots.find((x) => x.y === 1940 && x.m === "D");
    saveCoin({ ...blankCoin(), id: "q40", typeId: "washington-silver", typeName: "Washington Quarter", denom: "25C", year: 1940, mint: "D", grade: "VF-20", albumId: "w9122", slotId: s.id });
    go("album-w9122");
  });
  await p.waitForTimeout(200);
  const before = await p.evaluate(() => albumStats(getAlbum("w9122")).total);
  await p.click("[data-act=editAlbum]"); await p.click("[data-act=albumAddType]");
  await p.selectOption("#albumTypes select >> nth=1", "washington-clad");
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const a = getAlbum("w9122"); const st = albumStats(a); return { types: albumTypes(a), total: st.total, has1965: a.slots.some((s) => s.y === 1965), has1991: a.slots.some((s) => s.y > 1990), has1933: a.slots.some((s) => s.y === 1933), owned: st.owned, sub: document.querySelector("h1 + .small").textContent }; });
  ok("clad type added to album", r.types.join() === "washington-silver,washington-clad");
  ok("1965–1990 spots added, nothing past 1990, no 1933", r.has1965 && !r.has1991 && !r.has1933 && r.total > before);
  ok("1940-D silver coin still in its spot", r.owned === 1);
  console.log(before, "→", r.total, "|", r.sub);
  // add a clad coin from its spot
  await p.click('.slot:has-text("1970-D")'); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  ok("spot add coin uses clad type", await p.evaluate(() => draft.typeId === "washington-clad" && draft.year === 1970));
  await p.selectOption("[data-f=grade]", "MS-63"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("clad coin fills 1970-D", await p.evaluate(() => albumStats(getAlbum("w9122")).owned === 2));
  ok("album offered for silver and clad coins, not Morgan", await p.evaluate(() => albumsForCoin({ typeId: "washington-clad" }).some((a) => a.id === "w9122") && albumsForCoin({ typeId: "washington-silver" }).some((a) => a.id === "w9122") && !albumsForCoin({ typeId: "morgan-dollar" }).some((a) => a.id === "w9122")));
  // silver coin dated 1970 can't be saved (year check), and a clad 1950 doesn't fill a silver spot
  ok("wrong-type date doesn't fill", await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "bad", typeId: "washington-clad", typeName: "x", year: 1950, mint: "D", albumId: "w9122" }); const st = albumStats(getAlbum("w9122")); return st.owned === 2; }));
  await p.evaluate(() => remove("c_bad"));
  // Removing clad drops its empty spots but keeps silver
  await p.click("[data-act=editAlbum]"); await p.waitForTimeout(100); console.log("rows", await p.evaluate(() => document.querySelectorAll("#albumTypes .type-row").length)); await p.click("#albumTypes .type-row:nth-child(2) [data-act=albumDelType]"); ok("mismatched years blocked with a message", await (async () => { await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150); return /cover 1932–1964/.test(await p.textContent("#toast")); })()); await p.fill("#editAlbumForm [name=end]", "1964");
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  console.log(await p.evaluate(() => JSON.stringify({ t: albumTypes(getAlbum("w9122")), late: getAlbum("w9122").slots.filter((s) => s.y > 1964).slice(0, 3) }))); ok("removing clad drops clad spots", await p.evaluate(() => !getAlbum("w9122").slots.some((s) => s.y > 1964)));
  // Type set album via the New album form
  await p.evaluate(() => go("albums")); await p.waitForTimeout(100);
  await p.click("[data-act=newAlbum]"); await p.selectOption("#albumLayout", "set");
  await p.fill("#albumForm [name=name]", "US Type Set");
  const types = ["morgan-dollar", "barber-dime", "roosevelt-silver", "indian-cent", "ike-clad", "lincoln-wheat"];
  await p.selectOption("#albumTypes select >> nth=0", types[0]);
  for (let i = 1; i < types.length; i++) { await p.click("[data-act=albumAddType]"); await p.selectOption(`#albumTypes select >> nth=${i}`, types[i]); }
  await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(200);
  const set = await p.evaluate(() => { const a = albums().find((x) => x.name === "US Type Set"); return { id: a.id, n: a.slots.length, set: a.layout, labels: [...document.querySelectorAll(".slot")].map((e) => e.textContent.trim().slice(0, 18)) }; });
  ok("type set has one spot per type", set.set === "set" && set.n === 6);
  console.log(set.labels.join(" | "));
  // custom Bicentennial spot
  await p.evaluate((id) => { const a = getAlbum(id); put("a_" + id, { ...a, typeIds: [...a.typeIds, "washington-clad"], slots: [...a.slots, { id: "bic", set: true, t: "washington-clad", y: "", m: "", v: "Bicentennial", custom: true }] }); }, set.id);
  await p.waitForTimeout(150);
  // add Morgan from spot: any date
  await p.click('.slot:has-text("Morgan")'); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  ok("set spot opens Morgan form with blank year", await p.evaluate(() => draft.typeId === "morgan-dollar" && draft.year === ""));
  await p.fill("[data-f=year]", "1884"); await p.selectOption("[data-f=mint]", "O"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("1884-O Morgan fills the Morgan spot", await p.evaluate((id) => { const st = albumStats(getAlbum(id)); return st.owned === 1 && st.filled.get("set:morgan-dollar").year === 1884; }, set.id));
  // want from a set spot
  await p.click('.slot:has-text("Barber")'); await p.click("[data-act=slotWant]"); await p.waitForTimeout(100); await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(150);
  ok("Barber dime want added (any year)", await p.evaluate(() => wants().some((w) => w.typeId === "barber-dime" && w.year === "")));
  ok("set spot shows wanted", (await p.textContent('.slot:has-text("Barber")')).includes("wanted"));
  // missing picker
  await p.click("[data-act=missing]"); await p.waitForTimeout(150);
  ok("missing lists the unfilled types", await p.evaluate(() => document.querySelectorAll("#sheet .rowline").length === 6));
  await p.evaluate(() => closeSheet());
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
