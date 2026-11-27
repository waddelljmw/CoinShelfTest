// Step 6 Album tidy: delete album + its wants, honest melt, Take out on a spot, one place at a time, one-tap want, hidden count.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f, a) => p.evaluate(f, a);
  await ev(() => {
    put("b_bx1", { kind: "box", id: "bx1", name: "Gray Box", type: "storage", createdAt: 1 });
    const a = { kind: "album", id: "A1", brand: "Whitman", number: "1", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], start: 1878, end: 1880, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1878, 1880); put("a_A1", a);
    saveCoin({ ...blankCoin(), id: "c1", metal: "Silver", oz: 0.7734, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1879, mint: "", grade: "VF-20", albumId: "A1", holder: "Album" });
    saveCoin({ ...blankCoin(), id: "c2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "", grade: "VF-20", boxId: "bx1", boxRow: "1", boxSlot: "2" });
  });
  await p.waitForTimeout(150);
  // melt honesty
  await ev(() => go("album-A1")); await p.waitForTimeout(200);
  const txt = await p.textContent("body");
  ok("Album melt says Needs silver price when none entered", /Needs silver price/.test(txt));
  // hidden spots count
  await ev(() => { const a = getAlbum("A1"); put("a_A1", { ...a, removed: [slotKey(a.slots[0]), slotKey(a.slots[1])] }); render(); }); await p.waitForTimeout(150);
  ok("hidden spots line", /2 spots hidden/.test(await p.textContent("body")));
  await p.click("[data-act=editSlots].link-btn"); await p.waitForTimeout(150);
  ok("Show opens Edit spots", await ev(() => albumEdit.id === "A1"));
  await ev(() => { albumEdit.id = null; const a = getAlbum("A1"); put("a_A1", { ...a, removed: [] }); render(); });
  // one place at a time: c2 (in box) goes in the album
  await ev(() => { const el = document.createElement("div"); const a = withSlotIds(getAlbum("A1")); const s = a.slots.find((x) => x.y === 1880); Object.assign(el.dataset, { album: "A1", sid: s.id || "", y: 1880, m: "", v: "", cid: "c2" }); slotUse(el); });
  await p.waitForTimeout(100);
  const c2 = await ev(() => getCoin("c2"));
  ok("coin leaves its box slot when put in an album", c2.albumId === "A1" && !c2.boxId && !c2.boxRow && !c2.boxSlot);
  // take out from the spot menu
  await ev(() => actions.slotTakeOut({ dataset: { id: "c1" } })); await p.waitForTimeout(100);
  ok("Take out asks where it goes (E1q), Loose picked", (await p.inputValue('#sheet [data-flt="toOne"]')) === "none");
  await p.click("#sheet [data-act=takeOutGo]"); await p.waitForTimeout(100);
  const c1 = await ev(() => getCoin("c1"));
  ok("Take out frees the coin", !c1.albumId && c1.status !== "deleted");
  ok("Holder: Album cleared after leaving", (await ev(() => holderOf(getCoin("c1")))) !== "Album");
  ok("old coin with stale Album holder reads clean", (await ev(() => holderOf({ holder: "Album", albumId: "" }))) !== "Album");
  // one-tap want
  const n0 = await ev(() => wantsMadeFor(getAlbum("A1")).length);
  await ev(() => { const a = withSlotIds(getAlbum("A1")); const s = a.slots.find((x) => x.y === 1878); actions.slotWantQuick({ dataset: { album: "A1", sid: s.id || "", y: 1878, m: "", v: "" } }); });
  await p.waitForTimeout(100);
  const ws = await ev(() => wantsMadeFor(getAlbum("A1")));
  ok("one tap adds the want", ws.length === n0 + 1);
  ok("into this album's own list", await ev((id) => /Missing from/.test((getWantList(id) || {}).name || ""), ws[0].listId));
  // delete album asks about its wants
  await ev(() => actions.deleteAlbum({ dataset: { id: "A1" } })); await p.waitForTimeout(100);
  ok("delete asks about the want list", /want lists for this album/.test(await p.textContent("#sheet")));
  await p.click("[data-act=delAlbumGo][data-w='1']"); await p.waitForTimeout(150);
  ok("album and its wants gone", await ev(() => !getAlbum("A1") && !wantsMadeFor({ id: "A1" }).length));
  ok("the list made for it is gone too", await ev(() => !wantLists().some((l) => /Missing from/.test(l.name))));
  ok("coins stay", await ev(() => !!getCoin("c1") && !!getCoin("c2") && !getCoin("c2").albumId));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
