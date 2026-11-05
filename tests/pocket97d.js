// Step 9.7d: pocket albums (pages x pockets, any coin in any pocket). Saved like a box, pages are trays.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  // an old box and an old album must be untouched
  await p.evaluate(() => { put("b_old", { kind: "box", id: "old", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 }); });
  await p.evaluate(() => go("albums")); await p.waitForTimeout(150);
  await p.click("[data-act=pocketNew]");
  await p.fill("#pocketForm [name=name]", "Eagle album"); await p.fill("#pocketForm [name=pages]", "3"); await p.fill("#pocketForm [name=across]", "2"); await p.fill("#pocketForm [name=down]", "3");
  await p.selectOption("#pocketForm [name=color]", "black"); await p.fill("#pocketForm [name=keptPlace]", "safe, top shelf");
  await p.click("#pocketForm button[type=submit]"); await p.waitForTimeout(300);
  const id = await p.evaluate(() => (pocketAlbums()[0] || {}).id);
  ok("pocket album saved as a pocket", await p.evaluate(() => { const a = pocketAlbums()[0]; return !!a && a.type === "pocket" && a.rows === 3 && a.perRow === 2 && trayCount(a) === 3 && a.color === "black" && a.keptPlace === "safe, top shelf"; }));
  ok("not listed as a storage box", await p.evaluate(() => storageBoxes().every((x) => x.type !== "pocket") && storageBoxes().length === 1));
  ok("page shows page tabs and Kept in", await p.evaluate(() => { const t = [...document.querySelectorAll("[data-act=boxTray]")].map((e) => e.textContent); return t.length === 3 && t[0].startsWith("Page 1") && document.body.innerText.includes("Kept in: safe, top shelf"); }));
  // any coin in any pocket: a Morgan and an Eagle on page 2
  await p.evaluate((id) => {
    put("c_m", { kind: "coin", id: "m", status: "owned", typeId: COIN_TYPES[0].id, year: 1921, boxId: id, boxTray: "2", boxRow: "3", boxSlot: "2", createdAt: 2 });
    put("c_e", { kind: "coin", id: "e", status: "owned", typeId: COIN_TYPES[1].id, year: 2020, boxId: id, boxTray: "2", boxRow: "1", boxSlot: "1", createdAt: 3 });
  }, id);
  ok("coin text says Page and Pocket", await p.evaluate(() => boxText(getCoin("m")).includes("Page 2") && boxText(getCoin("m")).includes("Pocket 2")));
  ok("next free pocket skips taken ones", await p.evaluate((id) => { const n = nextFreeSpot(getBox(id), "", 2); return n.tray === 2 && n.row === 1 && n.slot === 2; }, id));
  ok("a taken pocket is refused", await p.evaluate((id) => boxCheck({ id: "z", boxId: id, boxTray: "2", boxRow: "3", boxSlot: "2" }).includes("already holds"), id));
  ok("a pocket past the page is refused", await p.evaluate((id) => boxCheck({ id: "z", boxId: id, boxTray: "1", boxRow: "4", boxSlot: "1" }) !== "", id));
  await p.evaluate((id) => go("box-" + id), id); await p.waitForTimeout(150);
  await p.click("[data-act=boxTray][data-v='2']"); await p.waitForTimeout(150);
  ok("page 2 draws 6 pockets, 2 filled", await p.evaluate(() => document.querySelectorAll(".slots .slot").length === 6 && document.querySelectorAll(".slots .slot.full").length === 2));
  // shows on the Albums page and the Home shelf
  await p.evaluate(() => go("albums")); await p.waitForTimeout(150);
  ok("Albums page has the card", await p.evaluate(() => document.body.innerText.includes("Eagle album") && document.body.innerText.includes("3 pages")));
  await p.evaluate(() => go("home")); await p.waitForTimeout(250);
  ok("Home shelf has a spine", await p.evaluate(() => [...document.querySelectorAll(".sh-spine")].some((e) => e.textContent.includes("Eagle album"))));
  // shrinking below a coin is refused; growing works
  await p.evaluate((id) => go("box-" + id), id); await p.waitForTimeout(150);
  await p.click("[data-act=boxEdit]"); await p.fill("#pocketForm [name=pages]", "1"); await p.click("#pocketForm button[type=submit]"); await p.waitForTimeout(250);
  ok("cannot shrink under coins", await p.evaluate((id) => trayCount(getBox(id)) === 3, id));
  await p.fill("#pocketForm [name=pages]", "4"); await p.click("#pocketForm button[type=submit]"); await p.waitForTimeout(250);
  ok("grows to 4 pages, coins stay", await p.evaluate((id) => trayCount(getBox(id)) === 4 && getCoin("m").boxTray === "2" && getCoin("e").boxRow === "1", id));
  // old box unchanged, delete keeps coins
  ok("old box unchanged", await p.evaluate(() => { const o = getBox("old"); return o.type === "storage" && o.rows === 2 && o.perRow === 3 && trayCount(o) === 1; }));
  await p.evaluate((id) => actions.boxDelete({ dataset: { id } }), id); await p.waitForTimeout(200);
  await p.evaluate(() => { const ok = document.querySelector("[data-act=confirmOk]"); if (ok) ok.click(); }); await p.waitForTimeout(250);
  ok("deleting the album keeps its coins", await p.evaluate(() => !pocketAlbums().length && !!getCoin("m") && !!getCoin("e") && !getCoin("m").boxId));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
