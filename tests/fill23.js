// Step 23: circulated switch above Grade; filled spots look different in Edit spots; type-ahead pickers; Needs Attention wording.
const { chromium } = require("./_compat");
const ok = (name, v, x) => console.log((v ? "ok   " : "FAIL ") + name + (x !== undefined && !v ? " " + JSON.stringify(x) : ""));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  // 1. circulated switch comes before the Grade box
  const order = await p.evaluate(() => {
    openCoinForm(null); pickType("lincoln-memorial-copper"); draft.year = "1975"; draft.grade = ""; renderCoinForm();
    const h = $("#sheet").innerHTML;
    return { circ: h.indexOf("Circulated (not graded)"), grade: h.indexOf("My estimated grade") };
  });
  ok("Circulated switch sits above Grade", order.circ > -1 && order.grade > -1 && order.circ < order.grade, order);
  // 4. type-ahead pickers in the want form
  const w = await p.evaluate(() => { closeSheet(); openWantForm(null); const h = $("#sheet").innerHTML; return { search: /tsel-q/.test(h), plainSelect: /<select name="typeId"/.test(h) }; });
  ok("want form type field is a search box", w.search && !w.plainSelect, w);
  await p.fill(".tsel-q", "morgan"); await p.waitForTimeout(150);
  await p.click(".tsel .ta-list button"); await p.waitForTimeout(100);
  const v = await p.evaluate(() => new FormData($("#wantForm")).get("typeId"));
  ok("picking a result fills typeId", /morgan/.test(v), v);
  // album type rows
  const alb = await p.evaluate(() => { closeSheet(); openNewAlbum && openNewAlbum(); const h = $("#sheet").innerHTML; return /albumTypes/.test(h); });
  ok("new album sheet opens", alb);
  // 5. wording
  const t = await p.evaluate(() => needInfoLine.toString() + fixupBar.toString());
  ok("Needs Attention wording", /attention/.test(t) && !/Fix-up:/.test(t));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
