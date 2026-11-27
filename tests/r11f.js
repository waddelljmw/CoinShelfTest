// R11f (v0.125.1): R11-1 break-up keeps tax/shipping in their own boxes, R11-2 break-up asks before losing work + pinned button, R11-3 hidden "something else" spot.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) process.exitCode = 1; };
  const ev = (f, a) => p.evaluate(f, a), wait = (n = 200) => p.waitForTimeout(n);

  // R11-1: a $50 proof set + $3 tax + $10 shipping on a receipt
  await ev(() => {
    put("pu_R1", { kind: "purchase", id: "R1", createdAt: 1, date: "2026-01-05", seller: "Mail order", tax: "3", ship: "10" });
    saveCoin({ ...blankCoin(), id: "ps64", item: "set", setKind: "proof", typeName: "Proof set", family: "Sets", year: 1964, paid: "50", buyTax: "3", buyShip: "10", purchaseId: "R1", acquired: "2026-01-05" });
  });
  ok("set costs $63", (await ev(() => costOf(getCoin("ps64")))) === 63);
  await ev(() => go("coin-ps64")); await wait();
  await p.click("[data-act=breakUp]"); await wait();
  ok("R11-2: Make coins sits in the pinned bar", (await p.locator("#sheet .fill-save [data-act=buGo]").count()) === 1);
  await p.click("#sheet [data-act=buGo]"); await wait(400);
  const r1 = await ev(() => { const m = allCoins().filter((c) => c.fromSet === "ps64"); return { n: m.length, cost: r2(sum(m, (c) => costOf(c))), paid: r2(sum(m, (c) => num(c.paid))), tax: r2(sum(m, (c) => num(c.buyTax) || 0)), ship: r2(sum(m, (c) => num(c.buyShip) || 0)), neg: m.some((c) => num(c.paid) < 0) }; });
  ok("5 coins cost $63 in all", r1.n === 5 && r1.cost === 63);
  ok("prices add to $50, tax $3, shipping $10, none below zero", r1.paid === 50 && r1.tax === 3 && r1.ship === 10 && !r1.neg);
  // open the receipt and save it again: nothing counted twice
  await ev(() => { purchaseFormOpen(getPurchase("R1")); });
  ok("receipt shows coins $50", /Coins on this receipt: <b>\$50\.00/.test(await ev(() => purchaseSummary())));
  await ev(() => { purchaseSave(); if (purchaseReview) purchaseCommit(purchaseReview.plan); }); await wait(300);
  ok("after re-saving the receipt, still $63", (await ev(() => r2(sum(allCoins().filter((c) => c.fromSet === "ps64" && c.status === "owned"), (c) => costOf(c)))) === 63));

  // 4-box (1) + (4): backup, wipe the coins, restore: count and totals match
  const bx = await ev(async () => {
    const snap = () => ({ n: ownedCoins().length, cost: r2(sum(ownedCoins(), (c) => costOf(c) || 0)) });
    const a = snap(), bk = await buildBackup();
    [...store.docs.keys()].filter((k) => k.startsWith("c_")).forEach((k) => remove(k));
    restorePending = JSON.parse(JSON.stringify(bk)); await doRestore(); await new Promise((r) => setTimeout(r, 300));
    return { a, b: snap(), gone: getCoin("ps64") && getCoin("ps64").status };
  });
  ok("backup + restore: same coin count and total cost, set still Gone", bx.a.n === bx.b.n && bx.a.cost === bx.b.cost && bx.a.cost === 63 && bx.gone === "gone");

  // R11-2: closing a touched break-up asks first
  await ev(() => saveCoin({ ...blankCoin(), id: "ps60", item: "set", setKind: "proof", typeName: "Proof set", family: "Sets", year: 1960, paid: "40" }));
  await ev(() => go("coin-ps60")); await wait();
  await p.click("[data-act=breakUp]"); await wait();
  await p.click('#sheet [data-act=buDel][data-i="0"]'); await wait();
  await p.click("#sheet [data-act=buClose]"); await wait();
  ok("✕ after a change asks Discard", /Discard this break-up\?/.test(await p.textContent("body")) && !(await p.isHidden("#sheet")));
  await p.click("[data-act=wordBack]"); await wait();
  ok("Keep editing keeps the 4 lines", (await ev(() => bu.lines.length)) === 4);
  await ev(() => closeSheet()); await wait();
  await p.click("[data-act=breakUp]"); await wait();
  await p.click("#sheet [data-act=buClose]"); await wait();
  ok("untouched ✕ just closes", await p.isHidden("#sheet"));
  ok("set not broken up", (await ev(() => getCoin("ps60").status)) === "owned");

  // R11-3: an 1891 Morgan as "something else" in the 1890 spot, then the 1890 spot is hidden
  await ev(() => {
    const a = { kind: "album", id: "M1", brand: "Other", number: "", name: "Morgans", typeId: "morgan-dollar", start: 1890, end: 1891, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1890, 1891); put("a_M1", a); withSlotIds(a);
    const s90 = getAlbum("M1").slots.find((x) => x.y === 1890 && x.m === "");
    saveCoin({ ...blankCoin(), id: "m91", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1891, mint: "", grade: "VF-20", paid: "30", albumId: "M1", slotId: s90.id, otherInSpot: true });
  });
  const before = await ev(() => albumStats(getAlbum("M1")).owned);
  await ev(() => { const a = getAlbum("M1"), s90 = a.slots.find((x) => x.y === 1890 && x.m === ""); put("a_M1", { ...a, removed: [slotKey(s90)] }); });
  const st = await ev(() => { const s = albumStats(getAlbum("M1")); return { owned: s.owned, other: s.others.size, inSpot: [...s.filled.values()].some((c) => c.id === "m91") }; });
  ok("hidden spot: the coin doesn't jump into the 1891 spot", st.owned === before && !st.inSpot && st.other === 0);
  await ev(() => go("album-M1")); await wait();
  ok("it shows under Also in this album", /Also in this album/.test(await p.textContent("main")));
  await ev(() => go("coin-m91")); await wait();
  ok("coin page drops the 'as something else' line", !/as something else/.test(await p.textContent("main")));

  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
