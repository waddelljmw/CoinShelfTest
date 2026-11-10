// Fix 1: a half-filled new coin comes back after the page reloads (Android closing the app)
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const url = "file://" + require("path").resolve(__dirname, "../index.html");
  await p.goto(url); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.waitForTimeout(100);
  await p.evaluate(() => { draft.photos.push({ lid: "fake1" }); draft.albumId = "alb1"; renderCoinForm(); });
  await p.reload(); await p.waitForTimeout(600);
  const r = await p.evaluate(() => ({ form: !!document.querySelector("#coinForm"), year: draft && draft.year, photos: draft && draft.photos.length, album: draft && draft.albumId }));
  ok("form reopens after reload", r.form);
  ok("year, photo and album spot come back", r.year === "1881" && r.photos === 1 && r.album === "alb1");
  await p.click("[data-act=closeSheet] >> nth=0"); await p.reload(); await p.waitForTimeout(500);
  ok("cancel clears the saved draft", !(await p.evaluate(() => !!document.querySelector("#coinForm"))));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
