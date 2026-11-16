// Ideas 34 + 35 (v0.77.0): a box kept in another box (the whole chain shows), and Swap two trays in Edit box.
// Also the 4-box check for this change to how boxes are saved: backup + restore, data version, demo copy, counts and totals.
const { chromium } = require("./_compat");
const fs = require("fs"), path = require("path");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
const URL0 = "file://" + path.resolve(__dirname, "../index.html");
const totals = () => { const owned = countedCoins(); return { all: allCoins().length, count: sum(owned, qtyOf), value: Math.round(sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c)) * 1e4) / 1e4, cost: Math.round(sum(allCoins(), (c) => costOf(c) || 0) * 100) / 100 }; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(URL0); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const t = COIN_TYPES.find((x) => x.id === "lincoln-wheat").id;
    put("b_safe", { kind: "box", id: "safe", name: "Safe", rows: 0, perRow: 0, type: "storage", look: "black", spots: false, createdAt: 1 });
    put("b_card", { kind: "box", id: "card", name: "Cardboard box", rows: 0, perRow: 0, type: "storage", look: "cardboard", spots: false, createdAt: 2 });
    put("b_wood", { kind: "box", id: "wood", name: "Wooden case", rows: 2, perRow: 4, type: "storage", look: "wood", spots: true, trays: [{ rows: 2, perRow: 4 }, { rows: 3, perRow: 5 }, { rows: 1, perRow: 6 }], createdAt: 3 });
    put("b_dc", { kind: "box", id: "dc", name: "Show case", rows: 2, perRow: 6, type: "dealer", look: "black", spots: true, forSale: true, createdAt: 4 });
    put("a_al", { kind: "album", id: "al", name: "Wheat album", typeId: t, keptBox: "card", createdAt: 5 });
    const coin = (id, o) => put("c_" + id, { kind: "coin", id, status: "owned", typeId: t, year: 1940, mint: "D", grade: "F-12", price: 2, qty: 1, createdAt: 10, ...o });
    coin("a1", { albumId: "al" });
    coin("t1", { boxId: "wood", boxTray: "", boxRow: "1", boxSlot: "2", year: 1941 });
    coin("t3", { boxId: "wood", boxTray: "3", boxRow: "1", boxSlot: "5", year: 1943 });
    coin("t2", { boxId: "wood", boxTray: "2", boxRow: "3", boxSlot: "5", year: 1942 });
    coin("loose", { boxId: "wood", year: 1944 }); // in the box with no numbered spot
    coin("sold", { boxId: "wood", boxTray: "1", boxRow: "2", boxSlot: "1", status: "sold", sold: { date: "2026-11-01", amount: 3 } });
    coin("cased", { boxId: "dc", boxRow: "1", boxSlot: "1", stage: "forsale", caseFrom: { albumId: "", slotId: "", boxId: "wood", boxRow: "1", boxSlot: "6", boxTray: "3", stack: "", status: "owned", stage: "" } });
  });
  const t0 = await p.evaluate(totals);

  // --- 34: Edit box > Kept in ---
  await p.evaluate(() => go("box-card")); await p.waitForTimeout(150);
  await p.click("[data-act=boxEdit]"); await p.waitForTimeout(150);
  ok("box form has a Kept in field", !!(await p.$("#boxForm [name=keptBox]")));
  ok("Kept in list leaves out the box itself", !(await p.$('#boxForm [name=keptBox] option[value="card"]')));
  await p.selectOption("#boxForm [name=keptBox]", "safe");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(200);
  ok("cardboard box saved as kept in the safe", await p.evaluate(() => getBox("card").keptBox === "safe" && getBox("card").name === "Cardboard box" && getBox("card").look === "cardboard"));
  ok("box page says where it is kept", (await p.textContent("main")).includes("Kept in: Safe"));
  await p.evaluate(() => go("box-safe")); await p.waitForTimeout(150);
  ok("safe lists the cardboard box kept in it", /Boxes kept in this box[\s\S]*Cardboard box/.test(await p.textContent("main")));
  await p.click("[data-act=boxEdit]"); await p.waitForTimeout(150);
  ok("safe can't be put inside the box that sits in it", !(await p.$('#boxForm [name=keptBox] option[value="card"]')));
  await p.fill("#boxForm [name=keptPlace]", "bedroom closet");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(200);
  ok("a typed place saves on a box", await p.evaluate(() => getBox("safe").keptPlace === "bedroom closet" && !getBox("safe").keptBox));
  ok("loop is refused even if forced", await p.evaluate(() => { boxForm(getBox("safe")); const s = $("#boxForm [name=keptBox]"); s.insertAdjacentHTML("beforeend", '<option value="card">x</option>'); s.value = "card"; saveBoxForm($("#boxForm")); closeSheet(); return !getBox("safe").keptBox; }));
  ok("a looped record (from a bad restore) still shows without hanging", await p.evaluate(() => { const a = { ...getBox("safe"), keptBox: "card" }; put("b_safe", a); const r = keptParts(getBox("card")).length < 6; delete a.keptBox; put("b_safe", a); return r; }));
  await p.evaluate(() => go("coin-a1")); await p.waitForTimeout(150);
  ok("coin in the album shows the whole chain", (await p.textContent("main")).includes("Wheat album › Cardboard box › Safe › bedroom closet"));
  await p.evaluate(() => go("album-al")); await p.waitForTimeout(150);
  ok("album page shows the chain", (await p.textContent("main")).includes("Kept in: Cardboard box · Safe · bedroom closet"));
  await p.evaluate(() => { const w = getBox("wood"); w.keptBox = "safe"; put("b_wood", w); go("coin-t1"); }); await p.waitForTimeout(150);
  ok("coin in a box shows the box's chain", (await p.textContent("main")).includes("Wooden case · Tray 1 · Row 1 · Slot 2 › Safe"));
  // delete the safe: boxes kept in it just lose it; Undo brings it back
  await p.evaluate(() => go("box-safe")); await p.waitForTimeout(150);
  await p.click("[data-act=boxDelete]"); await p.waitForTimeout(100); await p.click("[data-act=confirmOk]"); await p.waitForTimeout(150);
  ok("deleting a box frees the boxes kept in it", await p.evaluate(() => !getBox("safe") && !getBox("card").keptBox && !getBox("wood").keptBox));
  await p.click("#toast button"); await p.waitForTimeout(150);
  ok("Undo puts the chain back", await p.evaluate(() => getBox("card").keptBox === "safe" && getBox("wood").keptBox === "safe"));

  // --- 35: Swap two trays ---
  await p.evaluate(() => go("box-card")); await p.waitForTimeout(150); await p.click("[data-act=boxEdit]"); await p.waitForTimeout(150);
  ok("no Swap trays on a box without trays", !(await p.$("[data-act=traySwap]")));
  await p.evaluate(() => closeSheet());
  await p.evaluate(() => go("box-wood")); await p.waitForTimeout(150); await p.click("[data-act=boxEdit]"); await p.waitForTimeout(150);
  ok("Swap two trays is tucked away (folded)", await p.evaluate(() => { const d = $("[data-act=traySwap]").closest("details"); return !!d && !d.open; }));
  await p.evaluate(() => { $("[data-act=traySwap]").closest("details").open = true; });
  await p.selectOption("#swapA", "1"); await p.selectOption("#swapB", "1");
  await p.click("[data-act=traySwap]"); await p.waitForTimeout(100);
  ok("same tray twice is refused", await p.evaluate(() => getBox("wood").trays[0].perRow === 4 && !!$("#boxForm")));
  const before = await p.evaluate(() => JSON.stringify([getBox("wood"), ...["t1", "t2", "t3", "loose", "sold", "cased"].map((i) => getCoin(i))]));
  await p.selectOption("#swapB", "3");
  await p.click("[data-act=traySwap]"); await p.waitForTimeout(200);
  const s = await p.evaluate(() => ({ trays: getBox("wood").trays, rows: getBox("wood").rows, perRow: getBox("wood").perRow, t1: getCoin("t1").boxTray, t3: getCoin("t3").boxTray, t2: getCoin("t2").boxTray, loose: getCoin("loose").boxTray, sold: getCoin("sold").boxTray, cased: getCoin("cased").caseFrom.boxTray, rs: [getCoin("t1").boxRow, getCoin("t1").boxSlot, getCoin("t3").boxRow, getCoin("t3").boxSlot] }));
  ok("tray layouts traded places", s.trays[0].rows === 1 && s.trays[0].perRow === 6 && s.trays[2].rows === 2 && s.trays[2].perRow === 4 && s.trays[1].perRow === 5);
  ok("box rows/perRow still mirror tray 1", s.rows === 1 && s.perRow === 6);
  ok("coins moved with their tray, same row and slot", s.t1 === "3" && s.t3 === "1" && s.rs.join() === "1,2,1,5");
  ok("tray 2 and the loose coin untouched", s.t2 === "2" && s.loose === undefined);
  ok("sold coin's old spot moves too", s.sold === "3");
  ok("coin away in a dealer case will come back to the right tray", s.cased === "1");
  ok("spots still valid after swap", await p.evaluate(() => ["t1", "t3"].every((i) => { const c = getCoin(i); return spotExists(getBox("wood"), trayNo(c), c.boxRow, c.boxSlot) && spotCoin("wood", c.boxRow, c.boxSlot, undefined, trayNo(c)).id === i; })));
  ok("box page opens on the moved tray and shows the coin", /1941-D/.test(await p.textContent("main")) && (await p.textContent("main")).includes("Tray 3: 2 rows of 4"));
  const t1 = await p.evaluate(totals);
  ok("4-box (4): counts and totals the same after swap", JSON.stringify(t0) === JSON.stringify(t1));
  await p.click("#toast button"); await p.waitForTimeout(150);
  ok("one Undo puts every record back exactly", (await p.evaluate(() => JSON.stringify([getBox("wood"), ...["t1", "t2", "t3", "loose", "sold", "cased"].map((i) => getCoin(i))]))) === before);
  await p.evaluate(() => swapTrays(getBox("wood"), 2, 3)); // leave a swapped state for the backup

  // --- 4-box (1): backup and restore keep Kept in and the swapped trays ---
  const bk = await p.evaluate(async () => JSON.stringify(await buildBackup()));
  const snap = await p.evaluate(() => JSON.stringify({ card: getBox("card"), wood: getBox("wood"), safe: getBox("safe"), t2: getCoin("t2"), t3: getCoin("t3"), cased: getCoin("cased") }));
  fs.writeFileSync("/tmp/cc-kept3435.json", bk);
  const p2 = await b.newPage({ viewport: { width: 390, height: 844 } }); p2.on("pageerror", (e) => errors.push(e.message));
  await p2.goto(URL0); await p2.waitForTimeout(300);
  await p2.evaluate(() => openBackupSheet()); await p2.waitForTimeout(100);
  await p2.setInputFiles("#restoreFile", "/tmp/cc-kept3435.json"); await p2.waitForTimeout(300);
  await p2.click("[data-act=confirmOk]"); await p2.waitForTimeout(1000);
  ok("4-box (1): restore brings back boxes, chain and swapped trays exactly", (await p2.evaluate(() => JSON.stringify({ card: getBox("card"), wood: getBox("wood"), safe: getBox("safe"), t2: getCoin("t2"), t3: getCoin("t3"), cased: getCoin("cased") }))) === snap);
  ok("4-box (4): restored counts and totals match", JSON.stringify(await p2.evaluate(totals)) === JSON.stringify(t0));
  // --- 4-box (2): no conversion added, so the data version stays 1; old box records read the same ---
  ok("4-box (2): data version unchanged (new optional fields only)", await p2.evaluate(() => DATA_VERSION === 1 && settings().dataVersion === 1));
  ok("old box without Kept in reads as before", await p2.evaluate(() => { put("b_old", { kind: "box", id: "old", name: "Old", rows: 2, perRow: 2, createdAt: 9 }); const o = getBox("old"); return albumKeptText(o) === "" && keptParts(o).length === 0; }));

  // --- 4-box (3): tried on the demo sample collection ---
  const p3 = await b.newPage({ viewport: { width: 390, height: 844 } }); p3.on("pageerror", (e) => errors.push(e.message));
  await p3.goto(URL0 + "?demo=full"); await p3.waitForTimeout(1200);
  const d0 = await p3.evaluate(totals);
  const demo = await p3.evaluate(() => { const bx = allBoxes().filter((x) => x.type === "storage"); if (!bx.length) return "no box"; boxForm(bx[0]); $("#boxForm [name=keptPlace]").value = "safe"; saveBoxForm($("#boxForm")); go("box-" + bx[0].id); return getBox(bx[0].id).keptPlace; });
  ok("4-box (3): demo box saves a Kept in place", demo === "safe" && (await p3.textContent("main")).includes("Kept in: safe"));
  ok("4-box (3/4): demo counts and totals unchanged", JSON.stringify(await p3.evaluate(totals)) === JSON.stringify(d0) && d0.all > 0);

  console.log("errors", errors);
  await b.close();
})();
