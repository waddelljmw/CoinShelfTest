// Step 43b What I need: Albums tab (Need / Upgrade), Aim for grade, priority star, pay up to + old hint, backup keeps the new fields, totals unchanged.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  let fails = 0; const ok = (n, c) => { if (!c) fails++; console.log((c ? "PASS " : "FAIL ") + n); };
  const ev = (f, a) => p.evaluate(f, a);

  await ev(() => {
    const a = { kind: "album", id: "A1", brand: "Whitman", number: "1", name: "Test Morgans", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], start: 1879, end: 1881, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1879, 1881); put("a_A1", a);
    const base = { ...blankCoin(), metal: "Silver", oz: 0.7734, typeId: "morgan-dollar", typeName: "Morgan Dollar", albumId: "A1", holder: "Album", paid: 30 };
    saveCoin({ ...base, id: "c1", year: 1881, mint: "S", grade: "XF-45" });
    saveCoin({ ...base, id: "c2", year: 1880, mint: "S", grade: "MS-63" });
    saveCoin({ ...base, id: "c3", year: 1880, mint: "O", grade: "" , noGrade: true });
    saveCoin({ ...base, id: "c4", year: 1879, mint: "S", grade: "VF-20", source: "Inherited" });
    saveCoin({ ...base, id: "c5", year: 1879, mint: "O", grade: "F-12", origAlbum: true });
  });
  const totals = () => ev(() => { const o = ownedCoins(); return o.length + "|" + sum(o, (c) => (bestEach(c) || 0) * qtyOf(c)).toFixed(2) + "|" + sum(o, (c) => costOf(c) || 0).toFixed(2); });
  const before = await totals();

  // No target yet: empty spots are Need, coins aren't Upgrade
  let rows = await ev(() => albumNeedRows(getAlbum("A1")).map((r) => r.kind + ":" + r.label));
  ok("no target: only empty spots, all Need", rows.length > 0 && rows.every((x) => x.startsWith("need:")) && !rows.some((x) => /1881-S|1880-S|1880-O/.test(x)));

  // Edit album: Aim for AU-50
  await ev(() => { go("album-A1"); openEditAlbum("A1"); }); await p.waitForTimeout(150);
  ok("Edit album shows Aim for", await p.isVisible("#editAlbumForm [name=aimFor]"));
  await p.selectOption("#editAlbumForm [name=aimFor]", "AU-50");
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  ok("album saved aimFor AU-50", await ev(() => getAlbum("A1").aimFor === "AU-50" && !getAlbum("A1").aimOriginals));
  rows = await ev(() => albumNeedRows(getAlbum("A1")).filter((r) => r.kind === "up").map((r) => r.label));
  ok("below target and not graded are Upgrade; MS-63, inherited, original are not (got " + rows.join(",") + ")", rows.length === 2 && rows.some((x) => x.startsWith("1881-S")) && rows.some((x) => x.startsWith("1880-O")));
  await ev(() => { const a = getAlbum("A1"); put("a_A1", { ...a, aimOriginals: true }); });
  rows = await ev(() => albumNeedRows(getAlbum("A1")).filter((r) => r.kind === "up").map((r) => r.label));
  ok("switch on: original coin counts, inherited still never", rows.some((x) => x.startsWith("1879-O")) && !rows.some((x) => x.startsWith("1879-S")));

  // Page: tabs, rows, tags, home button
  await ev(() => go("home")); await p.waitForTimeout(150);
  ok("Home has What I need button", await p.isVisible("#view [data-go=wants]:has-text('What I need')"));
  await p.click("#view [data-go=wants]:has-text('What I need')"); await p.waitForTimeout(200);
  let txt = await p.textContent("#view");
  ok("big album starts folded", (await p.locator(".win-row").count()) === 0);
  await p.click("[data-act=winFold]"); await p.waitForTimeout(150);
  txt = await p.textContent("#view");
  ok("page title + tabs", txt.includes("What I need") && txt.includes("Albums") && txt.includes("Lists"));
  ok("Upgrade row shows have: not graded and AU+", txt.includes("have: not graded") && txt.includes("AU+"));
  await p.fill("#winQ", "1881 s"); await p.waitForTimeout(200);
  ok("search 1881 s narrows to one row, focus kept", (await p.locator(".win-row").count()) === 1 && (await ev(() => document.activeElement && document.activeElement.id)) === "winQ");
  await p.fill("#winQ", ""); await p.waitForTimeout(150);
  await p.click("[data-act=winFold]"); await p.waitForTimeout(150); // fold it, then search
  await p.fill("#winQ", "1881 s"); await p.waitForTimeout(200);
  ok("search opens a folded album with a match", (await p.locator(".win-row").count()) === 1);
  await p.fill("#winQ", ""); await p.waitForTimeout(150);
  ok("clearing the search puts the fold back", (await p.locator(".win-row").count()) === 0);
  await p.selectOption("#winAlbum", "A1"); await p.waitForTimeout(150); // still folded here
  ok("picking one album opens it even if folded", (await p.locator(".win-row").count()) > 0);
  await p.selectOption("#winAlbum", ""); await p.waitForTimeout(150);
  ok("back to All albums puts the fold back", (await p.locator(".win-row").count()) === 0);
  await p.click("[data-act=winFold]"); await p.waitForTimeout(150);
  await p.click("[data-act=winF][data-v=up]"); await p.waitForTimeout(150);
  ok("Upgrade chip shows only Upgrade rows", (await p.locator(".win-tag.need").count()) === 0 && (await p.locator(".win-row").count()) === 3);
  await p.click("[data-act=winF][data-v=all]"); await p.waitForTimeout(150);

  // Star an empty spot: a quiet want is made, it moves to Priority
  const nWants0 = await ev(() => wants().length);
  await p.click(".win-row:has-text('1881-O') .win-star"); await p.waitForTimeout(150);
  ok("star made one want with priority", await ev((n) => wants().length === n + 1 && wants().some((w) => w.priority && w.year == 1881 && w.mint === "O" && w.albumId === "A1"), nWants0));
  txt = await p.textContent("#view");
  ok("Priority section shows the starred row", txt.includes("Priority") && (await p.locator("h2:has-text('Priority') + .list .win-row:has-text('1881-O')").count()) === 1);
  await p.click(".win-row:has-text('1881-O') .win-star"); await p.waitForTimeout(150);
  ok("tap again puts it back", await ev(() => !wants().some((w) => w.priority)));

  // Pay up to from the card, then the old-price hint
  await p.click(".win-row:has-text('1881-S') .win-main"); await p.waitForTimeout(150);
  ok("card shows Pay up to (not set) and Bought it", (await p.textContent("#sheet")).includes("Pay up to… (not set)") && (await p.textContent("#sheet")).includes("Bought it"));
  await p.click("[data-act=winPrice]"); await p.waitForTimeout(150);
  await p.fill("#winPriceForm [name=p]", "45"); await p.click("#winPriceForm button[type=submit]"); await p.waitForTimeout(150);
  ok("price saved on an upgrade want with a date", await ev(() => wants().some((w) => w.year == 1881 && w.mint === "S" && w.notes === "Upgrade" && num(w.maxPrice) === 45 && w.maxPriceAt > 0)));
  ok("row shows up to $45", (await p.textContent(".win-row:has-text('1881-S')")).includes("up to $45.00"));
  await ev(() => { const w = wants().find((x) => x.year == 1881 && x.mint === "S"); saveWant({ ...w, maxPriceAt: Date.now() - 200 * 864e5 }); render(); }); await p.waitForTimeout(150);
  ok("old price says 6 mo old", (await p.textContent(".win-row:has-text('1881-S')")).includes("6 mo old"));

  // Q3: coin reaches target, its quiet upgrade want goes; the coin's old want list item too
  await ev(async () => { const c = getCoin("c1"); openCoinForm(c.id); draft.grade = "AU-55"; await saveDraft(); }); await p.waitForTimeout(300);
  ok("reaching AU-55 removed the quiet upgrade want and the Upgrade row", await ev(() => !wants().some((w) => w.year == 1881 && w.mint === "S") && !albumNeedRows(getAlbum("A1")).some((r) => r.label.startsWith("1881-S"))));
  ok("per-coin tick still shows Upgrade above target", await ev(() => { saveCoin({ ...getCoin("c2"), upgrade: true }); return albumNeedRows(getAlbum("A1")).some((r) => r.kind === "up" && r.label.startsWith("1880-S")); }));
  await ev(() => saveCoin({ ...getCoin("c2"), upgrade: false }));
  await ev(async () => { const c = getCoin("c1"); openCoinForm(c.id); draft.grade = "XF-45"; await saveDraft(); }); await p.waitForTimeout(300);

  // Lists tab still the want lists
  await p.click("[data-act=winTab][data-v=lists]"); await p.waitForTimeout(150);
  ok("Lists tab has the old want list buttons", (await p.textContent("#view")).includes("+ Add a coin you're looking for"));

  // Box 1: backup and restore keep the new fields; box 4: totals the same
  const kept = await ev(async () => {
    const w = wants()[0]; if (w) saveWant({ ...w, priority: true, maxPrice: 12, maxPriceAt: 123 });
    const bk = await buildBackup();
    put("a_A1", { ...getAlbum("A1"), aimFor: "", aimOriginals: false });
    restorePending = bk; await doRestore(); await new Promise((r) => setTimeout(r, 400));
    const a = getAlbum("A1"), w2 = w && getWant(w.id);
    return a.aimFor === "AU-50" && a.aimOriginals === true && (!w || (w2.priority === true && w2.maxPriceAt === 123));
  });
  ok("backup + restore keep Aim for, originals switch, priority, price date", kept);
  ok("coin count and totals the same before and after (" + before + ")", (await totals()) === before);
  ok("no page errors (" + errors.join(" | ") + ")", errors.length === 0);
  await b.close();
  if (fails) process.exitCode = 1;
})();
