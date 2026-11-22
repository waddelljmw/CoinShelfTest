// Step 7 Upgrades and wanted: grades for all, "upgrade wanted" tag, one mark, swap in, variety spots survive edits.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f, a) => p.evaluate(f, a);

  // R5-10: every grade except the top of MS and PR has an upgrade
  const miss = await ev(() => GRADES.filter((g) => g !== "Junk" && !upgradeGrade({ grade: g })));
  ok("only MS-70 and PR-70 have no upgrade (got " + miss.join(",") + ")", miss.join() === "MS-70,PR-70");
  ok("AU-58 to MS-60, XF-45 to AU-50, MS-69 stays MS", await ev(() => upgradeGrade({ grade: "AU-58" }) === "MS-60" && upgradeGrade({ grade: "XF-45" }) === "AU-50" && upgradeGrade({ grade: "MS-69" }) === "MS-70"));

  await ev(() => {
    put("b_bx1", { kind: "box", id: "bx1", name: "Gray Box", type: "storage", createdAt: 1 });
    const a = { kind: "album", id: "A1", brand: "Whitman", number: "1", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], start: 1879, end: 1881, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1879, 1881); put("a_A1", a);
    saveCoin({ ...blankCoin(), id: "c1", metal: "Silver", oz: 0.7734, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "XF-45", albumId: "A1", holder: "Album" });
    go("album-A1");
  });
  await p.waitForTimeout(200);

  // R5-10 + R5-9 + R4-35: Want an upgrade from the spot menu on XF-45
  await p.click(".slot.have"); await p.waitForTimeout(100);
  ok("XF-45 spot offers upgrade", (await p.textContent(".sheet")).includes("Want an upgrade (above XF-45)"));
  await p.click("[data-upgrade]"); await p.waitForTimeout(100);
  await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(150);
  ok("coin got the Upgrade wanted tick from the spot's want", await ev(() => getCoin("c1").upgrade === true));
  ok("spot says upgrade wanted", (await p.textContent(".slot.have")).includes("upgrade wanted"));
  ok("empty spot with a plain want still says wanted", await ev(() => {
    const a = getAlbum("A1"); saveWant(newWant({ typeId: "morgan-dollar", year: 1880, mint: "S", albumId: "A1" })); render(); return true; })
    && /★ wanted/.test(await p.textContent(".slot:has-text('1880-S')")) && !/upgrade wanted/.test(await p.textContent(".slot:has-text('1880-S')")));

  // removing the upgrade want clears the tick
  await p.click(".slot.have"); await p.waitForTimeout(100);
  await p.click("[data-act=slotUnwant]"); await p.waitForTimeout(150);
  ok("removing the upgrade want clears the coin's tick", await ev(() => !getCoin("c1").upgrade));

  // ticking on the coin makes the spot's upgrade want
  await ev(() => { const c = getCoin("c1"); saveCoin({ ...c, upgrade: true }); syncUpgradeMark({ ...c, upgrade: true }, c); render(); });
  ok("ticking Upgrade wanted creates the spot's want", await ev(() => { const a = getAlbum("A1"), s = albumStats(a).slots.find((x) => x.y === 1881 && x.m === "S"); const w = spotWants(a, s); return w.length === 1 && w[0].notes === "Upgrade" && w[0].grade === "AU-50"; }));
  await ev(() => { const c = getCoin("c1"); saveCoin({ ...c, upgrade: false }); syncUpgradeMark({ ...c, upgrade: false }, c); });
  ok("unticking removes it", await ev(() => { const a = getAlbum("A1"), s = albumStats(a).slots.find((x) => x.y === 1881 && x.m === "S"); return spotWants(a, s).length === 0; }));
  await ev(() => { const c = getCoin("c1"); saveCoin({ ...c, upgrade: true }); syncUpgradeMark({ ...c, upgrade: true }, c); });

  // R5-7: a better coin for the filled spot asks to swap
  await ev(() => { saveCoin({ ...blankCoin(), id: "c2", metal: "Silver", oz: 0.7734, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "MS-65", albumId: "A1" }); });
  const cand = await ev(() => { const s = swapCandidate(getCoin("c2")); return s && s.old.id; });
  ok("swapCandidate finds the old coin", cand === "c1");
  ok("a worse coin with no upgrade mark is not offered", await ev(() => { const c = { ...getCoin("c2"), grade: "G-4" }; const o = { ...getCoin("c1"), upgrade: false }; saveCoin(o); const r = swapCandidate(c); saveCoin({ ...o, upgrade: true }); return !r; }));
  await ev(() => openSwapSheet(getCoin("c2"), swapCandidate(getCoin("c2")))); await p.waitForTimeout(100);
  const sheet = await p.textContent(".sheet");
  ok("swap sheet text", sheet.includes("Put the MS-65 in the spot?") && sheet.includes("XF-45") && sheet.includes("old one for sale") && sheet.includes("Gray Box"));
  await p.click("[data-to=box]"); await p.waitForTimeout(200);
  const after = await ev(() => { const n = getCoin("c2"), o = getCoin("c1"), a = getAlbum("A1"), st = albumStats(a); const s = st.slots.find((x) => x.y === 1881 && x.m === "S"); const a2 = spotWants(a, s); return { inSpot: st.filled.get(slotKey(s)).id, oldBox: o.boxId, oldAlbum: o.albumId || "", oldUp: !!o.upgrade, wants: a2.length, newSlot: !!n.slotId }; });
  ok("new coin holds the spot", after.inSpot === "c2");
  ok("old coin went to the box, out of the album, tick cleared", after.oldBox === "bx1" && after.oldAlbum === "" && !after.oldUp);
  ok("the spot's upgrade want is gone", after.wants === 0);
  await p.click(".toast button, [data-act=toastUndo]").catch(() => {});

  // R5-6: variety spots survive an edit of the years
  await ev(() => {
    const a = { kind: "album", id: "A2", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], start: 1878, end: 1880, removed: [], createdAt: 2, proofs: "" };
    a.slots = buildAlbumSlots(["morgan-dollar"], "dates", 1878, 1880, "", lookupAlbum("Whitman", "9128") && lookupAlbum("Whitman", "9128").spotVarieties); put("a_A2", a);
    go("album-A2");
  });
  await p.waitForTimeout(150);
  const countV = () => ev(() => getAlbum("A2").slots.filter((s) => s.y === 1878 && s.v).length);
  ok("starts with 3 variety spots in 1878", (await countV()) === 3);
  async function editYears(from, to) {
    await ev(([f, t]) => { openEditAlbum("A2"); }, [from, to]); await p.waitForTimeout(100);
    await p.fill("#editAlbumForm [name=start]", String(from)); await p.fill("#editAlbumForm [name=end]", String(to));
    await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
    if (await p.$("#albumLoseNote")) { await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150); }
  }
  await editYears(1880, 1880);
  await editYears(1878, 1880);
  ok("back to 3 variety spots in 1878 (got " + (await countV()) + ")", (await countV()) === 3);

  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
