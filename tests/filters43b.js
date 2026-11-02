// Step 4.3b: Filter panel, saved filters, Select and Move many, Set holder.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  // Seed: 5 wheat cents, a Morgan, a junk silver dime, a box with 3 spots, a display box without spots, a Lincoln album
  await p.evaluate(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, family: "Lincoln cent", typeId: "lincoln-wheat", metal: "Copper", holder: "2x2 cardboard flip", ...o }, true);
    mk("w1", { year: 1909, mint: "S", grade: "G-4", value: "20", label: "1909-S wheat" });
    mk("w2", { year: 1914, mint: "D", grade: "VF-20", value: "300", label: "1914-D wheat", knownVar: "Doubled die" });
    mk("w3", { year: 1944, mint: "", grade: "MS-63", value: "2", label: "1944 wheat", holder: "Other", packaging: "Ziplock bag", group: "Inherited" });
    mk("w4", { year: 1955, mint: "", grade: "AU-50", value: "5", label: "1955 wheat", problems: ["Cleaned"], mintErrors: ["Off-center"] });
    mk("w5", { year: 1958, mint: "D", grade: "Other", customGrade: "MS-64 RD", value: "3", label: "1958-D wheat" });
    put("c_m1", { ...blankCoin(), id: "m1", family: "Morgan dollar", typeId: "morgan-dollar", metal: "Silver", year: 1881, mint: "S", grade: "MS-63", gradeMode: "raw", value: "60", holder: "Slab", label: "1881-S Morgan" }, true);
    put("c_j1", { ...blankCoin(), id: "j1", family: "Roosevelt dime", typeId: "roosevelt-dime-silver", metal: "Silver", year: 1960, mint: "", grade: "Junk", value: "", holder: "Loose", label: "1960 dime" }, true);
    put("b_box", { kind: "box", id: "box", name: "Black box 1", rows: 1, perRow: 3, createdAt: 1 }, true);
    put("b_disp", { kind: "box", id: "disp", name: "Display 1", type: "display", spots: false, createdAt: 2 }, true);
    put("a_lin", { kind: "album", id: "lin", brand: "Whitman", number: "9111", typeId: "lincoln-wheat", start: 1909, end: 1958, slots: [], removed: [], createdAt: 3 }, true);
    render();
  });
  const shown = (f) => p.evaluate((f) => { listState.f = f; return ownedCoins().filter(extraFilter).map((c) => c.id).sort().join(","); }, f);
  ok("no filter shows all", (await shown({})).split(",").length === 7);
  ok("group filter", await shown({ group: "Inherited" }) === "w3");
  ok("holder filter", await shown({ holder: "Slab" }) === "m1");
  ok("custom holder text filter", await shown({ holder: "Ziplock bag" }) === "w3");
  ok("year range", await shown({ yFrom: "1910", yTo: "1950" }) === "w2,w3");
  ok("mint D", await shown({ mint: "D" }) === "w2,w5");
  ok("mint P or none", (await shown({ mint: "P" })).includes("w3") && !(await shown({ mint: "P" })).includes("w1"));
  ok("grade range (standard grades only)", await shown({ gFrom: "VF-20", gTo: "MS-63" }) === "m1,w2,w3,w4");
  ok("junk grade in list", await shown({ gFrom: "Junk", gTo: "Junk" }) === "j1");
  ok("custom grade", await shown({ gCustom: "MS-64 RD" }) === "w5");
  ok("value range", await shown({ vFrom: "50", vTo: "400" }) === "m1,w2");
  ok("problems: details or variety", await shown({ probs: ["details", "variety"] }) === "w2,w4");
  ok("mint errors", await shown({ probs: ["error"] }) === "w4");
  ok("kept in nothing special", (await shown({ kept: "none" })).split(",").length === 7);
  ok("combined filters", await shown({ yFrom: "1900", mint: "D", vFrom: "100" }) === "w2");
  await p.evaluate(() => { listState.f = {}; });

  // old settings have no savedFilters
  ok("old settings work", await p.evaluate(() => Array.isArray(fltSaved()) && fltSaved().length === 0));

  // Filter button opens the panel; apply shows chips and the count
  await p.evaluate(() => go("coins")); await p.waitForTimeout(150);
  await p.click("[data-act=fltOpen]");
  await p.selectOption("[data-flt=metal]", "Silver");
  await p.click("[data-act=fltApply]"); await p.waitForTimeout(150);
  ok("chip shows after apply", await p.evaluate(() => /Silver ✕/.test(document.body.innerText)));
  ok("count line", await p.evaluate(() => /2 of 7 coins/.test(document.body.innerText)));
  ok("rows filtered", await p.evaluate(() => document.querySelectorAll(".coin-row").length === 2));
  await p.click("[data-act=fltDrop][data-k=metal]"); await p.waitForTimeout(100);
  ok("chip removed", await p.evaluate(() => document.querySelectorAll(".coin-row").length === 7 && !listState.metal));

  // saved filter round trip, rename, delete + undo
  await p.click("[data-act=fltOpen]");
  await p.selectOption("[data-flt=group]", "Inherited");
  await p.fill("[data-flt-name]", "Inherited stuff"); await p.click("[data-act=fltSave]"); await p.waitForTimeout(200);
  ok("saved filter stored", await p.evaluate(() => fltSaved().length === 1 && fltSaved()[0].s.f.group === "Inherited"));
  await p.click("#sheet [data-act=fltClear]"); await p.waitForTimeout(100);
  ok("clear all resets", await p.evaluate(() => !Object.keys(listState.f).length));
  await p.click("[data-act=fltOpen]"); await p.click("[data-act=fltUse]"); await p.waitForTimeout(150);
  ok("saved filter applies", await p.evaluate(() => listState.f.group === "Inherited" && document.querySelectorAll(".coin-row").length === 1));
  await p.click("[data-act=fltOpen]"); await p.click("[data-act=fltRen]");
  await p.fill("[data-flt-ren]", "Family coins"); await p.click("[data-act=fltRenSave]"); await p.waitForTimeout(150);
  ok("rename", await p.evaluate(() => fltSaved()[0].name === "Family coins"));
  await p.click("[data-act=fltDel]"); await p.waitForTimeout(150);
  ok("delete", await p.evaluate(() => fltSaved().length === 0));
  await p.click("[data-act=toastAction]"); await p.waitForTimeout(150);
  ok("delete undo", await p.evaluate(() => fltSaved().length === 1));
  await p.evaluate(() => { closeSheet(); listState.f = {}; render(); });

  // Select mode: tick wheat cents, move into a 3-spot box with 4 coins -> 3 move, 1 skipped
  await p.click("[data-act=selStart]");
  await p.evaluate(() => { listState.family = "Lincoln cent"; render(); });
  await p.click("[data-act=selAll]");
  ok("select all shown", await p.evaluate(() => listState.sel.size === 5));
  await p.evaluate(() => { put("c_w1", { ...getCoin("w1"), boxId: "box", boxRow: "1", boxSlot: "1" }, true); render(); });
  await p.click("[data-act=mvOpen]"); await p.selectOption("[data-flt=mv]", "b:box"); await p.click("[data-act=mvGo]"); await p.waitForTimeout(250);
  const mv = await p.evaluate(() => ({ inBox: ownedCoins().filter((c) => c.boxId === "box").length, spots: ownedCoins().filter((c) => c.boxId === "box").map((c) => c.boxSlot).sort().join(","), sheet: !$("#sheet").hidden && $("#sheet").innerText }));
  ok("box fills next free spots, rest skipped", mv.inBox === 3 && mv.spots === "1,2,3" && /Skipped 3/.test(mv.sheet) && /no free spot/.test(mv.sheet));
  await p.click("[data-act=fltUndo]"); await p.waitForTimeout(150);
  ok("bulk Undo puts everything back", await p.evaluate(() => ownedCoins().filter((c) => c.boxId === "box").length === 1 && !getCoin("w2").boxId));

  // move to a display box without spots; to an album (Morgan skipped); to a stack (only junk silver)
  await p.evaluate(() => { listState.family = null; render(); });
  await p.click("[data-act=selAll]"); await p.click("[data-act=mvOpen]"); await p.selectOption("[data-flt=mv]", "a:lin"); await p.click("[data-act=mvGo]"); await p.waitForTimeout(250);
  ok("album move skips other types", await p.evaluate(() => ownedCoins().filter((c) => c.albumId === "lin").length === 5 && getCoin("m1").albumId === "" && /different coin type|only coins/.test($("#sheet").innerText)));
  ok("album move cleared the box", await p.evaluate(() => !getCoin("w1").boxId));
  await p.evaluate(() => { closeSheet(); });
  await p.click("[data-act=selAll]"); await p.click("[data-act=mvOpen]"); await p.selectOption("[data-flt=mv]", "s:My Silver Stack"); await p.click("[data-act=mvGo]"); await p.waitForTimeout(250);
  ok("stack takes only junk silver", await p.evaluate(() => getCoin("j1").stack === "My Silver Stack" && !getCoin("m1").stack && !getCoin("w1").stack));
  await p.evaluate(() => closeSheet());
  await p.click("[data-act=selAll]"); await p.click("[data-act=mvOpen]"); await p.selectOption("[data-flt=mv]", "b:disp"); await p.click("[data-act=mvGo]"); await p.waitForTimeout(250);
  ok("display box without spots takes all", await p.evaluate(() => ownedCoins().filter((c) => c.boxId === "disp").length === 7 && !getCoin("w1").boxRow));
  await p.evaluate(() => closeSheet());

  // Set holder: coins change, picked ones only
  await p.click("[data-act=selNone]");
  await p.evaluate(() => { listState.sel.add("w1"); listState.sel.add("w2"); render(); });
  await p.click("[data-act=hdOpen]"); await p.selectOption("[data-flt=hd]", "Capsule"); await p.click("[data-act=hdGo]"); await p.waitForTimeout(200);
  ok("set holder", await p.evaluate(() => getCoin("w1").holder === "Capsule" && getCoin("w2").holder === "Capsule" && getCoin("w4").holder === "2x2 cardboard flip"));
  await p.click("[data-act=toastAction]"); await p.waitForTimeout(150);
  ok("holder Undo", await p.evaluate(() => getCoin("w1").holder === "2x2 cardboard flip"));
  await p.click("[data-act=selDone]");
  ok("select mode off", await p.evaluate(() => !listState.sel && !document.querySelector(".selbox")));

  ok("version", await p.evaluate(() => APP_VERSION === "0.27.0"));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
