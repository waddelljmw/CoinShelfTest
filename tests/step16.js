const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const url = "file://" + require("path").resolve(__dirname, "../index.html");
  await p.goto(url); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1880, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1880); put("a_a1", a); withSlotIds(a);
    const s = getAlbum("a1").slots.find((x) => x.m === "S");
    saveCoin({ ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Dollars", year: 1880, mint: "S", grade: "VF-20", albumId: "a1", slotId: s.id });
    saveCoin({ ...blankCoin(), id: "t1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Dollars", year: 1885, mint: "", grade: "VF-20", paid: 30 });
    listState.family = TYPE_BY_ID["morgan-dollar"].family; go("coins");
  });
  await p.waitForTimeout(250);
  const t = await p.textContent("#app, main, body");
  ok("missing card shows", /Missing from your albums: \d+/.test(t));
  ok("card names the album", /Whitman/.test(t));
  await p.evaluate(() => { listState.family = null; go("coins"); }); await p.waitForTimeout(150);
  ok("no card when no type chosen", !/Missing from your albums/.test(await p.textContent("body")));
  // two tabs: sell in tab 2 first, then tab 1 tries
  const p2 = await ctx.newPage(); await p2.goto(url); await p2.waitForTimeout(400);
  await p.evaluate(() => go("coin-t1")); await p.waitForTimeout(200); await p.click("[data-act=sell]"); await p.waitForTimeout(250); console.log("mode", await p.evaluate(() => store.mode));
  await p2.evaluate(() => { const c = getCoin("t1"); saveCoin({ ...c, status: "sold", sold: { at: 1, date: "2026-11-01", amount: 99 } }); }); await p2.waitForTimeout(300);
  const had = await p.evaluate(() => !!document.querySelector("#sellForm"));
  if (had) {
    await p.evaluate(() => { document.querySelector("#sellForm [name=amount]").value = "50"; document.querySelector("#sellForm").requestSubmit(); });
    await p.waitForTimeout(400);
    const amt = await p.evaluate(() => (getCoin("t1").sold || {}).amount);
    ok("second tab does not replace first sale", amt === 99);
    ok("warns", /another tab/.test(await p.textContent("body")));
  } else console.log("FAIL could not open sell form");
  ok("no page errors", errors.length === 0);
  await b.close();
})();
