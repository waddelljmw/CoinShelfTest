// E1d (v0.124.0): Select › Edit one by one.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (f, a) => p.evaluate(f, a), wait = (n = 300) => p.waitForTimeout(n);
  await ev(() => {
    const a = { kind: "album", id: "a1", brand: "Other", number: "", name: "Morgans", typeId: "morgan-dollar", start: 1880, end: 1882, removed: [], createdAt: 1 }; a.slots = buildSlots(a.typeId, 1880, 1882); put("a_a1", a); withSlotIds(a);
    [0, 1, 2, 3].forEach((i) => { const s = getAlbum("a1").slots[i]; saveCoin({ ...blankCoin(), id: "g" + i, typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", year: s.y, mint: s.m, grade: "VF-20", paid: "1", source: "Coin Shop", albumId: "a1", slotId: s.id }); });
  });
  await ev(() => go("album-a1")); await wait();
  await p.click("[data-act=selStart]"); await wait();
  await ev(() => { ["g2", "g0", "g1"].forEach((id) => listState.sel.add(id)); render(); });
  await p.click("[data-act=editEach]"); await wait();
  ok("starts with the first coin on the page", await ev(() => draft.id === "g0"));
  ok("button says Save + next", /Save \+ next/.test(await p.textContent("#coinForm button[type=submit]")));
  ok("bar counts 3", /Edit one by one: 3 coins left/.test(await p.textContent("#sheet")));
  await p.screenshot({ path: "/tmp/e1d.png" });
  await p.fill("#coinForm [data-f=year]", "1881"); await p.click("#coinForm button[type=submit]"); await wait(500);
  ok("the year change is saved", await ev(() => getCoin("g0").year === 1881));
  ok("the next picked coin opens", await ev(() => draft.id === "g1"));
  await p.click("#sheet [data-act=fixupBack]"); await wait();
  ok("Back returns", await ev(() => draft.id === "g0"));
  await p.click("#coinForm button[type=submit]"); await wait(500);
  await p.click("#sheet [data-act=fixupSkip]"); await wait();
  ok("Skip moves on", await ev(() => draft.id === "g2"));
  await p.click("#coinForm button[type=submit]"); await wait(500);
  ok("ends after the last one", await ev(() => !fixup.on && !fixup.list && document.querySelector("#sheet").hidden));
  ok("a coin not picked is untouched", await ev(() => getCoin("g3").grade === "VF-20"));
  await ev(() => openCoinForm("g3")); await wait();
  ok("a normal edit says Save changes", /Save changes/.test(await p.textContent("#coinForm button[type=submit]")));
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
