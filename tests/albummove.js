// R5-15: a coin in an album spot can move straight to another album's empty matching spot; one Undo.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const al = (id, name, tid, s, e) => put("a_" + id, { kind: "album", id, name, typeId: tid, typeIds: [tid], start: s, end: e, removed: [], createdAt: 1, slots: buildSlots(tid, s, e) });
    al("a1", "Morgan one", "morgan-dollar", 1878, 1921); al("a2", "Morgan two", "morgan-dollar", 1878, 1921); al("a3", "Peace one", "peace-dollar", 1921, 1935);
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan dollar", year: "1881", metal: "Silver", value: "50", qty: 1, status: "owned", ...o });
    mk("m1", { albumId: "a1" }); mk("m2", { albumId: "a2" }); mk("m3", { year: "1882", albumId: "a1" });
  });
  const targets = (id, from) => p.evaluate(([i, f]) => albumMoveTargets(getCoin(i), getAlbum(f)).map((t) => t.album.id), [id, from]);
  ok("m1 can't go to album 2 (its 1881 spot is taken) or the Peace set", JSON.stringify(await targets("m1", "a1")) === "[]");
  ok("m3 (1882) can go to album 2", JSON.stringify(await targets("m3", "a1")) === '["a2"]');
  await p.evaluate(() => { go("album-a1"); }); await p.waitForTimeout(200);
  await p.evaluate(() => { const e = document.createElement("button"); Object.entries({ album: "a1", coin: "m3", y: "1882", m: "", v: "", sid: "" }).forEach(([k, v]) => { e.dataset[k] = v; }); actions.slotMenu(e); }); await p.waitForTimeout(200);
  ok("album spot menu shows Move to another album", !!(await p.$('#sheet [data-act="slotMoveList"]')));
  await p.click('#sheet [data-act="slotMoveList"]'); await p.waitForTimeout(150);
  ok("list names Morgan two", /Morgan two/.test(await p.textContent("#sheet")));
  await p.click('#sheet [data-act="slotMoveGo"]'); await p.waitForTimeout(250);
  ok("coin is now in album 2 and out of album 1", await p.evaluate(() => getCoin("m3").albumId === "a2" && albumStats(getAlbum("a1")).filled.size === 1 && albumStats(getAlbum("a2")).filled.size === 2));
  await p.click(".toast [data-act], .toast button"); await p.waitForTimeout(200);
  ok("Undo puts it back in album 1", await p.evaluate(() => getCoin("m3").albumId === "a1"));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
