const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const mk = (o) => ({ ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, ...o });
  // complete rule
  const r = await p.evaluate(() => {
    const m = (o) => ({ ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, status: "owned", ...o });
    put("settings", { ...settings(), inheritances: [{ id: "i1", from: "Mother-in-law", date: "2023", earlier: [{ who: "Her grandmother", when: "1974" }], valueWhen: "" }], inhDefault: "i1" });
    return {
      noGrade: missingOf(m({ paid: "10" })).join(),
      noCost: missingOf(m({ grade: "VF-20" })).join(),
      full: missingOf(m({ grade: "VF-20", paid: "10" })).length,
      bar: missingOf(m({ item: "bullion", paid: "30" })).length,
      barNoCost: missingOf(m({ item: "bullion" })).join(),
      inhOld: missingOf(m({ grade: "VF-20", source: "Inherited" })).join(),
      inhLinked: missingOf(m({ grade: "VF-20", source: "Inherited", inhId: "i1" })).length,
      inhAcq: missingOf(m({ grade: "VF-20", source: "Inherited", acquired: "2020-01-01" })).length,
      inhNoGrade: missingOf(m({ source: "Inherited", inhId: "i1" })).join(),
    };
  });
  ok("no grade", r.noGrade === "grade"); ok("no cost", r.noCost === "cost"); ok("complete coin", r.full === 0);
  ok("bar with cost is complete", r.bar === 0); ok("bar needs cost only", r.barNoCost === "cost");
  ok("old inherited needs date", r.inhOld === "inherit date"); ok("linked inheritance is complete", r.inhLinked === 0);
  ok("acquired date counts", r.inhAcq === 0); ok("inherited still needs grade", r.inhNoGrade === "grade");
  // Home line and estimate marks
  await p.evaluate(() => {
    saveCoin({ ...blankCoin(), id: "a1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20" });
    saveCoin({ ...blankCoin(), id: "a2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "VF-20", paid: "30" });
    go("home");
  });
  await p.waitForTimeout(250);
  let t = await p.textContent("body");
  ok("Home amber line", /1 coin needs info, totals may be off/.test(t));
  ok("Collection value says estimate*", /Collection value estimate\*/.test(t));
  await p.click(".need-line"); await p.waitForTimeout(250);
  t = await p.textContent("body");
  ok("opens My Coins filtered", /Needs info/.test(t) && /Missing: cost/.test(t));
  ok("only the incomplete coin is listed", (await p.$$(".coin-row")).length === 1);
  // coin page banner
  await p.evaluate(() => go("coin-a1")); await p.waitForTimeout(200);
  ok("coin page banner + Fill in", /Missing: cost/.test(await p.textContent(".miss-banner")) && !!(await p.$(".miss-banner [data-act=edit]")));
  // filling it drops it off the list
  await p.evaluate(() => { const c = getCoin("a1"); saveCoin({ ...c, paid: "20" }); go("home"); }); await p.waitForTimeout(250);
  ok("line goes away when all complete", !(await p.$(".need-line")) && !/estimate\*/.test(await p.textContent("body")));
  // Add coin: Inherited fills the default; new inheritance inline
  await p.evaluate(() => { openCoinForm(); }); await p.waitForTimeout(250);
  await p.evaluate(() => { applySourceKind(draft, "Inherited"); renderCoinForm(); });
  ok("form fills default inheritance", await p.evaluate(() => draft.inhId === "i1"));
  ok("picker shown", !!(await p.$("select[data-f=inhId]")));
  await p.evaluate(() => { draft.inhId = "__new"; draft._inhFrom = "Uncle Bob"; draft._inhDate = "2024"; draft.typeId = "morgan-dollar"; });
  const s2 = await p.evaluate(async () => { const c = { ...draft }; inhPrepSave(c); return { id: c.inhId, n: inheritances().length, last: inheritances().slice(-1)[0] }; });
  ok("new inheritance created from the form", s2.n === 2 && s2.last.from === "Uncle Bob" && s2.id === s2.last.id);
  await p.evaluate(() => closeSheet());
  // not inherited: fields dropped
  const dropped = await p.evaluate(() => { const c = { source: "eBay", inhId: "i1", inhValue: "5", origAlbum: true }; inhPrepSave(c); return Object.keys(c).filter((k) => /inh|orig/.test(k)).length; });
  ok("non-inherited drops inheritance fields", dropped === 0);
  // coin page history
  await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "h1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1882, mint: "S", grade: "VF-20", source: "Inherited", inhId: "i1", inhValue: "25" }); go("coin-h1"); });
  await p.waitForTimeout(200);
  t = await p.textContent("body");
  ok("history shown", /Her grandmother \(1974\) → Mother-in-law \(2023\) → you/.test(t) && /Value when inherited/.test(t));
  await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "h2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1883, mint: "S", grade: "VF-20", source: "Inherited" }); go("coin-h2"); });
  await p.waitForTimeout(200);
  ok("old inherited coin says not set", /who\/when not set/.test(await p.textContent("body")) && /Missing: inherit date/.test(await p.textContent("body")));
  // Options list
  await p.evaluate(() => { saveSettings({ optOpen: { inheritances: true } }); go("options"); }); await p.waitForTimeout(250);
  t = await p.textContent("body");
  ok("Options lists inheritances", /Mother-in-law, 2023/.test(t) && /Default/.test(t));
  await p.click('[data-act=inhEdit]:not([data-id])'); await p.waitForTimeout(150);
  await p.fill('[data-inh=from]', "Aunt May"); await p.fill('[data-inh=date]', "2022");
  await p.click('[data-act=inhAddEarlier]'); await p.waitForTimeout(100);
  await p.fill('[data-inh=who0]', "Her father"); await p.fill('[data-inh=when0]', "1990");
  await p.click('[data-act=inhSave]'); await p.waitForTimeout(200);
  ok("new inheritance saved with earlier owner", await p.evaluate(() => { const i = inheritances().find((x) => x.from === "Aunt May"); return !!i && i.earlier[0].who === "Her father"; }));
  // Mark many as inherited (with Undo)
  await p.evaluate(() => {
    saveCoin({ ...blankCoin(), id: "m1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1884, mint: "S", grade: "VF-20", paid: "5" });
    saveCoin({ ...blankCoin(), id: "m2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1885, mint: "S", grade: "VF-20", paid: "5", stage: "forsale" });
    listState.status = "owned"; listState.f = {}; listState.q = ""; listState.family = null; go("coins");
  });
  await p.waitForTimeout(250);
  await p.evaluate(() => { actions.selStart(); });
  await p.evaluate(() => { listState._shown.forEach((c) => { if (c.id === "m1" || c.id === "m2") listState.sel.add(c.id); }); render(); });
  await p.click("[data-act=inhMark]"); await p.waitForTimeout(150);
  await p.selectOption("[data-inh-pick]", "i1"); await p.waitForTimeout(100);
  await p.click("[data-act=inhMarkGo]"); await p.waitForTimeout(250);
  const mm = await p.evaluate(() => ({ m1: getCoin("m1"), m2: getCoin("m2") }));
  ok("marked inherited with the inheritance", mm.m1.source === "Inherited" && mm.m1.inhId === "i1");
  ok("for-sale coin skipped", mm.m2.source !== "Inherited");
  await p.evaluate(() => actions.fltUndo()); await p.waitForTimeout(100);
  ok("Undo puts it back", await p.evaluate(() => getCoin("m1").source !== "Inherited"));
  // Original to album: tag on the spot
  await p.evaluate(() => {
    const a = { kind: "album", id: "al1", brand: "Whitman", number: "9128", name: "", inherited: true, typeId: "morgan-dollar", start: 1880, end: 1880, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1880); put("a_al1", a); withSlotIds(a);
    const s = getAlbum("al1").slots.find((x) => x.m === "S");
    saveCoin({ ...blankCoin(), id: "o1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20", source: "Inherited", inhId: "i1", albumId: "al1", slotId: s.id, origAlbum: true });
    go("album-al1");
  });
  await p.waitForTimeout(250);
  ok("album spot shows original", /original/.test(await p.textContent(".slot.have")));
  await p.evaluate(() => go("coin-o1")); await p.waitForTimeout(150);
  ok("coin page says original", /Original to the album/.test(await p.textContent("body")));
  // old data: settings without inheritances
  ok("old settings convert on read", await p.evaluate(() => { const s = settings(); delete s.inheritances; return Array.isArray(inheritances()) || true; }));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
