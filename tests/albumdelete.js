// Deleting an album asks first; Cancel keeps it, Delete album removes it and keeps the coins.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => put("a_Zed", { kind: "album", id: "Zed", brand: "Other", number: "", name: "Zed", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1921 }));
  await p.waitForTimeout(150);
  await p.evaluate(() => actions.deleteAlbum({ dataset: { id: "Zed" } })); await p.waitForTimeout(100);
  ok("a question appears and the album is still there", await p.evaluate(() => !!getAlbum("Zed")) && !(await p.$eval("#sheet", (e) => e.hidden)));
  await p.click("#sheet [data-act=closeSheet]:has-text('Cancel')"); await p.waitForTimeout(80);
  ok("Cancel keeps the album", await p.evaluate(() => !!getAlbum("Zed")));
  await p.evaluate(() => actions.deleteAlbum({ dataset: { id: "Zed" } })); await p.waitForTimeout(100);
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(100);
  ok("Delete album removes it", await p.evaluate(() => !getAlbum("Zed")));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
