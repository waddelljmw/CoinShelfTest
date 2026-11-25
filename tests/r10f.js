// R10f: fixes from review 33 (original mark, blank spots, coins only, remove words, Not graded, Select bar).
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f, a) => p.evaluate(f, a);
  const wait = () => p.waitForTimeout(150);
  await ev(() => {
    ["A", "B"].forEach((id) => { const a = { kind: "album", id, brand: "Whitman", number: "", name: "Album " + id, typeId: "lincoln-wheat", typeIds: ["lincoln-wheat"], layout: "dates", start: 1940, end: 1942, removed: [], createdAt: 1 };
      a.slots = [...buildAlbumSlots(["lincoln-wheat"], "dates", 1940, 1942, ""), newBlankSpot()]; put("a_" + id, a); });
    const c = (id, o) => saveCoin({ ...blankCoin(), id, typeId: "lincoln-wheat", typeName: "Lincoln Wheat Cent", year: 1940, mint: "", qty: 1, status: "owned", ...o });
    c("o1", { albumId: "A", origAlbum: true, grade: "VF-20" }); c("n1", { year: 1941, noGrade: true, grade: "" }); c("n2", { year: 1942, grade: "" }); c("m1", { year: 1943, grade: "MS-64" }); c("r1", { kind: "roll", item: "roll" });
    put("b_case", { kind: "box", id: "case", type: "dealer", name: "Case", createdAt: 1 });
  });
  // R10-1
  ok("original mark survives the same album and a dealer case", await ev(() => { const x = { ...getCoin("o1") }; applyKept(x, "a:A", true); const y = { ...getCoin("o1") }; applyKept(y, "b:case", true); return x.origAlbum && y.origAlbum; }));
  ok("moving to another album clears it", await ev(() => { const x = { ...getCoin("o1") }; applyKept(x, "a:B", true); return x.albumId === "B" && !x.origAlbum; }));
  // R10-2
  await ev(() => { const a = getAlbum("A"); actions.moveSpot({ dataset: { id: "A", i: String(a.slots.length - 1), d: "-1" } }); });
  ok("nudging a blank among dated spots keeps your own order", await ev(() => { const a = getAlbum("A"); return !!a.freeOrder && a.slots[a.slots.length - 2].blank; }));
  // R10-3
  ok("rolls are not offered for a blank spot", await ev(() => { const ids = blankCandidates().map((c) => c.id); return ids.includes("n1") && !ids.includes("r1"); }));
  // R10-5
  await ev(() => { const s = getAlbum("B").slots.find((x) => x.blank); saveCoin({ ...blankCoin(), id: "k1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1964, grade: "AU-50", albumId: "B", slotId: s.id }); actions.deleteSpot({ dataset: { id: "B", k: slotKey(s) } }); }); await wait();
  const words = await p.textContent("#sheet");
  ok("remove words name the coin and where it goes", /1964 Morgan Dollar AU-50/.test(words) && /Also in this album/.test(words) && !/Blank spot AU/.test(words));
  await ev(() => closeSheet());
  // R10-4
  const pick = async () => { await ev(() => { closeSheet(); listState.family = null; listState.status = "owned"; go("coins"); }); await wait(); await p.click("[data-act=selStart]"); await ev(() => { ["n1", "n2", "m1"].forEach((i) => listState.sel.add(i)); render(); }); await p.click("[data-act=saOpen]"); await p.click("[data-act=saPick][data-k=grade]"); };
  await pick(); await p.selectOption("#saVal", "VF-20");
  ok("Not graded counts as blank", /Set VF-20 on 2 coins/.test(await p.textContent("[data-act=saGo]")));
  await p.check("input[name=saMode][value=all]"); await p.click("[data-act=saGo]"); await wait();
  const ask = await p.textContent("#sheet");
  ok("Change all asks and lists the real grade", /Replace 1 grade\?/.test(ask) && /MS-64/.test(ask) && (await ev(() => getCoin("n2").grade)) === "");
  await p.click("[data-act=saReplaceOk]"); await wait();
  ok("Replace changes all three", await ev(() => ["n1", "n2", "m1"].every((i) => getCoin(i).grade === "VF-20")));
  await p.click("[data-act=toastAction]"); await wait();
  ok("one Undo", await ev(() => getCoin("m1").grade === "MS-64" && getCoin("n1").noGrade === true));
  // R10-6
  await ev(() => { saveSeller({ on: true }, true); go("coins"); render(); }); await wait(); await p.click("[data-act=selStart]");
  ok("Sell together shows with Seller Mode", !!(await p.$("[data-act=orderOpen]")) && !(await p.$("[data-act=toOpen]")));
  ok("no page errors", !errors.length); if (errors.length) console.log(errors);
  await b.close();
})();
