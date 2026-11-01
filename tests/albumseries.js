// Album numbers shown, series kept together, moved together, linked by hand.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const mk = (id, brand, number, name, typeId) => put("a_" + id, { kind: "album", id, brand, number, name, typeId, typeIds: [typeId], layout: "dates", start: 1878, end: 1880, slots: [], removed: [], createdAt: 1 });
    mk("m1", "Whitman", "9128", "Morgan Dollars Vol. 1", "morgan-dollar");
    mk("w", "Whitman", "9122", "Washington Quarters", "washington-silver");
    mk("m2", "Whitman", "9129", "Morgan Dollars Vol. 2", "morgan-dollar");
    mk("m3", "Dansco", "7179", "Morgans (Dansco)", "morgan-dollar");
    mk("a", "Other", "", "Apple", "peace-dollar");
    mk("k", "Whitman", "9127", "Kennedy", "kennedy-clad"); // next to 9128 but a different coin
    go("albums");
  });
  await p.waitForTimeout(150);
  const order = () => p.evaluate(() => albums().map((a) => a.id).join(","));
  ok("album number shown under the title", /Whitman No\. 9128/.test(await p.textContent("#view")));
  const o1 = await order();
  ok("9128 and 9129 are next to each other", /m1,m2|m2,m1/.test(o1));
  ok("9127 Kennedy is not pulled into the Morgan series", await p.evaluate(() => !albumSeriesOf(getAlbum("k"))));
  ok("series shown as a group", /Morgan dollar series · 2 albums/.test(await p.textContent("#view")));
  // link the Dansco Morgan into the series
  await p.evaluate(() => go("album-m3")); await p.waitForTimeout(100);
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=series]", "m1"); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  ok("Dansco Morgan linked: three albums in one series", await p.evaluate(() => { const s = albumSeriesOf(getAlbum("m3")); return !!s && albumSeriesOf(getAlbum("m1")) === s && albumSeriesOf(getAlbum("m2")) === s; }));
  ok("all three sit together", /m1,m2,m3|m1,m3,m2|m2,m1,m3|m2,m3,m1|m3,m1,m2|m3,m2,m1/.test(await order()));
  // move the whole series to the bottom
  await p.evaluate(() => { go("albums"); albumsView.reorder = true; render(); }); await p.waitForTimeout(100);
  for (let i = 0; i < 4; i++) { const btn = await p.$('.series-head [data-act=moveAlbum][data-d="1"]:not([disabled])'); if (btn) { await btn.click(); await p.waitForTimeout(80); } }
  const o2 = (await order()).split(",");
  ok("the series moved together to the bottom", o2.slice(-3).sort().join() === "m1,m2,m3");
  // reorder inside the series
  const before = o2.slice(-3);
  await p.click(`.series-box [data-act=moveAlbum][data-id="${before[2]}"][data-d="-1"]:not([data-whole])`); await p.waitForTimeout(80);
  const o3 = (await order()).split(",");
  ok("an album moves inside its series", o3.slice(-3).join() === [before[0], before[2], before[1]].join());
  // unlink
  await p.evaluate(() => { albumsView.reorder = false; go("album-m3"); }); await p.waitForTimeout(80);
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=series]", ""); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  ok("unlinking takes it out of the series", await p.evaluate(() => !albumSeriesOf(getAlbum("m3")) && !!albumSeriesOf(getAlbum("m1"))));
  // unlinking an automatic pair stays unlinked
  await p.evaluate(() => go("album-m2")); await p.waitForTimeout(80);
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=series]", ""); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  ok("Vol. 2 unlinked, Vol. 1 alone again", await p.evaluate(() => !albumSeriesOf(getAlbum("m2")) && !albumSeriesOf(getAlbum("m1"))));
  // Littleton LCA8 + LCA9 link automatically
  await p.evaluate(() => { put("a_l8", { kind: "album", id: "l8", brand: "Littleton", number: "LCA8", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1891, slots: [], removed: [] }); put("a_l9", { kind: "album", id: "l9", brand: "Littleton", number: "LCA9", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1892, end: 1921, slots: [], removed: [] }); });
  ok("Littleton LCA8 and LCA9 grouped", await p.evaluate(() => !!albumSeriesOf(getAlbum("l8")) && albumSeriesOf(getAlbum("l8")) === albumSeriesOf(getAlbum("l9"))));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
