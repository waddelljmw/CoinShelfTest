// Step 4.3: holders, Kept in, storage and display boxes, album spine colors.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    // an old box (no new fields), an old "2x2" coin and an old "Flip" coin
    put("b_old", { kind: "box", id: "old", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 });
    put("b_zip", { kind: "box", id: "zip", name: "Mixed box", type: "storage", look: "plastic", color: "clear", spots: false, inside: "ziplock of Bicentennial quarters", createdAt: 2 });
    put("b_dsp", { kind: "box", id: "dsp", name: "Display case", type: "display", look: "black", spots: false, createdAt: 3 });
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", qty: 1, status: "owned", ...o });
    mk("old2", { holder: "2x2", boxId: "old", boxRow: "1", boxSlot: "1" });
    mk("oldf", { holder: "Flip" });
    mk("cap", { holder: "Other", packaging: "Ziplock bag", boxId: "zip", boxRow: "5", boxSlot: "5", year: "1976", typeName: "Bicentennial quarter" });
    mk("alb", { holder: "Capsule", albumId: "x", boxId: "old", boxRow: "2", boxSlot: "2" });
    put("a_wh", { kind: "album", id: "wh", brand: "Whitman", number: "9128", name: "", typeId: "morgan", start: 1878, end: 1921 });
    put("a_da", { kind: "album", id: "da", brand: "Dansco", number: "7070", typeId: "morgan", start: 1878, end: 1921 });
    put("a_li", { kind: "album", id: "li", brand: "Littleton", number: "1", typeId: "morgan", start: 1878, end: 1921 });
    put("a_ha", { kind: "album", id: "ha", brand: "H.E. Harris", number: "2", typeId: "morgan", start: 1878, end: 1921 });
    put("a_ot", { kind: "album", id: "ot", brand: "Other", number: "My coins", name: "My coins", color: "orange", typeId: "morgan", start: 1878, end: 1921 });
    put("a_ot2", { kind: "album", id: "ot2", brand: "Other", number: "Plain", name: "Plain", typeId: "morgan", start: 1878, end: 1921 });
  });
  ok("old box reads as storage, black, with spots", await p.evaluate(() => { const x = getBox("old"); return x.type === "storage" && x.look === "black" && x.spots === true && x.inside === ""; }));
  ok("old 2x2 / Flip read as new names", await p.evaluate(() => holderOf(getCoin("old2")) === "2x2 cardboard flip" && holderOf(getCoin("oldf")) === "Plastic flip" && getCoin("old2").holder === "2x2"));
  ok("new holder choices", await p.evaluate(() => ["Plastic holder", "2x2 cardboard flip", "Plastic flip"].every((h) => HOLDERS.includes(h))));
  ok("a capsule coin can be in a box", await p.evaluate(() => boxCheck({ ...blankCoin(), holder: "Capsule", boxId: "old", boxRow: "1", boxSlot: "2" }) === ""));
  ok("box without spots has no row or slot", await p.evaluate(() => { const x = { ...blankCoin(), boxId: "zip", boxRow: "4", boxSlot: "4" }; boxCheck(x); return x.boxId === "zip" && x.boxRow === undefined && x.boxSlot === undefined; }));
  ok("old coin with album and box keeps both", await p.evaluate(() => { const c = getCoin("alb"); return !!c.albumId && !!c.boxId; }));
  // Kept in in the form: picking a box clears the album
  await p.evaluate(() => { openCoinForm(null); pickType("morgan"); draft.albumId = "wh"; renderCoinForm(); });
  await p.selectOption("[data-kept]", "b:old"); await p.waitForTimeout(150);
  ok("picking a box clears the album", await p.evaluate(() => draft.albumId === "" && draft.boxId === "old" && draft.boxRow === "1" && draft.boxSlot === "2"));
  ok("Kept in lists storage and display boxes", await p.evaluate(() => [...document.querySelectorAll("[data-kept] optgroup")].map((g) => g.label).join() === "Albums,Storage boxes,Display boxes"));
  await p.selectOption("[data-kept]", "b:dsp"); await p.waitForTimeout(150);
  ok("display box: no spot fields", !(await p.$("[data-f=boxRow]")) && await p.evaluate(() => draft.boxId === "dsp"));
  await p.selectOption("[data-kept]", ""); await p.waitForTimeout(100);
  ok("Nothing special clears the box", await p.evaluate(() => !draft.boxId));
  await p.evaluate(() => closeSheet());
  // set / roll / bullion can be kept in a box too
  await p.evaluate(() => { openCoinForm(null); actions.what({ dataset: { v: "roll" } }); });
  ok("rolls get Kept in", !!(await p.$("[data-kept]")) && !(await p.$("[data-kept] optgroup[label=Albums]")));
  await p.evaluate(() => closeSheet());
  // search matches holder text and Kept in name
  await p.evaluate(() => go("coins")); await p.waitForTimeout(150);
  await p.fill("#coinSearch", "ziplock"); await p.waitForTimeout(150);
  ok("search finds typed holder text", /Bicentennial/.test(await p.textContent("main")));
  await p.fill("#coinSearch", "mixed box"); await p.waitForTimeout(150);
  ok("search finds Kept in name", /Bicentennial/.test(await p.textContent("main")));
  await p.fill("#coinSearch", ""); 
  // box pages
  await p.evaluate(() => go("box-zip")); await p.waitForTimeout(150);
  ok("box without spots lists its coins and the note", /ziplock of Bicentennial quarters/.test(await p.textContent("main")) && /Bicentennial/.test(await p.textContent("main")) && !(await p.$(".slot")));
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  ok("Storage page names", /Storage boxes/.test(await p.textContent("main")) && /Display boxes/.test(await p.textContent("main")));
  // making a plastic box
  await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "Red tub"); await p.selectOption("[name=look]", "plastic");
  ok("color shows for plastic", await p.isVisible("#boxColorRow"));
  await p.selectOption("[name=color]", "red"); await p.click("[name=spots]"); await p.fill("[name=inside]", "wheat cents"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  ok("plastic red box saved without spots", await p.evaluate(() => { const x = allBoxes().find((q) => q.name === "Red tub"); return x && x.look === "plastic" && x.color === "red" && x.spots === false && x.inside === "wheat cents"; }));
  // shelf drawings
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  const sh = await p.evaluate(() => ({ black: !!document.querySelector(".sh-box.look-black"), clear: !!document.querySelector(".sh-box.look-plastic.col-clear"), red: !!document.querySelector(".sh-box.look-plastic.col-red"), disp: !!document.querySelector(".sh-display"), txt: document.querySelector("main").textContent }));
  ok("shelf draws black, clear and red boxes", sh.black && sh.clear && sh.red);
  ok("display box has its own shelf", sh.disp && /Display/.test(sh.txt));
  // spine colors
  const cls = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll(".sh-spine")].map((e) => [e.dataset.go, e.className])));
  ok("spine colors by brand", /col-darkblue/.test(cls["album-wh"]) && /col-darkbrown/.test(cls["album-da"]) && /col-darkgreen/.test(cls["album-li"]) && /col-beige/.test(cls["album-ha"]));
  ok("Other album uses its color, red by default", /col-orange/.test(cls["album-ot"]) && /col-red/.test(cls["album-ot2"]));
  // Other album color in the new-album form
  await p.evaluate(() => openNewAlbum());
  ok("color picker hidden until Other", !(await p.isVisible("#spineColorWrap")));
  await p.selectOption("[name=brand]", "Other"); await p.waitForTimeout(80);
  ok("color picker shows for Other", await p.isVisible("#spineColorWrap"));
  await p.evaluate(() => closeSheet());
  // CSV and coin page
  const csv = await p.evaluate(() => toCsv());
  ok("CSV has a Kept in column", /Kept in/.test(csv.split("\n")[0]) && /Black box 1 · Row 1 · Slot 1/.test(csv));
  await p.evaluate(() => go("coin-cap")); await p.waitForTimeout(150);
  ok("coin page shows Kept in box", /Storage box/.test(await p.textContent("main")) && /Mixed box/.test(await p.textContent("main")));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
