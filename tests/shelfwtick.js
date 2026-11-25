// Idea 163 (switch at the bottom of the album page), idea 164 (shelf rows) and the W-quarter tick.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const make = async (tick) => {
    await p.evaluate(() => { go("albums"); openNewAlbum(); });
    await p.fill("#albumTypeFind", "America the Beautiful Quarter"); await p.waitForTimeout(150);
    const shown = await p.isVisible("#albumWRow"), on = await p.isChecked("#albumWRow input");
    if (tick) await p.check("#albumWRow input");
    await p.click("#albumCreate"); await p.waitForTimeout(200);
    return { shown, on, w: await p.evaluate(() => getAlbum(location.hash.slice(7)).slots.filter((s) => s.m === "W").length) };
  };
  const off = await make(false);
  ok("tick shows for park quarters, off by default", off.shown && !off.on);
  ok("no W spots unless ticked", off.w === 0);
  ok("ticked: 10 W spots", (await make(true)).w === 10);
  await p.evaluate(() => openNewAlbum());
  await p.fill("#albumTypeFind", "Franklin Half Dollar"); await p.waitForTimeout(150);
  ok("tick hidden for other coins", !(await p.isVisible("#albumWRow")));
  await p.evaluate(() => closeSheet());
  ok("shelf switch sits below Edit album", await p.evaluate(() => !!(document.querySelector("[data-act=editAlbum]").compareDocumentPosition(document.querySelector("[data-act=shelfItem]")) & Node.DOCUMENT_POSITION_FOLLOWING)));
  await p.evaluate(() => { for (let i = 0; i < 19; i++) put("a_s" + i, { kind: "album", id: "s" + i, name: "Franklin " + i, typeId: "franklin-half", start: 1948, end: 1963 }); go("home"); }); await p.waitForTimeout(200);
  ok("21 albums all on the shelf", (await p.$$("button.sh-spine")).length === 21);
  if (process.argv.includes("--shots")) await p.screenshot({ path: "/tmp/shelf21.png", fullPage: true });
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
