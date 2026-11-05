// Step 9.6b: trays in a storage box, and albums kept in a box.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const T = () => COIN_TYPES[0].id;
  // old data: a box with no trays, a coin with no boxTray
  await p.evaluate(() => {
    put("b_old", { kind: "box", id: "old", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 });
    put("c_o1", { kind: "coin", id: "o1", status: "owned", typeId: COIN_TYPES[0].id, year: 1944, boxId: "old", boxRow: "2", boxSlot: "1", createdAt: 2 });
  });
  ok("old box reads as one tray", await p.evaluate(() => trayCount(getBox("old")) === 1 && trayNo(getCoin("o1")) === 1 && !boxText(getCoin("o1")).includes("Tray")));
  ok("old box total slots unchanged", await p.evaluate(() => boxStats(getBox("old")).total === 6));
  // make a 3-tray box through the form
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(100);
  await p.click("[data-act=boxNew]");
  await p.fill("#boxForm [name=name]", "Wooden box");
  await p.fill("#boxForm [name=rows]", "2"); await p.fill("#boxForm [name=perRow]", "3");
  await p.fill("#boxForm [name=trays]", "3"); await p.dispatchEvent("#boxForm [name=trays]", "change");
  ok("tray 2 and 3 offered, copied", await p.evaluate(() => document.querySelectorAll("#boxForm .tray-row").length === 2 && document.querySelector("#boxForm .tray-row [data-tr=rows]").value === "2"));
  await p.click("#boxForm .tray-row[data-n='3'] [data-act=trayChange]");
  await p.fill("#boxForm .tray-row[data-n='3'] [data-tr=rows]", "1"); await p.fill("#boxForm .tray-row[data-n='3'] [data-tr=perRow]", "2");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const id = await p.evaluate(() => allBoxes().find((x) => x.name === "Wooden box").id);
  ok("saved 3 trays, tray 1 mirrors rows", await p.evaluate((id) => { const x = getBox(id); return x.trays.length === 3 && x.trays[1].rows === 2 && x.trays[1].perRow === 3 && x.trays[2].rows === 1 && x.trays[2].perRow === 2 && x.rows === 2; }, id));
  ok("total slots add up (6+6+2)", await p.evaluate((id) => boxStats(getBox(id)).total === 14, id));
  // spots: same row/slot in different trays is fine, same tray is a clash
  await p.evaluate((id) => {
    put("c_a", { kind: "coin", id: "a", status: "owned", typeId: COIN_TYPES[0].id, year: 1950, boxId: id, boxRow: "1", boxSlot: "1", createdAt: 3 });
    put("c_b", { kind: "coin", id: "b", status: "owned", typeId: COIN_TYPES[0].id, year: 1951, boxId: id, boxRow: "1", boxSlot: "1", boxTray: "2", createdAt: 4 });
  }, id);
  ok("same spot in another tray is allowed", await p.evaluate((id) => boxCheck({ id: "n", kind: "coin", boxId: id, boxRow: "1", boxSlot: "2", boxTray: "2" }) === "", id));
  ok("same spot in the same tray is a clash", await p.evaluate((id) => boxCheck({ id: "n", kind: "coin", boxId: id, boxRow: "1", boxSlot: "1", boxTray: "2" }).includes("already holds"), id));
  ok("tray 3 only has 1 row", await p.evaluate((id) => boxCheck({ id: "n", kind: "coin", boxId: id, boxRow: "2", boxSlot: "1", boxTray: "3" }).includes("1 and a slot"), id));
  ok("box text names the tray", await p.evaluate(() => boxText(getCoin("b")).includes("Tray 2")));
  ok("next free spot moves on to the next tray when one is full", await p.evaluate((id) => {
    for (let r = 1; r <= 2; r++) for (let s = 1; s <= 3; s++) if (!(r === 1 && s === 1)) put("c_t1" + r + s, { kind: "coin", id: "t1" + r + s, status: "owned", typeId: COIN_TYPES[0].id, year: 1960, boxId: id, boxRow: String(r), boxSlot: String(s), createdAt: 5 });
    const n = nextFreeSpot(getBox(id)); return n.tray === 2 && n.row === 1 && n.slot === 2;
  }, id));
  // box page shows tray tabs, one tray at a time
  await p.evaluate((id) => go("box-" + id), id); await p.waitForTimeout(150);
  ok("tabs for 3 trays, tray 1 shown", await p.evaluate(() => document.querySelectorAll("[data-act=boxTray]").length === 3 && document.querySelectorAll(".slot").length === 6));
  await p.click("[data-act=boxTray][data-v='3']"); await p.waitForTimeout(100);
  ok("tray 3 shows its own 1x2 layout", await p.evaluate(() => document.querySelectorAll(".slot").length === 2));
  // shrink guard: cannot drop to 2 trays while a coin sits in tray 3
  await p.evaluate((id) => put("c_c", { kind: "coin", id: "c", status: "owned", typeId: COIN_TYPES[0].id, year: 1952, boxId: id, boxRow: "1", boxSlot: "2", boxTray: "3", createdAt: 6 }), id);
  await p.click("[data-act=boxEdit]");
  await p.fill("#boxForm [name=trays]", "2"); await p.dispatchEvent("#boxForm [name=trays]", "change");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(200);
  ok("shrinking below a used tray is refused", await p.evaluate((id) => trayCount(getBox(id)) === 3, id));
  await p.evaluate(() => { remove("c_c"); });
  await p.evaluate((id) => go("box-" + id), id); await p.waitForTimeout(100);
  await p.click("[data-act=boxEdit]");
  await p.fill("#boxForm [name=trays]", "2"); await p.dispatchEvent("#boxForm [name=trays]", "change");
  await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(200);
  ok("2 trays after the tray is empty", await p.evaluate((id) => trayCount(getBox(id)) === 2, id));
  // one tray again drops the trays list, tray numbers stay readable
  await p.click("[data-act=boxEdit]");
  await p.fill("#boxForm [name=trays]", "1"); await p.dispatchEvent("#boxForm [name=trays]", "change");
  ok("1 tray form check", await p.evaluate(() => document.querySelectorAll("#boxForm .tray-row").length === 0));
  await p.click("[data-act=boxCancel]");
  // CSV carries the tray
  ok("export has a Box tray column", await p.evaluate(() => SHEET_COLS.some((c) => c.key === "boxTray")));
  // albums kept in a box
  await p.evaluate((id) => {
    put("a_k", { kind: "album", id: "k", brand: "Whitman", number: "9128", name: "Kept album", typeId: COIN_TYPES[0].id, typeIds: [COIN_TYPES[0].id], layout: "dates", start: 1940, end: 1945, proofs: "", removed: [], slots: [], createdAt: 9, keptBox: id, keptPlace: "top shelf" });
  }, id);
  await p.evaluate((id) => go("box-" + id), id); await p.waitForTimeout(150);
  ok("box page lists the album kept in it", await p.evaluate(() => document.body.innerText.includes("Albums kept in this box") && document.body.innerText.includes("Kept album")));
  await p.evaluate(() => go("album-k")); await p.waitForTimeout(150);
  ok("album page says where it is kept", await p.evaluate(() => document.body.innerText.includes("Kept in: Wooden box · top shelf")));
  ok("album still counts for the shelf", await p.evaluate(() => albums().some((a) => a.id === "k") && String(viewHome ? viewHome() : "").includes("Kept album")));
  // edit album sets Kept in
  await p.evaluate(() => go("album-k")); 
  await p.evaluate(() => openEditAlbum("k")); await p.waitForTimeout(100);
  await p.selectOption("#editAlbumForm [name=keptBox]", ""); await p.fill("#editAlbumForm [name=keptPlace]", "safe, bottom");
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  ok("edit album: place typed, box cleared", await p.evaluate(() => { const a = getAlbum("k"); return !a.keptBox && a.keptPlace === "safe, bottom"; }));
  await p.evaluate((id) => { const a = getAlbum("k"); put("a_k", { ...a, keptBox: id }); }, id);
  // deleting the box: album loses the box, stays; Undo brings it back
  await p.evaluate((id) => actions.boxDelete({ dataset: { id } }), id); await p.waitForTimeout(100);
  await p.click(".sheet .btn.danger, [data-act=confirmYes]").catch(() => {});
  await p.waitForTimeout(200);
  ok("deleting the box keeps the album", await p.evaluate(() => !!getAlbum("k") && !getAlbum("k").keptBox));
  // add many + coin form + move many use the tray
  await p.evaluate(() => put("b_w2", { kind: "box", id: "w2", name: "Tray box", rows: 1, perRow: 3, trays: [{ rows: 1, perRow: 3 }, { rows: 1, perRow: 3 }], spots: true, type: "storage", look: "wood", createdAt: 20 }));
  ok("coin form offers a tray pick", await p.evaluate(() => { const d = { boxId: "w2", _spotAsk: "yes" }; return boxFields(d).includes('data-f="boxTray"'); }));
  ok("add many saves the chosen tray", await p.evaluate(() => { const d = { boxId: "w2", boxTray: "2", _spots: ["1-1", "1-2"], qty: 2, _many: 2 }; const c = { boxId: "w2" }; Object.assign(window, { manyCount: () => 2 }); const msg = manyPrep(c, d); return msg === "" && c.boxTray === "2" && c.boxRow === "1" && c.boxSlot === "1"; }));
  ok("old backup coin (no boxTray) in a tray box lands in tray 1", await p.evaluate(() => { put("c_ob", { kind: "coin", id: "ob", status: "owned", typeId: COIN_TYPES[0].id, year: 1949, boxId: "w2", boxRow: "1", boxSlot: "3", createdAt: 21 }); return boxText(getCoin("ob")).includes("Tray 1") && !!spotCoin("w2", 1, 3, undefined, 1) && !spotCoin("w2", 1, 3, undefined, 2); }));
  // review fixes (session 44): a coin coming back into a tray/spot that no longer exists stays in the box with no numbered spot
  ok("restore into a removed tray: no numbered spot, shown on page", await p.evaluate(async () => {
    put("b_rv", { kind: "box", id: "rv", name: "Wood", rows: 1, perRow: 4, spots: true, type: "storage", look: "wood", trays: [{ rows: 2, perRow: 4 }, { rows: 1, perRow: 4 }, { rows: 1, perRow: 4 }], createdAt: 30 });
    put("c_rx", { kind: "coin", id: "rx", status: "owned", typeId: COIN_TYPES[0].id, year: 1950, boxId: "rv", boxRow: "1", boxSlot: "1", boxTray: "3", createdAt: 31 });
    saveCoin({ ...getCoin("rx"), status: "deleted", prevStatus: "owned" });
    const bx = getBox("rv"); bx.trays = bx.trays.slice(0, 2); put("b_rv", bx);
    actions.restore({ dataset: { id: "rx" } });
    const c = getCoin("rx"); go("box-rv"); await new Promise((r) => setTimeout(r, 50)); boxTab.rv = 1; render();
    return c.status === "owned" && c.boxId === "rv" && !c.boxRow && !c.boxTray && document.body.innerHTML.includes('data-go="coin-rx"');
  }));
  ok("old coin left at a removed tray is listed under No numbered spot", await p.evaluate(async () => {
    put("c_ry", { kind: "coin", id: "ry", status: "owned", typeId: COIN_TYPES[0].id, year: 1951, boxId: "rv", boxRow: "1", boxSlot: "1", boxTray: "3", createdAt: 32 });
    go("box-rv"); await new Promise((r) => setTimeout(r, 50)); boxTab.rv = 1; render();
    return document.body.innerHTML.includes("No numbered spot") && document.body.innerHTML.includes('data-go="coin-ry"');
  }));
  ok("back from a dealer case never doubles up a spot", await p.evaluate(() => {
    put("b_dc", { kind: "box", id: "dc", name: "Case", rows: 2, perRow: 6, spots: true, type: "dealer", forSale: true, createdAt: 40 });
    put("b_vv", { kind: "box", id: "vv", name: "V", rows: 1, perRow: 2, spots: true, type: "storage", trays: [{ rows: 1, perRow: 2 }, { rows: 1, perRow: 2 }], createdAt: 41 });
    put("c_dy", { kind: "coin", id: "dy", status: "owned", typeId: COIN_TYPES[0].id, year: 1952, boxId: "vv", boxRow: "1", boxSlot: "1", boxTray: "2", createdAt: 42 });
    const prev = JSON.parse(JSON.stringify(getCoin("dy"))); const y2 = { ...prev, boxId: "dc", boxRow: "1", boxSlot: "1", boxTray: "" }; caseOnPut(prev, y2); put("c_dy", y2);
    const v = getBox("vv"); delete v.trays; put("b_vv", v);
    put("c_dz", { kind: "coin", id: "dz", status: "owned", typeId: COIN_TYPES[0].id, year: 1953, boxId: "vv", boxRow: "1", boxSlot: "1", createdAt: 43 });
    const c = JSON.parse(JSON.stringify(getCoin("dy"))); const note = caseRestore(c); put("c_dy", c);
    const same = ownedCoins().filter((k) => k.boxId === "vv" && trayNo(k) === 1 && k.boxRow === "1" && k.boxSlot === "1");
    // second case: box still has trays but fewer than remembered
    put("b_v3", { kind: "box", id: "v3", name: "V3", rows: 1, perRow: 2, spots: true, type: "storage", trays: [{ rows: 1, perRow: 2 }, { rows: 1, perRow: 2 }], createdAt: 44 });
    const c3 = { id: "d3", kind: "coin", status: "owned", typeId: COIN_TYPES[0].id, year: 1954, boxId: "dc", caseFrom: { boxId: "v3", boxRow: "1", boxSlot: "1", boxTray: "3" } };
    const n3 = caseRestore(c3);
    return same.length === 1 && !!note && c3.boxId === "v3" && !c3.boxRow && !c3.boxTray && /no longer exists/.test(n3);
  }));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
