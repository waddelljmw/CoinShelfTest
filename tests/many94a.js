// Step 9.4a: Set purchase info for many coins at once (My Coins, album and box pages).
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const m = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", status: "owned", qty: 1, ...o }, true);
    m("k1", { seller: "Old Shop", paid: "5", source: "Pawn Shop" }); m("k2", { qty: 2 }); m("k3", { acquired: "2019-05-05" });
    m("k4", { source: "Inherited", paid: "" }); m("k5", { status: "sold" });
    put("a_al1", { ...(typeof blankAlbum === "function" ? blankAlbum() : {}), id: "al1", typeId: "morgan-dollar", name: "Test", slots: [] }, true);
  });
  const coin = (id) => p.evaluate((id) => { const c = getCoin(id); return { paid: c.paid, src: c.source, sel: c.seller, acq: c.acquired }; }, id);
  const pick = async (ids) => { await p.evaluate((ids) => { listState.family = null; listState.status = "owned"; go("coins"); }, ids); await p.waitForTimeout(150); await p.click("[data-act=selStart]"); for (const id of ids) await p.click(`[data-act=selToggle][data-id=${id}]`); };
  // 1. split a total evenly over 4 coins (k1 x1, k2 x2, k3 x1) + inherited k4 is skipped
  await pick(["k1", "k2", "k3", "k4"]);
  await p.click("[data-act=pcOpen]");
  await p.fill("#pcDate", "2026-10-01"); await p.selectOption("#pcSrc", "Coin Show"); await p.fill("#pcSeller", "Spring Show");
  await p.check("input[name=pcMode][value=split]"); await p.fill("#pcAmt", "40");
  const prev = await p.textContent("#pcPreview");
  ok("preview says 3 coins and $10.00 each", /3/.test(prev) && /\$10\.00/.test(prev));
  await p.click("[data-act=pcGo]"); await p.waitForTimeout(300);
  const k1 = await coin("k1"), k2 = await coin("k2"), k4 = await coin("k4");
  ok("k1 got date, source, seller, price", k1.paid === "10" && k1.src === "Coin Show" && k1.sel === "Spring Show" && k1.acq === "2026-10-01");
  ok("k2 (qty 2) got the same each-price", k2.paid === "10");
  ok("inherited skipped, listed", k4.paid === "" && k4.src === "Inherited" && /inherited/i.test(await p.textContent("#sheet")));
  // 2. Undo puts every coin back
  await p.click("#sheet [data-act=fltUndo]"); await p.waitForTimeout(200);
  const u1 = await coin("k1"), u3 = await coin("k3");
  ok("undo restores all", u1.paid === "5" && u1.src === "Pawn Shop" && u1.sel === "Old Shop" && u3.acq === "2019-05-05" && u3.src === "");
  // 3. blank fields leave coins alone: only the date
  await pick(["k1", "k3"]); await p.click("[data-act=pcOpen]"); await p.fill("#pcDate", "2025-01-02"); await p.click("[data-act=pcGo]"); await p.waitForTimeout(300);
  const d1 = await coin("k1");
  ok("blank fields untouched", d1.acq === "2025-01-02" && d1.paid === "5" && d1.src === "Pawn Shop" && d1.sel === "Old Shop");
  // 4. nothing filled -> asks, no change
  await pick(["k1"]); await p.click("[data-act=pcOpen]"); await p.click("[data-act=pcGo]");
  ok("empty sheet changes nothing", (await coin("k1")).acq === "2025-01-02");
  // 5. Select works on a box page (select bar + pick + sold not selectable)
  await p.evaluate(() => { put("b_bx1", { id: "bx1", name: "Shoebox", type: "storage" }, true); const c = getCoin("k3"); c.boxId = "bx1"; put("c_k3", c, true); });
  await p.evaluate(() => go("box-bx1")); await p.waitForTimeout(200);
  ok("box page has Select", await p.locator("[data-act=selStart]").count() === 1);
  await p.click("[data-act=selStart]"); await p.waitForTimeout(100);
  ok("box page select bar shows Set purchase info", await p.locator("[data-act=pcOpen]").count() === 1 && await p.locator("[data-act=selAll]").count() >= 2);
  // 6. album page: Select taps a spot's coin; Missing list has Select all at top and bottom
  await p.evaluate(() => { const a = { id: "al2", typeId: "morgan-dollar", name: "A2", start: 1880, end: 1881 }; a.slots = buildSlots("morgan-dollar", 1880, 1881); put("a_al2", a, true); withSlotIds(a); const c = getCoin("k1"); c.albumId = "al2"; put("c_k1", c, true); });
  await p.evaluate(() => go("album-al2")); await p.waitForTimeout(200);
  await p.click("[data-act=selStart]"); await p.waitForTimeout(100);
  const have = await p.locator(".slot.have[data-act=selToggle]").count();
  ok("album page spot with coin is selectable", have >= 1 && await p.locator("[data-act=pcOpen]").count() === 1);
  await p.evaluate(() => { listState.sel = null; }); await p.evaluate(() => go("album-al2")); await p.waitForTimeout(100);
  await p.click("[data-act=missing]"); await p.waitForTimeout(200);
  const m = await p.evaluate(() => { const h = [...document.querySelectorAll("#sheet [data-act=missAll]")]; const card = document.querySelector("#sheet .card"); return { n: h.length, first: h[0] && card ? !!(h[0].compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) : false }; });
  ok("Missing list: Select all at top and bottom", m.n === 2 && m.first);
  const pwa = require("fs").readFileSync(require("path").resolve(__dirname, "../pwa.js"), "utf8");
  ok("update picks the newest waiting version", /updateViaCache: "none"/.test(pwa) && /newestWaiting\(worker\)/.test(pwa));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
