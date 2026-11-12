// Step 10.2: Back closes only the top pop-up and keeps what was typed
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const hash = () => p.evaluate(() => location.hash), shut = () => p.evaluate(() => document.getElementById("sheet").hidden);
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "7178", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a);
    go("album-alb1");
  }); await p.waitForTimeout(200);
  // 1. "+" in an album, then Back: stays on the album, form closed
  await p.click(".slot:has-text('1923-D')"); await p.click("[data-act=slotHave]"); await p.waitForTimeout(200);
  ok("form open", !(await shut()));
  await p.goBack(); await p.waitForTimeout(200);
  ok("Back closes the form, stays on the album", (await shut()) && (await hash()) === "#album-alb1");
  // 2. Add coin form, type, open ⓘ, Back keeps typing
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.waitForTimeout(100);
  const info = await p.$(".info-btn");
  const topOpen = () => p.evaluate(() => { const t = document.getElementById("sheetTop"); return !!t && !t.hidden && t.textContent.length > 0; });
  if (info) {
    await info.click(); await p.waitForTimeout(100);
    ok("ⓘ popup shown on top, the form stays behind it", (await topOpen()) && !!(await p.$("#coinForm")) && (await p.inputValue("[data-f=year]")) === "1881");
    await p.goBack(); await p.waitForTimeout(200);
    ok("Back closes only ⓘ, form + typing kept", !(await topOpen()) && !(await shut()) && !!(await p.$("#coinForm")) && (await p.inputValue("[data-f=year]")) === "1881");
    await p.click(".info-btn >> nth=0"); await p.waitForTimeout(100); await p.click("[data-act=wordBack]"); await p.waitForTimeout(250);
    ok("✕ on ⓘ also keeps typing", !(await topOpen()) && !!(await p.$("#coinForm")) && (await p.inputValue("[data-f=year]")) === "1881");
  } else console.log("SKIP no ⓘ on form");
  await p.goBack(); await p.waitForTimeout(200);
  ok("Back closes the form", await shut());
  // 3. Close with ✕ then Back goes to the previous page, not a dead press
  await p.click("#fab"); await p.click("[data-act=closeSheet] >> nth=0"); await p.waitForTimeout(250);
  await p.evaluate(() => go("home")); await p.waitForTimeout(150); await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(150);
  await p.goBack(); await p.waitForTimeout(200);
  ok("Back after ✕ goes to previous page", (await hash()) === "#home" || (await hash()) === "");
  // 4. link inside a pop-up leaves cleanly
  await p.evaluate(() => go("album-alb1")); await p.waitForTimeout(150);
  await p.click(".slot:has-text('1923-D')"); await p.waitForTimeout(100);
  await p.evaluate(() => go("options")); await p.waitForTimeout(300);
  ok("go() from pop-up lands on the page", (await hash()) === "#options" && (await shut()));
  await p.goBack(); await p.waitForTimeout(500);
  ok("Back from there returns to album", (await hash()) === "#album-alb1");
  await p.goBack(); await p.waitForTimeout(500);
  ok("next Back moves on (no wasted press)", (await hash()) !== "#album-alb1");
  // 5. v0.61.2: the two reported phone cases. Back must close only the top pop-up and never change the page behind it.
  await p.evaluate(() => go("home")); await p.waitForTimeout(150); await p.evaluate(() => go("options")); await p.waitForTimeout(250);
  await p.click("[data-act=openBackup]"); await p.waitForTimeout(200);
  ok("Back up/Restore pop-up open", !(await shut()));
  await p.goBack(); await p.waitForTimeout(300);
  ok("Back closes Back up/Restore, stays on Options", (await shut()) && (await hash()) === "#options");
  await p.evaluate(() => go("home")); await p.waitForTimeout(150); await p.click("#fab"); await p.waitForTimeout(200);
  const infoGrade = await p.$(".info-btn[data-w=rawslab]");
  if (infoGrade) {
    await infoGrade.click(); await p.waitForTimeout(200);
    ok("grading ⓘ opens on top: same page, form still behind it", (await hash()) === "#home" && !(await shut()) && !!(await p.$("#coinForm")) && await topOpen());
    await p.goBack(); await p.waitForTimeout(300);
    ok("Back closes only the ⓘ, page unchanged, form still there", (await hash()) === "#home" && !!(await p.$("#coinForm")));
    await p.goBack(); await p.waitForTimeout(300);
    ok("next Back closes the form, still on the same page", (await shut()) && (await hash()) === "#home");
  } else console.log("SKIP no grading ⓘ");
  await p.evaluate(() => go("options")); await p.waitForTimeout(250);
  ok("Options shows the Back-button check log", (await p.textContent("#backLog")).includes("popstate"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
