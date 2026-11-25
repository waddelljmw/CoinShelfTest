// Step 31 Album layout: blank spots, Move spots, Hide N, Add a spot placement, own order kept, Put back in year order, backup.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f, a) => p.evaluate(f, a);
  const order = () => ev(() => getAlbum("L1").slots.map((s) => (s.blank ? "B" : s.y + (s.m ? "-" + s.m : "") + (s.pf ? "PF" : ""))).join(" "));

  await ev(() => {
    const a = { kind: "album", id: "L1", brand: "Whitman", number: "", name: "Wheat test", typeId: "lincoln-wheat", typeIds: ["lincoln-wheat"], layout: "dates", start: 1940, end: 1942, removed: [], createdAt: 1 };
    a.slots = [...buildAlbumSlots(["lincoln-wheat"], "dates", 1940, 1942, ""), newBlankSpot(), newBlankSpot(), newBlankSpot()];
    put("a_L1", a);
    saveCoin({ ...blankCoin(), id: "w1", typeId: "lincoln-wheat", typeName: "Lincoln Wheat Cent", year: 1941, mint: "D", grade: "VF-20", paid: 1, albumId: "L1", holder: "Album" });
    saveCoin({ ...blankCoin(), id: "m1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1964, mint: "", grade: "MS-63", paid: 30, metal: "Silver", oz: 0.7734 });
  });
  const s0 = await ev(() => { const s = albumStats(getAlbum("L1")); return { owned: s.owned, total: s.total, blanks: s.blanks.length }; });
  ok("blanks don't count in total (9 dated spots)", s0.total === 9 && s0.owned === 1 && s0.blanks === 3);
  ok("blanks sit at the end", (await order()).endsWith("B B B"));

  // (6) empty blank: menu offers New coin and A coin I have; put the Morgan (wrong type) in it
  await ev(() => go("album-L1")); await p.waitForTimeout(200);
  ok("empty blank drawn as a dotted circle", (await p.locator(".slot.blank-spot .blank-ring").count()) === 3);
  await p.click(".slot.blank-spot >> nth=0"); await p.waitForTimeout(150);
  const menu = await p.textContent("#sheet");
  ok("blank menu: New coin + A coin I have", /New coin/.test(menu) && /A coin I have/.test(menu));
  await p.selectOption('#sheet [data-flt="blankHave"]', "m1"); await p.click("#sheet [data-act=blankHave]"); await p.waitForTimeout(150);
  const s1 = await ev(() => { const s = albumStats(getAlbum("L1")); return { owned: s.owned, bf: s.blankFilled, value: s.value, coins: s.coins.length, m1: getCoin("m1").albumId }; });
  ok("any coin fits a blank, not counted in owned", s1.m1 === "L1" && s1.owned === 1 && s1.bf === 1 && s1.coins === 2);
  ok("'+ 1 in blank spot' line shows", /\+ 1 in blank spot/.test(await p.textContent("body")));
  ok("missing list skips blanks", (await ev(() => { const s = albumStats(getAlbum("L1")); return s.slots.filter((x) => !s.filled.has(slotKey(x))).length; })) === 8);
  // editing the Morgan keeps it in the blank (wrong type warns, doesn't block)
  await ev(() => { openCoinForm("m1"); draft.grade = "MS-64"; }); await p.waitForTimeout(100);
  ok("coin form says it's a blank spot of another type", /isn't for this coin type/.test(await p.textContent("#sheet")));
  await ev(() => saveDraft()); await p.waitForTimeout(200);
  ok("saved, still in the blank", await ev(() => { const c = getCoin("m1"); return c.grade === "MS-64" && c.albumId === "L1" && !!blankSpotOf(c); }));
  // New coin from a blank: no type filled in, saves into the blank
  await ev(() => { const a = getAlbum("L1"); const s = a.slots.filter((x) => x.blank)[1]; const el = document.createElement("div"); Object.assign(el.dataset, { album: "L1", sid: s.id, y: "", m: "", v: "" }); slotHave(el); });
  ok("new coin in blank starts with no type", await ev(() => !draft.typeId && draft.albumId === "L1" && !!draft.slotId));
  await ev(() => { pickType(TYPE_BY_ID["kennedy-half"] || COIN_TYPES.find((t) => t.denom === "50C")); draft.year = 1964; draft.grade = "AU-50"; });
  ok("picking another type keeps the album", await ev(() => draft.albumId === "L1"));
  await ev(() => saveDraft()); await p.waitForTimeout(200);
  ok("blank-spot coin saved", await ev(() => albumStats(getAlbum("L1")).blankFilled === 2));
  const tot0 = await ev(() => { const s = albumStats(getAlbum("L1")); return [s.owned, s.blankFilled, s.coins.length, s.value].join(); });

  // (2) Move spots: pick 1942-D then 1941 (that order), put after 1940
  await ev(() => { albumEdit.id = "L1"; actions.spotPickStart({ dataset: { id: "L1" } }); });
  const id = (y, m) => ev(([y, m]) => getAlbum("L1").slots.find((s) => s.y === y && s.m === m).id, [y, m]);
  const a42d = await id(1942, "D"), a41 = await id(1941, "");
  await ev(([x, y]) => { actions.spotPickTog({ dataset: { sid: x } }); actions.spotPickTog({ dataset: { sid: y } }); }, [a42d, a41]);
  ok("banner says Move 2 spots and Hide 2", /Move 2 spots/.test(await p.textContent("body")) && /Hide 2/.test(await p.textContent("body")));
  await ev(() => actions.spotMoveOpen({ dataset: { id: "L1" } })); await p.waitForTimeout(100);
  await p.fill("#spotMoveAfter", "1940"); await p.click("#spotMoveForm button[type=submit]"); await p.waitForTimeout(150);
  ok("moved after 1940, in picked order", (await order()).startsWith("1940 1942-D 1941 1940-D"));
  ok("album keeps its own order flag", await ev(() => !!getAlbum("L1").freeOrder));
  ok("coins and totals unchanged by the move", (await ev(() => { const s = albumStats(getAlbum("L1")); return [s.owned, s.blankFilled, s.coins.length, s.value].join(); })) === tot0);
  // blank shows as "blank after ..."
  ok("blank named by the spot before it", /^blank after 1942/.test(await ev(() => { const a = getAlbum("L1"); return blankName(a, a.slots.filter((x) => x.blank)[0]); })));
  // To the start, with Undo
  const before = await order();
  await ev((x) => { actions.spotPickStart({ dataset: { id: "L1" } }); actions.spotPickTog({ dataset: { sid: x } }); actions.spotMoveEdge({ dataset: { id: "L1", w: "__start" } }); }, a41);
  ok("To the start", (await order()).startsWith("1941 "));
  await p.click("#toast button"); await p.waitForTimeout(100);
  ok("Undo puts it back", (await order()) === before);
  // Tap where: bar, nudge, Put here (move a blank after 1941-S)
  const bl = await ev(() => getAlbum("L1").slots.filter((s) => s.blank)[2].id);
  await ev((x) => { actions.spotPickStart({ dataset: { id: "L1" } }); actions.spotPickTog({ dataset: { sid: x } }); actions.spotPlaceMode({ dataset: { id: "L1" } }); }, bl);
  await p.waitForTimeout(100);
  ok("yellow bar shows", (await p.locator(".spot-bar").count()) === 1);
  const s41s = await id(1941, "S");
  await ev((x) => actions.spotPlaceAt({ dataset: { sid: x } }), s41s);
  await ev(() => actions.spotNudge({ dataset: { d: "1" } })); await ev(() => actions.spotNudge({ dataset: { d: "-1" } }));
  await ev(() => actions.spotPutHere({ dataset: { id: "L1" } })); await p.waitForTimeout(100);
  ok("Put 1 here after 1941-S", /1941-S B/.test(await order()));

  // (5) Hide N asks first when a spot holds a coin
  const a41d = await id(1941, "D"), a42 = await id(1942, "");
  await ev(([x, y]) => { actions.spotPickStart({ dataset: { id: "L1" } }); actions.spotPickTog({ dataset: { sid: x } }); actions.spotPickTog({ dataset: { sid: y } }); actions.spotHideGo({ dataset: { id: "L1" } }); }, [a41d, a42]);
  await p.waitForTimeout(100);
  ok("Hide asks first (spot holds a coin)", /hold/.test(await p.textContent("#sheet")) && (await ev(() => (getAlbum("L1").removed || []).length)) === 0);
  await p.click("#sheet [data-act=confirmOk]"); await p.waitForTimeout(100);
  ok("2 spots hidden, coin stays in album", await ev(() => getAlbum("L1").removed.length === 2 && getCoin("w1").albumId === "L1"));
  await ev(() => { const a = getAlbum("L1"); put("a_L1", { ...a, removed: [] }); });

  // (4) Edit album keeps own order: widen to 1943, new spots go next to their year
  const mid = await order();
  await ev(() => { closeSheet(); openEditAlbum("L1"); }); await p.waitForTimeout(100);
  await p.fill("#sheet [name=end]", "1943"); await ev(() => saveEditAlbum(document.querySelector("#albumForm") || document.querySelector("#sheet form"))); await p.waitForTimeout(100);
  const after = await order();
  ok("Edit album doesn't re-sort", after.startsWith(mid.split(" B")[0].split(" 1941-S")[0]) && /1943/.test(after) && !!(await ev(() => getAlbum("L1").freeOrder)));

  // (3) + Add a spot: 10 blank spots after 1940-D, and a dated spot At the start
  await ev(() => openAddSpot("L1")); await p.check("#sheet [name=kind][value=blank]"); await p.fill("#sheet [name=n]", "10");
  await p.selectOption("#sheet [name=bat]", "after"); await p.fill("#sheet [name=after]", "1940-D"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(100);
  ok("10 blanks after 1940-D", (await order()).includes("1940-D B B B B B B B B B B"));
  ok("total still 12 dated spots", (await ev(() => albumStats(getAlbum("L1")).total)) === 12);
  await ev(() => openAddSpot("L1")); await p.fill("#spotY", "1942"); await p.selectOption("#spotM", "S"); await p.fill("#spotV", "Test label");
  await p.selectOption("#sheet [name=at]", "start"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(100);
  ok("dated spot At the start", (await order()).startsWith("1942-S "));

  // (7) Put back in year order: originals first per year, then added spots; blanks at the end in their order
  await ev(() => putBackYearOrder("L1")); await p.waitForTimeout(100);
  const yo = await order();
  ok("year order: originals, then added, blanks last", yo.startsWith("1940 1940-D 1940-S 1941 1941-D 1941-S 1942 1942-D 1942-S 1942-S 1943") && /1943-S( B)+$/.test(yo) && !(await ev(() => getAlbum("L1").freeOrder)));
  ok("year-order kept every coin", (await ev(() => { const s = albumStats(getAlbum("L1")); return s.owned + s.blankFilled; })) === 3);
  // proofs: right after their regular spot
  const pf = await ev(() => {
    const a = { kind: "album", id: "Q1", typeId: "washington-silver", typeIds: ["washington-silver"], layout: "dates", start: 1955, end: 1956, proofs: "all", removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(["washington-silver"], "dates", 1955, 1956, "all"); a.slots.reverse(); a.freeOrder = true; put("a_Q1", a);
    putBackYearOrder("Q1");
    return getAlbum("Q1").slots.map((s) => s.y + (s.m ? "-" + s.m : "") + (s.pf ? "PF" : "")).join(" ");
  });
  ok("proof right after its regular spot (" + pf + ")", /^1955 1955PF 1955-D/.test(pf));

  // Backup keeps order and blanks
  const bk = await ev(async () => { const x = await buildBackup(); const d = x.docs.find((y) => y.id === "a_L1"); return JSON.stringify(d.data.slots.map((s) => (s.blank ? "B" : s.y + s.m))) === JSON.stringify(getAlbum("L1").slots.map((s) => (s.blank ? "B" : s.y + s.m))); });
  ok("backup keeps spot order and blank spots", bk);
  // CSV export doesn't break on blank-spot coins
  ok("CSV export runs", await ev(() => { try { const t = toCsv(allCoins()); return /Morgan/.test(t) && /Wheat test/.test(t); } catch (e) { return false; } }));
  // Old album (no blanks, no freeOrder) still sorts by year when a spot is added
  await ev(() => { const a = { kind: "album", id: "O1", typeId: "lincoln-wheat", typeIds: ["lincoln-wheat"], layout: "dates", start: 1950, end: 1951, removed: [], createdAt: 1 }; a.slots = buildSlots("lincoln-wheat", 1950, 1951); put("a_O1", a); });
  await ev(() => openAddSpot("O1")); await p.fill("#spotY", "1950"); await p.selectOption("#spotM", "D"); await p.fill("#spotV", "Doubled"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(100);
  ok("old album: added spot goes in its year", await ev(() => { const ss = getAlbum("O1").slots; const i = ss.findIndex((s) => s.v === "Doubled"); return ss[i + 1] && ss[i + 1].y === 1951 && !getAlbum("O1").freeOrder; }));
  ok("no page errors", !errors.length); if (errors.length) console.log("errors [" + errors.join(" | ") + "]");
  await b.close();
})();
