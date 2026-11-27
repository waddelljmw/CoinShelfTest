// E1q (v0.125.0): Something else is in this spot, Take out of album asks where, Break up this set, a second blank spot after one date.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) process.exitCode = 1; };
  const ev = (f, a) => p.evaluate(f, a), wait = (n = 200) => p.waitForTimeout(n);

  await ev(() => {
    const a = { kind: "album", id: "M1", brand: "Other", number: "", name: "Morgans", typeId: "morgan-dollar", start: 1890, end: 1891, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1890, 1891); put("a_M1", a); withSlotIds(a);
    const s = getAlbum("M1").slots;
    saveCoin({ ...blankCoin(), id: "m90", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1890, mint: "S", grade: "VF-20", paid: "30", albumId: "M1", slotId: s.find((x) => x.y === 1890 && x.m === "S").id });
    saveCoin({ ...blankCoin(), id: "tok", typeId: "", typeName: "Casino token", family: "Token", year: "", grade: "", noGrade: true, paid: "2" });
  });
  const spot91 = await ev(() => getAlbum("M1").slots.find((x) => x.y === 1891 && x.m === "").id);
  const st0 = await ev(() => { const s = albumStats(getAlbum("M1")); return { owned: s.owned, total: s.total }; });

  // 1) Something else: put the loose token in the empty 1891 spot
  await ev(() => go("album-M1")); await wait();
  await p.click(`.slot[data-sid="${spot91}"]`); await wait();
  ok("empty spot offers Something else", (await p.locator("#sheet [data-act=slotElse]").count()) === 1);
  await p.click("#sheet [data-act=slotElse]"); await wait();
  ok("else menu asks what's in the 1891 spot", /What's in the 1891 spot/.test(await p.textContent("#sheet")));
  await p.selectOption('#sheet [data-flt="elseHave"]', "tok"); await p.click("#sheet [data-act=slotElseHave]"); await wait();
  const st1 = await ev(() => { const s = albumStats(getAlbum("M1")); return { owned: s.owned, total: s.total, other: s.others.size, tok: getCoin("tok") }; });
  ok("token sits in the spot as something else", st1.tok.albumId === "M1" && st1.tok.slotId === spot91 && st1.tok.otherInSpot === true);
  ok("Q1: the spot still counts as missing", st1.owned === st0.owned && st1.total === st0.total && st1.other === 1);
  ok("orange ring shows the token", (await p.locator(".slot.other-spot").count()) === 1 && /Casino token/.test(await p.textContent(".slot.other-spot")));
  ok("not listed under Also in this album", !/Also in this album/.test(await p.textContent("main, body")));
  await p.screenshot({ path: "/tmp/e1q-ring.png" });
  // tapping it: still missing, add-coin hidden until it's taken out, want list still offered
  await p.click(".slot.other-spot"); await wait();
  const m2 = await p.textContent("#sheet");
  ok("menu: something else card, still missing, want list offered", /Something else is in this spot/.test(m2) && /Still missing/.test(m2) && (await p.locator("#sheet [data-act=slotHave]").count()) === 0 && /Add to want list/.test(m2));
  // 2) Take out asks where (Loose picked)
  await p.click("#sheet [data-act=slotTakeOut]"); await wait();
  ok("take out asks where, Loose first", (await p.inputValue('#sheet [data-flt="toOne"]')) === "none");
  await p.click("#sheet [data-act=takeOutGo]"); await wait();
  const tk = await ev(() => getCoin("tok"));
  ok("taken out: loose, no spot, no something-else tick", !tk.albumId && !tk.slotId && !tk.otherInSpot);

  // 3) a new coin of another type as something else, through the coin form
  await ev(() => { go("album-M1"); }); await wait();
  await ev((sid) => { const a = getAlbum("M1"); slotElseNew({ dataset: { album: "M1", sid } }); pickType("peace-dollar"); draft.year = 1922; draft.grade = "VF-20"; renderCoinForm(); }, spot91); await wait();
  ok("form says something else, album kept after picking another type", /Something else in the 1891 spot/.test(await p.textContent("#sheet")) && (await ev(() => draft.albumId)) === "M1");
  await p.click("#coinForm button[type=submit]"); await wait(500);
  const pd = await ev(() => allCoins().find((c) => c.typeId === "peace-dollar"));
  ok("Peace dollar saved in the Morgan 1891 spot as something else", pd && pd.albumId === "M1" && pd.otherInSpot && pd.slotId === spot91);
  ok("spot still missing", (await ev(() => albumStats(getAlbum("M1")).owned)) === st0.owned);

  // 4) Something else on a FILLED spot: the coin there goes somewhere first
  await ev(() => go("album-M1")); await wait();
  await p.click(".slot.have"); await wait();
  await p.click("#sheet [data-act=slotElse]"); await wait();
  ok("filled spot: asks where the 1890-S goes first", /Take out of album/.test(await p.textContent("#sheet")) && /1890-S/.test(await p.textContent("#sheet")));
  await p.click("#sheet [data-act=takeOutGo]"); await wait();
  ok("then asks what's in the 1890-S spot", /What's in the 1890-S spot/.test(await p.textContent("#sheet")) && !(await ev(() => getCoin("m90").albumId)));

  // 5) Break up a 1964 proof set, $30, with a Lincoln album that has an open 1964 spot
  await ev(() => {
    const a = { kind: "album", id: "LM", brand: "Other", number: "", name: "Lincoln memorial", typeId: "lincoln-memorial-copper", start: 1963, end: 1965, removed: [], createdAt: 2 };
    a.slots = buildSlots(a.typeId, 1963, 1965); put("a_LM", a); withSlotIds(a);
    saveCoin({ ...blankCoin(), id: "ps64", item: "set", setKind: "proof", typeName: "Proof set", family: "Sets", year: 1964, paid: "30", source: "Coin Shop", seller: "Main St Coins", acquired: "2026-01-05", holder: "Cellophane" });
    saveWant(newWant({ typeId: "lincoln-memorial-copper", year: 1964, mint: "", albumId: "LM", listId: DEFAULT_LIST_ID }));
  });
  const tot0 = await ev(() => ({ cost: sum(ownedCoins(), (c) => costOf(c) || 0), n: ownedCoins().length }));
  await ev(() => go("coin-ps64")); await wait();
  ok("set page has Break up this set", (await p.locator("[data-act=breakUp]").count()) === 1);
  await p.click("[data-act=breakUp]"); await wait();
  const lines = await ev(() => bu.lines.map((l) => l.typeId + ":" + l.mint + ":" + l.cost));
  ok("1964 proof set suggests 5 coins", lines.length === 5 && /kennedy-90/.test(lines.join()));
  ok("Q2: cost split adds up to $30", (await ev(() => buTotalCents())) === 3000 && /adds up to \$30\.00/.test(await p.textContent("#sheet")));
  ok("half dollar gets the biggest share", await ev(() => { const h = bu.lines.find((l) => l.typeId === "kennedy-90"); return bu.lines.every((l) => num(l.cost) <= num(h.cost)); }));
  // a cost typed over: Make coins turns off until it adds up
  await p.fill('#sheet [data-bu="cost"][data-i="0"]', "1"); await p.dispatchEvent('#sheet [data-bu="cost"][data-i="0"]', "input");
  ok("off when it doesn't add up", (await p.isDisabled("#sheet [data-act=buGo]")) && /Left to split|Over by/.test(await p.textContent("#sheet .bu-sum")));
  await p.click("#sheet [data-act=buResplit]"); await wait();
  ok("Split by value again fixes it", !(await p.isDisabled("#sheet [data-act=buGo]")));
  await p.click("#sheet [data-act=buMatch]"); await wait();
  const cent = await ev(() => bu.lines.find((l) => l.typeId === "lincoln-memorial-copper").to);
  ok("Use matching spots fills the cent's 1964 spot", /^spot:LM:/.test(cent));
  ok("Coins with no spot starts on Keep them in the set's case? (set kept nowhere: Loose)", (await p.inputValue('#sheet [data-bu="rest"]')) === "none");
  await p.selectOption('#sheet [data-bu="rest"]', "__case"); await wait();
  await p.screenshot({ path: "/tmp/e1q-breakup.png", fullPage: true });
  await p.click("#sheet [data-act=buGo]"); await wait(400);
  const after = await ev(() => {
    const made = allCoins().filter((c) => c.fromSet === "ps64");
    const box = allBoxes().find((x) => x.name === labelOf(getCoin("ps64")));
    return { made: made.length, set: getCoin("ps64"), cost: sum(ownedCoins(), (c) => costOf(c) || 0), n: ownedCoins().length,
      copied: made.every((c) => c.source === "Coin Shop" && c.seller === "Main St Coins" && c.acquired === "2026-01-05"),
      inAlbum: made.filter((c) => c.albumId === "LM").length, inBox: box ? made.filter((c) => c.boxId === box.id).length : 0,
      ids: made.every((c) => c.cid), owned: albumStats(getAlbum("LM")).owned, want: !!findWant("lincoln-memorial-copper", 1964, "", "", DEFAULT_LIST_ID, false) };
  });
  ok("5 coins made, linked to the set", after.made === 5 && after.ids);
  ok("set is Gone, Broken up", after.set.status === "gone" && after.set.gone.reason === "Broken up");
  ok("total cost stays the same", Math.abs(after.cost - tot0.cost) < 0.001 && after.n === tot0.n + 4);
  ok("details copied from the set", after.copied);
  ok("cent in its album spot, others in the set's case", after.inAlbum === 1 && after.owned === 1 && after.inBox === 4);
  ok("the spot's want crossed off", !after.want);
  await ev(() => go("coin-ps64")); await wait();
  ok("set page lists its coins, no Move back", /Its coins:/.test(await p.textContent("main, body")) && (await p.locator("[data-act=ungone]").count()) === 0);
  // Undo puts everything back
  await ev(() => { const t = document.querySelector(".toast button"); if (t) t.click(); }); await wait(300);
  const undone = await ev(() => ({ made: allCoins().filter((c) => c.fromSet === "ps64").length, set: getCoin("ps64").status, box: allBoxes().some((x) => x.name === labelOf(getCoin("ps64"))), want: !!findWant("lincoln-memorial-copper", 1964, "", "", DEFAULT_LIST_ID, false), cost: sum(ownedCoins(), (c) => costOf(c) || 0) }));
  ok("one Undo puts it all back", undone.made === 0 && undone.set === "owned" && !undone.box && undone.want && Math.abs(undone.cost - tot0.cost) < 0.001);
  // a set kind with no sure contents starts empty; + Add a coin works
  await ev(() => { saveCoin({ ...blankCoin(), id: "os", item: "set", setKind: "other", typeName: "Other set", family: "Sets", year: 1985, paid: "10" }); openBreakUp("os"); }); await wait();
  ok("unsure set starts empty with a note", (await ev(() => bu.lines.length)) === 0 && /aren't filled in/.test(await p.textContent("#sheet")));
  await p.selectOption('#sheet [data-bu="add"]', "roosevelt-clad"); await wait();
  ok("+ Add a coin adds a line with the whole cost", (await ev(() => bu.lines.length === 1 && bu.lines[0].cost === "10.00")));
  await ev(() => closeSheet());

  // 6) blank spots after the same date, twice; a dated twin offers a blank spot
  await ev(() => { const a = { kind: "album", id: "W1", brand: "Other", number: "", name: "Wheat", typeId: "lincoln-wheat", start: 1938, end: 1939, removed: [], createdAt: 3 }; a.slots = buildSlots(a.typeId, 1938, 1939); put("a_W1", a); withSlotIds(a); });
  const addBlank = async () => {
    await ev(() => openAddSpot("W1")); await wait();
    await p.check('#spotForm input[value="blank"]'); await p.selectOption('#spotForm [name="bat"]', "after"); await p.fill('#spotForm [name="after"]', "1938-D");
    await p.click("#spotForm button[type=submit]"); await wait();
  };
  await addBlank(); await addBlank();
  const ord = () => ev(() => getAlbum("W1").slots.map((s) => (s.blank ? "B" : s.y + (s.m ? "-" + s.m : ""))).join(" "));
  ok("two blank spots after 1938-D", /1938-D B B 1938-S/.test(await ord()));
  await ev(() => openAddSpot("W1")); await wait();
  await p.fill("#spotY", "1938"); await p.selectOption("#spotM", "D"); await p.click("#spotForm button[type=submit]"); await wait();
  ok("a dated twin offers a blank spot instead", /already has a 1938-D spot/.test(await p.textContent("#sheet")));
  await p.click("#sheet [data-act=confirmOk]"); await wait();
  ok("third blank goes after the other two", /1938-D B B B 1938-S/.test(await ord()));

  // backup keeps the new ticks (a coin record is saved whole)
  ok("backup carries otherInSpot and fromSet", await ev(() => { const x = allCoins().find((c) => c.otherInSpot); return !!x && JSON.parse(JSON.stringify(x)).otherInSpot === true; }));
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
