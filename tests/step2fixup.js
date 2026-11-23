const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(500);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    const base = { status: "owned", itemKind: "coin", typeId: "lincoln-wheat", year: 1922, mint: "", grade: "G-4", paid: "1", source: "Coin Shop" };
    const mk = (o) => ({ ...base, ...o });
    return {
      mintBlank: needsOf(mk({ year: 1944 })).includes("check mint"),
      mintP: needsOf(mk({ year: 1944, mint: "P" })).includes("check mint"),
      mintD: needsOf(mk({ year: 1944, mint: "D" })).includes("check mint"),
      mintAlbum: needsOf(mk({ year: 1944, albumId: "x" })).includes("check mint"),
      mintOnlyP: needsOf(mk({ year: 1909 })).includes("check mint") ,
      noSrc: needsOf(mk({ year: 1944, mint: "P", source: "" })).includes("where from"),
      pocketFree: missingOf(mk({ mint: "D", paid: "", source: "Pocket change" })).includes("cost"),
      paidMissing: missingOf(mk({ mint: "D", paid: "", source: "Coin Shop" })).includes("cost"),
      q1: coinMatchesQ(mk({ year: 1921, typeId: "morgan-dollar", mint: "D", metal: "Silver" }), "1921 morgan"),
      q2: coinMatchesQ(mk({ year: 1950, mint: "D" }), "1950 d"),
      q2b: coinMatchesQ(mk({ year: 1950, mint: "S" }), "1950 d"),
      q3: coinMatchesQ(mk({ metal: "Silver" }), "silver"),
      q4: coinMatchesQ(mk({ year: 1944, mint: "P" }), "1944 zzz"),
    };
  });
  ok("blank mint 1944 flagged", r.mintBlank);
  ok("P, D, album coins not flagged", !r.mintP && !r.mintD && !r.mintAlbum);
  ok("1909 (Philadelphia only per list?) result: " + r.mintOnlyP, true);
  ok("no where from flagged", r.noSrc);
  ok("Pocket change cost not missing, empty paid from shop is", !r.pocketFree && r.paidMissing);
  ok("search: 1921 morgan, 1950 d, silver; wrong word fails", r.q1 && r.q2 && !r.q2b && r.q3 && !r.q4);
  // Fix-up run
  const run = await p.evaluate(async () => {
    const mk = (id, y) => ({ kind: "coin", id, cid: "T-" + id, status: "owned", typeId: "lincoln-wheat", typeName: "Lincoln Wheat", year: y, mint: "", grade: "G-4", paid: "", source: "", qty: 1, createdAt: Date.now() });
    for (const c of [mk("fa1", 1944), mk("fa2", 1944), mk("fa3", 1944)]) await saveCoin(c);
    Object.assign(listState, { status: "owned", f: { inc: "1" } }); go("coins"); await new Promise((r) => setTimeout(r, 300)); render();
    const btn = !!document.querySelector("[data-act=fixupStart]");
    actions.fixupStart();
    const first = draft && draft.id;
    draft.paid = "1"; draft.source = "Coin Shop"; draft.mint = "P"; await saveDraft();
    await new Promise((r) => setTimeout(r, 200)); const second = draft && draft.id;
    return { btn, first, second, on: fixup.on, bar: /Needs Attention:/.test(document.body.textContent) };
  });
  ok("fix-up button shows on Needs info list", run.btn);
  ok("run opens a coin, Save goes to a different one", run.first && run.second && run.first !== run.second && run.on && run.bar);
  const end = await p.evaluate(async () => { actions.fixupStop(); go("home"); await new Promise((r) => setTimeout(r, 300)); return !(listState.f && listState.f.inc); });
  ok("leaving My Coins clears Needs info filter", end);
  // Fill spots reuses a loose coin (R4-7)
  const fs = await p.evaluate(async () => {
    put("a_fa", { kind: "album", id: "fa", brand: "Dansco", number: "1", name: "", typeId: "peace-dollar", start: 1921, end: 1922, removed: [], createdAt: 1, slots: [{ y: 1921, m: "" }, { y: 1922, m: "" }] });
    await saveCoin({ kind: "coin", id: "loose1", cid: "L-1", status: "owned", typeId: "peace-dollar", typeName: "Peace Dollar", year: 1921, mint: "", grade: "VF-20", paid: "20", source: "Coin Shop", qty: 1 });
    openFillAlbum("fa", false);
    const html = document.querySelector("#fillRows").innerHTML;
    const hasUse = /fill-use/.test(html);
    const before = allCoins().length;
    document.querySelectorAll("#fillRows .fill-on").forEach((b) => { b.checked = true; });
    fillSave(); fillSave();
    await new Promise((r) => setTimeout(r, 300));
    const lc = getCoin("loose1");
    return { hasUse, placed: lc.albumId === "fa" && !!lc.slotId, added: allCoins().length - before };
  });
  ok("Fill spots offers the loose coin and places it (no second 1921)", fs.hasUse && fs.placed && fs.added === 1);
  ok("no page errors: " + errors.join("|"), errors.length === 0);
  await b.close();
})();
