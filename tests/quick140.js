// Step 28 (idea 140, v0.111.0): Back on the Needs Attention run, and Quick grade from an album page.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f) => p.evaluate(f);
  await ev(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1882, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1882); put("a_a1", a); withSlotIds(a);
    [1880, 1881, 1882].forEach((y, i) => { const s = getAlbum("a1").slots.find((x) => x.y === y && x.m === "S") || getAlbum("a1").slots.find((x) => x.y === y);
      saveCoin({ ...blankCoin(), id: "g" + i, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: y, mint: s.m || "", grade: "", paid: "1", source: "Coin Shop", albumId: "a1", slotId: s.id }); });
  });
  const cur = () => ev(() => draft && draft.id);
  const row = async () => !!(await p.$("#sheet [data-act=fixupBack]"));
  await ev(() => actions.fixupStart()); await p.waitForTimeout(250);
  const first = await cur();
  ok("no Back on the first coin", !(await row()));
  await p.click("#sheet [data-act=fixupSkip]"); await p.waitForTimeout(250);
  const second = await cur();
  ok("skip moves to another coin", second && second !== first);
  ok("Back shows on the second coin", await row());
  await p.click("#sheet [data-act=fixupBack]"); await p.waitForTimeout(250);
  ok("Back returns to the skipped coin", (await cur()) === first);
  ok("the skip is undone", await ev(() => !fixup.skip.includes(draft.id)));
  await ev(() => actions.fixupStop()); await p.waitForTimeout(150);
  // Quick grade from the album page
  await ev(() => go("album-a1")); await p.waitForTimeout(250);
  ok("album page has Quick grade (3)", /Quick grade \(3\)/.test(await p.textContent("body")));
  await p.click("[data-act=fixupQuick]"); await p.waitForTimeout(300);
  ok("Quick grade bar shows", /Quick grade: 3 coins left/.test(await p.textContent("#sheet")));
  ok("Photograde link on the bar", !!(await p.$("#sheet a[href*=pcgs]")));
  await ev(() => { draft.grade = "VF-20"; }); await p.click("#sheet [data-act=save]").catch(async () => { await ev(() => saveDraft()); }); await p.waitForTimeout(300);
  ok("saved coin has the grade", await ev(() => getCoin("g0").grade === "VF-20"));
  ok("next coin opens", await ev(() => !!draft && draft.id !== "g0"));
  await p.click("#sheet [data-act=fixupSkip]"); await p.waitForTimeout(200);
  await p.click("#sheet [data-act=fixupBack]"); await p.waitForTimeout(250);
  ok("Back works inside Quick grade", await ev(() => !!draft && getCoin(draft.id).grade === ""));
  await p.screenshot({ path: "/tmp/quick140.png" });
  await ev(() => actions.fixupStop()); await p.waitForTimeout(250);
  ok("Stop returns to the album", await ev(() => location.hash === "#album-a1"));
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
