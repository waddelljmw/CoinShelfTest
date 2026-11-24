// Step 26b: Add another like this (copies details, offers album spots), + New coin on this receipt,
// receipt fixes (blank store named "Receipt, date", flag coins with no price, Receipt link in the coin's Purchase box,
// one warning line on spreadsheet import).
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const ok = (n, c) => console.log((c ? "ok   " : "FAIL ") + n);
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  await p.evaluate(() => {
    const al = (id, name) => put("a_" + id, { kind: "album", id, name, typeId: "morgan-dollar", typeIds: ["morgan-dollar"], start: 1878, end: 1921, removed: [], createdAt: 1, slots: buildSlots("morgan-dollar", 1878, 1921) });
    al("a1", "Morgan one"); al("a2", "Morgan two");
    put("pu_P1", { kind: "purchase", id: "P1", createdAt: 1, date: "2025-03-14", seller: "Main St Coins", source: "Coin Shop" }, true);
    put("c_m1", { ...blankCoin(), id: "m1", typeId: "morgan-dollar", typeName: "Morgan dollar", year: "1881", metal: "Silver", grade: "MS-63", notes: "serial C-4283", source: "Coin Shop", seller: "Main St Coins", paid: "40", buyTax: "3", buyShip: "2", cid: "MD-001", photos: [{ url: "x" }], receiptPhotos: [{ url: "y" }], purchaseId: "P1", qty: 1, status: "owned", createdAt: 1 }, true);
    render();
  });

  // ----- Add another like this -----
  await p.evaluate(() => go("coin-m1")); await p.waitForTimeout(200);
  ok("button says Add another like this", /\+ Add another like this/.test(await p.textContent("[data-act=addAnother]")));
  ok("coin page has no Purchase chip in the header", !/Purchase: Main/.test(await p.textContent("main")));
  const box = await p.textContent("main");
  ok("Purchase box has the Receipt link with a plain date", /Receipt\s*Mar 14, 2025 · Main St Coins/.test(box));
  await p.click("[data-act=addAnother]"); await p.waitForTimeout(250);
  const d = await p.evaluate(() => ({ year: draft.year, grade: draft.grade, notes: draft.notes, metal: draft.metal, source: draft.source, seller: draft.seller, paid: draft.paid, purchaseId: draft.purchaseId, photos: draft.photos.length, rphotos: (draft.receiptPhotos || []).length, cid: draft.cid || "", tax: draft.buyTax || "", ship: draft.buyShip || "", album: draft.albumId || "", slot: draft.slotId || "", qty: draft.qty }));
  ok("copies metal, grade, where from, notes, price", d.year === "1881" && d.grade === "MS-63" && d.notes === "serial C-4283" && d.metal === "Silver" && d.source === "Coin Shop" && d.paid === "40" && d.seller === "Main St Coins");
  ok("keeps the receipt link", d.purchaseId === "P1");
  ok("no photos, ID, tax, shipping, album or spot", d.photos === 0 && d.rphotos === 0 && d.cid === "" && d.tax === "" && d.ship === "" && d.album === "" && d.slot === "");
  ok("form says where it was copied from", /Copied from/.test(await p.textContent("#copiedNote")));
  await p.fill("[data-f=notes]", "serial C-4284"); // the one thing that differs
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  const ask = await p.textContent("#sheet");
  ok("asks Put it in an album spot?", /Put it in an album spot\?/.test(ask));
  ok("lists both albums by name", /Morgan one/.test(ask) && /Morgan two/.test(ask));
  ok("Not now is there", /Not now/.test(ask));
  const newId = await p.evaluate(() => allCoins().find((c) => c.id !== "m1").id);
  ok("new coin starts loose, not in an album", await p.evaluate((i) => !getCoin(i).albumId, newId));
  ok("new coin has its own notes and the copied price", await p.evaluate((i) => getCoin(i).notes === "serial C-4284" && num(getCoin(i).paid) === 40 && getCoin(i).purchaseId === "P1" && getCoin(i).cid !== "MD-001", newId));
  await p.click("#sheet [data-act=anotherPlace][data-album=a2]"); await p.waitForTimeout(250);
  ok("tapping an album places it there", await p.evaluate((i) => getCoin(i).albumId === "a2", newId));
  // Not now keeps it loose
  await p.evaluate(() => go("coin-m1")); await p.waitForTimeout(150);
  await p.click("[data-act=addAnother]"); await p.waitForTimeout(250);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("second copy: only album one still has an open 1881 spot", !/Morgan two/.test(await p.textContent("#sheet")) && /Morgan one/.test(await p.textContent("#sheet")));
  await p.click("#sheet [data-act=closeSheet]:not(.x)"); await p.waitForTimeout(200);
  ok("Not now leaves it loose", await p.evaluate(() => allCoins().filter((c) => !c.albumId && c.id !== "m1").length === 1));

  // ----- Receipt: blank store, new coin on this receipt -----
  await p.evaluate(() => go("purchases")); await p.waitForTimeout(150);
  await p.click("[data-act=purchaseNew]"); await p.waitForTimeout(200);
  ok("store box says optional", /Store or seller\s*\(optional\)/.test(await p.textContent("#purchaseForm")));
  ok("note that coins keep their own Where from", /Each coin keeps its own Where from/.test(await p.textContent("#purchaseForm")));
  await p.fill("[data-pf=date]", "2025-04-02");
  await p.selectOption("[data-pf=source]", "Coin Shop");
  await p.evaluate(() => { document.querySelector("#purchaseForm details").open = true; });
  await p.selectOption("[data-pf=payMethod]", "Cash");
  await p.click("[data-act=purchaseNewCoin]"); await p.waitForTimeout(300);
  const pre = await p.evaluate(() => ({ acquired: draft.acquired, source: draft.source, pay: draft.payMethod, seller: draft.seller || "", forP: !!draft._forPurchase }));
  ok("Add coin opens with date, where from and paid with filled in", pre.acquired === "2025-04-02" && pre.source === "Coin Shop" && pre.pay === "Cash" && pre.forP);
  // Cancel returns to the receipt
  await p.evaluate(() => actions.closeSheet()); await p.waitForTimeout(250);
  ok("closing the coin returns to the receipt", !!(await p.$("#purchaseForm")) && (await p.inputValue("[data-pf=date]")) === "2025-04-02");
  await p.click("[data-act=purchaseNewCoin]"); await p.waitForTimeout(300);
  await p.evaluate(() => { Object.assign(draft, { typeId: "morgan-dollar", typeName: "Morgan dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: "1885", mint: "O", grade: "MS-63" }); renderCoinForm(); });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(400);
  ok("after Save the receipt is back with the coin on it", !!(await p.$("#purchaseForm")) && /1885/.test(await p.textContent("#purchaseForm")));
  ok("total line flags the coin with no price", /1 coin has no price yet/.test(await p.textContent("#purchaseSum")));
  await (await p.$$("[data-pi]"))[0].fill("30");
  ok("flag goes away once priced", !/no price yet/.test(await p.textContent("#purchaseSum")));
  await p.click("[data-act=purchaseSave]:not([data-next])"); await p.waitForTimeout(400);
  const h1 = await p.textContent("main h1");
  ok("blank store is named Receipt, date", /Receipt, Apr 2, 2025/.test(h1));
  const cid = await p.evaluate(() => allCoins().find((c) => String(c.year) === "1885").id);
  ok("the new coin is linked and has its price", await p.evaluate((i) => getCoin(i).purchaseId && num(getCoin(i).paid) === 30 && getCoin(i).acquired === "2025-04-02", cid));
  await p.evaluate((i) => go("coin-" + i), cid); await p.waitForTimeout(200);
  ok("its Purchase box shows the Receipt link with a plain date", /Receipt\s*Apr 2, 2025/.test(await p.textContent("main")));
  await p.evaluate(() => go("purchases")); await p.waitForTimeout(150);
  ok("list names it Receipt, date", /Receipt, Apr 2, 2025/.test(await p.textContent("main")));

  // ----- Import warning -----
  await p.evaluate(() => { openImport(); loadImportText("Year,Type\n1881,Morgan Dollar\n", "t.csv"); }); await p.waitForTimeout(300);
  ok("import preview warns receipt links aren't kept", /Receipt links aren't kept in a spreadsheet/.test(await p.textContent("#sheet")));

  ok("no page errors", errors.length === 0);
  console.log("errors", errors);
  await b.close();
})();
