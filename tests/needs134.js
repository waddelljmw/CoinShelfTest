// Idea 134 (v0.106.0): the Needs Attention card names the album the coin is in; tapping it opens that album.
// Also: "Needs Attention" is written with a capital A on screen.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f) => p.evaluate(f);
  await ev(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1880, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1880); put("a_a1", a); withSlotIds(a);
    const s = getAlbum("a1").slots.find((x) => x.m === "S");
    saveCoin({ ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "", albumId: "a1", slotId: s.id });
    saveCoin({ ...blankCoin(), id: "n1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "", paid: "1", source: "Coin Shop" });
  });
  ok("album coin needs attention", await ev(() => needsOf(getCoin("s1")).length > 0));
  await ev(() => { actions.fixupStart(); }); await p.waitForTimeout(300);
  const open = await ev(() => draft && draft.id);
  const bar = async () => (await p.$("#sheet .link-btn[data-act=fixupAlbum]")) ? await p.textContent("#sheet .link-btn[data-act=fixupAlbum]") : null;
  const first = await bar();
  // the run opens the first queued coin; make sure we are looking at the album coin
  if (open !== "s1") { await ev(() => { closeSheet(); openCoinForm("s1"); }); await p.waitForTimeout(250); }
  const t = await bar();
  ok("card shows the album name", !!t && /Whitman/.test(t)); console.log(String(t).trim());
  ok("card heading has a capital A", /Needs Attention:/.test(await p.textContent("#sheet")));
  await p.screenshot({ path: "/tmp/needs134.png" });
  await p.click("#sheet .link-btn[data-act=fixupAlbum]"); await p.waitForTimeout(250);
  ok("tap opens the album", await ev(() => location.hash === "#album-a1" && !document.querySelector("#coinForm")));
  await ev(() => { actions.fixupStop(); openCoinForm("n1"); fixup.on = true; render(); openCoinForm("n1"); }); await p.waitForTimeout(250);
  ok("no album line for a coin outside an album", !(await p.$("#sheet .link-btn[data-act=fixupAlbum]")));
  ok("filter chip and Home wording use a capital A", await ev(() => !/Needs attention/.test(fixupBar.toString() + needInfoLine.toString())));
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
