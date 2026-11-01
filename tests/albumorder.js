// Albums can be put in any order on the Albums page.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => { ["Charlie", "Alpha", "Bravo"].forEach((n, i) => put("a_" + n, { kind: "album", id: n, brand: "Other", number: "", name: n, typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1880, slots: [], removed: [], createdAt: i })); go("albums"); });
  await p.waitForTimeout(150);
  const names = () => p.evaluate(() => albums().map((a) => a.name).join(","));
  ok("starts A to Z", await names() === "Alpha,Bravo,Charlie");
  await p.click("[data-act=reorderAlbums]"); await p.waitForTimeout(80);
  await p.click('[data-act=moveAlbum][data-id="Charlie"][data-d="-1"]'); await p.waitForTimeout(80);
  await p.click('[data-act=moveAlbum][data-id="Charlie"][data-d="-1"]'); await p.waitForTimeout(80);
  ok("Charlie moved to the top", await names() === "Charlie,Alpha,Bravo");
  await p.click("button:has-text('Done')"); await p.waitForTimeout(80);
  ok("Albums page shows the new order", (await p.$$eval("#view .card b", (els) => els.map((e) => e.textContent.trim()))).join(",") === "Charlie,Alpha,Bravo");
  await p.evaluate(() => put("a_Delta", { kind: "album", id: "Delta", brand: "Other", number: "", name: "Delta", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1880, slots: [], removed: [], createdAt: 9 }));
  ok("a new album goes at the end", await names() === "Charlie,Alpha,Bravo,Delta");
  await p.evaluate(() => { remove("a_Alpha"); });
  ok("deleting an album keeps the rest in order", await names() === "Charlie,Bravo,Delta");
  await p.reload(); await p.waitForTimeout(400);
  ok("order is kept after reopening", await names() === "Charlie,Bravo,Delta");
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
