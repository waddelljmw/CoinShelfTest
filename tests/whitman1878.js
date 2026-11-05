const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // Whitman 9128 (new album form): page 1 order is 3 varieties, then 1878-CC, 1878-S, 1879
  await p.evaluate(() => go("albums")); await p.waitForTimeout(100); await p.click("[data-act=newAlbum]");
  await p.selectOption("#albumForm [name=brand]", "Whitman"); await p.fill("#albumForm [name=number]", "9128"); await p.waitForTimeout(100);
  await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(200);
  const first = await p.evaluate(() => { const a = albums().find((x) => x.number === "9128"); return a.slots.slice(0, 7).map((s) => s.y + (s.m ? "-" + s.m : "") + (s.v ? " " + s.v : "")); });
  ok("Whitman 9128 starts with the three 1878 spots in photo order", first.join("|") === "1878 8 Tail Feathers|1878 7 Over 8 Tail Feathers|1878 7 Tail Feathers|1878-CC|1878-S|1879|1879-CC");
  // Other Morgan albums are unchanged (no guessing)
  const other = await p.evaluate(() => ["Dansco|7178", "Littleton|LCA8"].map((k) => { const [br, n] = k.split("|"); const i = lookupAlbum(br, n); return buildAlbumSlots(i.types, "dates", i.start, i.end, "", i.spotVarieties).filter((s) => s.y === 1878 && !s.m).length; }));
  ok("Dansco and Littleton keep one plain 1878 spot", other.join() === "1,1");
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
