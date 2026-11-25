// Step 30: Select › Set for all (155, 156, 137b, 97b, 133) and the bullion holder fix.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const m = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", status: "owned", qty: 1, ...o }, true);
    put("a_al1", { ...(typeof blankAlbum === "function" ? blankAlbum() : {}), id: "al1", typeId: "morgan-dollar", name: "Bought album", slots: [] }, true);
    m("g1", { grade: "VF-20", albumId: "al1" }); m("g2", { grade: "", albumId: "al1" }); m("g3", { grade: "", notes: "old note" });
    m("g4", { gradeMode: "cert", grade: "MS-64", service: "PCGS" }); m("g5", { grade: "PR-65" }); m("g6", { status: "sold", grade: "" });
  });
  const pick = async (ids) => { await p.evaluate(() => { listState.family = null; listState.status = "owned"; go("coins"); }); await p.waitForTimeout(150); await p.click("[data-act=selStart]"); await p.evaluate((ids) => { ids.forEach((i) => listState.sel.add(i)); render(); }, ids); };
  const sa = async (k) => { await p.click("[data-act=saOpen]"); await p.click(`[data-act=saPick][data-k=${k}]`); };
  const coin = (id) => p.evaluate((id) => getCoin(id), id);

  await pick(["g1", "g2", "g3", "g4", "g5"]);
  const bar = await p.$$eval(".selacts [data-act]", (els) => els.map((e) => e.dataset.act));
  ok("My Coins Select bar (Seller Mode off): Set for all, Move", bar.join().startsWith("saOpen,mvOpen") && !bar.includes("toOpen") && !bar.includes("orderOpen") && !bar.includes("hdOpen") && !bar.includes("pcOpen"));
  await p.click("[data-act=saOpen]");
  ok("Set for all list has 9 rows", (await p.locator("[data-act=saPick]").count()) === 9);
  await p.click("[data-act=saPick][data-k=grade]");
  ok("grade starts on Only the blank", await p.isChecked("input[name=saMode][value=blank]"));
  ok("slab is skipped and said so", /slabbed/.test(await p.textContent("#sheet")));
  await p.selectOption("#saVal", "XF-40");
  ok("button names the count", /Set XF-40 on 2 coins/.test(await p.textContent("[data-act=saGo]")));
  await p.check("input[name=saMode][value=all]");
  ok("Change all shows what it replaces", /Replaces/.test(await p.textContent("#saPreview")) && /VF-20/.test(await p.textContent("#saPreview")));
  await p.check("input[name=saMode][value=blank]");
  await p.click("[data-act=saGo]"); await p.waitForTimeout(200);
  const [c1, c2, c3, c4] = [await coin("g1"), await coin("g2"), await coin("g3"), await coin("g4")];
  ok("only blank ones changed", c1.grade === "VF-20" && c2.grade === "XF-40" && c3.grade === "XF-40" && c4.grade === "MS-64");
  ok("proof coin skipped for a non-PR grade (listed)", (await coin("g5")).grade === "PR-65");
  await p.click("[data-act=fltUndo]"); await p.waitForTimeout(150);
  ok("one Undo puts grades back", (await coin("g2")).grade === "" && (await coin("g3")).grade === "");

  // Not graded, change all on two blanks (no choice shown when all are blank)
  await pick(["g2", "g3"]); await sa("grade");
  ok("no choice when all blank", (await p.locator("input[name=saMode]").count()) === 0);
  await p.selectOption("#saVal", "Not graded"); await p.click("[data-act=saGo]"); await p.waitForTimeout(150);
  ok("Not graded set", (await coin("g2")).noGrade === true && (await coin("g3")).grade === "");

  // Described as and Keeping for
  await pick(["g1", "g2"]); await sa("described"); await p.selectOption("#saVal", "BU"); await p.click("[data-act=saGo]"); await p.waitForTimeout(150);
  ok("Described as set", (await coin("g1")).described === "BU" && (await coin("g2")).described === "BU");
  await pick(["g1", "g3"]); await sa("keepFor"); await p.fill("#saVal", "my son"); await p.click("[data-act=saGo]"); await p.waitForTimeout(150);
  ok("Keeping for set", (await coin("g1")).keepFor === "my son" && (await coin("g3")).keepFor === "my son");

  // Holder: slab and album coins skipped
  await pick(["g1", "g3", "g4"]); await sa("holder"); await p.selectOption("#saVal", "Capsule"); await p.click("[data-act=saGo]"); await p.waitForTimeout(150);
  ok("holder: loose coin set, album and slab coins kept", (await coin("g3")).holder === "Capsule" && (await coin("g4")).holder !== "Capsule" && (await coin("g1")).holder !== "Capsule");
  await p.evaluate(() => closeSheet());

  // 156: Original to the album on a bought (not inherited) album
  await pick(["g1", "g2", "g3"]); await sa("orig"); await p.click("[data-act=saOrigGo][data-v='1']"); await p.waitForTimeout(150);
  ok("original to a bought album", (await coin("g1")).origAlbum === true && (await coin("g2")).origAlbum === true && !(await coin("g3")).origAlbum);
  await p.evaluate(() => closeSheet());
  const kept = await p.evaluate(() => { const c = { ...getCoin("g1") }; inhPrepSave(c); return c.origAlbum === true; });
  ok("saving keeps original for a non-inherited coin", kept);
  await p.evaluate(() => go("coin-g1")); await p.waitForTimeout(150);
  ok("coin page shows original", /Original to the album/.test(await p.textContent("body")));

  // Add to notes never wipes
  await pick(["g3"]); await sa("notes"); await p.fill("#saNote", "From the estate lot"); await p.click("[data-act=saNotesGo]"); await p.waitForTimeout(150);
  ok("note line added, old note kept", (await coin("g3")).notes === "old note\nFrom the estate lot");

  // 133: add to a want list (new list), then Undo
  await pick(["g1", "g5"]); await sa("want"); await p.selectOption("#saList", "__new"); await p.fill("#saNewName", "Morgan upgrades"); await p.click("[data-act=saWantGo]"); await p.waitForTimeout(150);
  const w = await p.evaluate(() => { const l = wantLists().find((x) => x.name === "Morgan upgrades"); return l ? wants().filter((x) => x.listId === l.id).map((x) => x.year + x.mint + ":" + x.grade) : null; });
  ok("want list made with 2 upgrades", w && w.length === 2 && w.includes("1880S:VF-25"));
  await p.click("[data-act=toastAction]"); await p.waitForTimeout(150);
  ok("want Undo removes them and the new list", await p.evaluate(() => !wantLists().some((x) => x.name === "Morgan upgrades")));

  // Holder fix: a new bar never keeps a 2x2 flip carried from the last entry
  const fit = await p.evaluate(() => { const d = { ...blankCoin(), item: "bullion", kind: "bullion", bShape: "Bar", holder: "2x2 cardboard flip", _isNew: true }; holderFits(d); const old = { ...d, _isNew: false, holder: "2x2 cardboard flip" }; holderFits(old); return [d.holder, old.holder, bullionHolders({ bShape: "Bar" }).includes("Tube")]; });
  ok("new bar drops a flip; saved one keeps it; bars have no tube", fit[0] === "" && fit[1] === "2x2 cardboard flip" && fit[2] === false);

  ok("no page errors", !errors.length); if (errors.length) console.log(errors);
  await b.close();
})();
