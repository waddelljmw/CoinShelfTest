// Session 36: fixes from the Step 9.4 review.
const { chromium } = require("./_compat");
const fs = require("fs"), path = require("path");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const m = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", status: "owned", qty: 1, ...o }, true);
    m("r1", {}); m("r2", {}); m("r3", {});
  });
  const pick = async (ids) => { await p.evaluate(() => { listState.family = null; listState.status = "owned"; go("coins"); }); await p.waitForTimeout(150); await p.click("[data-act=selStart]"); for (const id of ids) await p.click(`[data-act=selToggle][data-id=${id}]`); };
  // 1. split $10 over 3 coins adds up to exactly $10.00
  await pick(["r1", "r2", "r3"]);
  await p.click("[data-act=pcOpen]"); await p.check("input[name=pcMode][value=split]"); await p.fill("#pcAmt", "10");
  ok("preview shows the leftover cent", /\$0\.01/.test(await p.textContent("#pcPreview")));
  await p.click("[data-act=pcGo]"); await p.waitForTimeout(300);
  const tot = await p.evaluate(() => ["r1", "r2", "r3"].reduce((s, id) => s + Number(getCoin(id).paid) * 100, 0));
  ok("split total adds up exactly", Math.round(tot) === 1000);
  // 2. the phone's Back button ends Select
  await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  await pick(["r1"]);
  await p.evaluate(() => history.back()); await p.waitForTimeout(300);
  ok("Back ends Select", await p.evaluate(() => listState.sel === null));
  // 3. guide ends when the form is closed before saving, and never sits over the top bar
  await p.evaluate(() => { go("home"); actions.guideStart(); }); await p.waitForTimeout(300);
  ok("guide starts", await p.locator("#guideBubble").count() === 1);
  ok("bubble below the top bar", await p.evaluate(() => document.getElementById("guideBubble").getBoundingClientRect().top >= 60));
  await p.evaluate(() => closeSheet()); await p.waitForTimeout(300);
  ok("closing the form ends the guide", await p.locator("#guideBubble").count() === 0);
  await p.evaluate(() => { actions.guideStart(); }); await p.waitForTimeout(300);
  await p.evaluate(() => actions.what({ dataset: { v: "bullion" } })); await p.waitForTimeout(300);
  ok("picking a bar ends the guide (no stuck bubble)", await p.locator("#guideBubble").count() === 0);
  await p.evaluate(() => closeSheet());
  // 4. Kept in has its ⓘ in the form, and it survives a redraw
  await p.evaluate(() => { openCoinForm("r1"); }); await p.waitForTimeout(200);
  await p.evaluate(() => { const d = document.querySelector("#sheet details:not([open])"); document.querySelectorAll("#sheet details").forEach((x) => (x.open = true)); renderCoinForm(); }); await p.waitForTimeout(150);
  ok("Kept in shows its ⓘ after a redraw", await p.locator("#sheet [data-w=keptin]").count() === 1);
  await p.evaluate(() => closeSheet());
  // 5. every plain word is used somewhere
  const code = fs.readdirSync(path.resolve(__dirname, "..")).filter((f) => f.endsWith(".js")).map((f) => fs.readFileSync(path.resolve(__dirname, "..", f), "utf8")).join("\n");
  const unused = await p.evaluate(() => Object.keys(WORDS)).then((ks) => ks.filter((k) => !new RegExp(`wi\\("${k}"\\)`).test(code)));
  ok("every ⓘ word is shown somewhere" + (unused.length ? " (unused: " + unused.join(", ") + ")" : ""), unused.length === 0);
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.join("\n"));
  await b.close();
})();
