// Step 4.3: holders, Kept in, storage and display boxes, album spine colors.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  // old holder names read as the new ones
  ok("old 2x2 and Flip show new names", await p.evaluate(() => holderText({ holder: "2x2" }) === "2x2 cardboard flip" && holderText({ holder: "Flip" }) === "Plastic flip"));
  ok("new holder list", await p.evaluate(() => ["2x2 cardboard flip", "Plastic flip", "Plastic holder"].every((h) => HOLDERS.includes(h)) && !HOLDERS.includes("2x2")));

  // an old box (no new fields) reads as storage, black, with spots
  await p.evaluate(() => put("b_old", { kind: "box", id: "old", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 }));
  ok("old box converts", await p.evaluate(() => { const x = getBox("old"); return x.type === "storage" && x.look === "black" && hasSpots(x); }));

  // make a display box without spots, a cardboard box and a clear plastic box through the form
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "Display 1"); await p.selectOption("[name=type]", "display"); await p.uncheck("#boxSpots");
  await p.fill("[name=inside]", "ziplock of Bicentennial quarters"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  const disp = await p.evaluate(() => { const x = displayBoxes()[0]; return { ...x, _spots: hasSpots(x) }; });
  ok("display box without spots", disp && disp.type === "display" && !disp._spots && disp.inside === "ziplock of Bicentennial quarters");
  await p.evaluate(() => go("boxes")); await p.waitForTimeout(150);
  await p.click("[data-act=boxNew]"); await p.fill("[name=name]", "Clear tub"); await p.selectOption("[name=look]", "plastic"); await p.selectOption("[name=color]", "clear");
  await p.fill("[name=rows]", "1"); await p.fill("[name=perRow]", "4"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  ok("clear plastic box saved", await p.evaluate(() => { const x = allBoxes().find((q) => q.name === "Clear tub"); return x && x.look === "plastic" && x.color === "clear" && x.spots; }));

  // a capsule coin can go in a box; picking a box clears an album
  const ids = await p.evaluate(() => {
    const al = { kind: "album", id: "al1", brand: "Whitman", number: "9122", typeId: "lincoln-wheat", start: 1909, end: 1958, slots: [], removed: [], createdAt: 1 };
    put("a_al1", al);
    const d = { ...blankCoin(), typeId: "lincoln-wheat", year: 1909, mint: "S", holder: "Capsule", albumId: "al1" };
    applyKept(d, "b:old");
    return { album: d.albumId, box: d.boxId };
  });
  ok("picking a box clears the album", ids.album === "" && ids.box === "old");
  ok("capsule coin passes box check", await p.evaluate(() => { const x = { ...blankCoin(), holder: "Capsule", boxId: "old", boxRow: "1", boxSlot: "1" }; return boxCheck(x) === "" && x.boxId === "old"; }));
  ok("box without spots has no row or slot", await p.evaluate((id) => { const x = { ...blankCoin(), holder: "Loose", boxId: id, boxRow: "1", boxSlot: "1" }; return boxCheck(x) === "" && x.boxRow === undefined && x.boxId === id; }, disp.id));

  // a set and a roll can also be kept in a box (form shows the Kept in dropdown)
  await p.evaluate(() => { openCoinForm(null); Object.assign(draft, { _what: "roll" }); renderCoinForm(); });
  ok("every kind gets Kept in", await p.evaluate(() => !!document.querySelector("select[data-kept]")));

  // coin page shows the box; search finds holder text and box name
  const cid = await p.evaluate((id) => { const c = { ...blankCoin(), typeId: "lincoln-wheat", year: 1944, mint: "D", grade: "G-4", holder: "Other", packaging: "Ziplock bag", boxId: id, status: "owned" }; saveCoin(c); return c.id; }, disp.id);
  await p.evaluate((id) => go("coin-" + id), cid); await p.waitForTimeout(150);
  ok("coin page shows display box", /Display box/.test(await p.textContent("main")) && /Display 1/.test(await p.textContent("main")));
  await p.evaluate(() => { listState.q = "ziplock"; go("coins"); }); await p.waitForTimeout(150);
  ok("search finds typed holder text", /1944/.test(await p.textContent("main")));
  await p.evaluate(() => { listState.q = "Display 1"; render(); }); await p.waitForTimeout(150);
  ok("search finds the Kept in name", /1944/.test(await p.textContent("main")));
  await p.evaluate(() => { listState.q = ""; });

  // turning spots off keeps the item in the box; Undo restores the spot
  ok("csv has a Kept in column", await p.evaluate(() => /Kept in/.test(toCsv())));

  // spine colors by brand
  ok("spine colors", await p.evaluate(() => brandSpine({ brand: "Whitman" }).cls === "s1" && brandSpine({ brand: "Littleton" }).cls === "s3" && brandSpine({ brand: "Dansco" }).cls === "sd" && brandSpine({ brand: "H.E. Harris" }).cls === "sbg" && brandSpine({ brand: "Other", color: "dark green" }).style.includes("#1f5a38") && brandSpine({ brand: "Other" }).style.includes("#9a2a2a")));

  // the shelf draws the new boxes
  await p.evaluate(() => go("home")); await p.waitForTimeout(250);
  const html = await p.evaluate(() => document.querySelector(".sh-cab").innerHTML);
  ok("shelf shows display case and clear box", /sh-case/.test(html) && /plastic clear/.test(html) && /Display boxes/.test(html));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
