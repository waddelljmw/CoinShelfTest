// Step 28b (v0.111.1): Auto order = face value, then coin type (by when it began), then first year; series stay together.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const mk = (id, name, typeId, start, end, number, brand) => ({ kind: "album", id, brand: brand || "Other", number: number || "", name, typeId, typeIds: [typeId], layout: "dates", start, end, slots: [], removed: [], createdAt: 1 });
  await p.evaluate((rows) => { rows.forEach((r) => put("a_" + r.id, r)); go("albums"); }, [
    mk("peace", "Peace", "peace-dollar", 1921, 1935), mk("m2", "Morgan Dollars 1878-1891", "morgan-dollar", 1878, 1891, "9128", "Whitman"), mk("m1", "Morgan Dollar 1892-1921", "morgan-dollar", 1892, 1921, "9129", "Whitman"),
    mk("kn", "Kennedy", "kennedy-90", 1964, 2002), mk("lin", "Lincoln", "lincoln-wheat", 1909, 1958), mk("fe", "Indian", "indian-cent", 1859, 1909), mk("nk", "Nickel", "buffalo-nickel", 1913, 1938),
  ]);
  await p.waitForTimeout(150);
  const names = () => p.evaluate(() => albums().map((a) => a.id).join(","));
  const o = await names(); console.log(o);
  ok("cents, nickel, half, then dollars", /^fe,lin,nk,kn,/.test(o));
  ok("Morgan series earliest year first", o.indexOf("m2") < o.indexOf("m1"));
  ok("Morgans before Peace (type began earlier)", o.indexOf("m1") < o.indexOf("peace"));
  ok("switch shows on", await p.evaluate(() => !!document.querySelector("[data-act=autoOrder]:checked")));
  await p.click("[data-act=reorderAlbums]"); await p.waitForTimeout(80);
  await p.click('[data-act=moveAlbum][data-id="peace"][data-d="-1"]'); await p.waitForTimeout(120);
  ok("moving asks to turn off Auto order", /Turn off Auto order/.test(await p.textContent("#sheet")));
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(150);
  ok("Auto order is off after the move", await p.evaluate(() => settings().autoOrder === false));
  ok("Peace moved up", (await names()).split(",").indexOf("peace") < o.split(",").indexOf("peace"));
  await p.click("[data-act=autoOrderOn]"); await p.waitForTimeout(120);
  ok("turning Auto order back on restores the order", (await names()) === o);
  console.log("errors", JSON.stringify(errors));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
