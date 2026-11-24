// Step 26 (idea 138): Purchases. One receipt, many coins; tax by price, shipping even; review before changing a coin;
// coin page line; delete + Undo; backup keeps it; snapshots leave it out.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const ok = (n, c) => console.log((c ? "ok   " : "FAIL ") + n);
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  await p.evaluate(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), kind: "coin", id, typeId: "morgan-dollar", typeName: "Morgan dollar", year: "1921", metal: "Silver", qty: 1, status: "owned", createdAt: 1, ...o }, true);
    mk("m1", { paid: "40", seller: "Bob's", source: "Coin Shop" }); // has its own details
    mk("m2", { year: "1922" });
    mk("m3", { year: "1923" });
    mk("inh", { year: "1880", source: "Inherited" }); // can't go on a receipt
    render();
  });
  // Menu item sits under Storage.
  await p.click("#menuBtn");
  const items = await p.$$eval("#menu button", (x) => x.filter((e) => !e.hidden).map((e) => e.textContent.trim()));
  ok("Purchases is in the menu under Storage", items[items.indexOf("Storage") + 1] === "Purchases");
  await p.click("#menu [data-go=purchases]"); await p.waitForTimeout(200);
  ok("Purchases page opens with help line", /One receipt, many coins/.test(await p.textContent("main")));
  await p.click("[data-act=purchaseNew]"); await p.waitForTimeout(200);
  await p.fill("[data-pf=date]", "2025-03-14");
  await p.fill("[data-pf=seller]", "Main St Coins");
  await p.selectOption("[data-pf=source]", "Coin Shop");
  await p.fill("[data-pf=total]", "200"); // receipt had other things on it
  await p.evaluate(() => { document.querySelector("#purchaseForm details").open = true; });
  await p.fill("[data-pf=tax]", "6");
  await p.fill("[data-pf=ship]", "10");
  await p.click("[data-act=purchasePickOpen]");
  ok("inherited coin isn't offered", !(await p.$("[data-act=purchaseAddCoin][data-id=inh]")));
  for (const id of ["m1", "m2", "m3"]) await p.click(`[data-act=purchaseAddCoin][data-id=${id}]`);
  await p.click("[data-act=purchasePickDone]");
  const pi = await p.$$("[data-pi]");
  await pi[0].fill("38"); await pi[1].fill("14"); await pi[2].fill("8");
  const sumText = await p.textContent("#purchaseSum");
  ok("summary adds coins + tax + shipping", /\$60\.00/.test(sumText) && /\$76\.00/.test(sumText));
  ok("other items shown, not counted", /Other items on the receipt: \$124\.00/.test(sumText));
  await p.click("[data-act=purchaseSave]:not([data-next])"); await p.waitForTimeout(200);
  const rev = await p.textContent(".sheet");
  ok("review lists only the coin with its own details", /These details will change/.test(rev) && /Bob's/.test(rev) && /Main St Coins/.test(rev) && (await p.$$("[data-act=purchaseKeep][data-keep='1']")).length === 1);
  await p.click("[data-act=purchaseKeep][data-keep='1']"); // keep m1's own info
  await p.click("[data-act=purchaseCommit]"); await p.waitForTimeout(300);
  const c = await p.evaluate(() => ["m1", "m2", "m3"].map((id) => store.docs.get("c_" + id)));
  ok("all three linked", c.every((x) => x.purchaseId && x.purchaseId === c[0].purchaseId));
  ok("kept coin keeps its price and store", c[0].paid === "40" && c[0].seller === "Bob's");
  ok("other coins get receipt details", c[1].paid === "14" && c[1].seller === "Main St Coins" && c[1].acquired === "2025-03-14" && c[2].source === "Coin Shop");
  ok("shipping splits evenly", [c[1].buyShip, c[2].buyShip].join() === "3.33,3.34");
  ok("tax splits by price", c[1].buyTax === "1.4" && c[2].buyTax === "0.8");
  ok("kept coin's blank tax filled in", c[0].buyTax === "3.8" && c[0].buyShip === "3.33");
  ok("purchase page opens", /Coins on this receipt \(3\)/.test(await p.textContent("main")));
  // Coin page line opens the purchase.
  await p.evaluate(() => go("coin-m2")); await p.waitForTimeout(200);
  ok("coin page shows the Purchase line", /Purchase: Main St Coins/.test(await p.textContent("main")));
  // Backup includes the purchase; a snapshot leaves it out.
  const bk = await p.evaluate(async () => { const d = await buildBackup(() => {}); return d.docs.some((x) => x.data && x.data.kind === "purchase"); });
  ok("backup includes the purchase", bk);
  const snap = await p.evaluate(async () => { const d = await snapshotDocs({ paid: true, source: true, notes: true, photos: false, values: true }); return { pu: d.some((x) => x.id.startsWith("pu_")), link: d.some((x) => x.data && x.data.purchaseId) }; });
  ok("snapshot leaves purchases out", !snap.pu && !snap.link);
  // Delete keeps the coins' details; Undo brings the link back.
  const pid = c[0].purchaseId;
  await p.evaluate((id) => go("purchase-" + id), pid); await p.waitForTimeout(200);
  await p.click("[data-act=purchaseDelete]"); await p.waitForTimeout(200);
  await p.click(".sheet .btn.danger"); await p.waitForTimeout(300);
  const after = await p.evaluate(() => [store.docs.has("pu_" + store.docs.get("c_m2").purchaseId), store.docs.get("c_m2").purchaseId, store.docs.get("c_m2").paid]);
  ok("delete unlinks but keeps price", !after[1] && after[2] === "14");
  await p.click("#toast button"); await p.waitForTimeout(300);
  ok("Undo brings purchase and link back", await p.evaluate((id) => store.docs.has("pu_" + id) && store.docs.get("c_m3").purchaseId === id, pid));
  // Restore in a fresh page: purchase, link and receipt photo come back (4-box check, box 1).
  await p.evaluate((id) => { const r = store.docs.get("pu_" + id); put("pu_" + id, { ...r, receiptPhotos: [{ url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }] }, true); }, pid);
  const data = await p.evaluate(async () => JSON.stringify(await buildBackup(() => {})));
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await ctx2.newPage(); p2.on("pageerror", (e) => errors.push(e.message));
  await p2.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p2.waitForTimeout(400);
  const back = await p2.evaluate(async ({ data, id }) => { restorePending = JSON.parse(data); await doRestore(); const r = store.docs.get("pu_" + id); return { has: !!r, photo: r && (r.receiptPhotos || []).length, link: (store.docs.get("c_m3") || {}).purchaseId === id, coins: allCoins().length }; }, { data, id: pid });
  ok("restore brings purchase, link and receipt photo back", back.has && back.photo === 1 && back.link && back.coins === 4);
  // A new purchase form asks before losing typing.
  await p.evaluate(() => go("purchases")); await p.waitForTimeout(200);
  await p.click("[data-act=purchaseNew]"); await p.fill("[data-pf=seller]", "Yard sale guy");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  ok("closing an edited purchase asks first", /Discard this purchase/.test(await p.textContent("body")));
  ok("no page errors", errors.length === 0);
  console.log("errors", errors);
  await b.close();
})();
